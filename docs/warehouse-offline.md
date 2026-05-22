# Warehouse Offline Mode

Scope: only `Поставки FBO` and `Товары WB` sticker printing.

## Target Setup

- Warehouse PC runs the local offline server.
- Tablet opens SkladPro through the PC over local Wi-Fi/LAN.
- Internet is needed for morning refresh and cloud sync only.
- FBO scanning and WB sticker printing continue when internet is unstable.

## Current Scaffold

- Frontend client: `src/lib/warehouseOffline.ts`
- Local server: `scripts/warehouse-offline-server.mjs`
- Start command: `npm run offline:server`
- Default server URL: `http://localhost:8787`
- Local SkladPro URL from tablet/PC: `http://<PC-LAN-IP>:8787`
- Frontend build served from: `dist/`
- Data file: `warehouse-offline-data/warehouse-offline.json`

The server serves the built SkladPro interface and stores:

- last offline snapshot;
- pending FBO scan queue;
- synced scan list placeholder;
- conflict list placeholder.

## API Contract

- `GET /api/warehouse-offline/health`
  - returns server status, snapshot timestamp, scan counters.
- `GET /api/warehouse-offline/snapshot`
  - returns the current morning snapshot.
- `POST /api/warehouse-offline/snapshot`
  - saves the current morning snapshot.
- `GET /api/warehouse-offline/fbo-scans`
  - returns pending/synced/conflict scan queues.
- `POST /api/warehouse-offline/fbo-scans`
  - appends one local FBO scan with `local_pending` status.

## Morning Snapshot Contents

The refresh button should build and send:

- suppliers;
- WB products from `wb_products_cache`;
- manual model numbers from `app_settings.wb_model_numbers_v1`;
- WB label layout from `app_settings.wb_label_layout_v1`;
- active FBO supplies;
- FBO boxes;
- already scanned Honest Sign codes.

## Implemented Frontend Pieces

- `Склад offline` panel is visible on the main `Поставки FBO` screen.
- `Обновить offline-базу` saves suppliers, WB products, FBO supplies, boxes, labels and model numbers to the PC server.
- `Товары WB` can load products from the offline snapshot for sticker printing.
- `Поставки FBO` can read supplies/boxes from the offline snapshot and create local supplies/boxes.
- FBO scan writes go to `POST /api/warehouse-offline/fbo-scans` when warehouse offline mode is enabled.
- `Синхронизировать` uploads pending local scans to Supabase when internet is available.

## Tomorrow On The Warehouse PC

Windows 11 plan via GitHub:

1. Install Git for Windows if it is missing.
2. Install Node.js LTS if it is missing.
3. Clone the project from GitHub:

```powershell
cd C:\
mkdir SkladPro
cd C:\SkladPro
git clone https://github.com/cany123rus/scladpro.git source_code
cd C:\SkladPro\source_code
```

4. Install dependencies:

```powershell
npm install
```

5. Build the SkladPro interface for local offline opening:

```powershell
npm run build
```

6. Start the server manually for the first check:

```bash
npm run offline:server
```

7. Check from the PC:

```bash
curl http://localhost:8787/api/warehouse-offline/health
```

8. Install Windows autostart through Task Scheduler:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-warehouse-offline-autostart.ps1
```

This creates a Windows scheduled task named `SkladPro Warehouse Offline Server`.
It starts `scripts\warehouse-offline-start.cmd` on user login and restarts the server if it stops.

9. Find the PC LAN IP:

```powershell
ipconfig
```

10. Open from tablet:

```text
http://<PC-LAN-IP>:8787
```

If the tablet can open SkladPro through that URL, the interface and offline API are ready on the local network.

## Windows Files

- `scripts/warehouse-offline-start.cmd`
  - starts the local server and writes logs to `logs\warehouse-offline-server.log`.
- `scripts/install-warehouse-offline-autostart.ps1`
  - installs/updates the Windows scheduled task and starts it immediately.

## Useful Windows Commands

Check task:

```powershell
Get-ScheduledTask -TaskName "SkladPro Warehouse Offline Server"
```

Start task manually:

```powershell
Start-ScheduledTask -TaskName "SkladPro Warehouse Offline Server"
```

Stop task:

```powershell
Stop-ScheduledTask -TaskName "SkladPro Warehouse Offline Server"
```

Remove task:

```powershell
Unregister-ScheduledTask -TaskName "SkladPro Warehouse Offline Server" -Confirm:$false
```
