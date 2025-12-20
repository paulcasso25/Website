// Content Protection Script
// Note: This provides deterrents but cannot completely prevent determined users from accessing content

(function() {
    'use strict';

    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // Disable text selection
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });

    // Disable drag and drop
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });

    // Disable image dragging
    document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.setAttribute('draggable', 'false');
            img.addEventListener('dragstart', function(e) {
                e.preventDefault();
                return false;
            });
            // Add protection overlay
            img.style.userSelect = 'none';
            img.style.webkitUserSelect = 'none';
            img.style.mozUserSelect = 'none';
            img.style.msUserSelect = 'none';
        });
    });

    // Disable keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Disable Ctrl+S (Save)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            return false;
        }
        // Disable Ctrl+A (Select All)
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            return false;
        }
        // Disable Ctrl+C (Copy)
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            return false;
        }
        // Disable Ctrl+X (Cut)
        if (e.ctrlKey && e.key === 'x') {
            e.preventDefault();
            return false;
        }
        // Disable Ctrl+V (Paste)
        if (e.ctrlKey && e.key === 'v') {
            e.preventDefault();
            return false;
        }
        // Disable Ctrl+P (Print)
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            return false;
        }
        // Disable Ctrl+Shift+I (Developer Tools)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            return false;
        }
        // Disable Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.key === 'J') {
            e.preventDefault();
            return false;
        }
        // Disable Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            return false;
        }
        // Disable F12 (Developer Tools)
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }
        // Disable Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            return false;
        }
    });

    // Disable print screen (limited effectiveness)
    document.addEventListener('keyup', function(e) {
        if (e.key === 'PrintScreen') {
            navigator.clipboard.writeText('');
            alert('Screenshots are disabled on this website.');
        }
    });

    // Prevent image saving via right-click menu (already handled above, but extra protection)
    document.addEventListener('DOMContentLoaded', function() {
        // Add invisible overlay to images
        const imageContainers = document.querySelectorAll('.gallery-image-container, .collection-image-container, .art-image-container, .item-card, .art-preview');
        imageContainers.forEach(container => {
            const overlay = document.createElement('div');
            overlay.className = 'image-protection-overlay';
            overlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none;';
            container.style.position = 'relative';
            container.appendChild(overlay);
        });
    });

    // Disable copy via mouse selection
    document.addEventListener('copy', function(e) {
        e.clipboardData.setData('text/plain', '');
        e.preventDefault();
        return false;
    });

    // Disable cut
    document.addEventListener('cut', function(e) {
        e.clipboardData.setData('text/plain', '');
        e.preventDefault();
        return false;
    });

    // Disable paste
    document.addEventListener('paste', function(e) {
        e.preventDefault();
        return false;
    });

    // Console warning
    console.log('%cStop!', 'color: red; font-size: 50px; font-weight: bold;');
    console.log('%cThis is a browser feature intended for developers. If someone told you to copy-paste something here, it is a scam and will give them access to your account.', 'color: red; font-size: 16px;');

    // Detect and warn about developer tools (limited effectiveness)
    let devtools = {open: false, orientation: null};
    const threshold = 160;
    setInterval(function() {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                console.clear();
                console.log('%cDeveloper tools detected. Please close developer tools to continue.', 'color: red; font-size: 20px;');
            }
        } else {
            devtools.open = false;
        }
    }, 500);

    // Disable image saving via drag to address bar or desktop
    document.addEventListener('DOMContentLoaded', function() {
        document.addEventListener('dragend', function(e) {
            e.preventDefault();
            return false;
        });
    });

})();

