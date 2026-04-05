# FF Private Server — v1.32.0

Lightweight private server emulator for **Free Fire 1.32.0**.  
Handles the Unity client's version-check request and returns a spoofed "up-to-date" response to bypass the loading/update screen.

---

## Endpoints

| Path | Method | Description |
|------|--------|-------------|
| `/live/` | GET / POST | Version check — returns the spoof payload |
| `/live/version.json` | GET / POST | Same — alternate path used by some builds |
| `/live/config.xml` | GET / POST | Same — alternate path used by some builds |
| `/` | GET | Health check |

### Response payload

```json
{
  "version": "1.32.0",
  "test_user": false,
  "update_url": "",
  "force_update": false,
  "status": 0,
  "patch_url": "",
  "maintenance": false
}
```

---

## Quick Start

### Node.js (zero dependencies)

```bash
# port 8080
npm start

# port 80  (requires root / sudo on Linux)
npm run start:80

# auto-restart on file changes (Node ≥ 18)
npm run dev
```

### PHP built-in server

```bash
php -S 0.0.0.0:8080 router.php
```

### PHP + Apache

Add to `.htaccess` in your web root:

```apache
RewriteEngine On
RewriteRule ^live(/.*)?$ index.php [L,QSA]
```

---

## Logging

Every request is printed to stdout with timestamp, method, client IP, and path.  
The PHP handler also appends to `ff_requests.log` in the project directory.

```
[2026-04-05T17:43:05.136Z]  [GET ]  [192.168.1.5]  /live/  →  version-check → 1.32.0
```

---

## Requirements

- **Node.js** ≥ 14  OR  **PHP** ≥ 7.4
- No third-party packages required
