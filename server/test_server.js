#!/usr/bin/env node

/**
 * Test script for Xiaomi Unlock Server
 */

const crypto = require('crypto');
const axios = require('axios');

// Test configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const CLIENT_ID = 'test-client-001';
const HMAC_SECRET = process.env.HMAC_SECRET || 'your_hmac_secret_key_here_change_in_production';

class ServerTester {
    constructor() {
        this.baseURL = SERVER_URL;
        this.clientId = CLIENT_ID;
        this.hmacSecret = HMAC_SECRET;
        this.testResults = [];
    }

    generateSignature(method, path, body, timestamp) {
        const dataToSign = `${method}${path}${body}${timestamp}${this.clientId}`;
        return crypto.createHmac('sha256', this.hmacSecret).update(dataToSign).digest('hex');
    }

    async makeRequest(method, endpoint, data = null) {
        const path = `/api${endpoint}`;
        const url = `${this.baseURL}${path}`;
        const body = data ? JSON.stringify(data) : '';
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = this.generateSignature(method, path, body, timestamp);

        const headers = {
            'Content-Type': 'application/json',
            'X-Client-ID': this.clientId,
            'X-Timestamp': timestamp.toString(),
            'X-Signature': signature,
            'User-Agent': 'XiaomiUnlockServerTester/1.0.0'
        };

        try {
            const response = await axios({
                method: method.toLowerCase(),
                url,
                headers,
                data,
                timeout: 10000
            });
            return { success: true, data: response.data, status: response.status };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: error.response ? .status,
                data: error.response ? .data
            };
        }
    }

    async testHealthCheck() {
        console.log('Testing health check...');

        try {
            const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
            const success = response.status === 200;

            this.testResults.push({
                test: 'Health Check',
                success,
                details: success ? 'Server is healthy' : 'Health check failed'
            });

            console.log(success ? '✓ Health check passed' : '✗ Health check failed');
            return success;
        } catch (error) {
            this.testResults.push({
                test: 'Health Check',
                success: false,
                details: error.message
            });
            console.log('✗ Health check failed:', error.message);
            return false;
        }
    }

    async testAuthKeyRequest() {
        console.log('\nTesting auth key request...');

        const deviceInfo = {
            deviceId: 'test-device-001',
            serialNumber: 'TEST123456789',
            chipset: 'qualcomm',
            mode: 'edl',
            manufacturer: 'Xiaomi',
            model: 'Test Device',
            androidVersion: '13'
        };

        const result = await this.makeRequest('POST', '/auth/request-key', { deviceInfo });

        if (result.success && result.data.success) {
            console.log('✓ Auth key request successful');
            console.log(`  Auth key: ${result.data.authKey.substring(0, 20)}...`);
            console.log(`  Device ID: ${result.data.deviceId}`);
            console.log(`  Expires in: ${result.data.expiresIn}s`);

            this.testResults.push({
                test: 'Auth Key Request',
                success: true,
                details: 'Auth key generated successfully',
                data: { authKey: result.data.authKey, deviceId: result.data.deviceId }
            });

            return { authKey: result.data.authKey, deviceId: result.data.deviceId };
        } else {
            console.log('✗ Auth key request failed:', result.error || result.data ? .error);
            this.testResults.push({
                test: 'Auth Key Request',
                success: false,
                details: result.error || result.data ? .error || 'Unknown error'
            });
            return null;
        }
    }

    async testAuthKeyVerification(authKey, deviceId) {
        console.log('\nTesting auth key verification...');

        const result = await this.makeRequest('POST', '/auth/verify-key', {
            authKey,
            deviceId
        });

        if (result.success && result.data.success && result.data.valid) {
            console.log('✓ Auth key verification successful');
            console.log(`  Device ID: ${result.data.deviceInfo.deviceId}`);
            console.log(`  Serial: ${result.data.deviceInfo.serialNumber}`);

            this.testResults.push({
                test: 'Auth Key Verification',
                success: true,
                details: 'Auth key verified successfully'
            });
            return true;
        } else {
            console.log('✗ Auth key verification failed:', result.error || result.data ? .reason);
            this.testResults.push({
                test: 'Auth Key Verification',
                success: false,
                details: result.error || result.data ? .reason || 'Unknown error'
            });
            return false;
        }
    }

    async testDeviceRegistration() {
        console.log('\nTesting device registration...');

        const deviceData = {
            deviceId: 'test-device-002',
            serialNumber: 'TEST987654321',
            chipset: 'mediatek',
            mode: 'brom',
            manufacturer: 'Xiaomi',
            model: 'Redmi Test',
            androidVersion: '12',
            bootloader: 'V1.0.0'
        };

        const result = await this.makeRequest('POST', '/device/register', deviceData);

        if (result.success && result.data.success) {
            console.log('✓ Device registration successful');
            console.log(`  Device ID: ${result.data.device.device_id}`);
            console.log(`  Serial: ${result.data.device.serial_number}`);

            this.testResults.push({
                test: 'Device Registration',
                success: true,
                details: 'Device registered successfully',
                data: { deviceId: result.data.device.device_id }
            });

            return result.data.device.device_id;
        } else {
            console.log('✗ Device registration failed:', result.error || result.data ? .error);
            this.testResults.push({
                test: 'Device Registration',
                success: false,
                details: result.error || result.data ? .error || 'Unknown error'
            });
            return null;
        }
    }

    async testUnlockOperation(deviceId, authKey) {
        console.log('\nTesting unlock operation...');

        // Start unlock operation
        const startResult = await this.makeRequest('POST', '/unlock/start', {
            deviceId,
            authKey,
            operationType: 'frp_unlock',
            metadata: { testMode: true }
        });

        if (!startResult.success || !startResult.data.success) {
            console.log('✗ Failed to start unlock operation:', startResult.error || startResult.data ? .error);
            this.testResults.push({
                test: 'Unlock Operation Start',
                success: false,
                details: startResult.error || startResult.data ? .error || 'Unknown error'
            });
            return null;
        }

        const operationId = startResult.data.operation.id;
        console.log(`✓ Unlock operation started (ID: ${operationId})`);

        // Update operation status to in_progress
        await this.makeRequest('PUT', `/unlock/${operationId}/status`, {
            status: 'in_progress',
            progress: 50
        });

        // Simulate completion
        await new Promise(resolve => setTimeout(resolve, 2000));

        const completeResult = await this.makeRequest('PUT', `/unlock/${operationId}/status`, {
            status: 'completed',
            progress: 100
        });

        if (completeResult.success && completeResult.data.success) {
            console.log('✓ Unlock operation completed successfully');
            this.testResults.push({
                test: 'Unlock Operation',
                success: true,
                details: 'Operation completed successfully',
                data: { operationId }
            });
            return operationId;
        } else {
            console.log('✗ Failed to complete unlock operation');
            this.testResults.push({
                test: 'Unlock Operation',
                success: false,
                details: 'Failed to complete operation'
            });
            return null;
        }
    }

    async testOperationHistory() {
        console.log('\nTesting operation history...');

        const result = await this.makeRequest('GET', '/unlock?limit=10');

        if (result.success && result.data.success) {
            const operations = result.data.operations;
            console.log(`✓ Retrieved ${operations.length} operations from history`);

            if (operations.length > 0) {
                console.log('  Recent operations:');
                operations.slice(0, 3).forEach(op => {
                    console.log(`    - ${op.operationType} (${op.status}) - ${op.startedAt}`);
                });
            }

            this.testResults.push({
                test: 'Operation History',
                success: true,
                details: `Retrieved ${operations.length} operations`
            });
            return true;
        } else {
            console.log('✗ Failed to retrieve operation history');
            this.testResults.push({
                test: 'Operation History',
                success: false,
                details: result.error || result.data ? .error || 'Unknown error'
            });
            return false;
        }
    }

    async testInvalidRequests() {
        console.log('\nTesting invalid requests...');

        // Test invalid HMAC
        const invalidHmacResult = await axios({
            method: 'post',
            url: `${this.baseURL}/api/auth/request-key`,
            headers: {
                'Content-Type': 'application/json',
                'X-Client-ID': this.clientId,
                'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
                'X-Signature': 'invalid-signature'
            },
            data: { deviceInfo: { serialNumber: 'test' } },
            validateStatus: () => true
        });

        const hmacTestSuccess = invalidHmacResult.status === 401;
        console.log(hmacTestSuccess ? '✓ Invalid HMAC correctly rejected' : '✗ Invalid HMAC not rejected');

        // Test missing headers
        const missingHeadersResult = await axios({
            method: 'post',
            url: `${this.baseURL}/api/auth/request-key`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: { deviceInfo: { serialNumber: 'test' } },
            validateStatus: () => true
        });

        const headersTestSuccess = missingHeadersResult.status === 401;
        console.log(headersTestSuccess ? '✓ Missing headers correctly rejected' : '✗ Missing headers not rejected');

        this.testResults.push({
            test: 'Invalid Requests',
            success: hmacTestSuccess && headersTestSuccess,
            details: 'Security validation tests'
        });

        return hmacTestSuccess && headersTestSuccess;
    }

    async runAllTests() {
        console.log('Xiaomi Unlock Server - Test Suite');
        console.log('='.repeat(50));

        try {
            // Basic connectivity
            const healthOk = await this.testHealthCheck();
            if (!healthOk) {
                console.log('\n✗ Server is not accessible. Please ensure the server is running.');
                return;
            }

            // Authentication tests
            const authData = await this.testAuthKeyRequest();
            if (authData) {
                await this.testAuthKeyVerification(authData.authKey, authData.deviceId);
            }

            // Device management tests
            const registeredDeviceId = await this.testDeviceRegistration();

            // Unlock operation tests
            if (authData && registeredDeviceId) {
                const operationId = await this.testUnlockOperation(authData.deviceId, authData.authKey);
                if (operationId) {
                    await this.testOperationHistory();
                }
            }

            // Security tests
            await this.testInvalidRequests();

            // Summary
            this.printTestSummary();

        } catch (error) {
            console.error('\nTest suite failed with error:', error.message);
        }
    }

    printTestSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('TEST SUMMARY');
        console.log('='.repeat(50));

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;

        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        if (failedTests > 0) {
            console.log('\nFailed Tests:');
            this.testResults.filter(r => !r.success).forEach(test => {
                console.log(`  ✗ ${test.test}: ${test.details}`);
            });
        }

        console.log('\n' + (failedTests === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed.'));
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new ServerTester();
    tester.runAllTests().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = ServerTester;