# NetWatch — Network Monitoring Dashboard

A self-hosted network monitoring dashboard running on a Raspberry Pi access point. Built with Flask and vanilla JS, it polls system metrics every 2 seconds and visualizes them in a modern dark UI with real-time charts. Features ARP spoofing detection, connected client enumeration, and live protocol analysis through an integrated IDS microservice.

---

## Features

- **Real-time metrics** — CPU, memory, disk, temperature, uptime, and network latency updated every 2 seconds
- **Live traffic charts** — Chart.js line graphs for network throughput (KB/s) and system load history
- **ARP spoofing detection** — tracks MAC addresses of connected clients and alerts on IP/MAC conflicts
- **Connected client list** — enumerates active devices on `wlan0` via the ARP table
- **Protocol analysis** — on-demand traffic inspection via an IDS microservice (port 5001)

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Backend  | Python 3, Flask, psutil           |
| Frontend | Vanilla JS, Chart.js, Inter font  |
| Platform | Raspberry Pi OS (Linux, `wlan0`)  |

## Project Structure

```
├── app.py                  # Flask backend — metrics, ARP detection, IDS proxy
├── templates/
│   └── index.html          # HTML template (markup only)
└── static/
    ├── style.css           # Dashboard styles
    └── js/
        ├── charts.js       # Chart.js setup and history buffers
        ├── dashboard.js    # Polling loop and DOM updates
        └── analysis.js     # Protocol analysis panel
```

## Getting Started

**Requirements:** Raspberry Pi running Raspberry Pi OS, Python 3, pip

```bash
# Install dependencies
pip install flask psutil requests

# Run the dashboard
python app.py
```

Then open `http://<Pi-IP>:5000` in a browser on your local network.

> The Pi must be configured as a wireless access point with `wlan0` for client enumeration and ARP monitoring to work.

## Protocol Analysis (Optional)

The Analyze button calls a companion IDS microservice expected at `http://localhost:5001/analyze`. Run `ids_service.py` separately on port 5001 to enable it. Without it, the panel will show a service offline message.

## API

| Endpoint             | Description                              |
|----------------------|------------------------------------------|
| `GET /`              | Renders the dashboard                    |
| `GET /data`          | JSON — all current system metrics        |
| `GET /protocol_analysis` | Proxies to IDS microservice on :5001 |

### `/data` Response

```json
{
  "cpu_percent": 12.3,
  "mem_percent": 45.1,
  "disk_percent": 61.0,
  "cpu_temp": "47.2°C",
  "uptime": "02h 14m 33s",
  "download_speed": 18.4,
  "upload_speed": 3.1,
  "latency": "0.512 ms",
  "arp_status": "Secure",
  "connected_devices": 2,
  "devices": [
    { "ip": "10.42.0.23", "mac": "aa:bb:cc:dd:ee:ff" }
  ]
}
```
