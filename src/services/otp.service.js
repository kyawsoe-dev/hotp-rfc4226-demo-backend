const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class OTPService {
  async generateHOTP(userId, deviceName = 'Primary Device') {
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `HOTP-RFC4226-DEMO (${userId})`,
    });

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: userId,
      issuer: 'HOTP-RFC4226-DEMO',
      type: 'hotp',
      counter: 0,
    });

    const qr = await QRCode.toDataURL(otpauthUrl);

    return {
      id: crypto.randomUUID(),
      base32: secret.base32,
      qr,
      deviceName,
      otpType: 'hotp',
      counter: 0,
      createdAt: new Date(),
    };
  }

  generateHOTPToken(base32, counter) {
    return speakeasy.hotp({
      secret: base32,
      counter,
      encoding: 'base32',
    });
  }

  verifyHOTP(token, base32, counter) {
    const expected = speakeasy.hotp({
      secret: base32,
      counter,
      encoding: 'base32',
    });
    console.log('Expected:', expected, 'Got:', token);
    return speakeasy.hotp.verify({
      secret: base32,
      counter,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}

module.exports = new OTPService();
