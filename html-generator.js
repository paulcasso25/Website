/**
 * HTML Generator for Paul Casso catalogue pages
 * Generates catalogue HTML files from gallery-data.json
 */

const SITE_BASE = 'https://paulcasso-website.netlify.app';
const GOOGLE_SITE_VERIFICATION = 'JfxVNHfYu0ixuvX_X-_5mgfl1EPNZAGkBkjEK3EevuY';

const SECTION_FILES = {
    perspectives: 'catalogue-perspectives.html',
    landscapes: 'catalogue-landscapes.html'
};

const SECTION_METADATA = {
    perspectives: {
        title: 'Paul Casso - Perspectives Collection | Abstract & Contemporary Paintings',
        heading: 'Perspectives Collection',
        description: 'Explore the Perspectives Collection by Paul Casso featuring abstract contemporary paintings including Summer Rain, Heat, Remembrance, Hope, The Precipice, Geothermal, and more. Acrylic paintings on canvas.',
        keywords: 'Paul Casso perspectives, Paul Foxton, Paul Foxton Art, Paul Foxton Painting, abstract paintings, contemporary abstract art, geometric paintings, acrylic abstract art, Summer Rain painting, The Precipice, Geothermal painting, abstract art collection',
        ogDescription: 'Explore the Perspectives Collection by Paul Casso featuring abstract contemporary paintings including Summer Rain, Heat, Remembrance, and more.',
        twitterDescription: 'Explore abstract contemporary paintings by Paul Casso including Summer Rain, Heat, Remembrance, and more.',
        genre: 'Abstract',
        jsonLdName: 'Paul Casso Perspectives Collection',
        jsonLdDescription: 'Abstract contemporary paintings by Paul Casso including Summer Rain, Heat, Remembrance, Hope, The Precipice, Geothermal, and more'
    },
    landscapes: {
        title: 'Paul Casso - Landscapes Collection | Contemporary Landscape Paintings',
        heading: 'Landscapes Collection',
        description: 'Browse the Landscapes Collection by Paul Casso featuring contemporary landscape paintings including The Old Bridge, The Falls, Snowstorm, County Clare, and more. Acrylic and oil paintings available for inquiry.',
        keywords: 'Paul Casso landscapes, Paul Foxton, Paul Foxton Art, Paul Foxton Painting, landscape paintings, contemporary landscapes, acrylic landscape paintings, oil landscape paintings, The Old Bridge, The Falls painting, County Clare painting, landscape art collection',
        ogDescription: 'Browse the Landscapes Collection by Paul Casso featuring contemporary landscape paintings including The Old Bridge, The Falls, Snowstorm, County Clare, and more.',
        twitterDescription: 'Browse contemporary landscape paintings by Paul Casso including The Old Bridge, The Falls, and more.',
        genre: 'Landscape',
        jsonLdName: 'Paul Casso Landscapes Collection',
        jsonLdDescription: 'Contemporary landscape paintings by Paul Casso including The Old Bridge, The Falls, Snowstorm, County Clare, and more'
    }
};

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text == null ? '' : text).replace(/[&<>"']/g, (m) => map[m]);
}

function getNavMarkup(activeSection) {
    const links = [
        { href: 'index.html', label: 'Gallery', key: 'index' },
        { href: 'catalogue-perspectives.html', label: 'Perspectives', key: 'perspectives' },
        { href: 'catalogue-landscapes.html', label: 'Landscapes', key: 'landscapes' },
        { href: 'bio.html', label: 'Artist Bio', key: 'bio' },
        { href: 'control-panel.html', label: 'Admin', key: 'admin' }
    ];
    const items = links.map((link) => {
        const active = link.key === activeSection ? ' class="active"' : '';
        return `                <li><a href="${link.href}"${active}>${link.label}</a></li>`;
    }).join('\n');
    return `    <nav>
        <div class="nav-container">
            <div class="nav-title">PAUL CASSO</div>
            <ul class="nav-links">
${items}
            </ul>
        </div>
    </nav>`;
}

function getInspirationMarkup(picture) {
    if (!picture.notes || !String(picture.notes).trim()) return '';
    const paras = String(picture.notes)
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `                    <p>${escapeHtml(p)}</p>`)
        .join('\n');
    return `
            <div class="artwork-inspiration" data-artwork="${escapeHtml(picture.name)}">
                <button class="inspiration-toggle" aria-expanded="false">
                    <h2>Inspiration for "${escapeHtml(picture.name)}"</h2>
                    <span class="toggle-icon">+</span>
                </button>
                <div class="inspiration-content">
${paras}
                </div>
            </div>`;
}

function generateItemCard(picture) {
    const soldClass = picture.sold ? ' sold' : '';
    const alt = picture.alt || `${picture.name} painting`;
    const details = [picture.medium, picture.year].filter(Boolean).join(' | ');
    return `
        <div class="item-card${soldClass}">
            <img src="${escapeHtml(picture.imageUrl)}" alt="${escapeHtml(alt)}" loading="lazy">${getInspirationMarkup(picture)}
            <div class="item-info">
                <p class="item-title">${escapeHtml(picture.name)}</p>
                <p class="item-details">${escapeHtml(details)}</p>
            </div>
            <a href="#" class="btn inquire-btn">Enquire</a>
        </div>`;
}

function getContactFormMarkup() {
    return `    <section class="contact-section" id="contact">
        <h2>Contact the Artist</h2>
        <form name="contact" netlify netlify-honeypot="bot-field" action="/success.html">
            <p class="hidden">
                <label>Don't fill this out if you're human: <input name="bot-field"></label>
            </p>
            
            <div class="form-grid">
                <div class="form-row">
                    <label for="name">Full Name</label>
                    <input type="text" id="name" name="name" required>
                </div>
                
                <div class="form-row">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <div class="form-row">
                    <label for="artwork">Artwork Reference</label>
                    <input type="text" id="artwork" name="artwork">
                </div>
                
                <div class="form-row">
                    <label for="message">Message</label>
                    <textarea id="message" name="message" rows="5" required></textarea>
                </div>
            </div>
            
            <button type="submit" class="btn">Send Inquiry</button>
        </form>
    </section>`;
}

function getFooterMarkup() {
    return `    <section class="copyright-notice">
        <div class="container">
            <p>All artwork is protected by copyright. Unauthorized reproduction or distribution is prohibited.</p>
            <p>For licensing inquiries, please contact PAUL CASSO via email using the contact section above or on the <a href="bio.html">Artist Bio</a> page.</p>
        </div>
    </section>

    <footer>
        <div class="footer-content">
            <p class="footer-left">&copy; <span id="copyright-year">2026</span> PAUL CASSO Art | All Rights Reserved | <a href="terms-of-use.html" style="color: #00BFFF; font-weight: 600; text-decoration: underline; font-family: 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;">Terms of Use</a></p>
        </div>
        <p style="font-style: italic; color: rgb(229, 229, 102); margin-top: 1rem;">
         Paul Casso is known as Paul Foxton outside of his artistic realm
       </p>
        <p class="footer-right"><img src="AvId_Digital_Small.png" alt="Avid Digital"></p>
    </footer>`;
}

function getCookieConsentMarkup() {
    return `    <!-- Cookie Consent Banner -->
    <div id="cookie-consent">
        <p>
            We use cookies to enhance your browsing experience and analyze site traffic. By clicking "Accept All", you consent to our use of cookies. 
            <a href="#" onclick="showGDPRInfo(); return false;">Learn more</a>
        </p>
        <div class="cookie-buttons">
            <button id="decline-cookies" class="decline-cookie">Decline</button>
            <button id="accept-cookies" class="accept-cookie">Accept All</button>
        </div>
    </div>

    <script>
        document.addEventListener("DOMContentLoaded", function() {
            const cookieConsent = document.getElementById('cookie-consent');
            const acceptBtn = document.getElementById('accept-cookies');
            const declineBtn = document.getElementById('decline-cookies');
            
            if (!localStorage.getItem('cookieConsent')) {
                setTimeout(() => {
                    cookieConsent.classList.add('show');
                }, 2000);
            }
            
            if (acceptBtn) {
                acceptBtn.addEventListener('click', function() {
                    localStorage.setItem('cookieConsent', 'accepted');
                    cookieConsent.style.animation = 'slideUp 0.5s ease-out reverse';
                    setTimeout(() => {
                        cookieConsent.classList.remove('show');
                    }, 500);
                    loadAnalytics();
                });
            }
            
            if (localStorage.getItem('cookieConsent') === 'accepted') {
                loadAnalytics();
            }
            
            function loadAnalytics() {
                const simpleScript = document.createElement('script');
                simpleScript.src = 'simple-analytics.js';
                document.head.appendChild(simpleScript);
            }
            
            if (declineBtn) {
                declineBtn.addEventListener('click', function() {
                    localStorage.setItem('cookieConsent', 'declined');
                    cookieConsent.style.animation = 'slideUp 0.5s ease-out reverse';
                    setTimeout(() => {
                        cookieConsent.classList.remove('show');
                    }, 500);
                });
            }
        });
        
        function showGDPRInfo() {
            const gdprInfo = \`
COOKIE & PRIVACY INFORMATION

We use cookies to:
- Analyze website traffic and visitor behavior
- Enhance your browsing experience
- Track which artworks you view and for how long

Your Rights (GDPR):
- You can accept or decline cookies at any time
- You can request access to your data
- You can request deletion of your data
- You can withdraw consent at any time

For data protection inquiries, please contact:
Liam Davis
Email: liam1davis@icloud.com

Cookie preferences can be managed in your browser settings.
            \`;
            alert(gdprInfo);
        }
    </script>
    <script src="protection.js"></script>
    <script src="canvas-protection.js"></script>
    <script src="artwork-modals.js"></script>
    <script src="inspiration-toggle.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const yearSpan = document.getElementById('copyright-year');
            if (yearSpan) {
                yearSpan.textContent = new Date().getFullYear();
            }
        });
    </script>`;
}

function generateStructuredData(sectionId, pictures, metadata, pageUrl) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: metadata.jsonLdName,
        description: metadata.jsonLdDescription,
        url: pageUrl,
        itemListElement: pictures.map((pic) => ({
            '@type': 'VisualArtwork',
            name: pic.name,
            creator: {
                '@type': 'Person',
                name: 'Paul Casso',
                alternateName: 'Paul Foxton'
            },
            artMedium: pic.medium || '',
            dateCreated: pic.year || '',
            genre: metadata.genre
        }))
    };
}

function generateGalleryHTML(sectionId, pictures, metadata) {
    const fileName = SECTION_FILES[sectionId] || `catalogue-${sectionId}.html`;
    const pageUrl = `${SITE_BASE}/${fileName}`;
    const imageUrl = pictures.length > 0
        ? pictures[0].imageUrl
        : `${SITE_BASE}/AvId_Digital_Small.png`;
    const galleryItemsHTML = pictures.length === 0
        ? `
        <p class="empty-message">New artwork coming soon...</p>`
        : pictures.map(generateItemCard).join('');
    const structuredData = generateStructuredData(sectionId, pictures, metadata, pageUrl);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    
    <!-- Primary Meta Tags -->
    <title>${escapeHtml(metadata.title)}</title>
    <meta name="title" content="${escapeHtml(metadata.title)}">
    <meta name="description" content="${escapeHtml(metadata.description)}">
    <meta name="keywords" content="${escapeHtml(metadata.keywords)}">
    <meta name="author" content="Paul Casso">
    <meta name="robots" content="index, follow">
    
    <!-- Google Search Console Verification -->
    <meta name="google-site-verification" content="${GOOGLE_SITE_VERIFICATION}" />
    
    <link rel="canonical" href="${pageUrl}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:title" content="${escapeHtml(metadata.title)}">
    <meta property="og:description" content="${escapeHtml(metadata.ogDescription)}">
    <meta property="og:image" content="${escapeHtml(imageUrl)}">
    <meta property="og:site_name" content="PAUL CASSO Art">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${pageUrl}">
    <meta property="twitter:title" content="${escapeHtml(metadata.title)}">
    <meta property="twitter:description" content="${escapeHtml(metadata.twitterDescription)}">
    <meta property="twitter:image" content="${escapeHtml(imageUrl)}">
    
    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    ${JSON.stringify(structuredData, null, 4)}
    </script>
    
    <link rel="stylesheet" href="Styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body>

    <!-- Simple Static Navigation -->
${getNavMarkup(sectionId)}
    
    <div class="gallery">
        <h1>${escapeHtml(metadata.heading)}</h1>
${galleryItemsHTML}
    </div>

${getContactFormMarkup()}

${getFooterMarkup()}

${getCookieConsentMarkup()}
</body>
</html>
`;
}

function generateAllGalleryHTMLs(galleryData) {
    const results = {};
    Object.keys(galleryData.sections || {}).forEach((sectionId) => {
        const pictures = galleryData.sections[sectionId] || [];
        const metadata = SECTION_METADATA[sectionId];
        if (!metadata) {
            console.warn(`No metadata found for section: ${sectionId}`);
            return;
        }
        results[sectionId] = {
            filename: SECTION_FILES[sectionId] || `catalogue-${sectionId}.html`,
            html: generateGalleryHTML(sectionId, pictures, metadata)
        };
    });
    return results;
}

if (typeof window !== 'undefined') {
    window.generateGalleryHTML = generateGalleryHTML;
    window.generateAllGalleryHTMLs = generateAllGalleryHTMLs;
    window.SECTION_METADATA = SECTION_METADATA;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateGalleryHTML,
        generateAllGalleryHTMLs,
        SECTION_METADATA,
        SECTION_FILES
    };
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, 'gallery-data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const files = generateAllGalleryHTMLs(data);
    Object.values(files).forEach((file) => {
        fs.writeFileSync(path.join(__dirname, file.filename), file.html, 'utf8');
        console.log(`Wrote ${file.filename}`);
    });
}
