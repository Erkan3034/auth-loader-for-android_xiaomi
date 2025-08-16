"""Device detection for various Android modes."""

import asyncio
import re
import subprocess
import time
from typing import List, Optional, Dict, Any
try:
    import usb.core
    import usb.util
    USB_AVAILABLE = True
except ImportError:
    USB_AVAILABLE = False
import serial.tools.list_ports

from .models import Device, DeviceMode, ChipsetType
from ..utils.config import Config


class DeviceDetector:
    """Detects Android devices in various modes."""
    
    # USB VID/PID mappings for different modes
    USB_DEVICES = {
        # Qualcomm EDL mode
        (0x05c6, 0x9008): (DeviceMode.EDL, ChipsetType.QUALCOMM),
        (0x05c6, 0x9025): (DeviceMode.EDL, ChipsetType.QUALCOMM),
        (0x05c6, 0x900e): (DeviceMode.EDL, ChipsetType.QUALCOMM),
        
        # MediaTek BROM mode
        (0x0e8d, 0x0003): (DeviceMode.BROM, ChipsetType.MEDIATEK),
        (0x0e8d, 0x2000): (DeviceMode.BROM, ChipsetType.MEDIATEK),
        (0x0e8d, 0x2001): (DeviceMode.BROM, ChipsetType.MEDIATEK),
        
        # Xiaomi specific
        (0x2717, 0xff40): (DeviceMode.MI_ASSISTANT, ChipsetType.XIAOMI),
        (0x2717, 0xff48): (DeviceMode.MI_ASSISTANT, ChipsetType.XIAOMI),
        
        # Fastboot mode (various manufacturers)
        (0x18d1, 0x4ee0): (DeviceMode.FASTBOOT, ChipsetType.UNKNOWN),
        (0x05c6, 0x9006): (DeviceMode.FASTBOOT, ChipsetType.QUALCOMM),
        
        # ADB mode
        (0x18d1, 0x4ee2): (DeviceMode.ADB, ChipsetType.UNKNOWN),
        (0x18d1, 0x4ee7): (DeviceMode.ADB, ChipsetType.UNKNOWN),
    }
    
    # Serial port patterns for different modes
    SERIAL_PATTERNS = {
        DeviceMode.EDL: [
            r'Qualcomm.*EDL',
            r'QUSB_BULK',
            r'Qualcomm.*9008'
        ],
        DeviceMode.BROM: [
            r'MediaTek.*BROM',
            r'MTK.*USB',
            r'MediaTek.*2000'
        ]
    }
    
    def __init__(self, config: Config, logger):
        self.config = config
        self.logger = logger
        self.timeout = config.device.detection_timeout
    
    async def detect_all(self) -> List[Device]:
        """Detect all connected devices in supported modes."""
        devices = []
        
        # Run detection methods in parallel
        detection_tasks = [
            self.detect_usb_devices(),
            self.detect_serial_devices(),
            self.detect_adb_devices(),
            self.detect_fastboot_devices()
        ]
        
        results = await asyncio.gather(*detection_tasks, return_exceptions=True)
        
        # Combine results and filter duplicates
        seen_serials = set()
        for result in results:
            if isinstance(result, Exception):
                self.logger.warning(f"Detection method failed: {result}")
                continue
            
            for device in result:
                if device.serial_number not in seen_serials:
                    devices.append(device)
                    seen_serials.add(device.serial_number)
        
        self.logger.info(f"Detected {len(devices)} unique devices")
        return devices
    
    async def detect_usb_devices(self) -> List[Device]:
        """Detect devices via USB enumeration."""
        devices = []
        
        if not USB_AVAILABLE:
            self.logger.debug("USB support not available, skipping USB detection")
            return devices
        
        try:
            # Find all USB devices
            usb_devices = usb.core.find(find_all=True)
            
            for usb_dev in usb_devices:
                vid_pid = (usb_dev.idVendor, usb_dev.idProduct)
                
                if vid_pid in self.USB_DEVICES:
                    mode, chipset = self.USB_DEVICES[vid_pid]
                    
                    # Get device info
                    device_info = await self._get_usb_device_info(usb_dev)
                    
                    device = Device(
                        device_id="",  # Will be generated
                        serial_number=device_info.get('serial', f"USB_{vid_pid[0]:04x}_{vid_pid[1]:04x}"),
                        mode=mode,
                        chipset=chipset,
                        manufacturer=device_info.get('manufacturer', 'Unknown'),
                        model=device_info.get('product', 'Unknown'),
                        usb_vid=f"{usb_dev.idVendor:04x}",
                        usb_pid=f"{usb_dev.idProduct:04x}",
                        connection_path=f"USB\\VID_{usb_dev.idVendor:04X}&PID_{usb_dev.idProduct:04X}"
                    )
                    
                    devices.append(device)
                    self.logger.debug(f"Found USB device: {device}")
        
        except Exception as e:
            self.logger.error(f"USB detection error: {e}")
        
        return devices
    
    async def detect_serial_devices(self) -> List[Device]:
        """Detect devices via serial port enumeration."""
        devices = []
        
        try:
            ports = serial.tools.list_ports.comports()
            
            for port in ports:
                for mode, patterns in self.SERIAL_PATTERNS.items():
                    for pattern in patterns:
                        if re.search(pattern, port.description, re.IGNORECASE):
                            # Determine chipset from mode
                            chipset = ChipsetType.QUALCOMM if mode == DeviceMode.EDL else ChipsetType.MEDIATEK
                            
                            device = Device(
                                device_id="",  # Will be generated
                                serial_number=port.serial_number or f"COM_{port.device}",
                                mode=mode,
                                chipset=chipset,
                                manufacturer="Unknown",
                                model=port.description,
                                connection_path=port.device,
                                usb_vid=f"{port.vid:04x}" if port.vid else None,
                                usb_pid=f"{port.pid:04x}" if port.pid else None
                            )
                            
                            devices.append(device)
                            self.logger.debug(f"Found serial device: {device}")
                            break
        
        except Exception as e:
            self.logger.error(f"Serial detection error: {e}")
        
        return devices
    
    async def detect_adb_devices(self) -> List[Device]:
        """Detect devices via ADB."""
        devices = []
        
        try:
            # Run adb devices command
            result = await self._run_command(['adb', 'devices', '-l'])
            
            if result and 'List of devices attached' in result:
                lines = result.split('\n')[1:]  # Skip header
                
                for line in lines:
                    line = line.strip()
                    if not line or 'offline' in line:
                        continue
                    
                    parts = line.split()
                    if len(parts) >= 2:
                        serial = parts[0]
                        status = parts[1]
                        
                        if status == 'device':
                            # Get additional device info
                            device_info = await self._get_adb_device_info(serial)
                            
                            device = Device(
                                device_id="",  # Will be generated
                                serial_number=serial,
                                mode=DeviceMode.ADB,
                                chipset=self._detect_chipset_from_props(device_info),
                                manufacturer=device_info.get('manufacturer', 'Unknown'),
                                model=device_info.get('model', 'Unknown'),
                                android_version=device_info.get('android_version'),
                                bootloader=device_info.get('bootloader'),
                                connection_path=f"ADB:{serial}"
                            )
                            
                            devices.append(device)
                            self.logger.debug(f"Found ADB device: {device}")
        
        except Exception as e:
            self.logger.error(f"ADB detection error: {e}")
        
        return devices
    
    async def detect_fastboot_devices(self) -> List[Device]:
        """Detect devices via Fastboot."""
        devices = []
        
        try:
            # Run fastboot devices command
            result = await self._run_command(['fastboot', 'devices'])
            
            if result:
                lines = result.split('\n')
                
                for line in lines:
                    line = line.strip()
                    if line and '\t' in line:
                        serial, status = line.split('\t', 1)
                        
                        if status == 'fastboot':
                            # Get additional device info
                            device_info = await self._get_fastboot_device_info(serial)
                            
                            device = Device(
                                device_id="",  # Will be generated
                                serial_number=serial,
                                mode=DeviceMode.FASTBOOT,
                                chipset=self._detect_chipset_from_fastboot(device_info),
                                manufacturer=device_info.get('manufacturer', 'Unknown'),
                                model=device_info.get('product', 'Unknown'),
                                bootloader=device_info.get('bootloader'),
                                connection_path=f"Fastboot:{serial}"
                            )
                            
                            devices.append(device)
                            self.logger.debug(f"Found Fastboot device: {device}")
        
        except Exception as e:
            self.logger.error(f"Fastboot detection error: {e}")
        
        return devices
    
    async def _get_usb_device_info(self, usb_dev) -> Dict[str, str]:
        """Get USB device information."""
        info = {}
        
        if not USB_AVAILABLE:
            return info
            
        try:
            # Get string descriptors
            if usb_dev.iManufacturer:
                info['manufacturer'] = usb.util.get_string(usb_dev, usb_dev.iManufacturer)
            
            if usb_dev.iProduct:
                info['product'] = usb.util.get_string(usb_dev, usb_dev.iProduct)
            
            if usb_dev.iSerialNumber:
                info['serial'] = usb.util.get_string(usb_dev, usb_dev.iSerialNumber)
        
        except Exception as e:
            self.logger.debug(f"Error getting USB device info: {e}")
        
        return info
    
    async def _get_adb_device_info(self, serial: str) -> Dict[str, str]:
        """Get device info via ADB."""
        info = {}
        
        props_to_get = {
            'manufacturer': 'ro.product.manufacturer',
            'model': 'ro.product.model',
            'android_version': 'ro.build.version.release',
            'bootloader': 'ro.bootloader',
            'chipset': 'ro.board.platform'
        }
        
        for key, prop in props_to_get.items():
            try:
                result = await self._run_command(['adb', '-s', serial, 'shell', 'getprop', prop])
                if result:
                    info[key] = result.strip()
            except Exception as e:
                self.logger.debug(f"Error getting ADB prop {prop}: {e}")
        
        return info
    
    async def _get_fastboot_device_info(self, serial: str) -> Dict[str, str]:
        """Get device info via Fastboot."""
        info = {}
        
        vars_to_get = ['product', 'manufacturer', 'bootloader-version', 'platform']
        
        for var in vars_to_get:
            try:
                result = await self._run_command(['fastboot', '-s', serial, 'getvar', var])
                if result and ':' in result:
                    value = result.split(':', 1)[1].strip()
                    info[var.replace('-', '_')] = value
            except Exception as e:
                self.logger.debug(f"Error getting fastboot var {var}: {e}")
        
        return info
    
    def _detect_chipset_from_props(self, props: Dict[str, str]) -> ChipsetType:
        """Detect chipset from device properties."""
        chipset_prop = props.get('chipset', '').lower()
        manufacturer = props.get('manufacturer', '').lower()
        
        if 'qualcomm' in chipset_prop or 'qcom' in chipset_prop or 'msm' in chipset_prop:
            return ChipsetType.QUALCOMM
        elif 'mediatek' in chipset_prop or 'mtk' in chipset_prop:
            return ChipsetType.MEDIATEK
        elif 'xiaomi' in manufacturer or 'redmi' in manufacturer:
            return ChipsetType.XIAOMI
        
        return ChipsetType.UNKNOWN
    
    def _detect_chipset_from_fastboot(self, info: Dict[str, str]) -> ChipsetType:
        """Detect chipset from fastboot info."""
        platform = info.get('platform', '').lower()
        
        if 'qualcomm' in platform or 'qcom' in platform:
            return ChipsetType.QUALCOMM
        elif 'mediatek' in platform or 'mtk' in platform:
            return ChipsetType.MEDIATEK
        
        return ChipsetType.UNKNOWN
    
    async def _run_command(self, cmd: List[str], timeout: int = 10) -> Optional[str]:
        """Run a command asynchronously."""
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout
            )
            
            if process.returncode == 0:
                return stdout.decode('utf-8', errors='ignore')
            else:
                self.logger.debug(f"Command failed: {' '.join(cmd)}, stderr: {stderr.decode()}")
                return None
        
        except asyncio.TimeoutError:
            self.logger.warning(f"Command timeout: {' '.join(cmd)}")
            return None
        except FileNotFoundError:
            self.logger.debug(f"Command not found: {cmd[0]}")
            return None
        except Exception as e:
            self.logger.debug(f"Command error: {e}")
            return None
    
    async def wait_for_device(self, mode: DeviceMode, timeout: int = 60) -> Optional[Device]:
        """Wait for a device in specific mode to connect."""
        self.logger.info(f"Waiting for device in {mode.value.upper()} mode...")
        
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            devices = await self.detect_all()
            
            for device in devices:
                if device.mode == mode:
                    self.logger.info(f"Device detected: {device}")
                    return device
            
            await asyncio.sleep(2)  # Check every 2 seconds
        
        self.logger.warning(f"No device found in {mode.value.upper()} mode within {timeout}s")
        return None
    
    async def is_device_connected(self, device: Device) -> bool:
        """Check if a specific device is still connected."""
        devices = await self.detect_all()
        
        for detected in devices:
            if (detected.serial_number == device.serial_number and 
                detected.mode == device.mode):
                return True
        
        return False
