// Privacy-first gallery analytics. Loads only after cookie consent.
// Stores daily totals via the free Netlify function on the Paul Casso site.
(function() {
    'use strict';

    const cookieConsent = localStorage.getItem('cookieConsent');
    if (cookieConsent !== 'accepted') return;
    if (/control-panel\.html$/i.test(location.pathname || '')) return;
    if (window.__simpleAnalyticsStarted) return;
    window.__simpleAnalyticsStarted = true;

    const host = (location.hostname || '').toLowerCase();
    const isLocal = !host || host === 'localhost' || host === '127.0.0.1' || location.protocol === 'file:';
    const siteId = (host.includes('cannon-art') || host.includes('github.io')) ? 'cannon-art' : 'paulcasso';
    const endpoint = (host.includes('cannon-art') || host.includes('github.io'))
        ? 'https://paulcasso-website.netlify.app/.netlify/functions/analytics'
        : '/.netlify/functions/analytics';

    const regionFromTimezone = (tz) => {
        const tzMap = {
            'Europe/London': 'United Kingdom',
            'Europe/Dublin': 'Ireland',
            'Europe/': 'Europe',
            'America/': 'Americas',
            'Asia/': 'Asia',
            'Australia/': 'Australia',
            'Africa/': 'Africa',
            'Pacific/': 'Pacific'
        };
        for (const key of Object.keys(tzMap)) {
            if (tz.indexOf(key) === 0 || tz.includes(key)) return tzMap[key];
        }
        return 'Unknown';
    };

    const screenBucket = () => {
        const w = window.innerWidth || screen.width || 0;
        if (w < 768) return 'mobile';
        if (w < 1100) return 'tablet';
        return 'desktop';
    };

    const referrerHost = () => {
        try {
            if (!document.referrer) return 'direct';
            const ref = new URL(document.referrer);
            if (ref.host === location.host) return 'direct';
            return ref.host || 'direct';
        } catch (e) {
            return 'direct';
        }
    };

    const pageStartTime = Date.now();
    const imageInteractions = new Map();
    let exitSent = false;

    const mediaSrc = (el) => el.dataset.originalSrc || el.currentSrc || el.src || el.getAttribute('src') || '';
    const mediaAlt = (el) => el.alt || el.getAttribute('alt') || 'Artwork';
    const mediaId = (el) => {
        const src = mediaSrc(el);
        const part = src.split('/').pop() || src;
        return String(part).split('?')[0] || 'unknown';
    };

    const trackMedia = (el, eventType) => {
        if (!el || el.closest('footer') || el.closest('#cookie-consent')) return;
        const id = mediaId(el);
        if (!imageInteractions.has(id)) {
            imageInteractions.set(id, {
                id,
                name: mediaAlt(el),
                viewTime: 0,
                hoverCount: 0,
                clickCount: 0,
                hoverStart: null,
                viewStart: null
            });
        }
        const row = imageInteractions.get(id);
        row.name = mediaAlt(el) || row.name;
        if (eventType === 'hover_start') {
            row.hoverStart = Date.now();
            row.hoverCount += 1;
        } else if (eventType === 'hover_end' && row.hoverStart) {
            row.viewTime += Math.floor((Date.now() - row.hoverStart) / 1000);
            row.hoverStart = null;
        } else if (eventType === 'click') {
            row.clickCount += 1;
        } else if (eventType === 'view_start') {
            row.viewStart = Date.now();
        } else if (eventType === 'view_end' && row.viewStart) {
            const secs = Math.floor((Date.now() - row.viewStart) / 1000);
            if (secs > 3) row.viewTime += secs;
            row.viewStart = null;
        }
    };

    const bindMedia = (el) => {
        if (!el || el.dataset.analyticsBound === 'true') return;
        el.dataset.analyticsBound = 'true';
        el.addEventListener('mouseenter', () => trackMedia(el, 'hover_start'));
        el.addEventListener('mouseleave', () => trackMedia(el, 'hover_end'));
        el.addEventListener('click', () => trackMedia(el, 'click'));
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) trackMedia(el, 'view_start');
                    else trackMedia(el, 'view_end');
                });
            }, { threshold: 0.5 });
            observer.observe(el);
        }
    };

    const scanMedia = () => {
        document.querySelectorAll('img, canvas[data-canvas-converted="true"]').forEach(bindMedia);
    };

    const payload = (eventName) => ({
        site: siteId,
        event: eventName,
        page: (location.pathname || '/') + (location.search || ''),
        referrerHost: referrerHost(),
        region: regionFromTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || ''),
        screen: screenBucket(),
        timeOnPage: Math.floor((Date.now() - pageStartTime) / 1000),
        artworks: Array.from(imageInteractions.values()).map((row) => ({
            id: row.id,
            name: row.name,
            viewTime: row.viewTime,
            hoverCount: row.hoverCount,
            clickCount: row.clickCount
        }))
    });

    const send = (eventName) => {
        if (isLocal) return;
        const body = JSON.stringify(payload(eventName));
        try {
            if (navigator.sendBeacon) {
                navigator.sendBeacon(endpoint, body);
                return;
            }
        } catch (e) {
            // fall through
        }
        try {
            fetch(endpoint, {
                method: 'POST',
                body,
                keepalive: true,
                headers: { 'Content-Type': 'text/plain' },
                mode: 'cors'
            }).catch(() => {});
        } catch (e) {
            // ignore
        }
    };

    const sendExit = () => {
        if (exitSent) return;
        exitSent = true;
        document.querySelectorAll('img, canvas[data-canvas-converted="true"]').forEach((el) => {
            trackMedia(el, 'hover_end');
            trackMedia(el, 'view_end');
        });
        send('page_exit');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scanMedia);
    } else {
        scanMedia();
    }
    document.addEventListener('canvasConverted', () => setTimeout(scanMedia, 50), true);
    const mo = new MutationObserver(() => scanMedia());
    if (document.body) {
        mo.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            mo.observe(document.body, { childList: true, subtree: true });
        });
    }

    send('pageview');
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') sendExit();
    });
    window.addEventListener('pagehide', sendExit);
})();
