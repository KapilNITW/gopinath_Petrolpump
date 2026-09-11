# Cloud Backup + Remote Access Setup

This app now auto-backs up your database AND can be opened from anywhere.
Your data stays on your own computer — we just (1) copy the database to a
synced folder for safety, and (2) give you a URL to open the app remotely.

---

## Part 1 — Auto Cloud Backup

The server automatically copies the database into a backup folder:
- **on every server start**
- **every 30 minutes** (while the server is running)
- **anytime you click "Backup Now"** in the Admin panel

If you point that backup folder at your **Google Drive / OneDrive desktop
folder**, the cloud app uploads each backup by itself — no API keys needed.

### 1. Create a backup folder in the cloud
Open your **Google Drive** or **OneDrive** folder on the pump computer and
make a new folder, e.g. `PetrolPump_Backup`. Note its full path, like:

- Google Drive: `C:\Users\<you>\Google Drive\PetrolPump_Backup`
- OneDrive:    `C:\Users\<you>\OneDrive\PetrolPump_Backup`

### 2. Point the app at that folder
In the `server` folder, create a file named `.env` (if not already there) and add:

```
BACKUP_DIR=C:\Users\<you>\OneDrive\PetrolPump_Backup
BACKUP_ENABLED=true
BACKUP_INTERVAL=30
BACKUP_KEEP=30
```

Then **restart the server**. You'll see log lines like:
`[BACKUP] Auto-backup every 30 min -> ...`

If you don't set `BACKUP_DIR`, backups go to `server/backups` by default.

---

## Part 2 — Remote Access (open the app from anywhere)

Two easy free options. Pick ONE.

### Option A — Cloudflare Tunnel (best: gives a public URL, no IP exposure)

1. Download `cloudflared` from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
   (Windows: pick the `cloudflared-windows-amd64.exe`).
   Rename it to `cloudflared.exe` and put it somewhere like `C:\cloudflared\`.
2. Make sure the server is running (port 5000).
3. Open Command Prompt and run:
   ```
   C:\cloudflared\cloudflared.exe tunnel --url http://localhost:5000
   ```
4. You'll get a URL like `https://random-words.trycloudflare.com`.
   **Anyone with this URL can open your app from any phone/laptop.**

> Note: with the free "quick tunnel" the URL changes every time you restart it.
> For a permanent URL you'd need a domain + a named tunnel (I can walk you through).

### Option B — Tailscale (best for privacy: only YOUR devices can connect)

1. Create a free account at https://tailscale.com and install Tailscale on the
   pump computer AND on your phone/laptop.
2. Sign in on all devices with the same account.
3. On the pump computer, make sure the server runs on `0.0.0.0` (all interfaces):
   - In `server/server.js`, change `app.listen(PORT, ...)` to
     `app.listen(PORT, "0.0.0.0", ...)`.
4. Restart the server. Now open the app on your phone using the pump computer's
   **Tailscale IP** + `:5000`, e.g. `http://100.x.x.x:5000`.

---

## Restore / view a backup

- Every backup is a full copy of the database: `petrol_pump_YYYY-MM-DD_HH-MM-SS.db`.
- To restore: stop the server, copy a backup file over
  `server/db/petrol_pump.db`, then start the server again.
- To view data on another computer: download a backup `.db` file and open it
  with any SQLite viewer (e.g. https://sqliteviewer.app).

---

## What this does NOT do (important)

- Remote access opens the **app**, but the live database still runs on the pump
  computer. If the pump computer is off, the app can't be used.
- Cloud backup is a **copy for safety**. For true multi-computer live syncing
  (every computer editing the same data), we'd need to move to a hosted
  database instead — happy to set that up as a separate step if you ever need it.
