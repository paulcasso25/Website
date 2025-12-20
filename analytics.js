// Analytics Integration - Only loads when user accepts cookies
(function() {
    'use strict';
    
    // Check if user has accepted cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    
    // Only load analytics if user has explicitly accepted
    if (cookieConsent === 'accepted') {
        // Plausible Analytics - Privacy-focused, open source, GDPR compliant
        // Replace 'your-domain.com' with your actual domain
        const domain = 'paulcasso-website.netlify.app';
        
        // Create and inject Plausible script
        const script = document.createElement('script');
        script.defer = true;
        script.dataset.domain = domain;
        script.src = 'https://plausible.io/js/script.js';
        document.head.appendChild(script);
        
        // Track custom events (optional)
        window.plausible = window.plausible || function() {
            (window.plausible.q = window.plausible.q || []).push(arguments);
        };
        
        // Track page views manually (Plausible auto-tracks, but this ensures it works)
        if (typeof plausible !== 'undefined') {
            plausible('pageview');
        }
    }
    
    // Alternative: Umami Analytics (self-hosted option)
    // Uncomment below and comment out Plausible if you prefer Umami
    /*
    if (cookieConsent === 'accepted') {
        const script = document.createElement('script');
        script.defer = true;
        script.src = 'https://your-umami-instance.com/script.js';
        script.dataset.websiteId = 'your-website-id';
        document.head.appendChild(script);
    }
    */
    
    // Alternative: Matomo Analytics (self-hosted option)
    // Uncomment below and comment out Plausible if you prefer Matomo
    /*
    if (cookieConsent === 'accepted') {
        var _paq = window._paq = window._paq || [];
        _paq.push(['trackPageView']);
        _paq.push(['enableLinkTracking']);
        (function() {
            var u = 'https://your-matomo-instance.com/';
            _paq.push(['setTrackerUrl', u + 'matomo.php']);
            _paq.push(['setSiteId', '1']);
            var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
            g.async = true; g.src = u + 'matomo.js'; s.parentNode.insertBefore(g, s);
        })();
    }
    */
})();

