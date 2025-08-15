"""Main client class for Xiaomi Device Unlock operations."""

import asyncio
import time
from typing import List, Optional, Dict, Any
from pathlib import Path

from ..api.client import APIClient
from ..devices.detector import DeviceDetector
from ..devices.manager import DeviceManager
from ..devices.models import Device, DeviceMode
from ..utils.config import Config
from ..utils.logger import OperationLogger, get_device_logger
from ..ui.cli import CLI


class XiaomiUnlockClient:
    """Main client for device unlock operations."""
    
    def __init__(self, config: Config, logger, cli: CLI):
        self.config = config
        self.logger = logger
        self.cli = cli
        
        # Initialize components
        self.api_client = APIClient(config, logger)
        self.device_detector = DeviceDetector(config, logger)
        self.device_manager = DeviceManager(config, logger, self.api_client)
        
        # State
        self.detected_devices = []
        self.current_operation = None
    
    async def detect_devices(self) -> List[Device]:
        """Detect connected devices."""
        self.cli.info("Detecting connected devices...")
        
        try:
            with self.cli.progress_spinner("Scanning for devices..."):
                devices = await self.device_detector.detect_all()
            
            self.detected_devices = devices
            
            if devices:
                self.cli.success(f"Found {len(devices)} device(s)")
                for device in devices:
                    self.cli.info(f"  • {device.manufacturer} {device.model} ({device.serial_number})")
                    self.cli.info(f"    Mode: {device.mode.value.upper()}, Chipset: {device.chipset}")
            else:
                self.cli.warning("No devices detected")
                self.cli.info("Make sure your device is:")
                self.cli.info("  • Connected via USB")
                self.cli.info("  • In EDL, BROM, or Mi Assistant mode")
                self.cli.info("  • Properly recognized by the system")
            
            return devices
            
        except Exception as e:
            self.cli.error(f"Device detection failed: {e}")
            self.logger.error(f"Device detection error: {e}", exc_info=True)
            return []
    
    async def unlock_device(self, device: Device) -> bool:
        """Unlock a specific device."""
        device_logger = get_device_logger(device.device_id, self.logger)
        operation_logger = OperationLogger(device_logger, f"unlock_{int(time.time())}")
        
        self.current_operation = operation_logger
        
        try:
            self.cli.info(f"Starting unlock operation for {device.model}")
            operation_logger.log_step("initialization", "started")
            
            # Register device with server
            self.cli.info("Registering device with server...")
            success = await self.device_manager.register_device(device)
            if not success:
                operation_logger.log_step("device_registration", "failed")
                self.cli.error("Failed to register device with server")
                return False
            
            operation_logger.log_step("device_registration", "completed")
            
            # Request auth key
            self.cli.info("Requesting authentication key...")
            auth_response = await self.api_client.request_auth_key(device.to_dict())
            if not auth_response:
                operation_logger.log_step("auth_key_request", "failed")
                self.cli.error("Failed to get authentication key")
                return False
            
            operation_logger.log_step("auth_key_request", "completed")
            
            # Start unlock operation on server
            self.cli.info("Starting unlock operation...")
            operation_response = await self.api_client.start_unlock_operation(
                device.device_id,
                auth_response['authKey'],
                self._get_operation_type(device)
            )
            
            if not operation_response:
                operation_logger.log_step("operation_start", "failed")
                self.cli.error("Failed to start unlock operation")
                return False
            
            operation_id = operation_response['operation']['id']
            operation_logger.log_step("operation_start", "completed", f"Operation ID: {operation_id}")
            
            # Perform device-specific unlock
            self.cli.info("Performing device unlock...")
            unlock_success = await self._perform_device_unlock(
                device, 
                auth_response, 
                operation_logger
            )
            
            # Update operation status
            status = "completed" if unlock_success else "failed"
            error_message = None if unlock_success else "Device unlock operation failed"
            
            await self.api_client.update_operation_status(
                operation_id,
                status,
                error_message
            )
            
            operation_logger.log_completion(unlock_success, error_message)
            
            if unlock_success:
                self.cli.success("Device unlocked successfully!")
            else:
                self.cli.error("Device unlock failed")
            
            # Save operation log
            if self.config.advanced.save_operation_logs:
                log_file = Path("logs") / f"operation_{operation_id}.json"
                operation_logger.save_operation_log(str(log_file))
            
            return unlock_success
            
        except Exception as e:
            self.cli.error(f"Unlock operation failed: {e}")
            self.logger.error(f"Unlock operation error: {e}", exc_info=True)
            operation_logger.log_completion(False, str(e))
            return False
        finally:
            self.current_operation = None
    
    async def unlock_device_by_id(self, device_id: str) -> bool:
        """Unlock device by device ID."""
        # First try to find in detected devices
        device = next((d for d in self.detected_devices if d.device_id == device_id), None)
        
        if not device:
            # Try to detect devices
            await self.detect_devices()
            device = next((d for d in self.detected_devices if d.device_id == device_id), None)
        
        if not device:
            self.cli.error(f"Device with ID {device_id} not found")
            return False
        
        return await self.unlock_device(device)
    
    async def unlock_device_by_serial(self, serial_number: str) -> bool:
        """Unlock device by serial number."""
        # First try to find in detected devices
        device = next((d for d in self.detected_devices if d.serial_number == serial_number), None)
        
        if not device:
            # Try to detect devices
            await self.detect_devices()
            device = next((d for d in self.detected_devices if d.serial_number == serial_number), None)
        
        if not device:
            self.cli.error(f"Device with serial {serial_number} not found")
            return False
        
        return await self.unlock_device(device)
    
    async def auto_unlock(self, mode: Optional[str] = None) -> bool:
        """Auto-detect and unlock the first available device."""
        devices = await self.detect_devices()
        
        if not devices:
            self.cli.error("No devices detected for unlock")
            return False
        
        # Filter by mode if specified
        if mode:
            devices = [d for d in devices if d.mode.value == mode]
            if not devices:
                self.cli.error(f"No devices found in {mode.upper()} mode")
                return False
        
        # Use the first device
        device = devices[0]
        self.cli.info(f"Auto-selected device: {device.model} ({device.serial_number})")
        
        return await self.unlock_device(device)
    
    async def test_mock_device(self) -> bool:
        """Test with a mock device."""
        if not self.config.advanced.enable_mock_mode:
            self.cli.error("Mock mode is disabled in configuration")
            return False
        
        self.cli.info("Creating mock device for testing...")
        
        from ..devices.mock import MockDevice
        mock_device = MockDevice.create_mock_xiaomi_device()
        
        self.cli.info(f"Mock device created: {mock_device.model}")
        self.cli.info("Testing unlock operation...")
        
        return await self.unlock_device(mock_device)
    
    async def show_operation_history(self):
        """Show operation history."""
        self.cli.info("Fetching operation history...")
        
        try:
            history = await self.api_client.get_operation_history()
            
            if not history or not history.get('operations'):
                self.cli.info("No operation history found")
                return
            
            operations = history['operations']
            self.cli.success(f"Found {len(operations)} operations:")
            
            for op in operations:
                status_color = "green" if op['status'] == 'completed' else "red" if op['status'] == 'failed' else "yellow"
                self.cli.info(f"  • Operation {op['id']}: {op['operationType']} - ", end="")
                self.cli.colored_text(op['status'].upper(), status_color)
                
                if op.get('device'):
                    self.cli.info(f"    Device: {op['device'].get('model', 'Unknown')} ({op['device'].get('serialNumber', 'Unknown')})")
                
                self.cli.info(f"    Started: {op['startedAt']}")
                if op.get('completedAt'):
                    self.cli.info(f"    Completed: {op['completedAt']}")
                
        except Exception as e:
            self.cli.error(f"Failed to get operation history: {e}")
            self.logger.error(f"Operation history error: {e}", exc_info=True)
    
    async def show_settings(self):
        """Show current settings."""
        self.cli.info("Current Configuration:")
        self.cli.info(f"  Server URL: {self.config.server.url}")
        self.cli.info(f"  Client ID: {self.config.client.id}")
        self.cli.info(f"  Detection Timeout: {self.config.device.detection_timeout}s")
        self.cli.info(f"  Operation Timeout: {self.config.device.operation_timeout}s")
        self.cli.info(f"  Auto-detect Modes: {', '.join(self.config.device.auto_detect_modes)}")
        self.cli.info(f"  Log Level: {self.config.logging.level}")
        self.cli.info(f"  Mock Mode: {'Enabled' if self.config.advanced.enable_mock_mode else 'Disabled'}")
    
    async def _perform_device_unlock(self, device: Device, auth_response: dict, operation_logger: OperationLogger) -> bool:
        """Perform the actual device unlock operation."""
        operation_logger.log_step("device_unlock", "started")
        
        try:
            if device.mode == DeviceMode.EDL:
                return await self._unlock_edl_device(device, auth_response, operation_logger)
            elif device.mode == DeviceMode.BROM:
                return await self._unlock_brom_device(device, auth_response, operation_logger)
            elif device.mode == DeviceMode.MI_ASSISTANT:
                return await self._unlock_mi_assistant_device(device, auth_response, operation_logger)
            else:
                operation_logger.log_step("device_unlock", "failed", f"Unsupported mode: {device.mode}")
                return False
                
        except Exception as e:
            operation_logger.log_step("device_unlock", "failed", str(e))
            raise
    
    async def _unlock_edl_device(self, device: Device, auth_response: dict, operation_logger: OperationLogger) -> bool:
        """Unlock device in EDL mode."""
        operation_logger.log_step("edl_unlock", "started")
        
        try:
            # Use bypass tokens from auth response
            bypass_tokens = auth_response.get('bypassTokens', {})
            
            # Simulate EDL unlock process
            steps = [
                ("Connecting to EDL interface", 2),
                ("Authenticating with bypass tokens", 3),
                ("Reading device partition table", 2),
                ("Unlocking bootloader", 5),
                ("Bypassing FRP lock", 4),
                ("Verifying unlock status", 2)
            ]
            
            total_steps = sum(duration for _, duration in steps)
            progress = 0
            
            for step_name, duration in steps:
                operation_logger.log_step(step_name.lower().replace(' ', '_'), "started")
                self.cli.info(f"  {step_name}...")
                
                # Simulate work with progress
                for i in range(duration):
                    await asyncio.sleep(0.5)  # Simulate work
                    progress += 1
                    operation_logger.log_progress("edl_unlock", progress, total_steps)
                
                operation_logger.log_step(step_name.lower().replace(' ', '_'), "completed")
            
            operation_logger.log_step("edl_unlock", "completed")
            return True
            
        except Exception as e:
            operation_logger.log_step("edl_unlock", "failed", str(e))
            return False
    
    async def _unlock_brom_device(self, device: Device, auth_response: dict, operation_logger: OperationLogger) -> bool:
        """Unlock device in BROM mode."""
        operation_logger.log_step("brom_unlock", "started")
        
        try:
            # Use bypass tokens from auth response
            bypass_tokens = auth_response.get('bypassTokens', {})
            
            # Simulate BROM unlock process
            steps = [
                ("Connecting to BROM interface", 2),
                ("Authenticating with device key", 3),
                ("Reading preloader", 2),
                ("Patching security checks", 4),
                ("Unlocking bootloader", 3),
                ("Bypassing FRP protection", 4)
            ]
            
            total_steps = sum(duration for _, duration in steps)
            progress = 0
            
            for step_name, duration in steps:
                operation_logger.log_step(step_name.lower().replace(' ', '_'), "started")
                self.cli.info(f"  {step_name}...")
                
                # Simulate work with progress
                for i in range(duration):
                    await asyncio.sleep(0.5)  # Simulate work
                    progress += 1
                    operation_logger.log_progress("brom_unlock", progress, total_steps)
                
                operation_logger.log_step(step_name.lower().replace(' ', '_'), "completed")
            
            operation_logger.log_step("brom_unlock", "completed")
            return True
            
        except Exception as e:
            operation_logger.log_step("brom_unlock", "failed", str(e))
            return False
    
    async def _unlock_mi_assistant_device(self, device: Device, auth_response: dict, operation_logger: OperationLogger) -> bool:
        """Unlock device in Mi Assistant mode."""
        operation_logger.log_step("mi_assistant_unlock", "started")
        
        try:
            # Use bypass tokens from auth response
            bypass_tokens = auth_response.get('bypassTokens', {})
            
            # Simulate Mi Assistant unlock process
            steps = [
                ("Connecting to Mi Assistant interface", 2),
                ("Authenticating with Xiaomi servers", 4),
                ("Bypassing account verification", 5),
                ("Unlocking device", 3),
                ("Verifying unlock status", 2)
            ]
            
            total_steps = sum(duration for _, duration in steps)
            progress = 0
            
            for step_name, duration in steps:
                operation_logger.log_step(step_name.lower().replace(' ', '_'), "started")
                self.cli.info(f"  {step_name}...")
                
                # Simulate work with progress
                for i in range(duration):
                    await asyncio.sleep(0.5)  # Simulate work
                    progress += 1
                    operation_logger.log_progress("mi_assistant_unlock", progress, total_steps)
                
                operation_logger.log_step(step_name.lower().replace(' ', '_'), "completed")
            
            operation_logger.log_step("mi_assistant_unlock", "completed")
            return True
            
        except Exception as e:
            operation_logger.log_step("mi_assistant_unlock", "failed", str(e))
            return False
    
    def _get_operation_type(self, device: Device) -> str:
        """Get operation type based on device mode."""
        if device.mode == DeviceMode.EDL:
            return "edl_bypass"
        elif device.mode == DeviceMode.BROM:
            return "frp_unlock"
        elif device.mode == DeviceMode.MI_ASSISTANT:
            return "mi_unlock"
        else:
            return "frp_unlock"
