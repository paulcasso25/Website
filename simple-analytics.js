// Enhanced Analytics - Tracks page time, image interactions, and engagement
// Privacy-focused, self-hosted option
(function() {
    'use strict';
    
    const cookieConsent = localStorage.getItem('cookieConsent');
    
    if (cookieConsent !== 'accepted') {
        return; // Don't track if user hasn't accepted
    }
    
    // Analytics data storage
    const analyticsData = {
        page: window.location.pathname,
        referrer: document.referrer || 'direct',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timeOnPage: 0,
        imageInteractions: []
    };
    
    // Get approximate location from timezone (privacy-friendly)
    const getCountryFromTimezone = (tz) => {
        const tzMap = {
            'America/': 'United States',
            'Europe/London': 'United Kingdom',
            'Europe/': 'Europe',
            'Asia/': 'Asia',
            'Australia/': 'Australia',
            'Africa/': 'Africa'
        };
        for (const [key, value] of Object.entries(tzMap)) {
            if (tz.includes(key)) return value;
        }
        return 'Unknown';
    };
    
    analyticsData.estimatedRegion = getCountryFromTimezone(analyticsData.timezone);
    
    // Track time on page
    const pageStartTime = Date.now();
    let timeTrackingInterval;
    let isPageVisible = true;
    
    // Track visibility changes (when user switches tabs)
    document.addEventListener('visibilitychange', function() {
        isPageVisible = !document.hidden;
    });
    
    // Update time on page every 5 seconds
    timeTrackingInterval = setInterval(() => {
        if (isPageVisible) {
            analyticsData.timeOnPage = Math.floor((Date.now() - pageStartTime) / 1000); // in seconds
        }
    }, 5000);
    
    // Track when user leaves page
    window.addEventListener('beforeunload', function() {
        analyticsData.timeOnPage = Math.floor((Date.now() - pageStartTime) / 1000);
        analyticsData.event = 'page_exit';
        sendAnalytics(analyticsData);
    });
    
    // Track image interactions
    const imageInteractions = new Map(); // Track each image separately
    
    const trackImageInteraction = (img, eventType, duration = null) => {
        const imgSrc = img.src || img.getAttribute('src') || 'unknown';
        const imgAlt = img.alt || 'Untitled artwork';
        const imgId = imgSrc.split('/').pop() || 'unknown';
        
        // Get or create interaction data for this image
        if (!imageInteractions.has(imgId)) {
            imageInteractions.set(imgId, {
                imageSrc: imgSrc,
                imageAlt: imgAlt,
                imageId: imgId,
                firstSeen: Date.now(),
                totalViewTime: 0,
                hoverCount: 0,
                clickCount: 0,
                lastInteraction: Date.now()
            });
        }
        
        const interaction = imageInteractions.get(imgId);
        interaction.lastInteraction = Date.now();
        
        if (eventType === 'hover_start') {
            interaction.hoverStartTime = Date.now();
            interaction.hoverCount++;
        } else if (eventType === 'hover_end' && interaction.hoverStartTime) {
            const hoverDuration = Math.floor((Date.now() - interaction.hoverStartTime) / 1000);
            interaction.totalViewTime += hoverDuration;
            interaction.hoverStartTime = null;
        } else if (eventType === 'click') {
            interaction.clickCount++;
        } else if (eventType === 'view' && duration) {
            interaction.totalViewTime += duration;
        }
        
        // Log significant interactions
        if (eventType === 'hover_end' || eventType === 'click') {
            console.log('Image Interaction:', {
                image: imgAlt,
                imageId: imgId,
                event: eventType,
                viewTime: interaction.totalViewTime + 's',
                hoverCount: interaction.hoverCount,
                clickCount: interaction.clickCount
            });
        }
    };
    
    // Track all images on the page
    const trackAllImages = () => {
        const images = document.querySelectorAll('img');
        
        images.forEach((img) => {
            // Track when image comes into view (Intersection Observer)
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        trackImageInteraction(img, 'view', 0);
                    }
                });
            }, { threshold: 0.5 }); // Image is "viewed" when 50% visible
            
            observer.observe(img);
            
            // Track hover events
            let hoverStartTime = null;
            img.addEventListener('mouseenter', function() {
                hoverStartTime = Date.now();
                trackImageInteraction(img, 'hover_start');
            });
            
            img.addEventListener('mouseleave', function() {
                if (hoverStartTime) {
                    trackImageInteraction(img, 'hover_end');
                }
            });
            
            // Track clicks
            img.addEventListener('click', function() {
                trackImageInteraction(img, 'click');
            });
            
            // Track long views (image visible for extended period)
            let viewStartTime = null;
            const viewObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !viewStartTime) {
                        viewStartTime = Date.now();
                    } else if (!entry.isIntersecting && viewStartTime) {
                        const viewDuration = Math.floor((Date.now() - viewStartTime) / 1000);
                        if (viewDuration > 3) { // Only track views longer than 3 seconds
                            trackImageInteraction(img, 'view', viewDuration);
                        }
                        viewStartTime = null;
                    }
                });
            });
            viewObserver.observe(img);
        });
    };
    
    // Initialize image tracking when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackAllImages);
    } else {
        trackAllImages();
    }
    
    // Track dynamically loaded images
    const imageObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    if (node.tagName === 'IMG') {
                        // Re-run tracking for new images
                        setTimeout(trackAllImages, 100);
                    } else {
                        // Check if new images were added inside this node
                        const newImages = node.querySelectorAll && node.querySelectorAll('img');
                        if (newImages && newImages.length > 0) {
                            setTimeout(trackAllImages, 100);
                        }
                    }
                }
            });
        });
    });
    
    imageObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Send analytics data function
    const sendAnalytics = (data) => {
        // Convert image interactions map to array
        const imageData = Array.from(imageInteractions.values());
        data.imageInteractions = imageData;
        
        console.log('Analytics Event:', data);
        
        // Send to your analytics endpoint (uncomment and configure)
        /*
        fetch('https://your-analytics-endpoint.com/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        }).catch(err => console.log('Analytics error:', err));
        */
    };
    
    // Track page views
    const trackPageView = () => {
        analyticsData.event = 'pageview';
        analyticsData.timeOnPage = 0;
        sendAnalytics(analyticsData);
    };
    
    // Track on load
    trackPageView();
    
    // Send periodic updates (every 30 seconds) with current stats
    setInterval(() => {
        if (isPageVisible) {
            analyticsData.timeOnPage = Math.floor((Date.now() - pageStartTime) / 1000);
            analyticsData.event = 'page_update';
            sendAnalytics(analyticsData);
        }
    }, 30000);
    
    // Track on navigation (for SPAs)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            // Send final data before navigation
            analyticsData.timeOnPage = Math.floor((Date.now() - pageStartTime) / 1000);
            analyticsData.event = 'page_exit';
            sendAnalytics(analyticsData);
            
            // Reset for new page
            lastUrl = url;
            analyticsData.page = window.location.pathname;
            analyticsData.timeOnPage = 0;
            imageInteractions.clear();
            trackPageView();
        }
    }).observe(document, { subtree: true, childList: true });
    
})();

