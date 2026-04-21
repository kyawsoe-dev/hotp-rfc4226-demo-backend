const crypto = require('crypto');

const users = {
  demo: {
    password: 'password123',
    devices: [],
    backupCodes: [],
  }
};

class UserStore {
  findByUsername(username) {
    return users[username] || null;
  }

  has2FA(username) {
    const user = users[username];
    return user && user.devices.length > 0;
  }

  addDevice(username, device) {
    console.log(device, "add device");
    
    if (!users[username]) return null;
    users[username].devices.push(device);
    
    return device;
  }

  getDevices(username) {
    return users[username]?.devices || [];
  }

  getDevice(username, deviceId) {
    return users[username]?.devices.find(d => d.id === deviceId) || null;
  }

  removeDevice(username, deviceId) {
    const user = users[username];
    if (!user) return false;
    user.devices = user.devices.filter(d => d.id !== deviceId);
    return true;
  }

  saveSecret(username, deviceId, base32) {
    const user = users[username];
    if (!user) return null;
    
    const device = user.devices.find(d => d.id === deviceId);

    if (device) {
      device.secret = base32;
      device.counter = 0;
    }
    
    return device;
  }

  getCounter(username, deviceId) {
    const device = this.getDevice(username, deviceId);
    return device?.counter || 0;
  }

  incrementCounter(username, deviceId) {
    const user = users[username];
    if (!user) return null;
    
    const device = user.devices.find(d => d.id === deviceId);
    if (device) {
      device.counter = (device.counter || 0) + 1;
      return device.counter;
    }
    return null;
  }

  setCounter(username, deviceId, counter) {
    const user = users[username];
    if (!user) return null;
    
    const device = user.devices.find(d => d.id === deviceId);
    if (device) {
      device.counter = counter;
      return counter;
    }
    return null;
  }

  getSecret(username, deviceId) {
    const device = this.getDevice(username, deviceId);
    
    return device?.secret || null;
  }

  getAnySecret(username) {
    const device = users[username]?.devices[0];
    
    return device?.secret || null;
  }

  setBackupCodes(username, codes) {
    if (!users[username]) return null;
    users[username].backupCodes = codes.map(code => ({
      code,
      used: false,
    }));
    return users[username].backupCodes;
  }

  getBackupCodes(username) {
    return users[username]?.backupCodes || [];
  }

  verifyBackupCode(username, code) {
    const user = users[username];
    if (!user) return false;

    const backupCode = user.backupCodes.find(
      bc => bc.code === code.toUpperCase() && !bc.used
    );

    if (backupCode) {
      backupCode.used = true;
      return true;
    }
    return false;
  }

  hasUnusedBackupCodes(username) {
    const codes = this.getBackupCodes(username);
    return codes.some(c => !c.used);
  }
}

module.exports = new UserStore();
