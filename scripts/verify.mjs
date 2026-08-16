/**
 * Local pre-push checks (no GitHub, no extra npm dependencies).
 * Run: npm test   or   node scripts/verify.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const require = createRequire(import.meta.url);

const REQUIRED_SECTIONS = ['perspectives', 'landscapes'];
const REQUIRED_ARTWORK = {
    perspectives: ['Summer Rain', 'Hope', 'The Precipice', 'Geothermal'],
    landscapes: ['The Old Bridge', 'Winter', 'Moonlight in Red Sky']
};

let failures = 0;

function fail(message) {
    console.error(`FAIL: ${message}`);
    failures += 1;
}

function pass(message) {
    console.log(`OK:  ${message}`);
}

function checkJavaScriptSyntax() {
    const files = readdirSync(ROOT).filter((f) => f.endsWith('.js'));
    if (files.length === 0) {
        fail('No .js files found in project root');
        return;
    }
    for (const name of files.sort()) {
        const full = join(ROOT, name);
        const result = spawnSync(process.execPath, ['--check', full], {
            encoding: 'utf8'
        });
        if (result.status !== 0) {
            fail(`${name} — syntax error (node --check)`);
            if (result.stderr) console.error(result.stderr);
        } else {
            pass(`${name} — syntax OK`);
        }
    }
}

function checkGalleryData() {
    const path = join(ROOT, 'gallery-data.json');
    let data;
    try {
        data = JSON.parse(readFileSync(path, 'utf8'));
    } catch (e) {
        fail(`gallery-data.json — ${e.message}`);
        return null;
    }
    if (!data || typeof data !== 'object') {
        fail('gallery-data.json — root must be an object');
        return null;
    }
    if (!data.sections || typeof data.sections !== 'object') {
        fail('gallery-data.json — missing "sections" object');
        return null;
    }
    for (const key of REQUIRED_SECTIONS) {
        if (!(key in data.sections)) {
            fail(`gallery-data.json — missing section "${key}"`);
            continue;
        }
        if (!Array.isArray(data.sections[key])) {
            fail(`gallery-data.json — sections["${key}"] must be an array`);
        }
    }
    pass('gallery-data.json — structure OK');

    for (const key of REQUIRED_SECTIONS) {
        const arr = data.sections[key];
        if (!Array.isArray(arr)) continue;
        arr.forEach((pic, i) => {
            if (!pic || typeof pic !== 'object') {
                fail(`gallery-data.json — ${key}[${i}] must be an object`);
                return;
            }
            for (const field of ['id', 'name', 'imageUrl']) {
                if (pic[field] === undefined || pic[field] === null || String(pic[field]).trim() === '') {
                    fail(`gallery-data.json — ${key}[${i}] missing or empty "${field}"`);
                }
            }
        });
        const names = arr.map((p) => p && p.name);
        for (const expected of REQUIRED_ARTWORK[key] || []) {
            if (!names.includes(expected)) {
                fail(`gallery-data.json — ${key} missing artwork "${expected}"`);
            }
        }
    }
    return data;
}

function checkControlPanelUi() {
    const path = join(ROOT, 'control-panel.html');
    let html;
    try {
        html = readFileSync(path, 'utf8');
    } catch (e) {
        fail(`control-panel.html — ${e.message}`);
        return;
    }

    if (!html.includes('content="paulcasso"')) {
        fail('control-panel.html — missing paulcasso gallery-site meta');
    }
    if (!html.includes('value="perspectives"') || !html.includes('value="landscapes"')) {
        fail('control-panel.html — missing Perspectives/Landscapes section options');
    }
    if (html.includes('dc-characters') || html.includes('Cannon Art - Control Panel')) {
        fail('control-panel.html — Cannon Art leftovers still present');
    }
    if (!html.includes('Edit Existing Pictures')) {
        fail('control-panel.html — missing Edit Existing Pictures section');
    }
    if (!html.includes('Token Admin') || !html.includes('panelViewDelete')) {
        fail('control-panel.html — missing panel submenu views');
    } else {
        pass('control-panel.html — Paul Casso admin UI');
    }

    const jsPath = join(ROOT, 'control-panel.js');
    let js;
    try {
        js = readFileSync(jsPath, 'utf8');
    } catch (e) {
        fail(`control-panel.js — ${e.message}`);
        return;
    }

    if (!js.includes("owner: 'paulcasso25'") || !js.includes("imageRepo: 'Art'")) {
        fail('control-panel.js — GitHub config does not target paulcasso25 Website/Art');
    }
    if (!js.includes('async function deletePicture') || !js.includes('callHTMLGenerator(galleryData)')) {
        fail('control-panel.js — delete/edit HTML sync helpers missing');
        return;
    }

    const deleteFn = js.slice(js.indexOf('async function deletePicture'));
    const deleteBody = deleteFn.slice(0, deleteFn.indexOf('\nasync function ') > 0
        ? deleteFn.indexOf('\nasync function ')
        : deleteFn.indexOf('\nfunction showSection'));
    if (!deleteBody.includes('callHTMLGenerator')) {
        fail('control-panel.js — deletePicture does not regenerate HTML files');
    } else {
        pass('control-panel.js — deletePicture syncs JSON + HTML');
    }
}

function checkAdminNav() {
    const pages = ['index.html', 'Home.html', 'bio.html', 'terms-of-use.html', 'success.html'];
    for (const page of pages) {
        const full = join(ROOT, page);
        if (!existsSync(full)) {
            fail(`${page} — missing`);
            continue;
        }
        const html = readFileSync(full, 'utf8');
        if (!html.includes('href="control-panel.html"') || !html.includes('>Admin<')) {
            fail(`${page} — missing Admin header link`);
        }
    }
    pass('Public pages include Admin header link');
}

function checkHtmlGenerator(galleryData) {
    let generator;
    try {
        generator = require(join(ROOT, 'html-generator.js'));
    } catch (e) {
        fail(`html-generator.js — could not load: ${e.message}`);
        return;
    }
    if (typeof generator.generateAllGalleryHTMLs !== 'function') {
        fail('html-generator.js — generateAllGalleryHTMLs not exported');
        return;
    }
    const files = generator.generateAllGalleryHTMLs(galleryData || { sections: {} });
    for (const key of REQUIRED_SECTIONS) {
        if (!files[key] || !files[key].html) {
            fail(`html-generator.js — did not generate ${key}`);
            continue;
        }
        const html = files[key].html;
        if (!html.includes('>Admin<') || !html.includes('control-panel.html')) {
            fail(`${files[key].filename} — generated page missing Admin nav`);
        }
        if (!html.includes('class="item-card"') && !html.includes('class="item-card sold"')) {
            fail(`${files[key].filename} — generated page missing item cards`);
        }
        if (key === 'perspectives' && !html.includes('Summer Rain')) {
            fail(`${files[key].filename} — missing Summer Rain`);
        }
        if (key === 'landscapes' && !html.includes('The Old Bridge')) {
            fail(`${files[key].filename} — missing The Old Bridge`);
        }
        if (key === 'perspectives' && !html.includes('item-card sold')) {
            fail(`${files[key].filename} — Remembrance should remain marked sold`);
        }
    }
    pass('html-generator.js — catalogue HTML includes Admin nav and artwork');
}

console.log('Local verify (pre-push)\n');
checkJavaScriptSyntax();
console.log('');
const galleryData = checkGalleryData();
console.log('');
checkControlPanelUi();
console.log('');
checkAdminNav();
console.log('');
checkHtmlGenerator(galleryData);

if (failures > 0) {
    console.error(`\n${failures} check(s) failed. Fix issues before pushing to GitHub.\n`);
    process.exit(1);
}
console.log('\nAll checks passed. Safe to commit and push.\n');
process.exit(0);
