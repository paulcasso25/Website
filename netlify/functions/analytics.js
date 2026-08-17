const { getStore } = require('@netlify/blobs');
const {
    emptyDay,
    siteFromOrigin,
    isAllowedOrigin,
    sanitizeEvent,
    applyEvent,
    summarize
} = require('../../scripts/analytics-lib');

const RETENTION_DAYS = 90;

function corsHeaders(origin) {
    const allowed = isAllowedOrigin(origin);
    return {
        'Access-Control-Allow-Origin': allowed ? origin : 'https://paulcasso-website.netlify.app',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };
}

function json(statusCode, origin, body) {
    return {
        statusCode,
        headers: corsHeaders(origin),
        body: JSON.stringify(body)
    };
}

function utcDate(offsetDays) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + (offsetDays || 0));
    return d.toISOString().slice(0, 10);
}

function parseBody(event) {
    if (!event.body) return null;
    let text = event.body;
    if (event.isBase64Encoded) {
        text = Buffer.from(event.body, 'base64').toString('utf8');
    }
    try {
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

async function readDay(store, site, date) {
    try {
        const data = await store.get(`${site}/${date}`, { type: 'json' });
        return data || emptyDay();
    } catch (e) {
        return emptyDay();
    }
}

exports.handler = async (event) => {
    const origin = event.headers.origin || event.headers.Origin || '';
    const method = event.httpMethod || 'GET';

    if (method === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders(origin), body: '' };
    }

    let store;
    try {
        store = getStore('gallery-analytics');
    } catch (e) {
        return json(503, origin, { error: 'Analytics store is not available yet.' });
    }

    if (method === 'POST') {
        const inferred = siteFromOrigin(origin);
        const raw = parseBody(event);
        const evt = sanitizeEvent(raw, inferred);
        if (!evt) {
            return json(400, origin, { error: 'Invalid event' });
        }
        // Localhost/dev can post, but keep it out of the live site buckets.
        if (evt.site === 'local' || inferred === 'local') {
            return json(200, origin, { ok: true, ignored: 'local' });
        }

        const date = utcDate(0);
        const key = `${evt.site}/${date}`;
        const current = await readDay(store, evt.site, date);
        const next = applyEvent(current, evt);
        await store.setJSON(key, next);

        try {
            const cutoff = utcDate(-RETENTION_DAYS);
            const listed = await store.list({ prefix: `${evt.site}/` });
            const blobs = listed.blobs || listed || [];
            for (const item of blobs) {
                const keyName = item.key || item;
                const datePart = String(keyName).split('/')[1];
                if (datePart && datePart < cutoff) {
                    await store.delete(keyName);
                }
            }
        } catch (e) {
            // Prune is best-effort
        }

        return json(200, origin, { ok: true });
    }

    if (method === 'GET') {
        const params = event.queryStringParameters || {};
        let site = String(params.site || '').trim();
        const inferred = siteFromOrigin(origin);
        if (inferred && inferred !== 'local') site = inferred;
        if (!site && inferred === 'local') site = String(params.site || 'paulcasso');
        if (site !== 'paulcasso' && site !== 'cannon-art') {
            return json(400, origin, { error: 'Unknown site' });
        }

        const daysWanted = Math.max(1, Math.min(90, Number(params.days) || 30));
        const dayMap = {};
        for (let i = 0; i < daysWanted; i++) {
            const date = utcDate(-i);
            dayMap[date] = await readDay(store, site, date);
        }
        const { days, totals } = summarize(dayMap);
        return json(200, origin, {
            site,
            generatedAt: new Date().toISOString(),
            days: days.map((date) => ({ date, pageviews: (dayMap[date] && dayMap[date].pageviews) || 0 })),
            totals
        });
    }

    return json(405, origin, { error: 'Method not allowed' });
};
