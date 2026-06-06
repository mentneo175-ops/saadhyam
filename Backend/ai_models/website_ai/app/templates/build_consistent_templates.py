import os
import sys

templates_dir = r"c:\Users\surya\Desktop\Saadhyam\Backend\ai_models\website_ai\app\templates"

# Standard fonts and visual blocks for each theme
THEMES_ASSETS = {
    "hero-split": {
        "fonts": '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">',
        "visual": """
            <div class="split-cards">
                <div class="split-card card-1"><h3>Innovation</h3><p>Next-generation digital solutions.</p></div>
                <div class="split-card card-2"><h3>Excellence</h3><p>Refined quality and craftsmanship.</p></div>
                <div class="split-card card-3"><h3>Results</h3><p>Scale your impact dynamically.</p></div>
            </div>
        """,
        "css": """
            :root {
                --bg-main: #fcfcfd;
                --bg-alt: #f4f5f7;
                --text-main: #1d2939;
                --text-muted: #667085;
                --primary: #4f46e5;
                --primary-hover: #4338ca;
                --primary-glow: rgba(79, 70, 229, 0.15);
                --card-bg: #ffffff;
                --border-color: #e4e7ec;
                --font-headings: 'Plus Jakarta Sans', sans-serif;
                --font-body: 'Inter', sans-serif;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html { scroll-behavior: smooth; }
            body {
                background: var(--bg-main);
                color: var(--text-main);
                font-family: var(--font-body);
                line-height: 1.6;
            }
            .navbar {
                position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
                background: rgba(252, 252, 253, 0.85);
                backdrop-filter: blur(12px);
                border-bottom: 1px solid var(--border-color);
                transition: all 0.3s;
            }
            .nav-container {
                max-width: 1200px; margin: 0 auto; padding: 20px 24px;
                display: flex; justify-content: space-between; align-items: center;
            }
            .nav-logo {
                font-family: var(--font-headings); font-weight: 800; font-size: 24px;
                color: var(--primary); text-decoration: none;
            }
            .nav-links {
                display: flex; gap: 32px; list-style: none;
            }
            .nav-links a {
                text-decoration: none; color: var(--text-main); font-weight: 500; font-size: 15px;
                transition: color 0.2s;
            }
            .nav-links a:hover { color: var(--primary); }
            .nav-toggle { display: none; background: none; border: none; cursor: pointer; }
            .nav-toggle span { display: block; width: 25px; height: 3px; background: var(--text-main); margin: 5px 0; }
            
            /* Section layout */
            .hero-section {
                padding: 180px 24px 120px; min-height: 95vh;
                display: flex; align-items: center; background: radial-gradient(circle at 80% 20%, #eff6ff 0%, var(--bg-main) 50%);
            }
            .hero-container {
                max-width: 1200px; margin: 0 auto; width: 100%;
                display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; align-items: center;
            }
            .hero-badge {
                display: inline-block; padding: 6px 14px; background: #eef2ff; color: var(--primary);
                font-family: var(--font-headings); font-weight: 600; font-size: 13px; border-radius: 100px; margin-bottom: 24px;
            }
            .hero-title {
                font-family: var(--font-headings); font-size: 56px; font-weight: 800; line-height: 1.15;
                color: var(--text-main); margin-bottom: 24px;
            }
            .hero-subtitle {
                font-size: 18px; color: var(--text-muted); margin-bottom: 40px; max-width: 540px;
            }
            .hero-actions { display: flex; gap: 16px; }
            .btn {
                display: inline-flex; align-items: center; justify-content: center;
                padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none;
                transition: all 0.2s ease; font-size: 15px; border: none; cursor: pointer;
            }
            .btn-primary { background: var(--primary); color: white; box-shadow: 0 4px 14px var(--primary-glow); }
            .btn-primary:hover { background: var(--primary-hover); transform: translateY(-2px); }
            .btn-secondary { background: var(--card-bg); color: var(--text-main); border: 1px solid var(--border-color); }
            .btn-secondary:hover { background: var(--bg-alt); transform: translateY(-2px); }
            
            /* Hero visual */
            .hero-visual { display: flex; justify-content: center; position: relative; }
            .split-cards { display: grid; gap: 20px; width: 100%; max-width: 380px; }
            .split-card {
                background: var(--card-bg); border: 1px solid var(--border-color); padding: 24px;
                border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.02);
                transition: all 0.3s ease; animation: fadeInUp 0.8s ease forwards;
            }
            .split-card:hover { transform: translateY(-4px); box-shadow: 0 15px 30px var(--primary-glow); border-color: var(--primary); }
            .card-1 { animation-delay: 0.2s; }
            .card-2 { animation-delay: 0.4s; }
            .card-3 { animation-delay: 0.6s; }
            .split-card h3 { font-family: var(--font-headings); font-size: 18px; margin-bottom: 8px; color: var(--primary); }
            .split-card p { font-size: 14px; color: var(--text-muted); }
            
            /* General Section styling */
            .section { padding: 120px 24px; border-bottom: 1px solid var(--border-color); }
            .about-section, .services-section, .faq-section, .blog-section, .contact-section {
                padding: 120px 24px; border-bottom: 1px solid var(--border-color);
            }
            .section-container { max-width: 1200px; margin: 0 auto; }
            .section-header { margin-bottom: 60px; }
            .section-label {
                display: inline-block; font-family: var(--font-headings); font-weight: 600;
                font-size: 13px; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;
            }
            .section-title { font-family: var(--font-headings); font-size: 38px; font-weight: 800; color: var(--text-main); }
            
            /* About Section */
            .about-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; }
            .about-text-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 40px; border-radius: 12px; }
            .about-desc { font-size: 18px; color: var(--text-main); margin-bottom: 24px; line-height: 1.8; }
            .about-support { font-size: 15px; color: var(--text-muted); font-style: italic; }
            .about-stats-card { display: flex; flex-direction: column; gap: 24px; justify-content: center; }
            .stat-item {
                background: var(--card-bg); border: 1px solid var(--border-color); padding: 24px; border-radius: 12px; text-align: center;
                transition: transform 0.3s;
            }
            .stat-item:hover { transform: translateY(-4px); }
            .stat-number { display: block; font-family: var(--font-headings); font-size: 40px; font-weight: 800; color: var(--primary); margin-bottom: 4px; }
            .stat-label { font-size: 14px; color: var(--text-muted); font-weight: 500; }
            
            /* Services */
            .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
            .service-card {
                background: var(--card-bg); border: 1px solid var(--border-color); padding: 40px; border-radius: 12px;
                transition: all 0.3s ease;
            }
            .service-card:hover { transform: translateY(-6px); box-shadow: 0 15px 30px rgba(0,0,0,0.04); border-color: var(--primary); }
            .service-icon {
                width: 48px; height: 48px; background: #eef2ff; color: var(--primary); display: flex; align-items: center; justify-content: center;
                border-radius: 10px; margin-bottom: 24px;
            }
            .service-icon svg { width: 24px; height: 24px; }
            .service-title { font-family: var(--font-headings); font-size: 20px; font-weight: 700; margin-bottom: 12px; }
            .service-desc { color: var(--text-muted); font-size: 15px; }
            
            /* FAQ */
            .faq-accordion { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
            .faq-item {
                background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;
                transition: all 0.3s;
            }
            .faq-item[open] { border-color: var(--primary); }
            .faq-question {
                font-family: var(--font-headings); font-weight: 600; font-size: 16px; padding: 20px 24px;
                cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center;
            }
            .faq-question::-webkit-details-marker { display: none; }
            .faq-question::after { content: '+'; font-size: 20px; color: var(--text-muted); transition: transform 0.3s; }
            .faq-item[open] .faq-question::after { content: '−'; transform: rotate(180deg); color: var(--primary); }
            .faq-answer { padding: 0 24px 20px; color: var(--text-muted); font-size: 15px; border-top: 1px solid transparent; }
            .faq-item[open] .faq-answer { border-top-color: var(--border-color); }
            
            /* Blog */
            .blog-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
            .blog-loading { grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px; }
            .blog-card {
                background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden;
                cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; height: 100%;
            }
            .blog-card:hover { transform: translateY(-6px); box-shadow: 0 15px 30px rgba(0,0,0,0.04); border-color: var(--primary); }
            .blog-img {
                height: 200px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); display: flex;
                align-items: center; justify-content: center; font-size: 64px; color: var(--primary); font-family: var(--font-headings); font-weight: 800;
            }
            .blog-content { padding: 24px; display: flex; flex-direction: column; flex-grow: 1; }
            .blog-category {
                display: inline-block; font-size: 12px; font-weight: 600; color: var(--primary); text-transform: uppercase;
                letter-spacing: 1px; margin-bottom: 12px;
            }
            .blog-title { font-family: var(--font-headings); font-size: 18px; font-weight: 700; margin-bottom: 10px; line-height: 1.4; }
            .blog-desc { color: var(--text-muted); font-size: 14px; margin-bottom: 20px; line-height: 1.5; flex-grow: 1; }
            .blog-footer {
                display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted);
                border-top: 1px solid var(--border-color); padding-top: 16px;
            }
            .blog-more-wrapper { text-align: center; margin-top: 50px; }
            
            /* Contact */
            .contact-grid { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 60px; }
            .contact-info h3 { font-family: var(--font-headings); font-size: 24px; font-weight: 700; margin-bottom: 16px; }
            .contact-message { color: var(--text-muted); font-size: 15px; margin-bottom: 32px; }
            .info-list { display: flex; flex-direction: column; gap: 20px; }
            .info-item { display: flex; align-items: center; gap: 16px; font-size: 15px; color: var(--text-main); }
            .info-icon { width: 20px; height: 20px; color: var(--primary); }
            
            .contact-form-container { background: var(--card-bg); border: 1px solid var(--border-color); padding: 40px; border-radius: 12px; }
            .contact-form { display: flex; flex-direction: column; gap: 20px; }
            .form-group { display: flex; flex-direction: column; gap: 8px; }
            .form-group label { font-size: 14px; font-weight: 600; color: var(--text-main); }
            .form-group input, .form-group textarea {
                padding: 12px 16px; border: 1.5px solid var(--border-color); border-radius: 8px;
                font-family: var(--font-body); font-size: 15px; background: var(--bg-main); transition: all 0.2s;
            }
            .form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
            
            /* Footer */
            .footer { background: var(--bg-alt); border-top: 1px solid var(--border-color); padding: 40px 24px; }
            .footer-container {
                max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;
            }
            .footer-brand { font-family: var(--font-headings); font-weight: 700; color: var(--text-muted); font-size: 15px; }
            .footer-links { display: flex; gap: 24px; list-style: none; }
            .footer-links a { text-decoration: none; color: var(--text-muted); font-size: 14px; transition: color 0.2s; }
            .footer-links a:hover { color: var(--primary); }
            
            /* Animations */
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(24px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @media (max-width: 992px) {
                .hero-container { grid-template-columns: 1fr; text-align: center; gap: 40px; }
                .hero-subtitle { margin-left: auto; margin-right: auto; }
                .hero-actions { justify-content: center; }
                .about-grid { grid-template-columns: 1fr; }
                .contact-grid { grid-template-columns: 1fr; }
            }
            @media (max-width: 768px) {
                .nav-links { display: none; }
                .nav-toggle { display: block; }
                .nav-links.active {
                    display: flex; flex-direction: column; position: absolute; top: 100%; left: 0; right: 0;
                    background: var(--bg-main); border-bottom: 1px solid var(--border-color); padding: 24px; gap: 16px;
                }
                .hero-title { font-size: 40px; }
            }
        """
    },
    "card-masonry": {
        "fonts": '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">',
        "visual": """
            <div class="masonry-visual-grid">
                <div class="m-tile m-1">🎨 Design</div>
                <div class="m-tile m-2">🚀 Deploy</div>
                <div class="m-tile m-3">📈 Scale</div>
            </div>
        """,
        "css": """
            :root {
                --bg-main: #0a0b10;
                --bg-alt: #12131a;
                --text-main: #f3f4f6;
                --text-muted: #9ca3af;
                --primary: #8b5cf6;
                --primary-hover: #7c3aed;
                --primary-glow: rgba(139, 92, 246, 0.25);
                --card-bg: #12131a;
                --border-color: #1f2937;
                --accent-glow: 0 0 25px rgba(139, 92, 246, 0.15);
                --font-headings: 'Outfit', sans-serif;
                --font-body: 'Inter', sans-serif;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html { scroll-behavior: smooth; }
            body {
                background: var(--bg-main);
                color: var(--text-main);
                font-family: var(--font-body);
                line-height: 1.6;
            }
            .navbar {
                position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
                background: rgba(10, 11, 16, 0.9);
                backdrop-filter: blur(12px);
                border-bottom: 1px solid var(--border-color);
            }
            .nav-container {
                max-width: 1200px; margin: 0 auto; padding: 20px 24px;
                display: flex; justify-content: space-between; align-items: center;
            }
            .nav-logo {
                font-family: var(--font-headings); font-weight: 800; font-size: 24px;
                color: var(--primary); text-decoration: none; text-shadow: 0 0 10px var(--primary-glow);
            }
            .nav-links { display: flex; gap: 32px; list-style: none; }
            .nav-links a { text-decoration: none; color: var(--text-main); font-weight: 500; font-size: 15px; transition: color 0.2s; }
            .nav-links a:hover { color: var(--primary); }
            .nav-toggle { display: none; background: none; border: none; cursor: pointer; }
            .nav-toggle span { display: block; width: 25px; height: 3px; background: var(--text-main); margin: 5px 0; }
            
            .hero-section {
                padding: 180px 24px 120px; min-height: 95vh;
                display: flex; align-items: center;
                background: radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.15) 0%, var(--bg-main) 60%);
            }
            .hero-container {
                max-width: 1200px; margin: 0 auto; width: 100%;
                display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 60px; align-items: center;
            }
            .hero-badge {
                display: inline-block; padding: 6px 14px; background: rgba(139, 92, 246, 0.1); color: var(--primary);
                font-family: var(--font-headings); font-weight: 600; font-size: 13px; border-radius: 100px; margin-bottom: 24px;
                border: 1px solid rgba(139, 92, 246, 0.2);
            }
            .hero-title {
                font-family: var(--font-headings); font-size: 56px; font-weight: 800; line-height: 1.15;
                color: var(--text-main); margin-bottom: 24px; letter-spacing: -1px;
            }
            .hero-subtitle { font-size: 18px; color: var(--text-muted); margin-bottom: 40px; max-width: 540px; }
            .hero-actions { display: flex; gap: 16px; }
            .btn {
                display: inline-flex; align-items: center; justify-content: center;
                padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none;
                transition: all 0.2s ease; font-size: 15px; border: none; cursor: pointer;
            }
            .btn-primary { background: var(--primary); color: white; box-shadow: 0 4px 14px var(--primary-glow); }
            .btn-primary:hover { background: var(--primary-hover); transform: translateY(-2px); box-shadow: 0 6px 20px var(--primary-glow); }
            .btn-secondary { background: var(--bg-alt); color: var(--text-main); border: 1px solid var(--border-color); }
            .btn-secondary:hover { background: var(--bg-main); transform: translateY(-2px); border-color: var(--primary); }
            
            .hero-visual { display: flex; justify-content: center; width: 100%; }
            .masonry-visual-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; max-width: 380px; }
            .m-tile {
                background: var(--card-bg); border: 1px solid var(--border-color); padding: 30px 20px; border-radius: 16px;
                font-family: var(--font-headings); font-weight: 600; text-align: center; font-size: 16px;
                box-shadow: var(--accent-glow); transition: all 0.3s;
            }
            .m-tile:hover { transform: scale(1.03); border-color: var(--primary); box-shadow: 0 10px 25px var(--primary-glow); }
            .m-1 { grid-row: span 2; display: flex; align-items: center; justify-content: center; }
            .m-2 { background: linear-gradient(135deg, var(--primary) 0%, #6d28d9 100%); color: white; }
            
            .about-section, .services-section, .faq-section, .blog-section, .contact-section {
                padding: 120px 24px; border-bottom: 1px solid var(--border-color);
            }
            .section-container { max-width: 1200px; margin: 0 auto; }
            .section-header { margin-bottom: 60px; }
            .section-label {
                display: inline-block; font-family: var(--font-headings); font-weight: 600;
                font-size: 13px; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;
            }
            .section-title { font-family: var(--font-headings); font-size: 38px; font-weight: 800; color: var(--text-main); }
            
            .about-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; }
            .about-text-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 40px; border-radius: 16px; box-shadow: var(--accent-glow); }
            .about-desc { font-size: 18px; color: var(--text-main); margin-bottom: 24px; line-height: 1.8; }
            .about-support { font-size: 15px; color: var(--text-muted); font-style: italic; }
            .about-stats-card { display: flex; flex-direction: column; gap: 24px; justify-content: center; }
            .stat-item {
                background: var(--card-bg); border: 1px solid var(--border-color); padding: 24px; border-radius: 16px; text-align: center;
                transition: all 0.3s;
            }
            .stat-item:hover { transform: translateY(-4px); border-color: var(--primary); box-shadow: var(--accent-glow); }
            .stat-number { display: block; font-family: var(--font-headings); font-size: 40px; font-weight: 800; color: var(--primary); margin-bottom: 4px; }
            .stat-label { font-size: 14px; color: var(--text-muted); }
            
            /* Masonry/Grid Services */
            .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
            .service-card {
                background: var(--card-bg); border: 1px solid var(--border-color); padding: 40px; border-radius: 16px;
                transition: all 0.3s; box-shadow: var(--accent-glow);
            }
            .service-card:hover { transform: translateY(-6px); border-color: var(--primary); box-shadow: 0 10px 25px var(--primary-glow); }
            .service-icon {
                width: 48px; height: 48px; background: rgba(139, 92, 246, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center;
                border-radius: 12px; margin-bottom: 24px; border: 1px solid rgba(139, 92, 246, 0.2);
            }
            .service-icon svg { width: 24px; height: 24px; }
            .service-title { font-family: var(--font-headings); font-size: 20px; font-weight: 700; margin-bottom: 12px; }
            .service-desc { color: var(--text-muted); font-size: 15px; }
            
            .faq-accordion { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
            .faq-item { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; transition: all 0.3s; }
            .faq-item[open] { border-color: var(--primary); }
            .faq-question {
                font-family: var(--font-headings); font-weight: 600; font-size: 16px; padding: 20px 24px;
                cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center;
            }
            .faq-question::after { content: '+'; font-size: 20px; color: var(--text-muted); }
            .faq-item[open] .faq-question::after { content: '−'; color: var(--primary); }
            .faq-answer { padding: 0 24px 20px; color: var(--text-muted); font-size: 15px; border-top: 1px solid transparent; }
            .faq-item[open] .faq-answer { border-top-color: var(--border-color); }
            
            .blog-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
            .blog-loading { grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px; }
            .blog-card {
                background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden;
                cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; height: 100%; box-shadow: var(--accent-glow);
            }
            .blog-card:hover { transform: translateY(-6px); border-color: var(--primary); box-shadow: 0 10px 25px var(--primary-glow); }
            .blog-img {
                height: 200px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.2) 100%);
                display: flex; align-items: center; justify-content: center; font-size: 64px; color: var(--primary);
                font-family: var(--font-headings); font-weight: 800; border-bottom: 1px solid var(--border-color);
            }
            .blog-content { padding: 24px; display: flex; flex-direction: column; flex-grow: 1; }
            .blog-category { display: inline-block; font-size: 12px; font-weight: 600; color: var(--primary); text-transform: uppercase; margin-bottom: 12px; }
            .blog-title { font-family: var(--font-headings); font-size: 18px; font-weight: 700; margin-bottom: 10px; }
            .blog-desc { color: var(--text-muted); font-size: 14px; margin-bottom: 20px; flex-grow: 1; }
            .blog-footer { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 16px; }
            .blog-more-wrapper { text-align: center; margin-top: 50px; }
            
            .contact-grid { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 60px; }
            .contact-info h3 { font-family: var(--font-headings); font-size: 24px; font-weight: 700; margin-bottom: 16px; }
            .contact-message { color: var(--text-muted); font-size: 15px; margin-bottom: 32px; }
            .info-list { display: flex; flex-direction: column; gap: 20px; }
            .info-item { display: flex; align-items: center; gap: 16px; font-size: 15px; }
            .info-icon { width: 20px; height: 20px; color: var(--primary); }
            
            .contact-form-container { background: var(--card-bg); border: 1px solid var(--border-color); padding: 40px; border-radius: 16px; box-shadow: var(--accent-glow); }
            .contact-form { display: flex; flex-direction: column; gap: 20px; }
            .form-group { display: flex; flex-direction: column; gap: 8px; }
            .form-group label { font-size: 14px; font-weight: 600; }
            .form-group input, .form-group textarea {
                padding: 12px 16px; border: 1.5px solid var(--border-color); border-radius: 8px;
                font-family: var(--font-body); font-size: 15px; background: var(--bg-main); color: var(--text-main); transition: all 0.2s;
            }
            .form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
            
            .footer { background: var(--bg-alt); border-top: 1px solid var(--border-color); padding: 40px 24px; }
            .footer-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
            .footer-brand { font-family: var(--font-headings); font-weight: 700; color: var(--text-muted); }
            .footer-links { display: flex; gap: 24px; list-style: none; }
            .footer-links a { text-decoration: none; color: var(--text-muted); font-size: 14px; transition: color 0.2s; }
            .footer-links a:hover { color: var(--primary); }
            
            @media (max-width: 992px) {
                .hero-container { grid-template-columns: 1fr; text-align: center; gap: 40px; }
                .hero-subtitle { margin-left: auto; margin-right: auto; }
                .hero-actions { justify-content: center; }
                .about-grid { grid-template-columns: 1fr; }
                .contact-grid { grid-template-columns: 1fr; }
            }
            @media (max-width: 768px) {
                .nav-links { display: none; }
                .nav-toggle { display: block; }
                .nav-links.active {
                    display: flex; flex-direction: column; position: absolute; top: 100%; left: 0; right: 0;
                    background: var(--bg-main); border-bottom: 1px solid var(--border-color); padding: 24px; gap: 16px;
                }
                .hero-title { font-size: 40px; }
            }
        """
    }
}

# Expand THEMES_ASSETS to include all 12 templates, ensuring equal section layout but unique, rich style definitions
