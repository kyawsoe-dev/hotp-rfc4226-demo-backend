# HOTP 2FA Backend

REST API server implementing RFC 4226 HOTP (HMAC-based One-Time Password) for two-factor authentication.

## Quick Start

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:3000`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with username/password |
| POST | `/api/auth/verify-2fa` | Verify HOTP token |
| POST | `/api/auth/verify-backup` | Verify backup code |
| GET | `/api/auth/protected` | Test protected route |

### Device Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/setup-2fa` | Generate new 2FA device with QR |
| POST | `/api/auth/add-device` | Add another device |
| POST | `/api/auth/confirm-device` | Confirm device with OTP |
| GET | `/api/auth/devices` | List user's devices |
| DELETE | `/api/auth/devices/:deviceId` | Remove device |

### Backup Codes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/backup-codes` | Generate new backup codes |
| GET | `/api/auth/backup-codes/:username` | Check if user has backup codes |

### Counter Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/counter/:deviceId` | Get current HOTP counter |
| GET | `/api/auth/generate-code/:deviceId` | Generate current HOTP code |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

## API Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "password123"}'
```

### Setup 2FA
```bash
curl -X POST http://localhost:3000/api/auth/setup-2fa \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "deviceName": "HOTP-RFC4226-DEMO APP"}'
```

### Verify 2FA
```bash
curl -X POST http://localhost:3000/api/auth/verify-2fa \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "token": "123456"}'
```

### Get Current Counter
```bash
curl -X GET "http://localhost:3000/api/auth/counter/:deviceId?username=demo"
```

### Generate HOTP Code
```bash
curl -X GET "http://localhost:3000/api/auth/generate-code/:deviceId?username=demo"
```

### Protected Route
```bash
curl -X GET http://localhost:3000/api/auth/protected \
  -H "Authorization: Bearer <TOKEN>"
```

## Default User

- Username: `demo`
- Password: `password123`

## Tech Stack

- Express.js
- speakeasy (HOTP)
- qrcode (QR generation)
- jsonwebtoken (JWT)