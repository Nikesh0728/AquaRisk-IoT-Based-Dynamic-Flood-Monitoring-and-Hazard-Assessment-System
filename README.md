# AquaRisk – IoT-Based Dynamic Flood Monitoring and Hazard Assessment System

A full-stack website that receives rainfall, water-level and flow readings from ESP32 sensor nodes, scores the flood hazard in real time, forecasts when thresholds will be crossed, and raises alerts.

- **Frontend:** React 19 + Tailwind CSS 4 + Vite (dashboard, analytics, alerts, device setup, settings)
- **Backend:** Express (REST API) with a JSON-file database – no database server or native modules to install
- **Firmware:** Arduino sketch for ESP32 in `firmware/`
- **Demo mode:** a built-in simulator so everything works without any hardware

## Run it in VS Code

1. Install **Node.js 20 or newer** from <https://nodejs.org> (check with `node -v`).
2. In VS Code choose **File → Open Folder…** and select this `aquarisk` folder. Accept the "install recommended extensions" prompt if you like.
3. Open the terminal (**Terminal → New Terminal**) and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open <http://localhost:3000>. The dashboard starts in **Demo mode** and is live immediately.

Shortcuts: press **Ctrl+Shift+B** (Cmd+Shift+B on macOS) to start the dev server, or **F5** to run it under the debugger.

> The `.env.local` file only sets `PORT`. Copy `.env.example` if you want to add optional settings (see below).

## Try the pages

| Page | What it shows |
| --- | --- |
| **Dashboard** | Hazard gauge (0–100), the three sensor cards with threshold bars, water-level trend, animated channel gauge, forecast, advisory and recent alerts |
| **Analytics** | Any metric over 5 min – All time, min/avg/max, latest readings table, CSV export |
| **Alerts** | Full alert log with acknowledge / clear |
| **Device** | ESP32 setup steps, copy-paste test commands, wiring table, connected devices |
| **Settings** | Demo ↔ Live switch, demo scenarios, editable risk thresholds, data clearing |

In **Settings → Demo scenario**, pick *Critical flood* to see the gauge, alerts and forecast react.

## Connect a real ESP32

1. Open `firmware/aquarisk_esp32/aquarisk_esp32.ino` in the Arduino IDE (board: *ESP32 Dev Module*).
2. Set `WIFI_SSID`, `WIFI_PASSWORD` and `SERVER_URL`. Use your computer's **LAN IP** (e.g. `http://192.168.1.50:3000/api/telemetry`) – not `localhost`.
3. Upload. In the web app go to **Settings → Live ESP32 data**.

If the ESP32 can't connect, allow Node.js through your firewall for private networks and make sure the board and computer are on the same Wi-Fi.

### No hardware? Simulate one

With the server running, in a second terminal:

```bash
npm run simulate -- --scenario=flood
```

Then switch the dashboard to **Live ESP32 data** (or click the banner that appears). Options: `--url=`, `--interval=` (seconds), `--id=`, `--key=`.

## How the hazard score works

Units: rainfall **mm/h**, water level **cm**, flow **L/min**.

1. Each sensor is converted to a 0–100 sub-score from its three thresholds: moderate → 25, high → 60, critical → 85, and it saturates at 100 once the value is 25 % above critical.
2. Overall score = 30 % rainfall + 45 % water level + 25 % flow.
3. A single dangerous sensor can't be averaged away: a water level in the High band forces at least a High level; rainfall or flow set a floor one band lower.
4. If the water is rising quickly, up to +10 points are added.
5. Score bands: **Low** < 25 · **Moderate** 25–59 · **High** 60–84 · **Critical** ≥ 85.

Thresholds can be changed in **Settings**. The forecast is a least-squares line through the latest water-level readings, projected to the high-risk and critical thresholds. The code is in `src/shared/risk.ts` and `src/shared/analytics.ts`.

## API

| Method & path | Purpose |
| --- | --- |
| `POST /api/telemetry` | ESP32 readings: `{ esp32_id, rainfall, water_level, flow_rate, wifi_rssi? }` → `{ ok, risk_score, risk_level }` |
| `GET /api/data` | Everything the dashboard needs |
| `GET /api/history?minutes=60&limit=400` | Readings for charts |
| `GET /api/alerts` · `POST /api/alerts/:id/ack` · `POST /api/alerts/ack-all` · `DELETE /api/alerts` | Alert log |
| `GET/PUT /api/thresholds` | Read / change thresholds |
| `GET/POST /api/demo` | Demo mode and scenario |
| `DELETE /api/readings` | Clear stored readings of the current mode |
| `GET /api/export.csv` | Download readings |
| `POST /api/advisory` | Plain-language situation summary |
| `GET /api/health` | Liveness check |

## Optional settings (`.env.local`)

| Variable | Effect |
| --- | --- |
| `PORT` | Web/API port (default 3000) |
| `DEVICE_API_KEY` | If set, devices must send it in the `x-api-key` header (the sketch has an `API_KEY` constant for this) |
| `GEMINI_API_KEY` | Enables Gemini-written advisories. Without it the dashboard uses built-in rules |
| `GEMINI_MODEL` | Gemini model name (default `gemini-2.5-flash`) |

## Project structure

```
aquarisk/
├── server.ts                 Express + Vite entry point
├── index.html
├── src/
│   ├── main.tsx, App.tsx     React shell and navigation
│   ├── pages/                Dashboard, Analytics, Alerts, Device, Settings
│   ├── components/           Gauge, charts, cards, alert list …
│   ├── hooks/, lib/          Data polling, API client, formatting
│   ├── shared/               Types + hazard model used by both server and UI
│   └── server/               api.ts, db.ts, demo.ts, advisory.ts
├── scripts/simulate-esp32.ts Hardware-free ESP32 simulator
├── firmware/aquarisk_esp32/  ESP32 Arduino sketch
├── .vscode/                  Tasks, debug config, recommended extensions
└── data/                     Created at runtime – saved real readings and settings
```

## Production build

```bash
npm run build     # creates dist/
npm run start     # serves dist/ + API on the same port
```

## Troubleshooting

- **Port 3000 already in use:** set `PORT=3001` in `.env.local`.
- **Blank page / old data:** stop the server, delete the `data/` folder, restart.
- **`npm install` errors:** confirm `node -v` is 20 or newer, then delete `node_modules` and retry.
- **Fonts look different offline:** the Google Fonts link in `index.html` needs internet; the UI falls back to system fonts.

AquaRisk is an educational/prototype system. Do not rely on it as the only source of flood warnings.
