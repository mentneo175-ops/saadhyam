/**
 * Inline Content Editor
 * Enables live editing of website content with save/load functionality
 */

class ContentEditor {
    constructor() {
        this.editMode = false;
        this.originalContent = {};
        this.websiteId = this.getWebsiteIdFromUrl();
        this.currentTheme = this.getCurrentTheme();
        this.init();
    }

    init() {
        // Check if we're running inside an iframe (preview mode)
        if (window.self !== window.top) {
            console.log('⚠️  Editor disabled - running in iframe (preview mode)');
            return;
        }
        
        // Don't initialize editor if no valid website ID
        if (!this.websiteId || this.websiteId === null) {
            console.log('⚠️  Editor not initialized - no valid website ID');
            return;
        }
        
        console.log('🎨 Initializing editor for website:', this.websiteId);
        this.createEditorUI();
        this.loadContent();
        this.attachEventListeners();
    }

    getWebsiteIdFromUrl() {
        // First, check if website ID was injected by the server
        if (window.WEBSITE_ID) {
            console.log('✅ Using injected website ID:', window.WEBSITE_ID);
            return window.WEBSITE_ID;
        }
        
        // Try to get from query parameter (?id=...)
        const params = new URLSearchParams(window.location.search);
        const idParam = params.get('id');
        if (idParam && idParam !== 'demo') {
            console.log('✅ Using website ID from query param:', idParam);
            return idParam;
        }
        
        // Try to get from URL path (/website/{id})
        const pathMatch = window.location.pathname.match(/\/website\/([^\/]+)/);
        if (pathMatch && pathMatch[1]) {
            const websiteId = pathMatch[1];
            
            // Skip if it's a blog file (blogs.html, blogs.json, blog-*.html)
            if (websiteId.includes('blog') || websiteId.endsWith('.html') || websiteId.endsWith('.json')) {
                console.log('⚠️  Skipping editor for blog page:', websiteId);
                return null; // Don't activate editor on blog pages
            }
            
            console.log('✅ Using website ID from path:', websiteId);
            return websiteId;
        }
        
        // Check if we're on a blog page (disable editor)
        if (window.location.pathname.includes('blogs.html') || 
            window.location.pathname.includes('blog-') ||
            window.location.pathname.includes('/website-ai/output/')) {
            console.log('⚠️  Editor disabled on blog pages');
            return null;
        }
        
        // Fallback to demo
        console.warn('⚠️  Could not determine website ID from URL, using demo mode');
        return 'demo';
    }

    getCurrentTheme() {
        const params = new URLSearchParams(window.location.search);
        return params.get('theme') || document.body.dataset.theme || 'modern';
    }

    createEditorUI() {
        const toolbar = document.createElement('div');
        toolbar.id = 'editor-toolbar';
        toolbar.innerHTML = `
      <style>
        #editor-toolbar {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          background: #ffffff;
          padding: 12px 16px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          backdrop-filter: blur(10px);
          max-width: 500px;
        }
        #editor-toolbar * {
          pointer-events: auto;
        }
        #editor-toolbar button {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }
        #editor-toolbar #toggle-edit {
          background: #4f46e5;
          color: white;
        }
        #editor-toolbar #toggle-edit.active {
          background: #10b981;
        }
        #editor-toolbar #save-content {
          background: #f59e0b;
          color: white;
          display: none;
        }
        #editor-toolbar #save-content.visible {
          display: block;
        }
        #editor-toolbar button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        #editor-toolbar select {
          padding: 8px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          background: white;
        }
        #editor-toolbar .status {
          font-size: 12px;
          color: #666;
          margin-left: 8px;
        }
        [contenteditable="true"] {
          outline: 2px dashed #4f46e5;
          outline-offset: 4px;
          transition: outline 0.2s;
          min-height: 20px;
          cursor: text;
        }
        [contenteditable="true"]:hover {
          outline-color: #10b981;
        }
        [contenteditable="true"]:focus {
          outline: 2px solid #f59e0b;
        }
        .editor-notification {
          position: fixed;
          top: 100px;
          right: 20px;
          z-index: 10001;
          background: #f59e0b;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
      <button id="toggle-edit" title="Toggle Edit Mode">
        <span class="edit-text">✏️ Edit Mode</span>
      </button>
      <button id="save-content" title="Save Changes">
        💾 Save
      </button>
      <select id="theme-selector" title="Switch Template">
        <option value="">Switch Template...</option>
        <option value="hero-split">Hero Split - Full Screen Layout</option>
        <option value="card-masonry">Card Masonry - Dark Creative</option>
        <option value="timeline-vertical">Timeline Vertical - Elegant Story</option>
        <option value="magazine-grid">Magazine Grid - Bold Editorial</option>
        <option value="bento-box">Bento Box - Apple Style</option>
        <option value="parallax-scroll">Parallax Scroll - Futuristic</option>
      </select>
      <span class="status" id="editor-status"></span>
    `;
        document.body.appendChild(toolbar);
    }

    attachEventListeners() {
        document.getElementById('toggle-edit').addEventListener('click', () => {
            this.toggleEditMode();
        });

        document.getElementById('save-content').addEventListener('click', () => {
            this.saveContent();
        });

        document.getElementById('theme-selector').addEventListener('change', (e) => {
            if (e.target.value) {
                this.switchTheme(e.target.value);
            }
        });
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
        const toggleBtn = document.getElementById('toggle-edit');
        const saveBtn = document.getElementById('save-content');

        if (this.editMode) {
            this.enableEditing();
            toggleBtn.classList.add('active');
            toggleBtn.querySelector('.edit-text').textContent = '🔒 Lock';
            saveBtn.classList.add('visible');
            this.showNotification('Edit mode enabled - Click any text to edit');
        } else {
            this.disableEditing();
            toggleBtn.classList.remove('active');
            toggleBtn.querySelector('.edit-text').textContent = '✏️ Edit Mode';
            saveBtn.classList.remove('visible');
            this.showNotification('Edit mode disabled');
        }
    }

    enableEditing() {
        // Make specific elements editable - comprehensive list for all content
        const editableSelectors = [
            // Headings
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',

            // Paragraphs and text
            'p', '.lede', '.eyebrow', 'span:not(.nav-links span)',

            // FAQ
            'summary', 'details p',

            // Services
            '.service-card h3', '.service-card p',
            '.service-item h3', '.service-item p',
            '.card h3', '.card p',

            // Stats/Metrics
            '.metric strong', '.metric p',
            '.stat-card .stat-number', '.stat-card .stat-label',
            '.stat-number', '.stat-label',

            // Team members - ALL text including names
            '.team-member h4', '.team-member p',
            '.team-card h4', '.team-card p',
            '.team-avatar',

            // Testimonials/Reviews - ALL text including author names
            '.testimonial-text',
            '.testimonial p',
            '.testimonial-card .testimonial-text',
            '.testimonial-card p',
            '.author-info strong',
            '.author-info span',
            '.testimonial-author strong',
            '.testimonial-author span',
            '.author-avatar',

            // Pricing
            '.pricing-card h3', '.pricing-card p',
            '.price', '.price-features li',

            // CTA sections
            '.cta-box h2', '.cta-box p',
            '.cta-section h2', '.cta-section p',

            // Contact
            '.contact p', '.contact h2',
            '.contact-box h2', '.contact-box p',
            '.contact-section h2', '.contact-section p',

            // Footer - make footer text editable but not links
            'footer h3', 'footer p:not(a p)',
            '.footer-section h3', '.footer-section p',
            '.footer-bottom p',

            // Buttons (text only, not the link itself)
            '.btn', 'a.btn',

            // Section titles
            '.section-title', '.section-subtitle',

            // Hero
            '.hero-badge', '.hero-tag', '.hero-label', '.hero-kicker',
            '.hero h1', '.hero p',

            // Other common elements
            '.badge', '.tag', '.label', 'strong:not(nav strong)', 'em'
        ];

        editableSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                // Skip if already editable
                if (el.hasAttribute('contenteditable')) return;

                // Skip if it's inside the editor toolbar
                if (el.closest('#editor-toolbar')) return;

                // Skip if it's inside navigation (keep nav functional)
                if (el.closest('nav:not(.footer-section)')) return;

                // Skip if it's a link in navigation
                if (el.tagName === 'A' && el.closest('.nav-links, .header-nav')) return;

                // Make it editable
                el.setAttribute('contenteditable', 'true');
                el.dataset.originalContent = el.innerHTML;
            });
        });
    }

    disableEditing() {
        document.querySelectorAll('[contenteditable="true"]').forEach(el => {
            el.removeAttribute('contenteditable');
        });
    }

    async loadContent() {
        try {
            this.updateStatus('Loading...');
            const response = await fetch(`/website-ai/api/content/${this.websiteId}`);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Loaded saved content:', data);
                this.originalContent = data;
                
                // If full HTML was saved, we don't need to populate individual fields
                // The HTML is already loaded from the server with edits applied
                if (data.content && data.content.html) {
                    this.updateStatus('Loaded saved version');
                } else {
                    this.populateContent(data);
                    this.updateStatus('Content loaded');
                }
            } else {
                console.log('No saved content found, using default');
                this.updateStatus('Using default content');
            }
        } catch (error) {
            console.error('Failed to load content:', error);
            this.updateStatus('Using default content');
        }
    }

    populateContent(data) {
        // Populate content from saved data
        if (data.headline) {
            const h1 = document.querySelector('h1');
            if (h1) h1.textContent = data.headline;
        }

        if (data.about) {
            const lede = document.querySelector('.lede');
            if (lede) lede.textContent = data.about;
        }

        // Add more field mappings as needed
    }

    async saveContent() {
        try {
            this.updateStatus('Saving...');
            console.log('💾 Saving content for website:', this.websiteId);

            // Clone the HTML to avoid modifying the live page
            const htmlClone = document.documentElement.cloneNode(true);
            
            // Remove editor toolbar from the clone
            const toolbar = htmlClone.querySelector('#editor-toolbar');
            if (toolbar) {
                toolbar.remove();
            }
            
            // Remove any editor notifications from the clone
            htmlClone.querySelectorAll('.editor-notification').forEach(el => el.remove());
            
            // Remove contenteditable attributes from the clone
            htmlClone.querySelectorAll('[contenteditable]').forEach(el => {
                el.removeAttribute('contenteditable');
                el.removeAttribute('data-original-content');
            });
            
            // Get the cleaned HTML
            const fullHtml = htmlClone.outerHTML;
            console.log('📄 HTML length:', fullHtml.length);

            const url = `/website-ai/api/content/${this.websiteId}`;
            console.log('🌐 Saving to:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: {
                        html: fullHtml  // Save cleaned HTML
                    },
                    theme: this.currentTheme
                })
            });

            console.log('📡 Response status:', response.status, response.statusText);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Content saved successfully:', result);
                this.showNotification('✅ Content saved successfully!');
                this.updateStatus('Saved');
                
                // Update original content
                this.originalContent = { html: fullHtml };
            } else {
                const errorText = await response.text();
                console.error('❌ Save failed:', response.status, errorText);
                throw new Error(`Save failed (${response.status}): ${errorText}`);
            }
        } catch (error) {
            console.error('❌ Failed to save content:', error);
            this.showNotification('❌ Failed to save: ' + error.message, 'error');
            this.updateStatus('Save failed');
        }
    }

    extractContent() {
        const content = {
            headline: document.querySelector('h1')?.textContent || '',
            about: document.querySelector('.lede')?.textContent || '',
            eyebrow: document.querySelector('.eyebrow')?.textContent || '',
            services: [],
            faq: [],
            sections: {}
        };

        // Extract services
        document.querySelectorAll('.service-card').forEach(card => {
            const name = card.querySelector('h3')?.textContent || '';
            const description = card.querySelector('p')?.textContent || '';
            if (name) {
                content.services.push({ name, description });
            }
        });

        // Extract FAQ
        document.querySelectorAll('details').forEach(detail => {
            const question = detail.querySelector('summary')?.textContent || '';
            const answer = detail.querySelector('p')?.textContent || '';
            if (question) {
                content.faq.push({ question, answer });
            }
        });

        // Extract all h2 sections
        document.querySelectorAll('h2').forEach(h2 => {
            const sectionTitle = h2.textContent;
            const sectionContent = h2.nextElementSibling?.textContent || '';
            content.sections[sectionTitle] = sectionContent;
        });

        return content;
    }

    async switchTheme(newTheme) {
        if (confirm(`Switch to ${newTheme} template? Current edits will be saved first.`)) {
            await this.saveContent();

            // Reload page with new theme
            const url = new URL(window.location);
            url.searchParams.set('theme', newTheme);
            window.location.href = url.toString();
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = 'editor-notification';
        notification.textContent = message;

        if (type === 'error') {
            notification.style.background = '#ff6b35';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateStatus(message) {
        const status = document.getElementById('editor-status');
        if (status) {
            status.textContent = message;
            setTimeout(() => {
                status.textContent = '';
            }, 3000);
        }
    }
}

// Initialize editor when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.contentEditor = new ContentEditor();
    });
} else {
    window.contentEditor = new ContentEditor();
}
