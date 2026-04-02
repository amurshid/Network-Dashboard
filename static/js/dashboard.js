// ── Helpers ──

function setBar(id, pct, warn = 70, danger = 90) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.width = Math.min(pct, 100) + '%';
    el.style.background = pct >= danger ? '#ef4444' : pct >= warn ? '#f59e0b' : '#10b981';
}

function parseNumeric(str) {
    if (typeof str === 'number') return str;
    const m = String(str).match(/[\d.]+/);
    return m ? parseFloat(m[0]) : NaN;
}

// ── Main polling function ──

async function updateDashboard() {
    try {
        const res = await fetch('/data');
        const d = await res.json();
        const now = new Date().toLocaleTimeString();

        pushHistory(timeL, now);

        // CPU
        const cpu = parseFloat(d.cpu_percent) || 0;
        document.getElementById('cpu-val').textContent = cpu.toFixed(1);
        document.getElementById('cpu-chart-val').textContent = cpu.toFixed(1) + '%';
        setBar('cpu-bar', cpu);
        pushHistory(cpuH, cpu);

        // Memory
        const mem = parseFloat(d.mem_percent) || 0;
        document.getElementById('mem-val').textContent = mem.toFixed(1);
        document.getElementById('mem-chart-val').textContent = mem.toFixed(1) + '%';
        setBar('mem-bar', mem);
        pushHistory(memH, mem);

        // Disk
        const disk = parseFloat(d.disk_percent) || 0;
        document.getElementById('disk-val').textContent = disk.toFixed(1);
        setBar('disk-bar', disk);

        // Temperature (string like "45.2°C" or "N/A")
        const tempRaw = d.cpu_temp || 'N/A';
        const tempNum = parseNumeric(tempRaw);
        document.getElementById('temp-val').textContent = isNaN(tempNum) ? tempRaw : tempNum.toFixed(1);
        if (!isNaN(tempNum)) setBar('temp-bar', (tempNum / 85) * 100, 60, 80);

        // Latency (string like "0.500 ms" or "N/A")
        const latRaw = d.latency || 'N/A';
        const latNum = parseNumeric(latRaw);
        document.getElementById('latency-val').textContent = isNaN(latNum) ? latRaw : latNum.toFixed(1);
        document.getElementById('latency-unit').textContent = isNaN(latNum) ? '' : 'ms';
        if (!isNaN(latNum)) setBar('latency-bar', Math.min((latNum / 200) * 100, 100), 40, 70);

        // Network speeds
        const dl = parseFloat(d.download_speed) || 0;
        const ul = parseFloat(d.upload_speed) || 0;
        document.getElementById('dl-val').textContent = dl.toFixed(2) + ' KB/s';
        document.getElementById('ul-val').textContent = ul.toFixed(2) + ' KB/s';
        pushHistory(dlH, dl);
        pushHistory(ulH, ul);

        // Uptime
        document.getElementById('uptime').textContent = d.uptime || '--';

        // ARP status
        const arp = d.arp_status || 'Unknown';
        const secure = arp.toLowerCase() === 'secure';
        const arpAlert = arp.toLowerCase().includes('conflict') || arp.toLowerCase().includes('error');
        document.getElementById('arp-state').textContent = secure ? 'Secure' : arpAlert ? 'Alert' : arp;
        document.getElementById('arp-detail').textContent = arp;
        document.getElementById('arp-dot').className = 'arp-dot ' + (secure ? 'dot-green' : 'dot-red');
        document.getElementById('arp-icon').className = 'mc-icon ' + (secure ? 'green' : 'red');

        // Connected devices
        const devs = d.devices || [];
        const count = d.connected_devices || devs.length;
        document.getElementById('device-badge').textContent = count + (count === 1 ? ' device' : ' devices');
        const tbody = document.getElementById('devices-body');
        if (devs.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No devices detected</td></tr>';
        } else {
            tbody.innerHTML = devs.map((dev, i) => `
                <tr>
                    <td class="t-num">${i + 1}</td>
                    <td class="mono">${dev.ip || '--'}</td>
                    <td class="mono t-mac">${dev.mac || '--'}</td>
                    <td><span class="status-pill">Active</span></td>
                </tr>`).join('');
        }

        netChart.update('none');
        sysChart.update('none');

        document.getElementById('last-updated').textContent = now;

    } catch (e) {
        console.error('Dashboard update failed:', e);
    }
}

updateDashboard();
setInterval(updateDashboard, 2000);
