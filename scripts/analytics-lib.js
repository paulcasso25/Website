/**
 * Shared analytics helpers (no I/O). Used by the Netlify function and local verify.
 */
const KNOWN_SITES = ['paulcasso', 'cannon-art'];
const MAX_PATH = 180;
const MAX_NAME = 120;
const MAX_ARTWORKS = 40;

const ORIGIN_SITE = {
    'https://paulcasso-website.netlify.app': 'paulcasso',
    'https://cannon-art.github.io': 'cannon-art'
};

function emptyDay() {
    return {
        pageviews: 0,
        pages: {},
        referrers: {},
        regions: {},
        screens: {},
        timeSum: {},
        timeCount: {},
        artworks: {}
    };
}

function bump(map, key, amount) {
    const k = String(key || 'unknown').slice(0, MAX_NAME);
    map[k] = (map[k] || 0) + amount;
}

function siteFromOrigin(origin) {
    if (!origin) return null;
    const trimmed = String(origin).replace(/\/$/, '');
    if (ORIGIN_SITE[trimmed]) return ORIGIN_SITE[trimmed];
    try {
        const url = new URL(origin);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return 'local';
    } catch (e) {
        return null;
    }
    return null;
}

function isAllowedOrigin(origin) {
    const site = siteFromOrigin(origin);
    return site === 'paulcasso' || site === 'cannon-art' || site === 'local';
}

function sanitizeEvent(raw, inferredSite) {
    if (!raw || typeof raw !== 'object') return null;
    const event = String(raw.event || '').trim();
    if (event !== 'pageview' && event !== 'page_exit') return null;

    let site = String(raw.site || inferredSite || '').trim();
    if (inferredSite && inferredSite !== 'local' && site && site !== inferredSite) {
        site = inferredSite;
    }
    if (inferredSite && inferredSite !== 'local') site = inferredSite;
    if (!KNOWN_SITES.includes(site)) return null;

    const page = String(raw.page || '/').slice(0, MAX_PATH);
    const referrerHost = String(raw.referrerHost || 'direct').slice(0, MAX_NAME);
    const region = String(raw.region || 'Unknown').slice(0, MAX_NAME);
    const screen = String(raw.screen || 'unknown').slice(0, 20);
    const timeOnPage = Math.max(0, Math.min(86400, Number(raw.timeOnPage) || 0));

    const artworks = [];
    if (Array.isArray(raw.artworks)) {
        raw.artworks.slice(0, MAX_ARTWORKS).forEach((item) => {
            if (!item || typeof item !== 'object') return;
            const id = String(item.id || '').slice(0, MAX_NAME);
            if (!id) return;
            artworks.push({
                id,
                name: String(item.name || id).slice(0, MAX_NAME),
                viewTime: Math.max(0, Math.min(86400, Number(item.viewTime) || 0)),
                hoverCount: Math.max(0, Math.min(10000, Number(item.hoverCount) || 0)),
                clickCount: Math.max(0, Math.min(10000, Number(item.clickCount) || 0))
            });
        });
    }

    return { site, event, page, referrerHost, region, screen, timeOnPage, artworks };
}

function applyEvent(day, evt) {
    const next = day && typeof day === 'object' ? day : emptyDay();
    if (!next.pages) next.pages = {};
    if (!next.referrers) next.referrers = {};
    if (!next.regions) next.regions = {};
    if (!next.screens) next.screens = {};
    if (!next.timeSum) next.timeSum = {};
    if (!next.timeCount) next.timeCount = {};
    if (!next.artworks) next.artworks = {};

    if (evt.event === 'pageview') {
        next.pageviews = (next.pageviews || 0) + 1;
        bump(next.pages, evt.page, 1);
        bump(next.referrers, evt.referrerHost, 1);
        bump(next.regions, evt.region, 1);
        bump(next.screens, evt.screen, 1);
    }

    if (evt.event === 'page_exit') {
        if (evt.timeOnPage > 0) {
            bump(next.timeSum, evt.page, evt.timeOnPage);
            bump(next.timeCount, evt.page, 1);
        }
        (evt.artworks || []).forEach((art) => {
            if (!next.artworks[art.id]) {
                next.artworks[art.id] = {
                    name: art.name,
                    viewTime: 0,
                    hoverCount: 0,
                    clickCount: 0
                };
            }
            const row = next.artworks[art.id];
            row.name = art.name || row.name;
            row.viewTime += art.viewTime;
            row.hoverCount += art.hoverCount;
            row.clickCount += art.clickCount;
        });
    }

    return next;
}

function summarize(dayMap) {
    const totals = emptyDay();
    const days = Object.keys(dayMap || {}).sort();
    days.forEach((date) => {
        const day = dayMap[date] || emptyDay();
        totals.pageviews += day.pageviews || 0;
        Object.keys(day.pages || {}).forEach((k) => bump(totals.pages, k, day.pages[k]));
        Object.keys(day.referrers || {}).forEach((k) => bump(totals.referrers, k, day.referrers[k]));
        Object.keys(day.regions || {}).forEach((k) => bump(totals.regions, k, day.regions[k]));
        Object.keys(day.screens || {}).forEach((k) => bump(totals.screens, k, day.screens[k]));
        Object.keys(day.timeSum || {}).forEach((k) => bump(totals.timeSum, k, day.timeSum[k]));
        Object.keys(day.timeCount || {}).forEach((k) => bump(totals.timeCount, k, day.timeCount[k]));
        Object.keys(day.artworks || {}).forEach((id) => {
            const art = day.artworks[id];
            if (!totals.artworks[id]) {
                totals.artworks[id] = { name: art.name, viewTime: 0, hoverCount: 0, clickCount: 0 };
            }
            totals.artworks[id].viewTime += art.viewTime || 0;
            totals.artworks[id].hoverCount += art.hoverCount || 0;
            totals.artworks[id].clickCount += art.clickCount || 0;
        });
    });
    return { days, totals };
}

function topEntries(map, limit) {
    return Object.keys(map || {})
        .map((key) => ({ key, value: map[key] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit || 10);
}

module.exports = {
    KNOWN_SITES,
    emptyDay,
    siteFromOrigin,
    isAllowedOrigin,
    sanitizeEvent,
    applyEvent,
    summarize,
    topEntries
};
