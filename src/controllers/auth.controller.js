const express = require('express');
const router = express.Router();

const otpService = require('../services/otp.service');
const jwtService = require('../services/jwt.service');
const userStore = require('../models/user.store');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = userStore.findByUsername(username);

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (userStore.has2FA(username)) {
    return res.json({ 
      requires2FA: true,
      message: 'Please verify your 2FA token'
    });
  }

  const token = jwtService.generateToken({ username });
  res.json({ token });
});

router.post('/verify-2fa', (req, res) => {
  const { username, token, deviceId } = req.body;

  const device = deviceId
    ? userStore.getDevice(username, deviceId)
    : userStore.getDevices(username)[0];    

  if (!device || !device.secret) {
    return res.status(400).json({ error: '2FA not set up' });
  }

  const counter = device.counter || 0;
  const valid = otpService.verifyHOTP(token, device.secret, counter, 10);

  if (!valid) {
    return res.status(401).json({ error: 'Invalid OTP token' });
  }

  userStore.incrementCounter(username, device.id);

  const jwtToken = jwtService.generateToken({ username, has2FA: true });
  res.json({ token: jwtToken });
});

router.post('/verify-backup', (req, res) => {
  const { username, code } = req.body;

  const valid = userStore.verifyBackupCode(username, code);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid or used backup code' });
  }

  const jwtToken = jwtService.generateToken({ username, has2FA: true, fromBackup: true });
  res.json({ token: jwtToken });
});

router.post('/setup-2fa', async (req, res) => {
  const { username, deviceName } = req.body;

  const data = await otpService.generateHOTP(username, deviceName || 'Primary Device');

  const deviceWithData = {
    id: data.id,
    deviceName: data.deviceName,
    secret: data.base32,
    otpType: data.otpType,
    counter: data.counter || 0,
    confirmed: false,
    createdAt: data.createdAt,
  };
  userStore.addDevice(username, deviceWithData);

  res.json({
    deviceId: data.id,
    qr: data.qr,
    secret: data.base32,
    deviceName: data.deviceName,
    otpType: data.otpType,
    counter: data.counter || 0,
  });
});

router.post('/add-device', async (req, res) => {
  const { username, deviceName } = req.body;

  const data = await otpService.generateHOTP(username, deviceName || 'New Device');

  const deviceWithData = {
    id: data.id,
    deviceName: data.deviceName,
    secret: data.base32,
    otpType: data.otpType,
    counter: data.counter || 0,
    confirmed: false,
    createdAt: data.createdAt,
  };
  userStore.addDevice(username, deviceWithData);

  res.json({
    deviceId: data.id,
    qr: data.qr,
    secret: data.base32,
    deviceName: data.deviceName,
    otpType: data.otpType,
    counter: data.counter || 0,
  });
});

router.post('/confirm-device', (req, res) => {
  const { username, deviceId, token } = req.body;

  const device = userStore.getDevice(username, deviceId);  
  
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const counter = device.counter || 0;
  console.log(counter, "confirm counter");
  
  let valid = otpService.verifyHOTP(token, device.secret, counter, 10);

  console.log(valid, "valid");
  
  if (!valid) {
    return res.status(401).json({ error: 'Invalid OTP token' });
  }

  userStore.setCounter(username, deviceId, counter + 1);
  device.confirmed = true;
  res.json({ success: true, device });
});

router.get('/devices', (req, res) => {
  const { username } = req.query;
  const devices = userStore.getDevices(username);
  
  res.json(devices.map(d => ({
    id: d.id,
    deviceName: d.deviceName,
    otpType: 'hotp',
    confirmed: d.confirmed,
    counter: d.counter || 0,
    createdAt: d.createdAt,
  })));
});

router.delete('/devices/:deviceId', (req, res) => {
  const { username } = req.query;
  const { deviceId } = req.params;

  const removed = userStore.removeDevice(username, deviceId);
  res.json({ success: removed });
});

router.get('/counter/:deviceId', (req, res) => {
  const { username } = req.query;
  const { deviceId } = req.params;

  const counter = userStore.getCounter(username, deviceId);
  res.json({ counter });
});

router.get('/generate-code/:deviceId', (req, res) => {
  const { username } = req.query;
  const { deviceId } = req.params;

  const device = userStore.getDevice(username, deviceId);
  if (!device || !device.secret) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const code = otpService.generateHOTPToken(device.secret, device.counter || 0);
  res.json({ code, counter: device.counter || 0, otpType: 'hotp' });
});

router.post('/backup-codes', (req, res) => {
  const { username } = req.body;

  const codes = otpService.generateBackupCodes(10);
  userStore.setBackupCodes(username, codes);

  res.json({ codes });
});

router.get('/backup-codes/:username', (req, res) => {
  const { username } = req.params;

  const hasCodes = userStore.hasUnusedBackupCodes(username);
  res.json({ hasBackupCodes: hasCodes });
});

router.get('/protected', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwtService.verifyToken(token);
    res.json({ 
      message: 'Access granted',
      user: decoded 
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
