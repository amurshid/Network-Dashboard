async function runProtocolAnalysis() {
    const body = document.getElementById('analysis-body');
    body.innerHTML = '<div class="analysis-loading"><span class="spinner"></span><span>Analyzing traffic...</span></div>';

    try {
        const res = await fetch('/protocol_analysis');
        const data = await res.json();

        if (data.error) {
            body.innerHTML = `
                <div class="analysis-err">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>${data.error}</span>
                </div>`;
            return;
        }

        const entries = Object.entries(data).filter(([k]) => k !== 'error');

        if (entries.length === 0) {
            body.innerHTML = '<div class="analysis-empty"><p>No protocols detected</p></div>';
            return;
        }

        const total = entries.reduce((s, [, v]) => s + (parseInt(v) || 0), 0);

        body.innerHTML = `<div class="proto-list">${
            entries.map(([proto, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return `
                    <div class="proto-item">
                        <div class="proto-name"><span class="proto-dot"></span><span>${proto}</span></div>
                        <div class="proto-right">
                            <div class="proto-bar-track"><div class="proto-bar-fill" style="width:${pct}%"></div></div>
                            <span class="proto-count mono">${count}</span>
                        </div>
                    </div>`;
            }).join('')
        }</div>`;

    } catch (e) {
        body.innerHTML = `
            <div class="analysis-err">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>IDS service unavailable</span>
            </div>`;
    }
}
