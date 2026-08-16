// Control Panel JavaScript
// This file handles all the logic for the gallery management control panel

/** Cannon-Art gallery: Pen options replace Oil. */
const PICTURE_MEDIUM_OPTIONS_CANNON_ART = ['Watercolour', 'Acrylic', 'Pencil', 'Pen', 'Pen & Pencil', 'Mixed Media'];

/** PaulCasso gallery: original medium list (includes Oil). */
const PICTURE_MEDIUM_OPTIONS_PAULCASSO = [
    'Acrylic on Canvas',
    'Oil on Canvas',
    'Acrylic on Wood',
    'Oil',
    'Watercolour',
    'Acrylic',
    'Pencil',
    'Mixed Media'
];

/**
 * Which site this control panel build targets. PaulCasso: set
 * <meta name="gallery-site" content="paulcasso"> in control-panel.html,
 * or serve from a hostname containing "paulcasso". Otherwise Cannon-Art.
 */
function getGallerySiteId() {
    const meta = document.querySelector('meta[name="gallery-site"]');
    const fromMeta = meta?.getAttribute('content')?.trim().toLowerCase();
    if (fromMeta === 'paulcasso') return 'paulcasso';
    if (fromMeta === 'cannon-art') return 'cannon-art';
    const host = typeof location !== 'undefined' && location.hostname ? location.hostname.toLowerCase() : '';
    if (host.includes('paulcasso')) return 'paulcasso';
    return 'cannon-art';
}

function getPictureMediumOptions() {
    return getGallerySiteId() === 'paulcasso' ? PICTURE_MEDIUM_OPTIONS_PAULCASSO : PICTURE_MEDIUM_OPTIONS_CANNON_ART;
}

/** Fills the "add picture" Medium &lt;select&gt; from the list for the active site. */
function initPictureMediumDropdown() {
    const sel = document.getElementById('pictureMedium');
    if (!sel) return;
    const previous = sel.value;
    const opts = getPictureMediumOptions();
    sel.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select medium...';
    sel.appendChild(placeholder);
    opts.forEach((m) => {
        const o = document.createElement('option');
        o.value = m;
        o.textContent = m;
        sel.appendChild(o);
    });
    if (previous && opts.includes(previous)) {
        sel.value = previous;
    } else if (previous && !opts.includes(previous)) {
        const o = document.createElement('option');
        o.value = previous;
        o.textContent = previous;
        sel.appendChild(o);
        sel.value = previous;
    }
}

// ============================================================================
// PASSWORD PROTECTION
// ============================================================================

// Password hash (SHA-256 hash of the password)
// To change the password:
// 1. Go to https://emn178.github.io/online-tools/sha256.html
// 2. Enter your new password
// 3. Copy the hash
// 4. Replace the value below with the new hash
// 
// IMPORTANT: Choose a strong password! Examples of good passwords:
// - Mix of uppercase, lowercase, numbers, and symbols
// - At least 12 characters long
// - Not dictionary words or personal information
//
// Default password hash (initial password)
const DEFAULT_PASSWORD_HASH = '751d3802f3db8cd910f2a6cacbbf1faf820b218cb8c3c0dd6a06188ce737c5c2'; // Password: &Can1989non

/**
 * Auto-login for the admin console only (same browser). This is not the account password.
 * Removing this key (or stale mismatch) only shows the password field again — it does not
 * reset or change the password the user chose; they sign in again with the same password.
 */
const CONTROL_PANEL_SESSION_KEY = 'controlPanelAuthSessionHash';

/** Mirrors `controlPanelPasswordHash` so the chosen password can survive some “clear data” flows that drop localStorage but keep cookies. */
const PASSWORD_HASH_COOKIE_NAME = 'cp_ph';

function readPasswordHashCookie() {
    if (typeof document === 'undefined') return null;
    const needle = `${PASSWORD_HASH_COOKIE_NAME}=`;
    const parts = document.cookie.split(';');
    for (let i = 0; i < parts.length; i++) {
        const p = parts[i].trim();
        if (p.startsWith(needle)) {
            try {
                return decodeURIComponent(p.slice(needle.length));
            } catch (e) {
                return null;
            }
        }
    }
    return null;
}

function writePasswordHashCookie(hash) {
    if (typeof document === 'undefined') return;
    const maxAge = 10 * 365 * 24 * 60 * 60; // 10 years
    const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${PASSWORD_HASH_COOKIE_NAME}=${encodeURIComponent(hash)};path=/;max-age=${maxAge};samesite=strict${secure}`;
}

function persistControlPanelSession(passwordHashHex) {
    try {
        localStorage.setItem(CONTROL_PANEL_SESSION_KEY, passwordHashHex);
    } catch (e) {
        console.warn('Could not persist admin session:', e);
    }
}

/** Clears only auto-login. Never removes `controlPanelPasswordHash` or the password cookie. */
function clearControlPanelSession() {
    try {
        localStorage.removeItem(CONTROL_PANEL_SESSION_KEY);
    } catch (e) {
        /* ignore */
    }
}

/** If a previous login in this browser matches the current password hash, skip the login form. */
function tryRestoreControlPanelSession() {
    const loginForm = document.getElementById('loginForm');
    const controlPanel = document.getElementById('controlPanel');
    if (!loginForm || !controlPanel) return false;
    let stored;
    try {
        stored = localStorage.getItem(CONTROL_PANEL_SESSION_KEY);
    } catch (e) {
        return false;
    }
    if (!stored) return false;
    if (stored === getPasswordHash()) {
        loginForm.classList.add('hidden');
        controlPanel.classList.remove('hidden');
        loadGalleryData();
        return true;
    }
    clearControlPanelSession();
    return false;
}

// Get current password hash: localStorage, then cookie mirror, then built-in default.
function getPasswordHash() {
    let storedHash = null;
    try {
        storedHash = localStorage.getItem('controlPanelPasswordHash');
    } catch (e) {
        /* quota / private mode */
    }
    if (!storedHash) {
        storedHash = readPasswordHashCookie();
        if (storedHash) {
            try {
                localStorage.setItem('controlPanelPasswordHash', storedHash);
            } catch (e) {
                /* keep using cookie-backed value in memory for this page only */
            }
        }
    }
    return storedHash || DEFAULT_PASSWORD_HASH;
}

// Set new password hash (persists both localStorage and cookie so “clear cache” is less likely to drop the password alone)
function setPasswordHash(hash) {
    try {
        localStorage.setItem('controlPanelPasswordHash', hash);
    } catch (e) {
        console.warn('Could not save password hash to localStorage:', e);
    }
    writePasswordHashCookie(hash);
}

// Simple SHA-256 hashing function (client-side)
async function sha256(message) {
    try {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        console.error('Error hashing password:', error);
        // Fallback: crypto.subtle requires HTTPS, but we can use a simple hash as fallback
        // For now, throw error to alert user
        throw new Error('Password hashing failed. Please ensure you are using HTTPS.');
    }
}

// Check password on login
async function checkPassword() {
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');
    const loginForm = document.getElementById('loginForm');
    const controlPanel = document.getElementById('controlPanel');
    
    const password = passwordInput.value.trim(); // Trim whitespace
    if (!password) {
        loginError.textContent = 'Please enter a password';
        loginError.classList.remove('hidden');
        return;
    }
    
    // Hash the entered password and compare
    let hash;
    try {
        hash = await sha256(password);
    } catch (error) {
        loginError.textContent = 'Error: ' + error.message + ' Please ensure you are accessing via HTTPS.';
        loginError.classList.remove('hidden');
        return;
    }
    
    // Get current password hash
    const currentPasswordHash = getPasswordHash();
    
    if (hash === currentPasswordHash) {
        // Check if using default password - prompt to change
        if (hash === DEFAULT_PASSWORD_HASH) {
            // Using default password - prompt to change
            showPasswordChangePrompt();
            return;
        }
        
        // Correct password - show control panel (mirror hash to cookie so it survives some cache clears)
        persistControlPanelSession(hash);
        writePasswordHashCookie(hash);
        loginForm.classList.add('hidden');
        controlPanel.classList.remove('hidden');
        
        // Load gallery data
        loadGalleryData();
    } else {
        // Incorrect password
        loginError.textContent = 'Incorrect password. Access denied.';
        loginError.classList.remove('hidden');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// Show password change prompt
function showPasswordChangePrompt() {
    const loginForm = document.getElementById('loginForm');
    const passwordChangeModal = document.getElementById('passwordChangeModal');
    
    if (passwordChangeModal) {
        passwordChangeModal.classList.remove('hidden');
        document.getElementById('newPasswordInput').focus();
    }
}

// Handle password change
async function changePassword() {
    const newPasswordInput = document.getElementById('newPasswordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    const passwordChangeError = document.getElementById('passwordChangeError');
    const passwordChangeModal = document.getElementById('passwordChangeModal');
    const loginForm = document.getElementById('loginForm');
    const controlPanel = document.getElementById('controlPanel');
    
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    
    // Clear previous errors
    passwordChangeError.textContent = '';
    passwordChangeError.classList.add('hidden');
    
    // Validate
    if (!newPassword) {
        passwordChangeError.textContent = 'Please enter a new password';
        passwordChangeError.classList.remove('hidden');
        return;
    }
    
    // Password policy validation
    if (newPassword.length < 8) {
        passwordChangeError.textContent = 'Password must be at least 8 characters long';
        passwordChangeError.classList.remove('hidden');
        return;
    }
    
    // Check for capital letter
    if (!/[A-Z]/.test(newPassword)) {
        passwordChangeError.textContent = 'Password must contain at least one capital letter';
        passwordChangeError.classList.remove('hidden');
        return;
    }
    
    // Check for number
    if (!/[0-9]/.test(newPassword)) {
        passwordChangeError.textContent = 'Password must contain at least one number';
        passwordChangeError.classList.remove('hidden');
        return;
    }
    
    // Check for special character (! @ # $ % ^ & * ( ) _ +)
    if (!/[!@#$%^&*()_+]/.test(newPassword)) {
        passwordChangeError.textContent = 'Password must contain at least one special character (! @ # $ % ^ & * ( ) _ +)';
        passwordChangeError.classList.remove('hidden');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        passwordChangeError.textContent = 'Passwords do not match';
        passwordChangeError.classList.remove('hidden');
        return;
    }
    
    try {
        // Hash new password
        const newHash = await sha256(newPassword);
        
        // Save new password hash
        setPasswordHash(newHash);
        persistControlPanelSession(newHash);
        
        // Hide modal and show control panel
        passwordChangeModal.classList.add('hidden');
        loginForm.classList.add('hidden');
        controlPanel.classList.remove('hidden');
        
        // Clear password fields
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        
        // Load gallery data
        loadGalleryData();
        
        // Show success message
        alert('Password changed successfully! Your new password is now active.');
    } catch (error) {
        passwordChangeError.textContent = 'Error: ' + error.message;
        passwordChangeError.classList.remove('hidden');
    }
}

// Cancel password change (use default password)
function cancelPasswordChange() {
    const passwordChangeModal = document.getElementById('passwordChangeModal');
    const loginForm = document.getElementById('loginForm');
    const controlPanel = document.getElementById('controlPanel');
    
    passwordChangeModal.classList.add('hidden');
    loginForm.classList.add('hidden');
    controlPanel.classList.remove('hidden');
    
    persistControlPanelSession(DEFAULT_PASSWORD_HASH);
    // Load gallery data
    loadGalleryData();
}

// Allow Enter key to submit login form
document.addEventListener('DOMContentLoaded', function() {
    initPictureMediumDropdown();
    tryRestoreControlPanelSession();
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    }
    const addFromRepo = document.getElementById('addImageFromRepo');
    if (addFromRepo) {
        addFromRepo.addEventListener('change', function() {
            if (this.value) {
                const urlInput = document.getElementById('imageUrl');
                if (urlInput) urlInput.value = this.value;
                this.selectedIndex = 0;
            }
        });
    }
});

// ============================================================================
// GALLERY DATA MANAGEMENT
// ============================================================================

let galleryData = {
    sections: {
        perspectives: [],
        landscapes: []
    }
};

let currentSectionFilter = 'all';
let currentPanelView = 'add';

// Load gallery data from JSON file
async function loadGalleryData() {
    const defaultSections = {
        perspectives: [],
        landscapes: []
    };

    try {
        const timestamp = Date.now();
        // Strict single source of truth: same-origin deployed inventory only.
        const source = `${GITHUB_CONFIG.dataFile}?t=${timestamp}`;
        console.log('Loading gallery data from single source:', source);
        const response = await fetch(source, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Cache-Control': 'no-cache'
            },
            cache: 'reload'
        });

        if (!response.ok) {
            throw new Error(`gallery-data fetch failed: ${response.status} ${response.statusText}`);
        }

        const jsonText = await response.text();
        const parsed = JSON.parse(jsonText);
        if (!parsed || typeof parsed !== 'object' || !parsed.sections || typeof parsed.sections !== 'object') {
            throw new Error('gallery-data.json has invalid structure (missing sections)');
        }

        galleryData = parsed;
        galleryData.sections = { ...defaultSections, ...galleryData.sections };
        console.log('Successfully loaded gallery data from single source');

        refreshPictureLists();
    } catch (error) {
        console.error('Error loading gallery data:', error);
        console.error('Error details:', error.message, error.stack);
        galleryData = { sections: { ...defaultSections } };
        refreshPictureLists();
        console.log('Using empty gallery data structure. You can start adding pictures.');
    }

    // Never let optional UI wiring wipe successfully loaded inventory.
    try {
        setupFileUpload();
        loadGitHubTokenStatus();
        void refreshArtExamplesPickers();
        if (!hasGitHubToken()) {
            showPanelView('token', document.querySelector('.panel-nav-tab[onclick*="token"]'));
        }
    } catch (uiError) {
        console.error('Control panel UI setup failed (data left intact):', uiError);
        showPanelToast('Panel UI setup issue: ' + (uiError.message || String(uiError)), true);
    }
}

// Load GitHub token from localStorage (optional legacy UI hooks)
function loadGitHubTokenStatus() {
    const token = getGitHubToken();
    const statusEl = document.getElementById('tokenAdminStatus');
    if (statusEl) {
        statusEl.textContent = token ? 'Configured ✓' : 'Not configured';
        statusEl.className = token ? 'token-status configured' : 'token-status not-configured';
    }
    const saveToGitHubBtn = document.getElementById('saveToGitHubBtn');
    const saveAllMessage = document.getElementById('saveAllMessage');
    if (saveToGitHubBtn) saveToGitHubBtn.style.display = token ? 'inline-block' : 'none';
    if (saveAllMessage) saveAllMessage.style.display = token ? 'none' : 'block';
}

// Save GitHub token (prompts for token; stored in localStorage only)
function saveGitHubToken() {
    const existing = getGitHubToken();
    const entered = prompt(existing ? 'Enter GitHub token (cancel to keep current):' : 'Enter GitHub token:');
    if (entered === null) return;

    const token = entered.trim();
    
    if (!token) {
        if (existing) {
            showPanelToast('Token unchanged.', false);
            return;
        }
        showPanelToast('Please enter a GitHub token.', true);
        return;
    }

    if (token.length < 20) {
        showPanelToast('Token appears invalid (too short).', true);
        return;
    }

    if (setGitHubToken(token)) {
        showPanelToast('Token saved.', false);
        loadGitHubTokenStatus();
    } else {
        showPanelToast('Failed to save token.', true);
    }
}

function clearGitHubToken() {
    if (!getGitHubToken()) {
        showPanelToast('No token is saved in this browser.', false);
        return;
    }
    if (!confirm('Remove the saved GitHub token from this browser? You will need to enter it again to publish changes.')) {
        return;
    }
    try {
        localStorage.removeItem('github_token');
    } catch (e) {
        console.warn('Could not clear GitHub token:', e);
    }
    showPanelToast('Token cleared.', false);
    loadGitHubTokenStatus();
}

function showPanelView(view, clickedButton) {
    currentPanelView = view;
    const views = {
        add: document.getElementById('panelViewAdd'),
        edit: document.getElementById('panelViewEdit'),
        delete: document.getElementById('panelViewDelete'),
        token: document.getElementById('panelViewToken')
    };
    Object.keys(views).forEach((key) => {
        const el = views[key];
        if (el) el.classList.toggle('hidden', key !== view);
    });
    document.querySelectorAll('.panel-nav-tab').forEach((tab) => tab.classList.remove('active'));
    if (clickedButton) clickedButton.classList.add('active');
    if (view === 'edit' || view === 'delete') {
        refreshPictureLists();
    }
    if (view === 'token') {
        loadGitHubTokenStatus();
    }
}

// Generate unique ID for new pictures
function generateId(section) {
    const sectionPrefix = {
        perspectives: 'persp',
        landscapes: 'land'
    }[section] || 'pic';
    
    const existingIds = galleryData.sections[section].map(p => p.id);
    let counter = 1;
    let newId;
    do {
        newId = `${sectionPrefix}-${String(counter).padStart(3, '0')}`;
        counter++;
    } while (existingIds.includes(newId));
    
    return newId;
}

// ============================================================================
// GITHUB API CONFIGURATION
// ============================================================================

// GitHub repository configuration
// Website pages/JSON live in Website; artwork images live in the Art repo root.
const GITHUB_CONFIG = {
    owner: 'paulcasso25',
    repo: 'Website',
    branch: 'main',
    imageOwner: 'paulcasso25',
    imageRepo: 'Art',
    imageBranch: 'main',
    imagePath: '', // Images are stored at the root of the Art repo
    dataFile: 'gallery-data.json'
};

function githubImageOwner() {
    return GITHUB_CONFIG.imageOwner || GITHUB_CONFIG.owner;
}

function githubImageRepo() {
    return GITHUB_CONFIG.imageRepo || GITHUB_CONFIG.repo;
}

function githubImageBranch() {
    return GITHUB_CONFIG.imageBranch || GITHUB_CONFIG.branch;
}

function githubImageFilePath(filename) {
    const folder = (GITHUB_CONFIG.imagePath || '').replace(/^\/+|\/+$/g, '');
    return folder ? `${folder}/${filename}` : filename;
}

function githubImageRawUrl(filename) {
    const path = githubImageFilePath(filename);
    const enc = path.split('/').map(encodeURIComponent).join('/');
    return `https://raw.githubusercontent.com/${githubImageOwner()}/${githubImageRepo()}/${githubImageBranch()}/${enc}`;
}

function githubImageApiUrl(filename) {
    const path = githubImageFilePath(filename);
    return `https://api.github.com/repos/${githubImageOwner()}/${githubImageRepo()}/contents/${path}`;
}

function githubImageListApiUrl() {
    const folder = (GITHUB_CONFIG.imagePath || '').replace(/^\/+|\/+$/g, '');
    const base = `https://api.github.com/repos/${githubImageOwner()}/${githubImageRepo()}/contents`;
    const pathPart = folder ? `/${encodeURIComponent(folder)}` : '';
    return `${base}${pathPart}?ref=${encodeURIComponent(githubImageBranch())}`;
}

// Get GitHub token from localStorage (set once by admin)
function getGitHubToken() {
    return localStorage.getItem('github_token');
}

// Set GitHub token (called from settings)
function setGitHubToken(token) {
    if (token) {
        localStorage.setItem('github_token', token);
        return true;
    }
    return false;
}

// Check if GitHub token is configured
function hasGitHubToken() {
    return !!getGitHubToken();
}

// ============================================================================
// GITHUB API FUNCTIONS
// ============================================================================

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Unicode-safe base64 encoding (handles special characters, emojis, etc.)
function unicodeToBase64(str) {
    // First, convert the string to UTF-8 bytes
    const utf8Bytes = new TextEncoder().encode(str);
    // Then convert bytes to base64
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
    }
    return btoa(binary);
}

// Upload file to GitHub using REST API
async function uploadFileToGitHub(file, filename) {
    const token = getGitHubToken();
    if (!token) {
        throw new Error('GitHub token not configured. Please set it in Settings.');
    }

    // Convert file to base64
    const content = await fileToBase64(file);
    
    const url = githubImageApiUrl(filename);
    
    // Check if file exists (to get SHA for update)
    let sha = null;
    try {
        const checkResponse = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (checkResponse.ok) {
            const existingFile = await checkResponse.json();
            sha = existingFile.sha;
        }
    } catch (e) {
        // File doesn't exist, will create new
    }

    // Create or update file
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Upload image: ${filename}`,
            content: content,
            branch: githubImageBranch(),
            ...(sha && { sha: sha }) // Include SHA if updating existing file
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload file to GitHub');
    }

    await response.json();

    // Return the raw GitHub URL
    return githubImageRawUrl(filename);
}

// Invalidate cached Art repository listing (after upload)
function invalidateArtExamplesCache() {
    artExamplesCache = null;
}

let artExamplesCache = null;

function rawUrlForArtExample(filename) {
    return githubImageRawUrl(filename);
}

async function fetchArtExamplesList() {
    if (artExamplesCache) return artExamplesCache;
    const url = githubImageListApiUrl();
    const headers = { Accept: 'application/vnd.github.v3+json' };
    const token = getGitHubToken();
    if (token) headers.Authorization = `token ${token}`;
    const res = await fetch(url, { headers });
    if (res.status === 403) {
        throw new Error('GitHub returned 403. Add a token under Settings or try again later.');
    }
    if (!res.ok) {
        throw new Error(`GitHub API ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
        throw new Error('Unexpected response from GitHub (not a folder listing).');
    }
    const imageExt = /\.(jpe?g|png|gif|webp|svg)$/i;
    artExamplesCache = data
        .filter((f) => f.type === 'file' && imageExt.test(f.name))
        .map((f) => ({
            name: f.name,
            url: f.download_url || rawUrlForArtExample(f.name)
        }));
    return artExamplesCache;
}

function fillSelectWithRepoImages(selectEl, placeholderLabel) {
    if (!selectEl) return;
    const firstText = placeholderLabel || '— Pick file to set Image URL —';
    selectEl.innerHTML = '';
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = firstText;
    selectEl.appendChild(opt0);
    const list = artExamplesCache || [];
    list.forEach((f) => {
        const o = document.createElement('option');
        o.value = f.url;
        o.textContent = f.name;
        selectEl.appendChild(o);
    });
}

async function refreshArtExamplesPickers() {
    try {
        invalidateArtExamplesCache();
        const files = await fetchArtExamplesList();
        document.querySelectorAll('select.restore-repo-image').forEach((sel) => {
            fillSelectWithRepoImages(sel, '— Restore from Art repository —');
        });
        showPanelToast(`Loaded ${files.length} image(s) from the Art repository.`, false);
    } catch (e) {
        console.error(e);
        showPanelToast(e.message || String(e), true);
    }
}

function showPanelToast(message, isError) {
    const el = document.getElementById('panelToast');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden', 'success', 'error');
    el.classList.add(isError ? 'error' : 'success');
    clearTimeout(showPanelToast._t);
    showPanelToast._t = setTimeout(() => {
        el.classList.add('hidden');
    }, isError ? 8000 : 4000);
}

const pictureFieldDebounceTimers = {};

function schedulePictureFieldUpdate(pictureId, section, field, getValue) {
    const key = `${pictureId}|${field}`;
    clearTimeout(pictureFieldDebounceTimers[key]);
    pictureFieldDebounceTimers[key] = setTimeout(() => {
        delete pictureFieldDebounceTimers[key];
        updatePictureField(pictureId, section, field, getValue());
    }, 550);
}

// Update gallery-data.json on GitHub
async function updateGalleryDataOnGitHub(jsonData) {
    const token = getGitHubToken();
    if (!token) {
        throw new Error('GitHub token not configured.');
    }

    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataFile}`;
    
    // Get current file to get SHA
    let sha = null;
    try {
        const checkResponse = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (checkResponse.ok) {
            const existingFile = await checkResponse.json();
            sha = existingFile.sha;
        }
    } catch (e) {
        throw new Error('Could not read existing gallery-data.json from GitHub');
    }

    // Convert JSON to base64 (Unicode-safe)
    const content = unicodeToBase64(JSON.stringify(jsonData, null, 2));
    
    // Update file
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: 'Update gallery data',
            content: content,
            branch: GITHUB_CONFIG.branch,
            sha: sha
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update gallery-data.json');
    }

    return true;
}

// Update any file on GitHub (generic function for HTML files, etc.)
async function updateGitHubFile(filename, content, commitMessage) {
    const token = getGitHubToken();
    if (!token) {
        throw new Error('GitHub token not configured.');
    }

    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filename}`;
    
    // Get current file to get SHA (if it exists)
    let sha = null;
    try {
        const checkResponse = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (checkResponse.ok) {
            const existingFile = await checkResponse.json();
            sha = existingFile.sha;
        }
    } catch (e) {
        // File doesn't exist, will create new
    }

    // Convert content to base64 (Unicode-safe)
    const base64Content = unicodeToBase64(content);
    
    // Create or update file
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: commitMessage || `Update ${filename}`,
            content: base64Content,
            branch: GITHUB_CONFIG.branch,
            ...(sha && { sha: sha }) // Include SHA if updating existing file
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to update ${filename}`);
    }

    return true;
}

// ============================================================================
// ADD NEW PICTURE
// ============================================================================

// Setup file upload handler
function setupFileUpload() {
    const fileInput = document.getElementById('imageFile');
    const fileName = document.getElementById('fileName');
    const imageUrlInput = document.getElementById('imageUrl');
    const imageUrlRequired = document.getElementById('imageUrlRequired');

    if (!fileInput || !imageUrlInput) {
        console.warn('File upload fields missing; skipping upload handler setup.');
        return;
    }

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (fileName) fileName.textContent = `Selected: ${file.name}`;
            // Auto-fill image URL field with expected path (will be updated after upload)
            const sanitizedName = document.getElementById('pictureName').value.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'image';
            const fileExtension = file.name.split('.').pop();
            const expectedFilename = `${sanitizedName}.${fileExtension}`;
            imageUrlInput.value = githubImageRawUrl(expectedFilename);
            
            // Make image URL field optional when file is selected
            imageUrlInput.required = false;
            if (imageUrlRequired) imageUrlRequired.textContent = '';
        } else {
            // Make image URL required again if no file selected
            imageUrlInput.required = true;
            if (imageUrlRequired) imageUrlRequired.textContent = '*';
        }
    });
    
    // Update URL when picture name changes (if file is selected)
    const pictureNameInput = document.getElementById('pictureName');
    if (pictureNameInput) {
        pictureNameInput.addEventListener('input', function() {
            if (fileInput.files[0]) {
                const sanitizedName = this.value.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'image';
                const fileExtension = fileInput.files[0].name.split('.').pop();
                const expectedFilename = `${sanitizedName}.${fileExtension}`;
                imageUrlInput.value = githubImageRawUrl(expectedFilename);
            }
        });
    }
}

// Add a new picture to the gallery (with optional file upload)
async function addPicture() {
    const fileInput = document.getElementById('imageFile');
    const name = document.getElementById('pictureName').value.trim();
    const section = document.getElementById('pictureSection').value;
    const medium = document.getElementById('pictureMedium').value;
    let imageUrl = document.getElementById('imageUrl').value.trim();
    const year = document.getElementById('pictureYear').value.trim();
    const notes = document.getElementById('pictureNotes').value.trim();
    const soldEl = document.getElementById('pictureSold');
    const sold = !!(soldEl && soldEl.checked);
    const messageDiv = document.getElementById('addPictureMessage');
    
    // Validation
    if (!name || !section || !medium) {
        messageDiv.innerHTML = '<div class="error-message">Please fill in all required fields (marked with *)</div>';
        return;
    }
    
    // Check if file is selected and upload it
    const file = fileInput.files[0];
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            messageDiv.innerHTML = '<div class="error-message">Please select a valid image file</div>';
            return;
        }
        
        // Check if GitHub token is configured
        if (!hasGitHubToken()) {
            messageDiv.innerHTML = '<div class="error-message">GitHub token not configured. Please set it in Settings below before uploading images.</div>';
            return;
        }
        
        // Show uploading message
        messageDiv.innerHTML = '<div style="color: #1B4D5A; padding: 0.75rem; background-color: #d4edda; border-radius: 4px;">Uploading image to GitHub... Please wait.</div>';
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        try {
            // Sanitize filename (remove special characters, keep extension)
            const fileExtension = file.name.split('.').pop();
            const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const filename = `${sanitizedName}.${fileExtension}`;
            
            // Upload file to GitHub
            imageUrl = await uploadFileToGitHub(file, filename);
            invalidateArtExamplesCache();

            // Update the image URL field
            document.getElementById('imageUrl').value = imageUrl;
            
        } catch (error) {
            messageDiv.innerHTML = `<div class="error-message">Error uploading image: ${error.message}</div>`;
            return;
        }
    } else if (!imageUrl) {
        messageDiv.innerHTML = '<div class="error-message">Please either select an image file to upload, or provide an Image URL</div>';
        return;
    }
    
    // Debug: Log the year value
    console.log('Year value captured:', year, 'Type:', typeof year);
    
    // Create new picture object
    const newPicture = {
        id: generateId(section),
        name: name,
        imageUrl: imageUrl,
        medium: medium,
        notes: notes || '',
        year: year ? String(year).trim() : '',
        sold: sold
    };
    
    console.log('New picture object:', newPicture);
    
    // Add to gallery data
    if (!galleryData.sections[section]) {
        galleryData.sections[section] = [];
    }
    galleryData.sections[section].push(newPicture);
    
    // Try to update gallery-data.json and HTML files on GitHub (if token is configured)
    if (hasGitHubToken()) {
        try {
            messageDiv.innerHTML = '<div style="color: #1B4D5A; padding: 0.75rem; background-color: #d4edda; border-radius: 4px;">Saving JSON and generating HTML files... Please wait.</div>';
            
            // Step 1: Update JSON
            await updateGalleryDataOnGitHub(galleryData);
            
            // Step 2: Generate and save HTML files
            const generatedHTMLs = callHTMLGenerator(galleryData);
            const htmlFiles = Object.keys(generatedHTMLs);
            let savedCount = 0;
            let errorCount = 0;
            
            for (const sectionId of htmlFiles) {
                try {
                    const file = generatedHTMLs[sectionId];
                    await updateGitHubFile(file.filename, file.html, `Auto-update ${file.filename} from control panel`);
                    savedCount++;
                } catch (error) {
                    console.error(`Failed to save ${generatedHTMLs[sectionId].filename}:`, error);
                    errorCount++;
                }
            }
            
            if (errorCount === 0) {
                messageDiv.innerHTML = `<div class="success-message">✅ Picture added! Saved gallery-data.json and ${savedCount} HTML file(s) to GitHub.</div>`;
            } else {
                messageDiv.innerHTML = `<div class="success-message">✅ Picture added! Saved gallery-data.json and ${savedCount} HTML file(s). ${errorCount} file(s) failed.</div>`;
            }
        } catch (error) {
            messageDiv.innerHTML = `<div class="error-message">Picture added locally, but failed to update GitHub: ${error.message}. Check your token and try again.</div>`;
        }
    } else {
        messageDiv.innerHTML = '<div class="success-message">Picture added locally. Configure a GitHub token (Save Token) to publish changes automatically.</div>';
    }
    
    // Clear form
    document.getElementById('addPictureForm').reset();
    document.getElementById('fileName').textContent = '';
    
    // Update display
    refreshPictureLists();
    
    // Scroll to the new picture
    setTimeout(() => {
        const newPictureElement = document.querySelector(`[data-picture-id="${newPicture.id}"]`);
        if (newPictureElement) {
            newPictureElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            newPictureElement.classList.add('editing');
            setTimeout(() => {
                newPictureElement.classList.remove('editing');
            }, 2000);
        }
    }, 100);
}

// ============================================================================
// EDIT EXISTING PICTURES
// ============================================================================

function appendPictureEditor(container, picture, sectionKey, sectionName) {
    const pictureItem = document.createElement('div');
    pictureItem.className = 'picture-item';
    pictureItem.dataset.pictureId = picture.id;
    pictureItem.dataset.section = sectionKey;

    const header = document.createElement('div');
    header.className = 'picture-header';
    const h3 = document.createElement('h3');
    h3.style.color = '#1B4D5A';
    h3.style.margin = '0';
    h3.textContent = picture.name || '';
    header.appendChild(h3);
    pictureItem.appendChild(header);

    const sectionRow = document.createElement('div');
    sectionRow.className = 'picture-section-meta';
    sectionRow.style.marginBottom = '1rem';
    const strong = document.createElement('strong');
    strong.textContent = 'Section: ';
    sectionRow.appendChild(strong);
    sectionRow.appendChild(document.createTextNode(sectionName));
    pictureItem.appendChild(sectionRow);

    if (picture.imageUrl && String(picture.imageUrl).trim()) {
        const imgWrap = document.createElement('div');
        imgWrap.style.marginBottom = '1rem';
        const img = document.createElement('img');
        img.className = 'picture-preview';
        img.alt = picture.name || '';
        img.referrerPolicy = 'no-referrer';
        img.loading = 'lazy';
        img.src = String(picture.imageUrl).trim();
        const errP = document.createElement('p');
        errP.className = 'picture-preview-err hidden';
        errP.textContent = 'Image could not load. Check the URL or pick a file from the Art repository below.';
        img.addEventListener('error', () => {
            img.style.display = 'none';
            errP.classList.remove('hidden');
        });
        img.addEventListener('load', () => {
            img.style.display = '';
            errP.classList.add('hidden');
        });
        imgWrap.appendChild(img);
        imgWrap.appendChild(errP);
        pictureItem.appendChild(imgWrap);
    }

    function mkTextField(labelText, fieldKey, val) {
        const wrap = document.createElement('div');
        wrap.className = 'editable-field';
        const lab = document.createElement('label');
        lab.textContent = labelText;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = val || '';
        input.addEventListener('input', () =>
            schedulePictureFieldUpdate(picture.id, sectionKey, fieldKey, () => input.value)
        );
        wrap.appendChild(lab);
        wrap.appendChild(input);
        return wrap;
    }

    pictureItem.appendChild(mkTextField('Picture Name *', 'name', picture.name));
    pictureItem.appendChild(mkTextField('Image URL *', 'imageUrl', picture.imageUrl || ''));

    const row = document.createElement('div');
    row.className = 'form-row';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '1fr 1fr';
    row.style.gap = '1rem';

    const medWrap = document.createElement('div');
    medWrap.className = 'editable-field';
    const medLab = document.createElement('label');
    medLab.textContent = 'Medium *';
    const medSel = document.createElement('select');
    const mediumOpts = getPictureMediumOptions();
    mediumOpts.forEach((m) => {
        const o = document.createElement('option');
        o.value = m;
        o.textContent = m;
        if (picture.medium === m) o.selected = true;
        medSel.appendChild(o);
    });
    if (picture.medium && !mediumOpts.includes(picture.medium)) {
        const o = document.createElement('option');
        o.value = picture.medium;
        o.textContent = picture.medium;
        o.selected = true;
        medSel.appendChild(o);
    }
    medSel.addEventListener('change', () => updatePictureField(picture.id, sectionKey, 'medium', medSel.value));
    medWrap.appendChild(medLab);
    medWrap.appendChild(medSel);
    row.appendChild(medWrap);

    const yearWrap = document.createElement('div');
    yearWrap.className = 'editable-field';
    const yearLab = document.createElement('label');
    yearLab.textContent = 'Year (optional)';
    const yearIn = document.createElement('input');
    yearIn.type = 'text';
    yearIn.value = picture.year || '';
    yearIn.addEventListener('input', () =>
        schedulePictureFieldUpdate(picture.id, sectionKey, 'year', () => yearIn.value)
    );
    yearWrap.appendChild(yearLab);
    yearWrap.appendChild(yearIn);
    row.appendChild(yearWrap);
    pictureItem.appendChild(row);

    const notesWrap = document.createElement('div');
    notesWrap.className = 'editable-field';
    const notesLab = document.createElement('label');
    notesLab.textContent = 'Inspiration notes (optional)';
    const ta = document.createElement('textarea');
    ta.lang = 'en';
    ta.spellcheck = true;
    ta.value = picture.notes || '';
    ta.addEventListener('input', () =>
        schedulePictureFieldUpdate(picture.id, sectionKey, 'notes', () => ta.value)
    );
    notesWrap.appendChild(notesLab);
    notesWrap.appendChild(ta);
    pictureItem.appendChild(notesWrap);

    const soldWrap = document.createElement('div');
    soldWrap.className = 'editable-field';
    const soldLab = document.createElement('label');
    soldLab.style.display = 'flex';
    soldLab.style.alignItems = 'center';
    soldLab.style.gap = '0.5rem';
    const soldCb = document.createElement('input');
    soldCb.type = 'checkbox';
    soldCb.checked = !!picture.sold;
    soldCb.addEventListener('change', () => updatePictureField(picture.id, sectionKey, 'sold', soldCb.checked));
    soldLab.appendChild(soldCb);
    soldLab.appendChild(document.createTextNode('Mark as sold'));
    soldWrap.appendChild(soldLab);
    pictureItem.appendChild(soldWrap);

    const restoreWrap = document.createElement('div');
    restoreWrap.className = 'editable-field';
    const restoreLab = document.createElement('label');
    restoreLab.textContent = 'Restore Image URL from Art repository';
    const restoreSel = document.createElement('select');
    restoreSel.className = 'restore-repo-image';
    fillSelectWithRepoImages(restoreSel, '— Restore from Art repository —');
    restoreSel.addEventListener('change', () => {
        if (!restoreSel.value) return;
        void updatePictureField(picture.id, sectionKey, 'imageUrl', restoreSel.value);
        restoreSel.selectedIndex = 0;
    });
    restoreWrap.appendChild(restoreLab);
    restoreWrap.appendChild(restoreSel);
    pictureItem.appendChild(restoreWrap);

    container.appendChild(pictureItem);
}

function appendPictureDeleteRow(container, picture, sectionKey, sectionName) {
    const row = document.createElement('div');
    row.className = 'delete-picture-item';
    row.dataset.pictureId = picture.id;
    row.dataset.section = sectionKey;

    if (picture.imageUrl && String(picture.imageUrl).trim()) {
        const img = document.createElement('img');
        img.className = 'delete-picture-thumb';
        img.alt = picture.name || '';
        img.referrerPolicy = 'no-referrer';
        img.loading = 'lazy';
        img.src = String(picture.imageUrl).trim();
        row.appendChild(img);
    }

    const info = document.createElement('div');
    info.className = 'delete-picture-info';
    const h3 = document.createElement('h3');
    h3.textContent = picture.name || 'Untitled';
    const meta = document.createElement('p');
    meta.textContent = sectionName;
    info.appendChild(h3);
    info.appendChild(meta);
    row.appendChild(info);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn btn-danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => deletePicture(picture.id, sectionKey));
    row.appendChild(delBtn);

    container.appendChild(row);
}

function getSectionsToShow() {
    return currentSectionFilter === 'all' ? Object.keys(galleryData.sections) : [currentSectionFilter];
}

function getSectionDisplayName(sectionKey) {
    return {
        perspectives: 'Perspectives',
        landscapes: 'Landscapes'
    }[sectionKey] || sectionKey;
}

function refreshPictureLists() {
    renderPicturesList();
    renderDeletePicturesList();
}

function renderPicturesList() {
    const picturesList = document.getElementById('picturesList');
    if (!picturesList) return;
    picturesList.innerHTML = '';

    getSectionsToShow().forEach((sectionKey) => {
        const sectionName = getSectionDisplayName(sectionKey);
        const pictures = galleryData.sections[sectionKey] || [];

        if (pictures.length === 0 && currentSectionFilter !== 'all') {
            const p = document.createElement('p');
            p.style.cssText = 'color:#666;padding:2rem;text-align:center;';
            p.textContent = `No pictures in ${sectionName} section yet.`;
            picturesList.appendChild(p);
            return;
        }

        pictures.forEach((picture) => {
            appendPictureEditor(picturesList, picture, sectionKey, sectionName);
        });
    });
}

function renderDeletePicturesList() {
    const picturesDeleteList = document.getElementById('picturesDeleteList');
    if (!picturesDeleteList) return;
    picturesDeleteList.innerHTML = '';

    let total = 0;
    getSectionsToShow().forEach((sectionKey) => {
        const sectionName = getSectionDisplayName(sectionKey);
        const pictures = galleryData.sections[sectionKey] || [];
        total += pictures.length;
        pictures.forEach((picture) => {
            appendPictureDeleteRow(picturesDeleteList, picture, sectionKey, sectionName);
        });
    });

    if (total === 0) {
        const p = document.createElement('p');
        p.style.cssText = 'color:#666;padding:2rem;text-align:center;';
        p.textContent = currentSectionFilter === 'all'
            ? 'No pictures to delete.'
            : `No pictures in ${getSectionDisplayName(currentSectionFilter)} section.`;
        picturesDeleteList.appendChild(p);
    }
}

// Update a field in a picture
async function updatePictureField(pictureId, section, field, value) {
    const picture = galleryData.sections[section].find(p => p.id === pictureId);
    if (!picture) return;

    if (field === 'sold') {
        picture[field] = !!value;
    } else if (typeof value === 'string') {
        picture[field] = value.trim();
    } else {
        picture[field] = value;
    }

    const pictureElement = document.querySelector(`[data-picture-id="${pictureId}"]`);
    if (pictureElement) {
        if (field === 'name') {
            const h3 = pictureElement.querySelector('.picture-header h3');
            if (h3) h3.textContent = picture.name;
            const img = pictureElement.querySelector('img.picture-preview');
            if (img) img.alt = picture.name;
        }
        if (field === 'imageUrl') {
            let img = pictureElement.querySelector('img.picture-preview');
            let errP = pictureElement.querySelector('.picture-preview-err');
            if (!picture.imageUrl) {
                const wrap = img && img.parentElement;
                if (wrap && wrap.querySelector('.picture-preview-err')) {
                    wrap.remove();
                } else if (img) {
                    img.remove();
                }
            } else {
                if (!img) {
                    const wrap = document.createElement('div');
                    wrap.style.marginBottom = '1rem';
                    img = document.createElement('img');
                    img.className = 'picture-preview';
                    img.alt = picture.name || '';
                    img.referrerPolicy = 'no-referrer';
                    img.loading = 'lazy';
                    errP = document.createElement('p');
                    errP.className = 'picture-preview-err hidden';
                    errP.textContent =
                        'Image could not load. Check the URL or pick a file from the Art repository below.';
                    img.addEventListener('error', () => {
                        img.style.display = 'none';
                        errP.classList.remove('hidden');
                    });
                    img.addEventListener('load', () => {
                        img.style.display = '';
                        errP.classList.add('hidden');
                    });
                    wrap.appendChild(img);
                    wrap.appendChild(errP);
                    const meta = pictureElement.querySelector('.picture-section-meta');
                    if (meta) meta.after(wrap);
                    else pictureElement.prepend(wrap);
                }
                img.src = picture.imageUrl;
                img.style.display = '';
                if (errP) errP.classList.add('hidden');
            }
        }
    }

    // Auto-save to GitHub (JSON + HTML) if token is configured
    if (hasGitHubToken()) {
        try {
            await updateGalleryDataOnGitHub(galleryData);
            const generatedHTMLs = callHTMLGenerator(galleryData);
            for (const sectionId of Object.keys(generatedHTMLs)) {
                try {
                    const file = generatedHTMLs[sectionId];
                    await updateGitHubFile(file.filename, file.html, `Auto-update ${file.filename} from control panel`);
                } catch (error) {
                    console.error(`Failed to save ${generatedHTMLs[sectionId].filename}:`, error);
                }
            }
            showPanelToast('Saved to GitHub.', false);
        } catch (error) {
            console.error('Failed to update GitHub:', error);
            showPanelToast('Could not save to GitHub: ' + (error.message || String(error)), true);
        }
    }

    if (pictureElement) {
        pictureElement.classList.add('editing');
        setTimeout(() => {
            pictureElement.classList.remove('editing');
        }, 1000);
    }
}

// Delete a picture
async function deletePicture(pictureId, section) {
    if (!confirm('Are you sure you want to delete this picture? This action cannot be undone.')) {
        return;
    }
    
    const sectionArray = galleryData.sections[section];
    const index = sectionArray.findIndex(p => p.id === pictureId);
    if (index !== -1) {
        sectionArray.splice(index, 1);
        
        // Auto-save to GitHub (JSON + HTML) if token is configured — same path as Edit
        if (hasGitHubToken()) {
            try {
                await updateGalleryDataOnGitHub(galleryData);
                const generatedHTMLs = callHTMLGenerator(galleryData);
                for (const sectionId of Object.keys(generatedHTMLs)) {
                    try {
                        const file = generatedHTMLs[sectionId];
                        await updateGitHubFile(file.filename, file.html, `Auto-update ${file.filename} from control panel`);
                    } catch (error) {
                        console.error(`Failed to save ${generatedHTMLs[sectionId].filename}:`, error);
                    }
                }
                showPanelToast('Picture deleted and saved to GitHub.', false);
            } catch (error) {
                showPanelToast('Picture deleted locally, but could not save to GitHub: ' + (error.message || String(error)), true);
            }
        } else {
            showPanelToast('Picture deleted locally. Configure a GitHub token to publish changes.', true);
        }
        
        // Update display
        refreshPictureLists();
    }
}

// Show specific section or all
function showSection(section, clickedButton) {
    currentSectionFilter = section;
    
    // Update tab styles in both Edit and Delete section filters
    document.querySelectorAll('#editSectionTabs .section-tab, #deleteSectionTabs .section-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    if (clickedButton) {
        clickedButton.classList.add('active');
        const tabsContainer = clickedButton.closest('.section-tabs');
        if (tabsContainer) {
            const index = Array.from(tabsContainer.querySelectorAll('.section-tab')).indexOf(clickedButton);
            const mirrorContainer = tabsContainer.id === 'editSectionTabs'
                ? document.getElementById('deleteSectionTabs')
                : document.getElementById('editSectionTabs');
            if (mirrorContainer && index >= 0) {
                const mirrorTab = mirrorContainer.querySelectorAll('.section-tab')[index];
                if (mirrorTab) mirrorTab.classList.add('active');
            }
        }
    }
    
    refreshPictureLists();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// HTML GENERATION (used automatically by Add / Edit / Delete)
// ============================================================================

// Helper function to call the HTML generator from html-generator.js
// IMPORTANT: We do NOT define a function named generateAllGalleryHTMLs here
// because html-generator.js already defines window.generateAllGalleryHTMLs
// Instead, we create a wrapper with a different name that calls the original
function callHTMLGenerator(galleryData) {
    // Check if html-generator.js has loaded and exposed the function
    if (typeof window !== 'undefined' && window.generateAllGalleryHTMLs && typeof window.generateAllGalleryHTMLs === 'function') {
        // Call the original function from html-generator.js directly
        return window.generateAllGalleryHTMLs(galleryData);
    }
    
    // Fallback: html-generator.js didn't load - show error
    console.error('html-generator.js not loaded! Cannot generate HTML files.');
    throw new Error('HTML generator not available. Please refresh the page to reload html-generator.js');
}
