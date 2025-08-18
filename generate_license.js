const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class ProfessionalLicenseGenerator {
    constructor() {
        this.secretKey = 'xiaomi-unlock-professional-2025';
    }

    // Generate unique machine ID
    generateMachineId(customerInfo) {
        const machineData = [
            customerInfo.companyName,
            customerInfo.customerName,
            customerInfo.email,
            Date.now().toString()
        ].join('|');

        return crypto.createHash('sha256')
            .update(machineData)
            .digest('hex')
            .substring(0, 32)
            .toUpperCase();
    }

    // Generate customer ID
    generateCustomerId(customerInfo) {
        const customerData = customerInfo.companyName.substring(0, 3).toUpperCase() +
            Date.now().toString().slice(-6);
        return customerData;
    }

    // Generate license signature
    generateSignature(licenseData) {
        const dataToSign = [
            licenseData.customerId,
            licenseData.machineId,
            licenseData.expiry,
            licenseData.package
        ].join('|');

        return crypto.createHmac('sha256', this.secretKey)
            .update(dataToSign)
            .digest('hex');
    }

    // Create professional license
    createProfessionalLicense(customerInfo) {
        // Calculate expiry date (1 year from now)
        const now = new Date();
        const expiry = new Date(now);
        expiry.setFullYear(expiry.getFullYear() + 1);

        const customerId = this.generateCustomerId(customerInfo);
        const machineId = this.generateMachineId(customerInfo);

        const licenseData = {
            customerId: customerId,
            customerName: customerInfo.companyName,
            contactPerson: customerInfo.customerName,
            email: customerInfo.email,
            phone: customerInfo.phone,
            xiaomiAuthorizedId: customerInfo.xiaomiId || 'XIAOMI_ID_TO_BE_PROVIDED',
            machineId: machineId,
            expiry: expiry.toISOString(),
            issued: now.toISOString(),
            version: '1.0',
            package: 'Professional',
            features: [
                'source_code_access',
                'full_documentation',
                'whatsapp_support_group',
                'remote_installation',
                'one_year_support',
                'all_updates_included',
                'priority_support',
                'xiaomi_authorized_unlock'
            ],
            supportLevel: 'Professional',
            maxDevicesPerDay: 100,
            concurrentUsers: 5
        };

        // Generate signature
        licenseData.signature = this.generateSignature(licenseData);

        return licenseData;
    }

    // Save license to file
    saveLicenseFile(licenseData, outputDir = './') {
        const filename = `license_${licenseData.customerId}_${Date.now()}.json`;
        const filepath = path.join(outputDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(licenseData, null, 2), 'utf8');

        return {
            filepath,
            filename,
            licenseData
        };
    }

    // Create activation instructions
    createActivationInstructions(licenseData) {
            return `
========================================
  XIAOMI UNLOCK PROFESSIONAL LICENSE
        Activation Instructions
========================================

Customer Information:
====================
Customer ID: ${licenseData.customerId}
Company: ${licenseData.customerName}
Contact: ${licenseData.contactPerson}
Email: ${licenseData.email}
Phone: ${licenseData.phone}

License Details:
================
Package: ${licenseData.package}
Version: ${licenseData.version}
Issued: ${new Date(licenseData.issued).toLocaleDateString('tr-TR')}
Expires: ${new Date(licenseData.expiry).toLocaleDateString('tr-TR')}
Machine ID: ${licenseData.machineId}

Features Included:
==================
${licenseData.features.map(f => `✓ ${f.replace(/_/g, ' ').toUpperCase()}`).join('\n')}

Support Information:
====================
Support Level: ${licenseData.supportLevel}
Max Devices/Day: ${licenseData.maxDevicesPerDay}
Concurrent Users: ${licenseData.concurrentUsers}

Activation Steps:
=================
1. Copy the license file to: server/license/license.json
2. Run the installation: INSTALL_PROFESSIONAL.bat
3. Start the system: QUICK_START.bat
4. Contact support for WhatsApp group access

Support Contacts:
=================
Email: support@xiaomi-unlock.com
WhatsApp: +90 XXX XXX XXXX
Support Hours: 09:00 - 18:00 (GMT+3)

IMPORTANT NOTES:
================
- Keep this license file secure
- Do not share with unauthorized persons
- Contact support for any activation issues
- License is bound to specific machine ID

========================================
        Thank you for your purchase!
========================================
`;
    }
}

// Example usage and CLI interface
if (require.main === module) {
    console.log('========================================');
    console.log('  PROFESSIONAL LICENSE GENERATOR');
    console.log('========================================\n');

    // Example customer data (replace with actual customer info)
    const customerInfo = {
        companyName: 'Akıllı Telefon Servisi Ltd.',
        customerName: 'Ahmet Yılmaz',
        email: 'ahmet@akillitelefon.com',
        phone: '+90 532 123 4567'
    };

    const generator = new ProfessionalLicenseGenerator();
    
    try {
        console.log('Generating Professional License...');
        const license = generator.createProfessionalLicense(customerInfo);
        
        console.log('Saving license file...');
        const result = generator.saveLicenseFile(license);
        
        console.log('Creating activation instructions...');
        const instructions = generator.createActivationInstructions(license);
        
        // Save instructions
        const instructionsFile = `activation_instructions_${license.customerId}.txt`;
        fs.writeFileSync(instructionsFile, instructions, 'utf8');
        
        console.log('\n✅ SUCCESS!');
        console.log('================');
        console.log(`License File: ${result.filename}`);
        console.log(`Instructions: ${instructionsFile}`);
        console.log(`Customer ID: ${license.customerId}`);
        console.log(`Machine ID: ${license.machineId}`);
        console.log(`Expires: ${new Date(license.expiry).toLocaleDateString('tr-TR')}`);
        
    } catch (error) {
        console.error('❌ Error generating license:', error.message);
    }
}

module.exports = ProfessionalLicenseGenerator;