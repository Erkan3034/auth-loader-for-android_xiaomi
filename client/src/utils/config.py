"""Configuration management for Xiaomi Unlock Client."""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from pydantic import BaseModel, validator


class ServerConfig(BaseModel):
    url: str = "http://localhost:3000"
    timeout: int = 30
    retry_attempts: int = 3
    retry_delay: int = 2

    @validator('url')
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('Server URL must start with http:// or https://')
        return v.rstrip('/')


class ClientConfig(BaseModel):
    id: str = "xiaomi-unlock-client"
    hmac_secret: str = "default-hmac-secret"
    user_agent: str = "XiaomiUnlockClient/1.0.0"

    @validator('hmac_secret')
    def validate_hmac_secret(cls, v):
        if len(v) < 16:
            raise ValueError('HMAC secret must be at least 16 characters')
        return v


class DeviceConfig(BaseModel):
    detection_timeout: int = 10
    connection_timeout: int = 30
    operation_timeout: int = 300
    auto_detect_modes: list = ["edl", "brom", "mi_assistant"]


class LoggingConfig(BaseModel):
    level: str = "INFO"
    file: str = "logs/client.log"
    max_size: str = "10MB"
    backup_count: int = 5


class UIConfig(BaseModel):
    color_enabled: bool = True
    progress_bar: bool = True
    animations: bool = True


class AdvancedConfig(BaseModel):
    enable_mock_mode: bool = True
    enable_debug_logging: bool = False
    save_operation_logs: bool = True
    auto_register_devices: bool = True


class Config(BaseModel):
    server: ServerConfig = ServerConfig()
    client: ClientConfig = ClientConfig()
    device: DeviceConfig = DeviceConfig()
    logging: LoggingConfig = LoggingConfig()
    ui: UIConfig = UIConfig()
    advanced: AdvancedConfig = AdvancedConfig()

    @classmethod
    def load(cls, config_path: str = "config.json") -> 'Config':
        """Load configuration from file."""
        config_file = Path(config_path)
        
        if not config_file.exists():
            # Create default config file
            default_config = cls()
            default_config.save(config_path)
            return default_config
        
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return cls(**data)
        except Exception as e:
            raise ValueError(f"Failed to load config from {config_path}: {e}")

    def save(self, config_path: str = "config.json") -> None:
        """Save configuration to file."""
        config_file = Path(config_path)
        config_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(self.dict(), f, indent=2, ensure_ascii=False)

    def get_api_base_url(self) -> str:
        """Get API base URL."""
        return f"{self.server.url}/api"

    def get_log_file_path(self) -> Path:
        """Get log file path."""
        log_path = Path(self.logging.file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        return log_path

    def get_max_log_size_bytes(self) -> int:
        """Convert log size string to bytes."""
        size_str = self.logging.max_size.upper()
        if size_str.endswith('KB'):
            return int(size_str[:-2]) * 1024
        elif size_str.endswith('MB'):
            return int(size_str[:-2]) * 1024 * 1024
        elif size_str.endswith('GB'):
            return int(size_str[:-2]) * 1024 * 1024 * 1024
        else:
            return int(size_str)

    def update_from_env(self) -> None:
        """Update configuration from environment variables."""
        env_mappings = {
            'XIAOMI_SERVER_URL': ('server', 'url'),
            'XIAOMI_CLIENT_ID': ('client', 'id'),
            'XIAOMI_HMAC_SECRET': ('client', 'hmac_secret'),
            'XIAOMI_LOG_LEVEL': ('logging', 'level'),
            'XIAOMI_TIMEOUT': ('server', 'timeout'),
        }
        
        for env_var, (section, key) in env_mappings.items():
            value = os.getenv(env_var)
            if value:
                section_obj = getattr(self, section)
                if hasattr(section_obj, key):
                    # Convert to appropriate type
                    current_value = getattr(section_obj, key)
                    if isinstance(current_value, int):
                        value = int(value)
                    elif isinstance(current_value, bool):
                        value = value.lower() in ('true', '1', 'yes', 'on')
                    
                    setattr(section_obj, key, value)

    def validate_config(self) -> list:
        """Validate configuration and return list of issues."""
        issues = []
        
        # Check server URL accessibility
        try:
            import requests
            response = requests.get(f"{self.server.url}/health", timeout=5)
            if response.status_code != 200:
                issues.append(f"Server health check failed: {response.status_code}")
        except Exception as e:
            issues.append(f"Cannot reach server: {e}")
        
        # Check HMAC secret strength
        if self.client.hmac_secret == "default-hmac-secret":
            issues.append("Using default HMAC secret - change in production")
        
        # Check log directory permissions
        try:
            log_path = self.get_log_file_path()
            log_path.parent.mkdir(parents=True, exist_ok=True)
            test_file = log_path.parent / '.test_write'
            test_file.write_text('test')
            test_file.unlink()
        except Exception as e:
            issues.append(f"Cannot write to log directory: {e}")
        
        return issues
