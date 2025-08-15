# Xiaomi Device Unlock System

A complete system for Android firmware engineering with support for Qualcomm EDL, MTK BROM, and Xiaomi Mi Assistant modes.

## Features

- **Multi-Device Support**: Qualcomm EDL, MTK BROM v6, Xiaomi Mi Assistant
- **Authentication Bypass**: Xiaomi EDL authorized account bypass
- **Secure API**: Node.js server with HMAC SHA256 signing
- **Cross-Platform Client**: Python tool with device detection
- **FRP Unlock**: Factory Reset Protection bypass
- **Comprehensive Logging**: PostgreSQL database logging

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Android       │    │   Python        │    │   Node.js       │
│   Device        │◄──►│   Client        │◄──►│   API Server    │
│                 │    │   Tool          │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                               ┌─────────────────┐
                                               │   PostgreSQL    │
                                               │   Database      │
                                               └─────────────────┘
```

## Workflow

1. **Device Connection**: User connects Android device in correct mode
2. **Device Detection**: Client detects device mode and extracts info
3. **Auth Request**: Client sends device data to API server
4. **Key Generation**: Server generates time-limited auth key
5. **Unlock Operation**: Client performs FRP unlock using auth key
6. **Result Logging**: Server logs operation result

## Quick Start

### Server Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run migrate
npm start
```

### Client Setup

```bash
cd client
pip install -r requirements.txt
python main.py
```

## Directory Structure

```
xiaomi-project/
├── server/                 # Node.js API Server
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── migrations/
│   ├── package.json
│   └── .env.example
├── client/                 # Python Client Tool
│   ├── src/
│   │   ├── devices/
│   │   ├── api/
│   │   └── utils/
│   ├── requirements.txt
│   └── main.py
├── docs/                   # Documentation
│   ├── api.md
│   └── workflow.md
└── README.md
```

## Security Features

- HMAC SHA256 request signing
- Time-limited auth keys (5-minute expiration)
- Secure device identification
- Operation logging and audit trail

## Supported Devices

- **Qualcomm EDL Mode**: Snapdragon chipsets
- **MTK BROM Mode**: MediaTek chipsets
- **Xiaomi Mi Assistant**: Mi devices in special mode

## ⚠️ Important Disclaimer

**This software is provided for educational and research purposes only.** 

- **Legal Compliance**: Ensure you comply with all local laws and regulations
- **Device Warranty**: Unlocking devices may void warranties
- **Risk Acknowledgment**: Use at your own risk - device damage is possible
- **Authorized Use Only**: Only use on devices you own or have explicit permission to modify

The developers assume no responsibility for any damage, legal issues, or warranty violations that may result from using this software.

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/xiaomi-project.git
   cd xiaomi-project
   ```

2. **Start the system:**
   ```bash
   # Terminal 1: Start server
   cd server
   npm install && npm run migrate && npm start

   # Terminal 2: Start client
   cd client
   pip install -r requirements.txt && python main.py
   ```

3. **Test the system:**
   ```bash
   # Test server
   cd server && node test_server.js

   # Test client
   cd client && python test_client.py
   ```

## 📁 Complete Project Structure

```
xiaomi-project/
├── server/                     # Node.js API Server
│   ├── src/
│   │   ├── app.js             # Main application
│   │   ├── middleware/        # HMAC validation, error handling
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes (auth, device, unlock)
│   │   └── utils/             # Crypto, database, logging utilities
│   ├── migrations/            # Database migrations
│   ├── package.json
│   ├── env.example
│   └── test_server.js         # Server test suite
├── client/                     # Python Client Tool
│   ├── src/
│   │   ├── core/              # Main client logic
│   │   ├── devices/           # Device detection and management
│   │   │   ├── detector.py    # Multi-mode device detection
│   │   │   ├── manager.py     # Device operations
│   │   │   ├── models.py      # Device data models
│   │   │   └── mock.py        # Mock devices for testing
│   │   ├── api/               # Server communication
│   │   ├── utils/             # Configuration and logging
│   │   └── ui/                # Command-line interface
│   ├── main.py                # Entry point
│   ├── config.json            # Client configuration
│   ├── requirements.txt       # Python dependencies
│   └── test_client.py         # Client test suite
├── docs/                       # Documentation
│   ├── api.md                 # Complete API documentation
│   ├── installation.md        # Installation guide
│   └── workflow.md            # Detailed workflow explanation
├── README.md                   # This file
└── DEPLOYMENT.md              # Deployment guide
```

## 🔧 Features Implemented

### ✅ Server (Node.js + Express)
- **Secure API** with HMAC SHA256 authentication
- **Database integration** with PostgreSQL
- **Device management** and registration
- **Operation logging** and history
- **Auth key generation** with JWT
- **Rate limiting** and security headers
- **Comprehensive error handling**

### ✅ Client (Python)
- **Multi-mode device detection** (USB, Serial, ADB, Fastboot)
- **Device communication** for EDL, BROM, Mi Assistant modes
- **Secure API communication** with HMAC signing
- **Rich CLI interface** with progress indicators
- **Mock device support** for testing
- **Comprehensive logging** and error handling

### ✅ Security Features
- **HMAC SHA256 request signing**
- **Time-limited auth keys** (5-minute expiration)
- **Timestamp validation** (prevents replay attacks)
- **Input validation** and sanitization
- **Rate limiting** and abuse prevention

### ✅ Device Support
- **Qualcomm EDL Mode**: Snapdragon chipsets with bypass tokens
- **MediaTek BROM Mode**: MTK chipsets with authentication keys
- **Xiaomi Mi Assistant**: Xiaomi-specific unlock methods
- **Generic modes**: ADB and Fastboot support

### ✅ Testing & Documentation
- **Complete test suites** for both server and client
- **Mock device simulation** for safe testing
- **Comprehensive API documentation**
- **Installation and deployment guides**
- **Workflow documentation** with diagrams

## License

This project is for educational and research purposes only.

