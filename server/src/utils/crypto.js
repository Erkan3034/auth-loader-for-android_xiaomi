const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class CryptoUtils {
    constructor() {
        this.hmacSecret = process.env.HMAC_SECRET || 'default-hmac-secret';
        this.jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret';
        this.authKeyExpiry = parseInt(process.env.AUTH_KEY_EXPIRY) || 300; // 5 minutes
    }

    /**
     * Generate HMAC SHA256 signature
     */
    generateHMAC(data, secret = null) {
        const secretKey = secret || this.hmacSecret;
        return crypto.createHmac('sha256', secretKey).update(data).digest('hex');
    }

    /**
     * Verify HMAC signature
     */
    verifyHMAC(data, signature, secret = null) {
        const secretKey = secret || this.hmacSecret;
        const expectedSignature = this.generateHMAC(data, secretKey);
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }

    /**
     * Generate secure random string
     */
    generateSecureRandom(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate device-specific auth key
     */
    generateAuthKey(deviceInfo) {
        const payload = {
            deviceId: deviceInfo.deviceId,
            serialNumber: deviceInfo.serialNumber,
            chipset: deviceInfo.chipset,
            mode: deviceInfo.mode,
            timestamp: Date.now(),
            nonce: this.generateSecureRandom(16)
        };

        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.authKeyExpiry,
            issuer: 'xiaomi-unlock-server',
            audience: 'xiaomi-unlock-client'
        });
    }

    /**
     * Verify and decode auth key
     */
    verifyAuthKey(authKey) {
        try {
            return jwt.verify(authKey, this.jwtSecret, {
                issuer: 'xiaomi-unlock-server',
                audience: 'xiaomi-unlock-client'
            });
        } catch (error) {
            throw new Error('Invalid or expired auth key');
        }
    }

    /**
     * Generate Xiaomi EDL bypass token
     */
    generateXiaomiEDLBypass(deviceInfo) {
        // Simulate Xiaomi's auth handshake
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = this.generateSecureRandom(8);

        const payload = {
            sn: deviceInfo.serialNumber,
            hwid: deviceInfo.hwid || this.generateHardwareId(deviceInfo),
            timestamp: timestamp,
            nonce: nonce,
            mode: 'edl_bypass'
        };

        // Create a signature that mimics Xiaomi's protocol
        const dataToSign = `${payload.sn}${payload.hwid}${payload.timestamp}${payload.nonce}`;
        const signature = this.generateHMAC(dataToSign, 'xiaomi-edl-secret');

        return {
            token: Buffer.from(JSON.stringify(payload)).toString('base64'),
            signature: signature,
            expires: timestamp + this.authKeyExpiry
        };
    }

    /**
     * Generate hardware ID from device info
     */
    generateHardwareId(deviceInfo) {
        const data = `${deviceInfo.serialNumber}${deviceInfo.chipset}${deviceInfo.bootloader || ''}`;
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }

    /**
     * Generate MTK BROM bypass token
     */
    generateMTKBypass(deviceInfo) {
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = this.generateSecureRandom(12);

        return {
            auth_token: this.generateSecureRandom(32),
            device_key: crypto.createHash('md5').update(deviceInfo.serialNumber).digest('hex'),
            timestamp: timestamp,
            nonce: nonce,
            expires: timestamp + this.authKeyExpiry
        };
    }

    /**
     * Hash password with salt
     */
    hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return `${salt}:${hash}`;
    }

    /**
     * Verify password
     */
    verifyPassword(password, hashedPassword) {
        const [salt, hash] = hashedPassword.split(':');
        const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return hash === verifyHash;
    }
}

module.exports = new CryptoUtils();