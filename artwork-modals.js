// Artwork Expansion Modal and Inquire Modal Functionality

// Wait for everything to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModals);
} else {
    // DOM already loaded
    initializeModals();
}

function initializeModals() {
    // Wait for canvas protection to finish converting images
    // Then initialize modals with a delay to ensure canvas conversion is complete
    setTimeout(function() {
        // Initialize artwork expansion modals
        initArtworkModals();
        
        // Initialize inquire modals
        initInquireModals();
        
        // Re-initialize after a longer delay to catch any late-loading images
        setTimeout(function() {
            initArtworkModals();
        }, 500);
    }, 300);
    
    // Listen for canvas conversion events from canvas-protection.js
    document.addEventListener('canvasConverted', function(e) {
        const canvas = e.target;
        if (canvas && canvas.tagName === 'CANVAS' && canvas.dataset.canvasConverted === 'true') {
            setTimeout(function() {
                initArtworkModals();
            }, 50);
        }
    }, true); // Use capture phase to catch event early
    
    // Watch for canvas elements being added (from canvas-protection.js)
    const observer = new MutationObserver(function(mutations) {
        let shouldReinit = false;
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    // Check if a canvas was added or an image was converted
                    if (node.tagName === 'CANVAS' || 
                        (node.querySelector && node.querySelector('canvas[data-canvas-converted="true"]'))) {
                        shouldReinit = true;
                    }
                }
            });
        });
        if (shouldReinit) {
            setTimeout(function() {
                initArtworkModals();
            }, 100);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Artwork Expansion Modal
function initArtworkModals() {
    const itemCards = document.querySelectorAll('.item-card');
    
    itemCards.forEach(card => {
        // Check for both img and canvas (canvas-protection.js converts images to canvas)
        const img = card.querySelector('img:not([data-modal-handled])');
        const canvas = card.querySelector('canvas[data-canvas-converted="true"]:not([data-modal-handled])');
        const imageElement = canvas || img; // Prefer canvas if both exist
        
        if (imageElement) {
            // Mark as handled to avoid duplicate handlers
            imageElement.setAttribute('data-modal-handled', 'true');
            
            // Ensure image/canvas is clickable
            imageElement.style.cursor = 'pointer';
            imageElement.style.pointerEvents = 'auto';
            
            // Add click handler to image/canvas
            imageElement.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openArtworkModal(imageElement, card);
            }, { once: false });
        }
    });
}

function openArtworkModal(imageElement, card) {
    // Get the image source - handle both img and canvas elements
    let imageSrc;
    let imageAlt;
    
    if (imageElement.tagName === 'CANVAS' && imageElement.dataset.originalSrc) {
        // Canvas element - use stored original source
        imageSrc = imageElement.dataset.originalSrc;
        imageAlt = imageElement.alt || '';
    } else if (imageElement.tagName === 'IMG') {
        // Regular image element
        imageSrc = imageElement.src;
        imageAlt = imageElement.alt || '';
    } else {
        // Fallback - try to get src from canvas
        imageSrc = imageElement.dataset.originalSrc || imageElement.src || '';
        imageAlt = imageElement.alt || '';
    }
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('artwork-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'artwork-modal';
        modal.className = 'artwork-modal';
        document.body.appendChild(modal);
        
        // Create back button
        const backBtn = document.createElement('button');
        backBtn.className = 'artwork-modal-back';
        backBtn.textContent = '← Back to Catalogue';
        backBtn.addEventListener('click', closeArtworkModal);
        modal.appendChild(backBtn);
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'artwork-modal-close';
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', closeArtworkModal);
        modal.appendChild(closeBtn);
        
        // Create content container
        const content = document.createElement('div');
        content.className = 'artwork-modal-content';
        modal.appendChild(content);
        
        // Close on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeArtworkModal();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeArtworkModal();
            }
        });
    }
    
    // Get artwork info
    const titleElement = card.querySelector('.item-title');
    const detailsElement = card.querySelector('.item-details');
    const title = titleElement ? titleElement.textContent.trim() : '';
    const details = detailsElement ? detailsElement.textContent.trim() : '';
    
    // Update modal content - use img tag for display (not canvas)
    const content = modal.querySelector('.artwork-modal-content');
    content.innerHTML = `
        <img src="${imageSrc}" alt="${imageAlt || title}" style="max-width: 100%; height: auto; display: block;">
        <div class="artwork-modal-info">
            <h3>${title}</h3>
            <p>${details}</p>
        </div>
    `;
    
    // Add back and close buttons if not already there
    if (!modal.querySelector('.artwork-modal-back')) {
        const backBtn = document.createElement('button');
        backBtn.className = 'artwork-modal-back';
        backBtn.textContent = '← Back to Catalogue';
        backBtn.addEventListener('click', closeArtworkModal);
        modal.insertBefore(backBtn, content);
    }
    
    if (!modal.querySelector('.artwork-modal-close')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'artwork-modal-close';
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', closeArtworkModal);
        modal.insertBefore(closeBtn, content);
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeArtworkModal() {
    const modal = document.getElementById('artwork-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Inquire Email Functionality
function initInquireModals() {
    const inquireButtons = document.querySelectorAll('.item-card a.btn, .item-card .btn, .inquire-btn');
    
    inquireButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = btn.closest('.item-card');
            if (card) {
                openInquireEmail(card);
            }
        });
    });
}

function openInquireEmail(card) {
    // Get artwork info
    const titleElement = card.querySelector('.item-title');
    const detailsElement = card.querySelector('.item-details');
    const title = titleElement ? titleElement.textContent.trim() : '';
    const details = detailsElement ? detailsElement.textContent.trim() : '';
    
    // Format artwork reference: "Name | Material | Year"
    const artworkReference = `${title} | ${details}`;
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('inquire-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'inquire-modal';
        modal.className = 'inquire-modal';
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeInquireModal();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeInquireModal();
            }
        });
    }
    
    // Create or update modal content
    const content = document.createElement('div');
    content.className = 'inquire-modal-content';
    content.innerHTML = `
        <button class="inquire-modal-close" onclick="closeInquireModal()">×</button>
        <h2>Inquire About Artwork</h2>
        <form name="contact" netlify netlify-honeypot="bot-field" action="/success.html">
            <p class="hidden">
                <label>Don't fill this out if you're human: <input name="bot-field"></label>
            </p>
            
            <div class="form-grid">
                <div class="form-row">
                    <label for="inquire-name">Full Name</label>
                    <input type="text" id="inquire-name" name="name" required>
                </div>
                
                <div class="form-row">
                    <label for="inquire-email">Email</label>
                    <input type="email" id="inquire-email" name="email" required>
                </div>
                
                <div class="form-row">
                    <label for="inquire-artwork">Artwork Reference</label>
                    <input type="text" id="inquire-artwork" name="artwork" value="${artworkReference}" readonly>
                </div>
                
                <div class="form-row">
                    <label for="inquire-message">Message</label>
                    <textarea id="inquire-message" name="message" rows="5" required></textarea>
                </div>
            </div>
            
            <div class="inquire-modal-buttons">
                <button type="button" class="btn-cancel" onclick="closeInquireModal()">Cancel</button>
                <button type="submit" class="btn-submit">Send Inquiry</button>
            </div>
        </form>
    `;
    
    // Replace existing content
    modal.innerHTML = '';
    modal.appendChild(content);
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeInquireModal() {
    const modal = document.getElementById('inquire-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// REMOVED - restoring original form modal

// Make functions globally available
window.closeArtworkModal = closeArtworkModal;

