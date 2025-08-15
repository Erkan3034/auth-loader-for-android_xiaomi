"""Logging utilities for Xiaomi Unlock Client."""

import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from typing import Optional
from colorama import init, Fore, Style
import os

# Initialize colorama for Windows compatibility
init(autoreset=True)


class ColoredFormatter(logging.Formatter):
    """Custom formatter with color support."""
    
    COLORS = {
        'DEBUG': Fore.CYAN,
        'INFO': Fore.GREEN,
        'WARNING': Fore.YELLOW,
        'ERROR': Fore.RED,
        'CRITICAL': Fore.MAGENTA + Style.BRIGHT,
    }
    
    def __init__(self, use_color: bool = True):
        super().__init__()
        self.use_color = use_color
        
    def format(self, record):
        # Create base format
        if hasattr(record, 'device_id'):
            device_info = f" [{record.device_id}]"
        else:
            device_info = ""
            
        base_format = f"%(asctime)s - %(name)s{device_info} - %(levelname)s - %(message)s"
        
        if self.use_color and record.levelname in self.COLORS:
            # Apply color to the entire message
            color = self.COLORS[record.levelname]
            colored_format = f"{color}{base_format}{Style.RESET_ALL}"
            formatter = logging.Formatter(colored_format)
        else:
            formatter = logging.Formatter(base_format)
            
        return formatter.format(record)


class DeviceAdapter(logging.LoggerAdapter):
    """Logger adapter that adds device context."""
    
    def process(self, msg, kwargs):
        if 'device_id' in self.extra:
            kwargs.setdefault('extra', {})['device_id'] = self.extra['device_id']
        return msg, kwargs


def setup_logger(level: str = 'INFO', 
                use_color: bool = True,
                log_file: Optional[str] = None,
                max_size: int = 10 * 1024 * 1024,  # 10MB
                backup_count: int = 5) -> logging.Logger:
    """Setup logging configuration."""
    
    # Convert string level to logging constant
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    
    # Create main logger
    logger = logging.getLogger('xiaomi_unlock')
    logger.setLevel(numeric_level)
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(ColoredFormatter(use_color))
    logger.addHandler(console_handler)
    
    # File handler (if specified)
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = RotatingFileHandler(
            log_path,
            maxBytes=max_size,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)  # Always log everything to file
        file_handler.setFormatter(ColoredFormatter(use_color=False))  # No colors in file
        logger.addHandler(file_handler)
    
    # Prevent propagation to root logger
    logger.propagate = False
    
    return logger


def get_device_logger(device_id: str, base_logger: logging.Logger) -> DeviceAdapter:
    """Get a logger adapter with device context."""
    return DeviceAdapter(base_logger, {'device_id': device_id})


class OperationLogger:
    """Logger for tracking unlock operations."""
    
    def __init__(self, logger: logging.Logger, operation_id: str):
        self.logger = logger
        self.operation_id = operation_id
        self.steps = []
        
    def log_step(self, step: str, status: str = 'started', details: str = None):
        """Log an operation step."""
        timestamp = self._get_timestamp()
        step_info = {
            'timestamp': timestamp,
            'step': step,
            'status': status,
            'details': details
        }
        self.steps.append(step_info)
        
        message = f"Operation {self.operation_id} - {step}: {status}"
        if details:
            message += f" - {details}"
            
        if status == 'completed':
            self.logger.info(message)
        elif status == 'failed':
            self.logger.error(message)
        elif status == 'started':
            self.logger.info(message)
        else:
            self.logger.debug(message)
    
    def log_progress(self, step: str, progress: int, total: int, message: str = None):
        """Log progress within a step."""
        percentage = (progress / total) * 100 if total > 0 else 0
        msg = f"Operation {self.operation_id} - {step}: {progress}/{total} ({percentage:.1f}%)"
        if message:
            msg += f" - {message}"
        self.logger.debug(msg)
    
    def log_completion(self, success: bool, error: str = None):
        """Log operation completion."""
        if success:
            self.logger.info(f"Operation {self.operation_id} completed successfully")
        else:
            error_msg = f"Operation {self.operation_id} failed"
            if error:
                error_msg += f": {error}"
            self.logger.error(error_msg)
    
    def get_operation_log(self) -> dict:
        """Get complete operation log."""
        return {
            'operation_id': self.operation_id,
            'steps': self.steps,
            'total_steps': len(self.steps),
            'completed_steps': len([s for s in self.steps if s['status'] == 'completed']),
            'failed_steps': len([s for s in self.steps if s['status'] == 'failed'])
        }
    
    def save_operation_log(self, file_path: str):
        """Save operation log to file."""
        import json
        log_data = self.get_operation_log()
        
        log_file = Path(file_path)
        log_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False, default=str)
    
    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().isoformat()


# Silence noisy third-party loggers
def silence_third_party_loggers():
    """Reduce verbosity of third-party libraries."""
    noisy_loggers = [
        'urllib3.connectionpool',
        'requests.packages.urllib3',
        'usb.core',
        'usb.util',
        'serial.serialutil'
    ]
    
    for logger_name in noisy_loggers:
        logging.getLogger(logger_name).setLevel(logging.WARNING)


# Setup third-party logger silencing
silence_third_party_loggers()
