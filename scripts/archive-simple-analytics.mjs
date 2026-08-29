/**
 * Saves the current Simple Analytics 30-day figures into simple-analytics-archive.json.
 * Run: SA_HOSTNAME=example.com node scripts/archive-simple-analytics.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ARCHIVE_PATH = join(ROOT, 'simple-analytics-archive.json');
const FIELDS = 'visitors,pageviews,histogram,pages,referrers,countries,device_types,seconds_on_page';

const hostname = String(process.env.SA_HOSTNAME || '').trim().toLowerCase();
if (!hostname) {
    console.error('SA_HOSTNAME is required');
    process.exit(1);
}

function emptyArchive() {
    return { hostname, snapshots: [], days: {} };
}

function loadArchive() {
    if (!existsSync(ARCHIVE_PATH)) return emptyArchive();
    try {
        const data = JSON.parse(readFileSync(ARCHIVE_PATH, 'utf8'));
        if (!data || typeof data !== 'object') return emptyArchive();
        return {
            hostname: data.hostname || hostname,
            snapshots: Array.isArray(data.snapshots) ? data.snapshots : [],
            days: data.days && typeof data.days === 'object' ? data.days : {}
        };
    } catch (e) {
        return emptyArchive();
    }
}

function monthKey(iso) {
    return String(iso || '').slice(0, 7);
}

function compactList(items) {
    return (items || [])
        .filter((item) => item && (item.pageviews > 0 || item.visitors > 0))
        .map((item) => ({
            value: String(item.value || ''),
            visitors: Number(item.visitors) || 0,
            pageviews: Number(item.pageviews) || 0
        }));
}

const url = `https://simpleanalytics.com/${encodeURIComponent(hostname)}.json?version=6&fields=${encodeURIComponent(FIELDS)}&start=today-30d&end=today&timezone=Europe/London`;
const res = await fetch(url, { headers: { Accept: 'application/json' } });
const data = await res.json().catch(() => ({}));
if (!res.ok || data.ok === false) {
    console.error(data.error || `Simple Analytics request failed (${res.status})`);
    process.exit(1);
}

const capturedAt = new Date().toISOString();
const start = data.start || data.dates?.start || '';
const end = data.end || data.dates?.end || capturedAt.slice(0, 10);
const snapshotMonth = monthKey(capturedAt);

const archive = loadArchive();
archive.hostname = hostname;

for (const row of data.histogram || []) {
    const date = String(row.date || row.created || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    archive.days[date] = {
        visitors: Number(row.visitors) || 0,
        pageviews: Number(row.pageviews) || 0
    };
}

const existing = archive.snapshots.find((item) => monthKey(item.capturedAt) === snapshotMonth);
const snapshot = {
    capturedAt,
    start,
    end,
    visitors: Number(data.visitors) || 0,
    pageviews: Number(data.pageviews) || 0,
    seconds_on_page: data.seconds_on_page == null ? null : Number(data.seconds_on_page),
    pages: compactList(data.pages),
    countries: compactList(data.countries),
    referrers: compactList(data.referrers),
    device_types: compactList(data.device_types)
};

if (existing) {
    Object.assign(existing, snapshot);
} else {
    archive.snapshots.push(snapshot);
}

archive.snapshots.sort((a, b) => String(a.capturedAt).localeCompare(String(b.capturedAt)));

writeFileSync(ARCHIVE_PATH, `${JSON.stringify(archive, null, 2)}\n`);
console.log(`Archived ${hostname}: ${snapshot.visitors} visitors, ${snapshot.pageviews} page views (${start} to ${end}).`);
