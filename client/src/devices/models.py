"""Device models and data structures."""

from dataclasses import dataclass, asdict
from enum import Enum
from typing import Optional, Dict, Any
import hashlib
import uuid


class DeviceMode(Enum):
    """Device operating modes."""
    EDL = "edl"
    BROM = "brom"
    MI_ASSISTANT = "mi_assistant"
    FASTBOOT = "fastboot"
    ADB = "adb"
    UNKNOWN = "unknown"


class ChipsetType(Enum):
    """Chipset types."""
    QUALCOMM = "qualcomm"
    MEDIATEK = "mediatek"
    XIAOMI = "xiaomi"  # For Mi Assistant mode
    UNKNOWN = "unknown"


@dataclass
class Device:
    """Device information."""
    device_id: str
    serial_number: str
    mode: DeviceMode
    chipset: ChipsetType
    manufacturer: str = "Unknown"
    model: str = "Unknown"
    android_version: Optional[str] = None
    bootloader: Optional[str] = None
    hardware_id: Optional[str] = None
    usb_vid: Optional[str] = None
    usb_pid: Optional[str] = None
    connection_path: Optional[str] = None
    
    def __post_init__(self):
        """Post-initialization processing."""
        if not self.device_id:
            self.device_id = self.generate_device_id()
        
        if not self.hardware_id:
            self.hardware_id = self.generate_hardware_id()
    
    def generate_device_id(self) -> str:
        """Generate unique device ID."""
        # Use serial number and other identifiers to create stable ID
        data = f"{self.serial_number}{self.usb_vid}{self.usb_pid}{self.model}"
        return hashlib.md5(data.encode()).hexdigest()[:16]
    
    def generate_hardware_id(self) -> str:
        """Generate hardware ID."""
        data = f"{self.serial_number}{self.chipset.value}{self.bootloader or ''}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'deviceId': self.device_id,
            'serialNumber': self.serial_number,
            'chipset': self.chipset.value,
            'mode': self.mode.value,
            'manufacturer': self.manufacturer,
            'model': self.model,
            'androidVersion': self.android_version,
            'bootloader': self.bootloader,
            'hardwareId': self.hardware_id,
            'usbVid': self.usb_vid,
            'usbPid': self.usb_pid,
            'connectionPath': self.connection_path
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Device':
        """Create device from dictionary."""
        return cls(
            device_id=data.get('deviceId', ''),
            serial_number=data.get('serialNumber', ''),
            mode=DeviceMode(data.get('mode', 'unknown')),
            chipset=ChipsetType(data.get('chipset', 'unknown')),
            manufacturer=data.get('manufacturer', 'Unknown'),
            model=data.get('model', 'Unknown'),
            android_version=data.get('androidVersion'),
            bootloader=data.get('bootloader'),
            hardware_id=data.get('hardwareId'),
            usb_vid=data.get('usbVid'),
            usb_pid=data.get('usbPid'),
            connection_path=data.get('connectionPath')
        )
    
    def is_xiaomi_device(self) -> bool:
        """Check if this is a Xiaomi device."""
        return (self.manufacturer.lower() in ['xiaomi', 'redmi', 'poco', 'mi'] or
                'xiaomi' in self.model.lower() or
                'redmi' in self.model.lower() or
                'poco' in self.model.lower())
    
    def supports_edl_mode(self) -> bool:
        """Check if device supports EDL mode."""
        return self.chipset == ChipsetType.QUALCOMM
    
    def supports_brom_mode(self) -> bool:
        """Check if device supports BROM mode."""
        return self.chipset == ChipsetType.MEDIATEK
    
    def supports_mi_assistant(self) -> bool:
        """Check if device supports Mi Assistant mode."""
        return self.is_xiaomi_device()
    
    def get_unlock_methods(self) -> list:
        """Get available unlock methods for this device."""
        methods = []
        
        if self.mode == DeviceMode.EDL and self.supports_edl_mode():
            methods.append('edl_bypass')
        
        if self.mode == DeviceMode.BROM and self.supports_brom_mode():
            methods.append('brom_unlock')
        
        if self.mode == DeviceMode.MI_ASSISTANT and self.supports_mi_assistant():
            methods.append('mi_unlock')
        
        # Generic FRP unlock
        methods.append('frp_unlock')
        
        return methods
    
    def __str__(self) -> str:
        """String representation."""
        return f"{self.manufacturer} {self.model} ({self.serial_number}) - {self.mode.value.upper()}"
    
    def __repr__(self) -> str:
        """Detailed representation."""
        return (f"Device(id={self.device_id}, serial={self.serial_number}, "
                f"mode={self.mode.value}, chipset={self.chipset.value}, "
                f"model={self.manufacturer} {self.model})")


@dataclass 
class DeviceConnection:
    """Device connection information."""
    device: Device
    port: Optional[str] = None
    interface: Optional[str] = None
    driver: Optional[str] = None
    status: str = "connected"
    last_seen: Optional[float] = None
    
    def is_active(self) -> bool:
        """Check if connection is active."""
        return self.status == "connected"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'device': self.device.to_dict(),
            'port': self.port,
            'interface': self.interface,
            'driver': self.driver,
            'status': self.status,
            'lastSeen': self.last_seen
        }
