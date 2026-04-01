from flask import Flask, render_template, jsonify
import psutil
import datetime
import subprocess
import time
import requests

IDS_SERVICE_URL = "http://localhost:5001/analyze"

# Function to read CPU temperature from the system file
def get_cpu_temp():
    try:
        # File path for CPU temperature on Raspberry Pi OS
        with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
            temp_raw = f.read()
        # Convert millidegrees C to degrees C
        temp_c = int(temp_raw) / 1000.0
        return f"{temp_c:.1f}°C"
    except FileNotFoundError:
        return "N/A"
    except Exception:
        return "Error"


app = Flask(__name__)


# --- Global variable to track network usage ---
net_start = psutil.net_io_counters()
last_read_time = time.time()
KNOWN_MACS = {}

# Function to gather ALL system data
def get_system_data():
    global net_start, last_read_time

    # 1. CPU, MEMORY, DISK
    cpu_percent = psutil.cpu_percent(interval=None) # Interval=None ensures instant check
    mem_percent = psutil.virtual_memory().percent
    disk_percent = psutil.disk_usage('/').percent

    # 2. UPTIME
    boot_time = datetime.datetime.fromtimestamp(psutil.boot_time())
    now = datetime.datetime.now()
    uptime_seconds = (now - boot_time).total_seconds()
    hours, remainder = divmod(uptime_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    uptime_str = f"{int(hours):02d}h {int(minutes):02d}m {int(seconds):02d}s"

    # 3. NETWORK USAGE (Upload/Download Speed)
    # Get current bytes, calculate speed since the last check (2 seconds for setInterval)
    net_end = psutil.net_io_counters()
    time_delta = time.time() - last_read_time

    # Calculate speed in KB/s
    upload_speed = (net_end.bytes_sent - net_start.bytes_sent) / time_delta / 1024
    download_speed = (net_end.bytes_recv - net_start.bytes_recv) / time_delta / 1024

    # Update global state for next reading
    net_start = net_end
    last_read_time = time.time()

    # 4. CONNECTED DEVICES / IP / MAC ADDRESSES & ARP Spoofing Check
    global KNOWN_MACS
    devices = []
    arp_spoof_status = "Secure" # Default status

    try:
        # Check NetworkManager's ARP table
        result = subprocess.run(['ip', 'neigh'], capture_output=True, text=True, check=True)
        lines = result.stdout.splitlines()

        current_macs = {}

        for line in lines:
            # Look for devices on wlan0 that are in a recently active state
            if 'wlan0' in line and any(status in line for status in ['DELAY', 'STALE', 'REACHABLE']):
                parts = line.split()
                ip_addr = parts[0]
                mac_addr = parts[4] if len(parts) > 4 and parts[3] == 'lladdr' else 'N/A'

                # Exclude the Pi's own router address (10.42.0.1) from the client list and checks
                if ip_addr == '10.42.0.1':
                    continue

                devices.append({'ip': ip_addr, 'mac': mac_addr})
                current_macs[ip_addr] = mac_addr

                # --- ARP Spoofing Detection Logic ---
                if ip_addr in KNOWN_MACS and KNOWN_MACS[ip_addr] != mac_addr:
                    # If an IP has a different MAC than the known baseline, it's a conflict
                    arp_spoof_status = f"ARP Conflict! IP {ip_addr} MAC changed from {KNOWN_MACS[ip_addr]} to {mac_addr}"

        # Update KNOWN_MACS only if no spoofing is currently detected
        # This keeps the known good MACs as the baseline until the system is reset
        if arp_spoof_status == "Secure":
             KNOWN_MACS.update(current_macs)

    except Exception:
        devices.append({'ip': 'Error', 'mac': 'Error'})
        arp_spoof_status = "ARP Check Error"

    # 5. LATENCY
    latency_ms = 'N/A'
    try:
        ping_result = subprocess.run(
            ['ping', '-c', '1', '10.42.0.1'],
            capture_output=True, text=True, timeout=2
        )
        # Extract average latency from the output summary (e.g., avg/max/mdev = 0.500/0.700/0.100 ms)
        match = [line for line in ping_result.stdout.splitlines() if 'avg/max' in line]
        if match:
            # Splits the line, takes the second part (the values), splits by '/', and gets the average
            latency_ms = match[0].split('=')[1].split('/')[1] + ' ms'
        else:
            latency_ms = 'Fail'
    except Exception:
        latency_ms = 'Timeout'

    # CPU Temperature
    cpu_temp = get_cpu_temp()

    return {
        'cpu_percent': cpu_percent,
        'mem_percent': mem_percent,
        'disk_percent': disk_percent,
        'uptime': uptime_str,
        'upload_speed': upload_speed,
        'download_speed': download_speed,
        'connected_devices': len(devices),
        'devices': devices,
        'latency': latency_ms,
        'cpu_temp': cpu_temp,
        'arp_status': arp_spoof_status
    }

# Route for the main dashboard (http://<Pi_IP>/)
@app.route('/')
def index():
    data = get_system_data()
    return render_template('index.html', data=data)

# Route for real-time JSON data (used by JavaScript)
@app.route('/data')
def data():
    return jsonify(get_system_data())

# Proxies to the IDS microservice running on port 5001
@app.route('/protocol_analysis')
def protocol_analysis():
    try:
        response = requests.get(IDS_SERVICE_URL, timeout=10)
        return jsonify(response.json())
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "IDS service offline. Run ids_service.py on port 5001."})
    except Exception as e:
        return jsonify({"error": str(e)})

# Run application
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
