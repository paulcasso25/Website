/**
 * Canvas-Based Image Protection
 * Renders images on HTML5 Canvas to make extraction more difficult
 * 
 * This script converts <img> tags to canvas elements for enhanced protection.
 * Images are drawn onto canvas, making it harder to extract the original image URL.
 */

(function() {
    'use strict';

    // Configuration
    const config = {
        // Apply to gallery images
        galleryImages: true,
        // Apply to collection images on homepage
        collectionImages: true,
        // Apply to art preview images
        artPreviewImages: true,
        // Add subtle noise to canvas (helps prevent perfect reconstruction)
        addNoise: false,
        // Noise intensity (0-1)
        noiseIntensity: 0.01
    };

    /**
     * Convert an image element to canvas
     */
    function convertImageToCanvas(img) {
        // Skip if already converted or if image hasn't loaded
        if (img.dataset.canvasConverted === 'true' || !img.complete) {
            return;
        }

        // Create canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to match image
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        // Copy image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Optional: Add subtle noise to make perfect extraction harder
        if (config.addNoise) {
            addNoiseToCanvas(ctx, canvas.width, canvas.height);
        }
        
        // Copy attributes from original image
        canvas.className = img.className;
        canvas.alt = img.alt;
        canvas.style.cssText = img.style.cssText;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'cover';
        
        // Mark as converted
        canvas.dataset.canvasConverted = 'true';
        canvas.dataset.originalSrc = img.src;
        
        // Copy any data attributes that might be needed for modals
        if (img.dataset.modalHandled) {
            canvas.dataset.modalHandled = img.dataset.modalHandled;
        }
        
        // Replace image with canvas
        img.parentNode.replaceChild(canvas, img);
        
        // Make canvas clickable for modal functionality
        canvas.style.cursor = 'pointer';
        canvas.style.pointerEvents = 'auto';
        
        // Prevent canvas from being saved
        canvas.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
        
        // Trigger custom event so artwork-modals.js can re-initialize
        canvas.dispatchEvent(new CustomEvent('canvasConverted', { bubbles: true }));
    }

    /**
     * Add subtle noise to canvas (optional, for extra protection)
     */
    function addNoiseToCanvas(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            // Add subtle random variation to RGB values
            const noise = (Math.random() - 0.5) * config.noiseIntensity * 255;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Process all images matching selectors
     */
    function processImages() {
        const selectors = [];
        
        if (config.galleryImages) {
            selectors.push('.gallery img', '.item-card img');
        }
        
        if (config.collectionImages) {
            selectors.push('.art-preview img', '.featured-grid img');
        }
        
        if (config.artPreviewImages) {
            selectors.push('.art-link img');
        }
        
        if (selectors.length === 0) {
            return;
        }
        
        const selector = selectors.join(', ');
        const images = document.querySelectorAll(selector);
        
        images.forEach(img => {
            if (img.complete) {
                convertImageToCanvas(img);
            } else {
                // Wait for image to load
                img.addEventListener('load', function() {
                    convertImageToCanvas(img);
                }, { once: true });
            }
        });
    }

    /**
     * Initialize when DOM is ready
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', processImages);
        } else {
            processImages();
        }
        
        // Also process images that are added dynamically
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        const images = node.querySelectorAll ? node.querySelectorAll('.gallery img, .item-card img, .art-preview img, .featured-grid img, .art-link img') : [];
                        images.forEach(img => {
                            if (img.complete) {
                                convertImageToCanvas(img);
                            } else {
                                img.addEventListener('load', function() {
                                    convertImageToCanvas(img);
                                }, { once: true });
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Start initialization
    init();

    // Export for manual triggering if needed
    window.canvasProtection = {
        processImages: processImages,
        convertImage: convertImageToCanvas
    };

})();

