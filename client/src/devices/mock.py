"""Mock devices for testing purposes."""

import random
import time
from typing import List, Dict, Any

from .models import Device, DeviceMode, ChipsetType


class MockDevice:
    """Factory for creating mock devices."""
    
    XIAOMI_MODELS = [
        "Redmi Note 12",
        "Mi 11",
        "Redmi K40",
        "POCO F4",
        "Mi Mix 4",
        "Redmi 10",
        "Mi 12 Pro",
        "POCO X4 Pro"
    ]
    
    QUALCOMM_CHIPSETS = [
        "SM8350",  # Snapdragon 888
        "SM7325",  # Snapdragon 778G
        "SM6375",  # Snapdragon 695
        "SM8450",  # Snapdragon 8 Gen 1
        "SM8550",  # Snapdragon 8 Gen 2
    ]
    
    MEDIATEK_CHIPSETS = [
        "MT6833",  # Dimensity 700
        "MT6877",  # Dimensity 900
        "MT6893",  # Dimensity 1200
        "MT6983",  # Dimensity 9000
        "MT6985",  # Dimensity 9200
    ]
    
    @classmethod
    def create_mock_xiaomi_device(cls) -> Device:
        """Create a mock Xiaomi device."""
        model = random.choice(cls.XIAOMI_MODELS)
        mode = random.choice([DeviceMode.EDL, DeviceMode.MI_ASSISTANT])
        
        if mode == DeviceMode.EDL:
            chipset = ChipsetType.QUALCOMM
            chipset_name = random.choice(cls.QUALCOMM_CHIPSETS)
        else:
            chipset = ChipsetType.XIAOMI
            chipset_name = "Xiaomi"
        
        # Generate realistic serial number
        serial = f"{''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=10))}"
        
        device = Device(
            device_id="",  # Will be generated
            serial_number=serial,
            mode=mode,
            chipset=chipset,
            manufacturer="Xiaomi",
            model=model,
            android_version=random.choice(["11", "12", "13", "14"]),
            bootloader=f"V{random.randint(1, 9)}.{random.randint(0, 9)}.{random.randint(0, 99)}",
            usb_vid="2717" if mode == DeviceMode.MI_ASSISTANT else "05c6",
            usb_pid="ff40" if mode == DeviceMode.MI_ASSISTANT else "9008",
            connection_path=f"Mock\\{serial}"
        )
        
        return device
    
    @classmethod
    def create_mock_qualcomm_device(cls) -> Device:
        """Create a mock Qualcomm EDL device."""
        models = ["SM-G991B", "OnePlus 9", "Pixel 6", "Xperia 1 III"]
        manufacturers = ["Samsung", "OnePlus", "Google", "Sony"]
        
        idx = random.randint(0, len(models) - 1)
        model = models[idx]
        manufacturer = manufacturers[idx]
        
        serial = f"{''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=12))}"
        
        device = Device(
            device_id="",  # Will be generated
            serial_number=serial,
            mode=DeviceMode.EDL,
            chipset=ChipsetType.QUALCOMM,
            manufacturer=manufacturer,
            model=model,
            android_version=random.choice(["11", "12", "13", "14"]),
            bootloader=f"V{random.randint(1, 9)}.{random.randint(0, 9)}.{random.randint(0, 99)}",
            usb_vid="05c6",
            usb_pid="9008",
            connection_path=f"Mock\\{serial}"
        )
        
        return device
    
    @classmethod
    def create_mock_mediatek_device(cls) -> Device:
        """Create a mock MediaTek BROM device."""
        models = ["Helio G96", "Redmi Note 11", "Realme 9", "Oppo A96"]
        manufacturers = ["MediaTek", "Xiaomi", "Realme", "Oppo"]
        
        idx = random.randint(0, len(models) - 1)
        model = models[idx]
        manufacturer = manufacturers[idx]
        
        serial = f"{''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=11))}"
        
        device = Device(
            device_id="",  # Will be generated
            serial_number=serial,
            mode=DeviceMode.BROM,
            chipset=ChipsetType.MEDIATEK,
            manufacturer=manufacturer,
            model=model,
            android_version=random.choice(["11", "12", "13"]),
            bootloader=f"MTK{random.randint(1000, 9999)}",
            usb_vid="0e8d",
            usb_pid="0003",
            connection_path=f"Mock\\{serial}"
        )
        
        return device
    
    @classmethod
    def create_mock_devices(cls, count: int = 3) -> List[Device]:
        """Create multiple mock devices."""
        devices = []
        
        for _ in range(count):
            device_type = random.choice(['xiaomi', 'qualcomm', 'mediatek'])
            
            if device_type == 'xiaomi':
                device = cls.create_mock_xiaomi_device()
            elif device_type == 'qualcomm':
                device = cls.create_mock_qualcomm_device()
            else:
                device = cls.create_mock_mediatek_device()
            
            devices.append(device)
        
        return devices
    
    @classmethod
    def simulate_device_operation(cls, device: Device, operation_type: str) -> Dict[str, Any]:
        """Simulate a device operation and return mock results."""
        # Simulate operation time
        operation_time = random.uniform(10, 60)  # 10-60 seconds
        
        # Simulate success rate (90% success for testing)
        success = random.random() < 0.9
        
        result = {
            'device_id': device.device_id,
            'operation_type': operation_type,
            'success': success,
            'duration': operation_time,
            'timestamp': time.time(),
            'steps_completed': random.randint(5, 10),
            'total_steps': 10
        }
        
        if not success:
            errors = [
                "Device communication timeout",
                "Authentication failed",
                "Partition read error",
                "Security verification failed",
                "Device not responding"
            ]
            result['error'] = random.choice(errors)
        else:
            result['unlock_status'] = 'unlocked'
            result['frp_status'] = 'bypassed'
        
        return result
    
    @classmethod
    def generate_mock_auth_response(cls, device: Device) -> Dict[str, Any]:
        """Generate mock authentication response."""
        import jwt
        import time
        
        # Mock auth key (not a real JWT for testing)
        auth_key = f"mock_auth_key_{device.device_id}_{int(time.time())}"
        
        bypass_tokens = {}
        
        if device.mode == DeviceMode.EDL:
            bypass_tokens = {
                'token': f"mock_edl_token_{device.serial_number}",
                'signature': f"mock_signature_{random.randint(1000, 9999)}",
                'expires': int(time.time()) + 300
            }
        elif device.mode == DeviceMode.BROM:
            bypass_tokens = {
                'auth_token': f"mock_brom_token_{device.serial_number}",
                'device_key': f"mock_device_key_{random.randint(1000, 9999)}",
                'expires': int(time.time()) + 300
            }
        elif device.mode == DeviceMode.MI_ASSISTANT:
            bypass_tokens = {
                'mi_token': f"mock_mi_token_{device.serial_number}",
                'account_bypass': f"mock_bypass_{random.randint(1000, 9999)}",
                'expires': int(time.time()) + 300
            }
        
        return {
            'success': True,
            'authKey': auth_key,
            'deviceId': device.device_id,
            'bypassTokens': bypass_tokens,
            'expiresIn': 300,
            'timestamp': time.time()
        }
    
    @classmethod
    def create_test_scenario(cls, scenario_name: str) -> List[Device]:
        """Create devices for specific test scenarios."""
        scenarios = {
            'xiaomi_mixed': [
                cls.create_mock_xiaomi_device(),
                cls.create_mock_xiaomi_device(),
            ],
            'multi_chipset': [
                cls.create_mock_qualcomm_device(),
                cls.create_mock_mediatek_device(),
                cls.create_mock_xiaomi_device()
            ],
            'edl_only': [
                cls.create_mock_qualcomm_device(),
                cls.create_mock_qualcomm_device()
            ],
            'brom_only': [
                cls.create_mock_mediatek_device(),
                cls.create_mock_mediatek_device()
            ],
            'single_device': [
                cls.create_mock_xiaomi_device()
            ]
        }
        
        return scenarios.get(scenario_name, cls.create_mock_devices())


class MockDeviceSimulator:
    """Simulates device behavior for testing."""
    
    def __init__(self, device: Device):
        self.device = device
        self.connected = True
        self.operation_in_progress = False
        self.last_ping = time.time()
    
    async def simulate_connection_loss(self, duration: float = 5.0):
        """Simulate temporary connection loss."""
        self.connected = False
        await asyncio.sleep(duration)
        self.connected = True
    
    async def simulate_operation(self, operation_type: str) -> Dict[str, Any]:
        """Simulate a device operation."""
        if self.operation_in_progress:
            raise RuntimeError("Operation already in progress")
        
        self.operation_in_progress = True
        
        try:
            # Simulate operation steps
            steps = [
                "Initializing connection",
                "Authenticating device",
                "Reading device info",
                "Performing unlock",
                "Verifying results"
            ]
            
            for i, step in enumerate(steps):
                if not self.connected:
                    raise RuntimeError("Device disconnected during operation")
                
                # Simulate step duration
                await asyncio.sleep(random.uniform(1, 3))
                
                # Small chance of random failure
                if random.random() < 0.05:  # 5% chance
                    raise RuntimeError(f"Operation failed at step: {step}")
            
            return MockDevice.simulate_device_operation(self.device, operation_type)
        
        finally:
            self.operation_in_progress = False
    
    def ping(self) -> bool:
        """Ping device to check connectivity."""
        if self.connected:
            self.last_ping = time.time()
            return True
        return False
    
    def is_responsive(self) -> bool:
        """Check if device is responsive."""
        return self.connected and not self.operation_in_progress
