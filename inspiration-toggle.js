// Inspiration Section Toggle Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all inspiration toggles
    const inspirationSections = document.querySelectorAll('.artwork-inspiration');
    
    inspirationSections.forEach(section => {
        const toggle = section.querySelector('.inspiration-toggle');
        const content = section.querySelector('.inspiration-content');
        const heading = toggle ? toggle.querySelector('h2') : null;
        
        // Only show if content exists and has text
        if (!content || !content.textContent.trim()) {
            // Hide the entire section if no content
            section.style.display = 'none';
            return;
        }
        
        // Hide heading if no content (shouldn't happen, but safety check)
        if (!heading) {
            section.style.display = 'none';
            return;
        }
        
        // Set initial state (collapsed)
        section.setAttribute('aria-expanded', 'false');
        
        // Add click handler
        if (toggle) {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                const isExpanded = section.getAttribute('aria-expanded') === 'true';
                section.setAttribute('aria-expanded', !isExpanded);
            });
        }
    });
});

