// ── History buffers (shared with dashboard.js) ──
const MAX = 60;
const cpuH = [], memH = [], dlH = [], ulH = [], timeL = [];

function pushHistory(arr, val) {
    arr.push(val);
    if (arr.length > MAX) arr.shift();
}

// ── Chart.js global defaults ──
Chart.defaults.color = '#64748b';
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.font.size = 11;

const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    interaction: { intersect: false, mode: 'index' },
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#1e293b',
            borderColor: '#334155',
            borderWidth: 1,
            titleColor: '#94a3b8',
            bodyColor: '#f1f5f9',
            padding: 10,
            callbacks: { title: () => '' }
        }
    },
    scales: {
        x: { display: false },
        y: {
            min: 0,
            grid: { color: 'rgba(51,65,85,0.6)' },
            ticks: { color: '#475569', maxTicksLimit: 4 },
            border: { dash: [3, 3], color: 'transparent' }
        }
    },
    elements: {
        line: { tension: 0.4, borderWidth: 2 },
        point: { radius: 0, hoverRadius: 5, hoverBorderWidth: 2 }
    }
};

const netChart = new Chart(document.getElementById('net-chart').getContext('2d'), {
    type: 'line',
    data: {
        labels: timeL,
        datasets: [
            { label: 'Download KB/s', data: dlH, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.07)', fill: true },
            { label: 'Upload KB/s',   data: ulH, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.07)', fill: true }
        ]
    },
    options: baseOpts
});

const sysChart = new Chart(document.getElementById('sys-chart').getContext('2d'), {
    type: 'line',
    data: {
        labels: timeL,
        datasets: [
            { label: 'CPU %',    data: cpuH, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.07)', fill: true },
            { label: 'Memory %', data: memH, borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.07)', fill: true }
        ]
    },
    options: { ...baseOpts, scales: { ...baseOpts.scales, y: { ...baseOpts.scales.y, max: 100 } } }
});
