// Admin Analytics dashboard — visitor-facing language only.
(function() {
    'use strict';

    const PAGE_NAMES = {
        '/': 'Home',
        '/index.html': 'Home',
        'index.html': 'Home',
        '/Home.html': 'Home',
        'Home.html': 'Home',
        '/catalogue-perspectives.html': 'Perspectives',
        'catalogue-perspectives.html': 'Perspectives',
        '/catalogue-landscapes.html': 'Landscapes',
        'catalogue-landscapes.html': 'Landscapes',
        '/bio.html': 'Artist Bio',
        'bio.html': 'Artist Bio',
        '/terms-of-use.html': 'Terms of Use',
        'terms-of-use.html': 'Terms of Use',
        '/success.html': 'Enquiry received',
        'success.html': 'Enquiry received',
        '/dc-characters.html': 'DC Characters',
        'dc-characters.html': 'DC Characters',
        '/marvel-characters.html': 'Marvel Characters',
        'marvel-characters.html': 'Marvel Characters',
        '/music-legends.html': 'Music Legends',
        'music-legends.html': 'Music Legends',
        '/recovery-art.html': 'Recovery Art',
        'recovery-art.html': 'Recovery Art',
        '/miscellaneous.html': 'Miscellaneous',
        'miscellaneous.html': 'Miscellaneous'
    };

    const SCREEN_NAMES = {
        mobile: 'Phone',
        tablet: 'Tablet',
        desktop: 'Computer'
    };

    function analyticsEndpoint() {
        const host = (location.hostname || '').toLowerCase();
        const base = (host.includes('cannon-art') || host.includes('github.io'))
            ? 'https://paulcasso-website.netlify.app/.netlify/functions/analytics'
            : '/.netlify/functions/analytics';
        const site = (host.includes('cannon-art') || host.includes('github.io')) ? 'cannon-art' : 'paulcasso';
        return `${base}?site=${encodeURIComponent(site)}&days=30`;
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function pageName(path) {
        const raw = String(path || '/');
        const noQuery = raw.split('?')[0];
        if (PAGE_NAMES[noQuery]) return PAGE_NAMES[noQuery];
        const file = noQuery.replace(/^\//, '');
        if (PAGE_NAMES[file]) return PAGE_NAMES[file];
        if (PAGE_NAMES['/' + file]) return PAGE_NAMES['/' + file];
        return file.replace(/\.html$/i, '').replace(/[-_]/g, ' ') || 'Home';
    }

    function referrerName(host) {
        if (!host || host === 'direct') return 'Direct visit';
        return host.replace(/^www\./, '');
    }

    function screenName(key) {
        return SCREEN_NAMES[key] || key;
    }

    function formatDate(iso) {
        const d = new Date(iso + 'T00:00:00Z');
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

    function formatSeconds(total) {
        const n = Math.max(0, Number(total) || 0);
        if (n < 60) return n + ' sec';
        const m = Math.floor(n / 60);
        const s = n % 60;
        return s ? m + ' min ' + s + ' sec' : m + ' min';
    }

    function emptyNote() {
        return '<p class="analytics-empty">Nothing to show yet.</p>';
    }

    function table(headers, rows) {
        if (!rows.length) return emptyNote();
        const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
        const body = rows.map((cells) => (
            `<tr>${cells.map((c) => `<td>${escapeHtml(String(c))}</td>`).join('')}</tr>`
        )).join('');
        return `<table class="analytics-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    }

    function rankedTable(map, nameFn) {
        const entries = Object.keys(map || {}).map((key) => ({
            name: nameFn ? nameFn(key) : key,
            value: map[key]
        })).sort((a, b) => b.value - a.value);
        return table(['Name', 'Visits'], entries.slice(0, 15).map((row) => [row.name, row.value]));
    }

    function timeTable(totals) {
        const pages = Object.keys(totals.timeSum || {});
        const rows = pages.map((page) => {
            const count = totals.timeCount[page] || 1;
            const avg = Math.round((totals.timeSum[page] || 0) / count);
            return { name: pageName(page), avg };
        }).sort((a, b) => b.avg - a.avg);
        return table(['Page', 'Average time'], rows.map((row) => [row.name, formatSeconds(row.avg)]));
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
        return table(
            ['Artwork', 'Time viewed', 'Looked at', 'Opened'],
            rows.slice(0, 20).map((a) => [a.name, formatSeconds(a.viewTime), a.hoverCount, a.clickCount])
        );
    }

    function recentDays(days) {
        const withCounts = (days || []).filter((d) => d && d.pageviews > 0);
        if (!withCounts.length) return '';
        const latest = withCounts.slice(-7).map((d) => `${formatDate(d.date)} · ${d.pageviews}`);
        return `<p class="analytics-recent">${escapeHtml(latest.join('  |  '))}</p>`;
    }

    function section(title, html) {
        return `<section class="analytics-block"><h3>${escapeHtml(title)}</h3>${html}</section>`;
    }

    window.loadAnalyticsDashboard = async function loadAnalyticsDashboard() {
        const root = document.getElementById('analyticsDashboard');
        if (!root) return;
        root.innerHTML = '<p>Loading visitor figures…</p>';
        try {
            const res = await fetch(analyticsEndpoint(), { headers: { Accept: 'application/json' } });
            if (!res.ok) throw new Error('unavailable');
            const data = await res.json();
            const totals = data.totals || {};
            const visits = totals.pageviews || 0;
            const summary = visits === 1
                ? '1 visit in the last 30 days.'
                : `${visits} visits in the last 30 days.`;

            root.innerHTML = `
                <p class="analytics-summary">${escapeHtml(summary)}</p>
                ${recentDays(data.days)}
                ${section('Pages', rankedTable(totals.pages, pageName))}
                ${section('Artworks', artworkTable(totals.artworks))}
                ${section('Time on page', timeTable(totals))}
                ${section('Location', rankedTable(totals.regions))}
                ${section('How people arrived', rankedTable(totals.referrers, referrerName))}
                ${section('Device', rankedTable(totals.screens, screenName))}
            `;
        } catch (e) {
            root.innerHTML = '<p>Visitor figures are unavailable at the moment. Please try again shortly.</p>';
        }
    };
})();
