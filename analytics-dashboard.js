// Renders the Admin → Analytics dashboard from the free Netlify store.
(function() {
    'use strict';

    function analyticsEndpoint() {
        const host = (location.hostname || '').toLowerCase();
        const base = (host.includes('cannon-art') || host.includes('github.io'))
            ? 'https://paulcasso-website.netlify.app/.netlify/functions/analytics'
            : '/.netlify/functions/analytics';
        const site = (host.includes('cannon-art') || host.includes('github.io')) ? 'cannon-art' : 'paulcasso';
        return `${base}?site=${encodeURIComponent(site)}&days=30`;
    }

    function rowsFromMap(map, labelValue) {
        const entries = Object.keys(map || {}).map((key) => ({ key, value: map[key] }));
        entries.sort((a, b) => b.value - a.value);
        if (!entries.length) return '<p style="color:#666;">No data yet.</p>';
        const body = entries.slice(0, 15).map((row) => (
            `<tr><td>${escapeHtml(row.key)}</td><td>${escapeHtml(String(labelValue ? labelValue(row) : row.value))}</td></tr>`
        )).join('');
        return `<table class="analytics-table"><thead><tr><th>Name</th><th>Count</th></tr></thead><tbody>${body}</tbody></table>`;
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function avgTime(totals) {
        const pages = Object.keys(totals.timeSum || {});
        if (!pages.length) return '<p style="color:#666;">No time-on-page data yet.</p>';
        const rows = pages.map((page) => {
            const count = totals.timeCount[page] || 1;
            const avg = Math.round((totals.timeSum[page] || 0) / count);
            return { key: page, value: `${avg}s avg` };
        }).sort((a, b) => String(b.value).localeCompare(String(a.value)));
        const body = rows.map((row) => `<tr><td>${escapeHtml(row.key)}</td><td>${escapeHtml(row.value)}</td></tr>`).join('');
        return `<table class="analytics-table"><thead><tr><th>Page</th><th>Time</th></tr></thead><tbody>${body}</tbody></table>`;
    }

    function artworkTable(artworks) {
        const rows = Object.keys(artworks || {}).map((id) => {
            const a = artworks[id];
            return {
                name: a.name || id,
                viewTime: a.viewTime || 0,
                hoverCount: a.hoverCount || 0,
                clickCount: a.clickCount || 0
            };
        }).sort((a, b) => (b.viewTime + b.clickCount * 5) - (a.viewTime + a.clickCount * 5));
        if (!rows.length) return '<p style="color:#666;">No artwork interactions yet.</p>';
        const body = rows.slice(0, 20).map((a) => (
            `<tr><td>${escapeHtml(a.name)}</td><td>${a.viewTime}s</td><td>${a.hoverCount}</td><td>${a.clickCount}</td></tr>`
        )).join('');
        return `<table class="analytics-table"><thead><tr><th>Artwork</th><th>View time</th><th>Hovers</th><th>Clicks</th></tr></thead><tbody>${body}</tbody></table>`;
    }

    window.loadAnalyticsDashboard = async function loadAnalyticsDashboard() {
        const root = document.getElementById('analyticsDashboard');
        if (!root) return;
        root.innerHTML = '<p>Loading analytics…</p>';
        try {
            const res = await fetch(analyticsEndpoint(), { headers: { Accept: 'application/json' } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const totals = data.totals || {};
            const spark = (data.days || []).map((d) => `${d.date}: ${d.pageviews}`).slice(-7).join(' · ');
            root.innerHTML = `
                <p><strong>${totals.pageviews || 0}</strong> page views in the last 30 days (visitors who accepted cookies only).</p>
                <p style="color:#666; font-size:0.9rem;">${escapeHtml(spark || 'No daily counts yet.')}</p>
                <h3>Pages</h3>
                ${rowsFromMap(totals.pages)}
                <h3>Artwork engagement</h3>
                ${artworkTable(totals.artworks)}
                <h3>Time on page</h3>
                ${avgTime(totals)}
                <h3>Regions</h3>
                ${rowsFromMap(totals.regions)}
                <h3>Referrers</h3>
                ${rowsFromMap(totals.referrers)}
                <h3>Screens</h3>
                ${rowsFromMap(totals.screens)}
            `;
        } catch (e) {
            root.innerHTML = `<p class="error-message">Could not load analytics yet. After the Netlify deploy finishes, refresh this tab. ${escapeHtml(e.message || '')}</p>`;
        }
    };
})();
