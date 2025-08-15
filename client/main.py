#!/usr/bin/env python3
"""
Xiaomi Device Unlock Client
A comprehensive tool for unlocking Android devices via EDL, BROM, and Mi Assistant modes.
"""

import sys
import os
import argparse
import asyncio
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from src.core.client import XiaomiUnlockClient
from src.utils.logger import setup_logger
from src.utils.config import Config
from src.ui.cli import CLI

def main():
    """Main entry point for the Xiaomi Unlock Client."""
    parser = argparse.ArgumentParser(
        description='Xiaomi Device Unlock Client',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py --detect                    # Detect connected devices
  python main.py --unlock --mode edl         # Unlock device in EDL mode
  python main.py --config config.json       # Use custom config file
  python main.py --mock                     # Use mock device for testing
        """
    )
    
    parser.add_argument('--config', '-c', 
                       help='Configuration file path',
                       default='config.json')
    
    parser.add_argument('--server-url', 
                       help='API server URL',
                       default='http://localhost:3000')
    
    parser.add_argument('--detect', '-d',
                       action='store_true',
                       help='Detect connected devices')
    
    parser.add_argument('--unlock', '-u',
                       action='store_true',
                       help='Start unlock operation')
    
    parser.add_argument('--mode', '-m',
                       choices=['edl', 'brom', 'mi_assistant', 'auto'],
                       default='auto',
                       help='Device mode (default: auto-detect)')
    
    parser.add_argument('--device-id',
                       help='Specific device ID to unlock')
    
    parser.add_argument('--serial',
                       help='Device serial number')
    
    parser.add_argument('--mock',
                       action='store_true',
                       help='Use mock device for testing')
    
    parser.add_argument('--verbose', '-v',
                       action='count',
                       default=0,
                       help='Increase verbosity (-v, -vv, -vvv)')
    
    parser.add_argument('--quiet', '-q',
                       action='store_true',
                       help='Quiet mode (minimal output)')
    
    parser.add_argument('--no-color',
                       action='store_true',
                       help='Disable colored output')
    
    args = parser.parse_args()
    
    # Setup logging
    log_level = 'ERROR' if args.quiet else ['INFO', 'DEBUG', 'TRACE'][min(args.verbose, 2)]
    logger = setup_logger(log_level, not args.no_color)
    
    # Load configuration
    try:
        config = Config.load(args.config)
        if args.server_url:
            config.server_url = args.server_url
    except Exception as e:
        logger.error(f"Failed to load configuration: {e}")
        return 1
    
    # Initialize CLI
    cli = CLI(no_color=args.no_color, quiet=args.quiet)
    
    # Initialize client
    try:
        client = XiaomiUnlockClient(config, logger, cli)
    except Exception as e:
        logger.error(f"Failed to initialize client: {e}")
        return 1
    
    # Run the appropriate action
    try:
        if args.mock:
            return asyncio.run(run_mock_mode(client, args))
        elif args.detect:
            return asyncio.run(run_detect_mode(client, args))
        elif args.unlock:
            return asyncio.run(run_unlock_mode(client, args))
        else:
            return asyncio.run(run_interactive_mode(client, args))
    except KeyboardInterrupt:
        logger.info("Operation cancelled by user")
        return 130
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1

async def run_detect_mode(client, args):
    """Run device detection mode."""
    devices = await client.detect_devices()
    
    if not devices:
        client.cli.error("No devices detected")
        return 1
    
    client.cli.success(f"Found {len(devices)} device(s):")
    for device in devices:
        client.cli.info(f"  - {device.model} ({device.serial_number}) - {device.mode.upper()} mode")
    
    return 0

async def run_unlock_mode(client, args):
    """Run unlock operation mode."""
    if args.device_id:
        # Unlock specific device by ID
        success = await client.unlock_device_by_id(args.device_id)
    elif args.serial:
        # Unlock device by serial number
        success = await client.unlock_device_by_serial(args.serial)
    else:
        # Auto-detect and unlock
        success = await client.auto_unlock(mode=args.mode if args.mode != 'auto' else None)
    
    return 0 if success else 1

async def run_mock_mode(client, args):
    """Run with mock device for testing."""
    client.cli.info("Running in mock mode...")
    success = await client.test_mock_device()
    return 0 if success else 1

async def run_interactive_mode(client, args):
    """Run interactive mode."""
    client.cli.show_banner()
    
    while True:
        try:
            choice = client.cli.show_main_menu()
            
            if choice == '1':
                await run_detect_mode(client, args)
            elif choice == '2':
                await run_unlock_mode(client, args)
            elif choice == '3':
                await client.show_operation_history()
            elif choice == '4':
                await client.show_settings()
            elif choice == '5':
                await run_mock_mode(client, args)
            elif choice == '0':
                break
            else:
                client.cli.error("Invalid choice")
                
        except KeyboardInterrupt:
            break
    
    client.cli.info("Goodbye!")
    return 0

if __name__ == '__main__':
    sys.exit(main())
