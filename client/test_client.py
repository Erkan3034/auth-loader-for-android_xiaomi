#!/usr/bin/env python3
"""Test script for Xiaomi Unlock Client with mock devices."""

import asyncio
import sys
import os
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from src.devices.mock import MockDevice, MockDeviceSimulator
from src.core.client import XiaomiUnlockClient
from src.utils.config import Config
from src.utils.logger import setup_logger
from src.ui.cli import CLI


async def test_mock_device_detection():
    """Test mock device detection."""
    print("=== Testing Mock Device Detection ===")
    
    # Create mock devices
    devices = MockDevice.create_mock_devices(3)
    
    print(f"Created {len(devices)} mock devices:")
    for device in devices:
        print(f"  - {device}")
    
    return devices


async def test_auth_key_generation():
    """Test authentication key generation."""
    print("\n=== Testing Auth Key Generation ===")
    
    device = MockDevice.create_mock_xiaomi_device()
    auth_response = MockDevice.generate_mock_auth_response(device)
    
    print(f"Device: {device.model} ({device.serial_number})")
    print(f"Auth Key: {auth_response['authKey'][:20]}...")
    print(f"Bypass Tokens: {list(auth_response['bypassTokens'].keys())}")
    
    return auth_response


async def test_device_simulation():
    """Test device operation simulation."""
    print("\n=== Testing Device Operation Simulation ===")
    
    device = MockDevice.create_mock_xiaomi_device()
    simulator = MockDeviceSimulator(device)
    
    print(f"Testing device: {device}")
    
    # Test ping
    ping_result = simulator.ping()
    print(f"Ping result: {'Success' if ping_result else 'Failed'}")
    
    # Test operation
    try:
        operation_result = await simulator.simulate_operation("frp_unlock")
        print(f"Operation result: {'Success' if operation_result['success'] else 'Failed'}")
        if operation_result['success']:
            print(f"Duration: {operation_result['duration']:.1f}s")
            print(f"Steps completed: {operation_result['steps_completed']}/{operation_result['total_steps']}")
        else:
            print(f"Error: {operation_result.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"Operation failed: {e}")


async def test_client_integration():
    """Test full client integration with mock server."""
    print("\n=== Testing Client Integration ===")
    
    try:
        # Load config
        config = Config.load('config.json')
        
        # Setup logger
        logger = setup_logger('INFO', use_color=True)
        
        # Initialize CLI
        cli = CLI()
        
        # Initialize client
        client = XiaomiUnlockClient(config, logger, cli)
        
        print("Client initialized successfully")
        
        # Test mock device
        success = await client.test_mock_device()
        print(f"Mock device test: {'Success' if success else 'Failed'}")
        
        return success
        
    except Exception as e:
        print(f"Client integration test failed: {e}")
        return False


async def test_different_scenarios():
    """Test different device scenarios."""
    print("\n=== Testing Different Scenarios ===")
    
    scenarios = {
        'xiaomi_mixed': 'Mixed Xiaomi devices',
        'multi_chipset': 'Multiple chipset types',
        'edl_only': 'EDL mode only',
        'brom_only': 'BROM mode only',
        'single_device': 'Single device'
    }
    
    for scenario, description in scenarios.items():
        print(f"\nScenario: {description}")
        devices = MockDevice.create_test_scenario(scenario)
        
        print(f"Created {len(devices)} devices:")
        for device in devices:
            print(f"  - {device.manufacturer} {device.model} ({device.mode.value.upper()})")
        
        # Test operation simulation for each device
        for device in devices:
            result = MockDevice.simulate_device_operation(device, 'frp_unlock')
            status = 'SUCCESS' if result['success'] else 'FAILED'
            print(f"    Operation {status}: {device.serial_number}")


async def test_error_scenarios():
    """Test error handling scenarios."""
    print("\n=== Testing Error Scenarios ===")
    
    device = MockDevice.create_mock_xiaomi_device()
    simulator = MockDeviceSimulator(device)
    
    # Test connection loss
    print("Testing connection loss...")
    connection_task = asyncio.create_task(simulator.simulate_connection_loss(3))
    
    await asyncio.sleep(1)  # Wait for connection to be lost
    ping_result = simulator.ping()
    print(f"Ping during disconnection: {'Success' if ping_result else 'Failed'}")
    
    await connection_task  # Wait for reconnection
    ping_result = simulator.ping()
    print(f"Ping after reconnection: {'Success' if ping_result else 'Failed'}")
    
    # Test operation during disconnection
    print("\nTesting operation during disconnection...")
    try:
        # Start connection loss
        loss_task = asyncio.create_task(simulator.simulate_connection_loss(2))
        await asyncio.sleep(0.5)  # Let disconnection start
        
        # Try operation
        result = await simulator.simulate_operation("frp_unlock")
        print("Operation unexpectedly succeeded")
    except RuntimeError as e:
        print(f"Operation correctly failed: {e}")
    
    await loss_task  # Ensure cleanup


async def run_performance_test():
    """Run performance tests."""
    print("\n=== Performance Testing ===")
    
    import time
    
    # Test device creation performance
    start_time = time.time()
    devices = MockDevice.create_mock_devices(100)
    creation_time = time.time() - start_time
    print(f"Created 100 mock devices in {creation_time:.3f}s")
    
    # Test operation simulation performance
    start_time = time.time()
    results = []
    for i in range(10):
        device = devices[i]
        result = MockDevice.simulate_device_operation(device, 'frp_unlock')
        results.append(result)
    
    simulation_time = time.time() - start_time
    print(f"Simulated 10 operations in {simulation_time:.3f}s")
    
    # Calculate success rate
    success_count = sum(1 for r in results if r['success'])
    print(f"Success rate: {success_count}/10 ({success_count*10}%)")


async def main():
    """Run all tests."""
    print("Xiaomi Unlock Client - Test Suite")
    print("=" * 50)
    
    try:
        # Basic tests
        await test_mock_device_detection()
        await test_auth_key_generation()
        await test_device_simulation()
        
        # Scenario tests
        await test_different_scenarios()
        
        # Error handling tests
        await test_error_scenarios()
        
        # Performance tests
        await run_performance_test()
        
        # Integration test (requires server)
        print("\n=== Integration Test (Optional) ===")
        print("Note: This test requires the server to be running")
        try:
            success = await test_client_integration()
            if success:
                print("✓ All tests passed!")
            else:
                print("⚠ Some integration tests failed (server may not be running)")
        except Exception as e:
            print(f"⚠ Integration test skipped: {e}")
        
        print("\n" + "=" * 50)
        print("Test suite completed successfully!")
        
    except KeyboardInterrupt:
        print("\nTest suite interrupted by user")
    except Exception as e:
        print(f"\nTest suite failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    asyncio.run(main())
