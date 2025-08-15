# Xiaomi Unlock Server API Documentation

## Overview

The Xiaomi Unlock Server provides a secure REST API for managing device unlock operations. All requests must be signed with HMAC SHA256 for security.

**Base URL:** `http://localhost:3000/api`

## Authentication

All API requests require HMAC SHA256 authentication using the following headers:

```http
X-Client-ID: your-client-id
X-Timestamp: unix-timestamp
X-Signature: hmac-sha256-signature
Content-Type: application/json
```

### Signature Generation

```javascript
const crypto = require('crypto');

function generateSignature(method, path, body, timestamp, clientId, secret) {
    const dataToSign = `${method}${path}${body}${timestamp}${clientId}`;
    return crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');
}
```

## Endpoints

### Health Check

**GET** `/health`

Check server health status. This endpoint does not require HMAC authentication.

**Response:**
```json
{
    "status": "OK",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "v1"
}
```

---

### Authentication

#### Request Auth Key

**POST** `/auth/request-key`

Request an authentication key for device unlock operations.

**Request Body:**
```json
{
    "deviceInfo": {
        "serialNumber": "ABC123456789",
        "chipset": "qualcomm",
        "mode": "edl",
        "deviceId": "optional-device-id",
        "manufacturer": "Xiaomi",
        "model": "Redmi Note 12",
        "androidVersion": "13",
        "bootloader": "V1.0.0"
    }
}
```

**Response:**
```json
{
    "success": true,
    "authKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "deviceId": "generated-device-id",
    "bypassTokens": {
        "token": "base64-encoded-token",
        "signature": "hmac-signature",
        "expires": 1642248600
    },
    "expiresIn": 300,
    "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Verify Auth Key

**POST** `/auth/verify-key`

Verify the validity of an authentication key.

**Request Body:**
```json
{
    "authKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "deviceId": "device-id-to-verify"
}
```

**Response:**
```json
{
    "success": true,
    "valid": true,
    "deviceInfo": {
        "deviceId": "device-id",
        "serialNumber": "ABC123456789",
        "chipset": "qualcomm",
        "mode": "edl"
    },
    "expiresAt": "2024-01-15T10:35:00.000Z"
}
```

#### Refresh Auth Key

**POST** `/auth/refresh-key`

Refresh an existing authentication key.

**Request Body:**
```json
{
    "authKey": "current-auth-key",
    "deviceId": "device-id"
}
```

**Response:**
```json
{
    "success": true,
    "authKey": "new-auth-key",
    "expiresIn": 300,
    "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Device Management

#### Register Device

**POST** `/device/register`

Register a new device with the server.

**Request Body:**
```json
{
    "deviceId": "unique-device-id",
    "serialNumber": "ABC123456789",
    "chipset": "qualcomm",
    "mode": "edl",
    "manufacturer": "Xiaomi",
    "model": "Redmi Note 12",
    "androidVersion": "13",
    "bootloader": "V1.0.0",
    "hardwareId": "optional-hardware-id"
}
```

**Response:**
```json
{
    "success": true,
    "device": {
        "id": 1,
        "device_id": "unique-device-id",
        "serial_number": "ABC123456789",
        "chipset": "qualcomm",
        "mode": "edl",
        "manufacturer": "Xiaomi",
        "model": "Redmi Note 12",
        "created_at": "2024-01-15T10:30:00.000Z",
        "last_seen": "2024-01-15T10:30:00.000Z"
    },
    "message": "Device registered successfully"
}
```

#### Get Device Info

**GET** `/device/{deviceId}`

Get information about a specific device.

**Response:**
```json
{
    "success": true,
    "device": {
        "id": 1,
        "device_id": "unique-device-id",
        "serial_number": "ABC123456789",
        "chipset": "qualcomm",
        "mode": "edl",
        "manufacturer": "Xiaomi",
        "model": "Redmi Note 12",
        "android_version": "13",
        "created_at": "2024-01-15T10:30:00.000Z",
        "last_seen": "2024-01-15T10:30:00.000Z"
    }
}
```

#### Get Devices

**GET** `/device?limit=50&offset=0`

Get devices registered by the client.

**Query Parameters:**
- `limit` (optional): Number of devices to return (1-100, default: 50)
- `offset` (optional): Number of devices to skip (default: 0)

**Response:**
```json
{
    "success": true,
    "devices": [
        {
            "id": 1,
            "device_id": "device-id-1",
            "serial_number": "ABC123456789",
            "chipset": "qualcomm",
            "mode": "edl",
            "manufacturer": "Xiaomi",
            "model": "Redmi Note 12",
            "created_at": "2024-01-15T10:30:00.000Z"
        }
    ],
    "pagination": {
        "limit": 50,
        "offset": 0,
        "count": 1
    }
}
```

#### Ping Device

**PUT** `/device/{deviceId}/ping`

Update device last seen timestamp.

**Response:**
```json
{
    "success": true,
    "device": {
        "id": 1,
        "device_id": "unique-device-id",
        "last_seen": "2024-01-15T10:35:00.000Z"
    },
    "message": "Device ping updated"
}
```

---

### Unlock Operations

#### Start Unlock Operation

**POST** `/unlock/start`

Start a new unlock operation.

**Request Body:**
```json
{
    "deviceId": "unique-device-id",
    "authKey": "valid-auth-key",
    "operationType": "frp_unlock",
    "metadata": {
        "clientVersion": "1.0.0",
        "operatingSystem": "Windows 11"
    }
}
```

**Operation Types:**
- `frp_unlock`: Factory Reset Protection unlock
- `edl_bypass`: EDL mode authentication bypass
- `bootloader_unlock`: Bootloader unlock
- `mi_unlock`: Xiaomi Mi Assistant unlock

**Response:**
```json
{
    "success": true,
    "operation": {
        "id": 123,
        "deviceId": "unique-device-id",
        "operationType": "frp_unlock",
        "status": "started",
        "startedAt": "2024-01-15T10:30:00.000Z"
    },
    "message": "Unlock operation started"
}
```

#### Update Operation Status

**PUT** `/unlock/{operationId}/status`

Update the status of an ongoing operation.

**Request Body:**
```json
{
    "status": "completed",
    "progress": 100,
    "errorMessage": "Optional error message if failed"
}
```

**Status Values:**
- `in_progress`: Operation is running
- `completed`: Operation completed successfully
- `failed`: Operation failed

**Response:**
```json
{
    "success": true,
    "operation": {
        "id": 123,
        "deviceId": "unique-device-id",
        "operationType": "frp_unlock",
        "status": "completed",
        "startedAt": "2024-01-15T10:30:00.000Z",
        "completedAt": "2024-01-15T10:32:00.000Z"
    },
    "message": "Operation status updated"
}
```

#### Get Operation Details

**GET** `/unlock/{operationId}`

Get details of a specific operation.

**Response:**
```json
{
    "success": true,
    "operation": {
        "id": 123,
        "deviceId": "unique-device-id",
        "operationType": "frp_unlock",
        "status": "completed",
        "startedAt": "2024-01-15T10:30:00.000Z",
        "completedAt": "2024-01-15T10:32:00.000Z",
        "metadata": {
            "clientVersion": "1.0.0"
        },
        "device": {
            "serialNumber": "ABC123456789",
            "model": "Redmi Note 12",
            "manufacturer": "Xiaomi"
        }
    }
}
```

#### Get Device Operations

**GET** `/unlock/device/{deviceId}?limit=10`

Get unlock operations for a specific device.

**Response:**
```json
{
    "success": true,
    "operations": [
        {
            "id": 123,
            "operationType": "frp_unlock",
            "status": "completed",
            "startedAt": "2024-01-15T10:30:00.000Z",
            "completedAt": "2024-01-15T10:32:00.000Z"
        }
    ],
    "deviceId": "unique-device-id"
}
```

#### Get Operation History

**GET** `/unlock?limit=50&offset=0`

Get operation history for the client.

**Response:**
```json
{
    "success": true,
    "operations": [
        {
            "id": 123,
            "deviceId": "unique-device-id",
            "operationType": "frp_unlock",
            "status": "completed",
            "startedAt": "2024-01-15T10:30:00.000Z",
            "completedAt": "2024-01-15T10:32:00.000Z",
            "device": {
                "serialNumber": "ABC123456789",
                "model": "Redmi Note 12",
                "manufacturer": "Xiaomi"
            }
        }
    ],
    "pagination": {
        "limit": 50,
        "offset": 0,
        "count": 1
    }
}
```

#### Get Operation Statistics

**GET** `/unlock/stats/summary?timeframe=24%20hours`

Get operation statistics.

**Query Parameters:**
- `timeframe`: Time period for stats (`1 hour`, `24 hours`, `7 days`, `30 days`)

**Response:**
```json
{
    "success": true,
    "stats": [
        {
            "total_operations": 150,
            "successful": 135,
            "failed": 10,
            "in_progress": 5,
            "operation_type": "frp_unlock",
            "avg_duration_seconds": 45.5
        }
    ],
    "timeframe": "24 hours"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
    "error": "Error message",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/auth/request-key"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication failed
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Common Error Messages

- `Missing required authentication headers`: HMAC headers not provided
- `Invalid request signature`: HMAC signature verification failed
- `Request timestamp outside valid window`: Request timestamp too old/new
- `Invalid or expired auth key`: Authentication key is invalid or expired
- `Device not found`: Specified device does not exist
- `Operation not found`: Specified operation does not exist
- `Validation failed`: Request data validation failed

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: 15 minutes
- **Limit**: 100 requests per window per IP
- **Headers**: Rate limit information is returned in response headers:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

---

## Security Considerations

1. **HMAC Signing**: All requests must be signed with HMAC SHA256
2. **Timestamp Validation**: Requests with timestamps older than 5 minutes are rejected
3. **Auth Key Expiration**: Authentication keys expire after 5 minutes
4. **Rate Limiting**: Prevents brute force and DoS attacks
5. **Input Validation**: All input data is validated and sanitized
6. **Secure Headers**: Security headers are applied to all responses

---

## SDK Examples

### Node.js Example

```javascript
const crypto = require('crypto');
const axios = require('axios');

class XiaomiUnlockAPI {
    constructor(baseURL, clientId, hmacSecret) {
        this.baseURL = baseURL;
        this.clientId = clientId;
        this.hmacSecret = hmacSecret;
    }

    generateSignature(method, path, body, timestamp) {
        const dataToSign = `${method}${path}${body}${timestamp}${this.clientId}`;
        return crypto.createHmac('sha256', this.hmacSecret).update(dataToSign).digest('hex');
    }

    async request(method, endpoint, data = null) {
        const path = `/api${endpoint}`;
        const url = `${this.baseURL}${path}`;
        const body = data ? JSON.stringify(data) : '';
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = this.generateSignature(method, path, body, timestamp);

        const headers = {
            'Content-Type': 'application/json',
            'X-Client-ID': this.clientId,
            'X-Timestamp': timestamp.toString(),
            'X-Signature': signature
        };

        const response = await axios({
            method: method.toLowerCase(),
            url,
            headers,
            data
        });

        return response.data;
    }

    async requestAuthKey(deviceInfo) {
        return await this.request('POST', '/auth/request-key', { deviceInfo });
    }
}
```

### Python Example

```python
import hashlib
import hmac
import json
import time
import requests

class XiaomiUnlockAPI:
    def __init__(self, base_url, client_id, hmac_secret):
        self.base_url = base_url
        self.client_id = client_id
        self.hmac_secret = hmac_secret

    def generate_signature(self, method, path, body, timestamp):
        data_to_sign = f"{method}{path}{body}{timestamp}{self.client_id}"
        return hmac.new(
            self.hmac_secret.encode(),
            data_to_sign.encode(),
            hashlib.sha256
        ).hexdigest()

    def request(self, method, endpoint, data=None):
        path = f"/api{endpoint}"
        url = f"{self.base_url}{path}"
        body = json.dumps(data) if data else ""
        timestamp = int(time.time())
        signature = self.generate_signature(method, path, body, timestamp)

        headers = {
            'Content-Type': 'application/json',
            'X-Client-ID': self.client_id,
            'X-Timestamp': str(timestamp),
            'X-Signature': signature
        }

        response = requests.request(
            method.lower(),
            url,
            headers=headers,
            json=data
        )
        
        return response.json()

    def request_auth_key(self, device_info):
        return self.request('POST', '/auth/request-key', {'deviceInfo': device_info})
```
