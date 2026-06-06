import re
from pathlib import Path

TEMPLATES_DIR = Path("c:/Users/surya/Desktop/Saadhyam/Backend/ai_models/website_ai/app/templates")

THEMES_CONFIG = {
    "hero-split": {
        "nav_class": "nav-links",
        "insert_before": '<div id="services"',
        "about_css": """
        /* Premium CSS Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .hero-left, .hero-right {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .about-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            max-width: 1100px;
            margin: 40px auto 0;
        }
        .about-left, .about-right {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            padding: 40px;
            border-radius: 12px;
            transition: all 0.3s ease;
        }
        .about-left:hover, .about-right:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.05);
        }
        @media (max-width: 768px) {
            .about-grid { grid-template-columns: 1fr; }
        }
        """,
        "about_html": """
    <section id="about" class="section">
        <div class="section-header">
            <span class="section-label">Our Journey</span>
            <h2 class="section-title">About {{ data.business_name }}</h2>
        </div>
        <div class="about-grid">
            <div class="about-left">
                <p class="about-text">{{ content.about }}</p>
            </div>
            <div class="about-right">
                <p class="about-text">{{ theme_state.support_line }} We focus on building modern, responsive, and performance-optimized products tailored to your audience.</p>
            </div>
        </div>
    </section>
"""
    },
    "card-masonry": {
        "nav_class": "nav-links",
        "insert_before": '<div id="services"',
        "about_css": """
        /* Premium CSS Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .hero {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .about-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            padding: 60px;
            border-radius: 16px;
            max-width: 800px;
            margin: 40px auto 0;
            text-align: center;
            box-shadow: 0 10px 30px var(--accent-glow);
            transition: all 0.4s ease;
        }
        .about-card:hover {
            border-color: rgba(139, 92, 246, 0.4);
            box-shadow: 0 15px 35px rgba(139, 92, 246, 0.2);
            transform: translateY(-4px);
        }
        .about-highlight {
            font-size: 20px;
            color: white;
            margin-bottom: 24px;
            font-weight: 300;
        }
        .about-subtext {
            font-size: 15px;
            color: var(--text-muted);
        }
        """,
        "about_html": """
    <section id="about" class="section">
        <div class="section-header">
            <span class="section-label">Who We Are</span>
            <h2 class="section-title">About Our Studio</h2>
        </div>
        <div class="about-card">
            <p class="about-highlight">{{ content.about }}</p>
            <p class="about-subtext">{{ theme_state.support_line }} Crafting bespoke designs and engineering robust solutions that help businesses shine in the digital space.</p>
        </div>
    </section>
"""
    },
    "timeline-vertical": {
        "nav_class": "nav-links",
        "about_css": """
        /* Premium CSS Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .hero {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .timeline-item {
            transition: all 0.3s ease;
        }
        .timeline-item:hover {
            transform: translateX(6px);
        }
        """
    },
    "magazine-grid": {
        "nav_class": "header-nav",
        "insert_before": '<section id="services"',
        "about_css": """
        /* Premium CSS Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .hero-magazine {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .about-wrap {
            max-width: 1000px;
            margin: 40px auto 0;
            border-top: 2px solid var(--text-main);
            border-bottom: 2px solid var(--text-main);
            padding: 60px 0;
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 48px;
            transition: all 0.3s ease;
        }
        .about-body p {
            font-size: 16px;
            line-height: 1.8;
            color: var(--text-muted);
        }
        .about-body p + p {
            margin-top: 20px;
        }
        @media (max-width: 768px) {
            .about-wrap { grid-template-columns: 1fr; }
        }
        """,
        "about_html": """
    <section id="about" class="section">
        <div class="about-wrap">
            <div class="about-header">
                <span class="section-label">Editorial Profile</span>
                <h2 class="section-title">About {{ data.business_name }}</h2>
            </div>
            <div class="about-body">
                <p class="about-p1">{{ content.about }}</p>
                <p class="about-p2">{{ theme_state.support_line }} Focused on providing high-quality digital solutions and keeping the client at the heart of our operations.</p>
            </div>
        </div>
    </section>
"""
    },
    "bento-box": {
        "nav_class": "nav-links",
        "insert_before": '<div id="services"',
        "about_css": """
        /* Premium CSS Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .hero {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .bento-about {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 24px;
            max-width: 1100px;
            margin: 40px auto 0;
        }
        @media (max-width: 768px) {
            .bento-about { grid-template-columns: 1fr; }
        }
        """,
        "about_html": """
    <section id="about" class="section">
        <div class="section-header">
            <span class="section-label">Introduction</span>
            <h2 class="section-title">About Us</h2>
        </div>
        <div class="bento-about">
            <div class="bento-item bento-wide" style="padding: 40px; background: white; border: 1px solid var(--border-color); border-radius: 16px; transition: all 0.3s ease;">
                <h3 style="font-size: 20px; margin-bottom: 12px;">Our Mission</h3>
                <p style="color: var(--text-muted); font-size: 15px;">{{ content.about }}</p>
            </div>
            <div class="bento-item bento-medium" style="padding: 40px; background: white; border: 1px solid var(--border-color); border-radius: 16px; transition: all 0.3s ease;">
                <h3 style="font-size: 20px; margin-bottom: 12px;">Our Values</h3>
                <p style="color: var(--text-muted); font-size: 15px;">{{ theme_state.support_line }} Quality-first delivery, continuous support, and customer success are our core values.</p>
            </div>
        </div>
    </section>
"""
    },
    "parallax-scroll": {
        "nav_class": "nav-links",
        "insert_before": '<section id="services"',
        "about_css": """
        /* Premium CSS Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .hero {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .parallax-about-box {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            padding: 48px;
            border-radius: 12px;
            max-width: 900px;
            margin: 40px auto 0;
            box-shadow: 0 0 30px var(--accent-glow);
            position: relative;
            transition: all 0.3s ease;
        }
        .parallax-about-box:hover {
            border-color: var(--primary-accent);
            box-shadow: 0 0 40px rgba(139, 92, 246, 0.3);
        }
        .parallax-about-text {
            font-size: 18px;
            color: white;
            margin-bottom: 24px;
            line-height: 1.8;
        }
        .parallax-about-sub {
            color: var(--text-muted);
            font-size: 14px;
        }
        """,
        "about_html": """
    <section id="about" class="section">
        <div class="section-header">
            <span class="section-label">Core Mission</span>
            <h2 class="section-title">About {{ data.business_name }}</h2>
        </div>
        <div class="parallax-about-box">
            <p class="parallax-about-text">{{ content.about }}</p>
            <p class="parallax-about-sub">{{ theme_state.support_line }} Engineering robust, performance-optimized, and beautiful cyberpunk frontends.</p>
        </div>
    </section>
"""
    },
    "minimal-modern": {
        "nav_class": "nav-links",
        "insert_before": '<section id="services"',
        "about_css": """
        /* Premium CSS Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .hero {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .minimal-about {
            max-width: 800px;
            margin: 40px auto 0;
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 40px;
            transition: all 0.3s ease;
        }
        .minimal-lead {
            font-size: 22px;
            font-weight: 300;
            color: var(--text-main);
            line-height: 1.6;
        }
        .minimal-sub {
            font-size: 15px;
            color: var(--text-muted);
            line-height: 1.7;
            align-self: end;
        }
        @media (max-width: 768px) {
            .minimal-about { grid-template-columns: 1fr; }
        }
        """,
        "about_html": """
    <section id="about" class="section">
        <div class="section-header">
            <span class="section-label">Our Story</span>
            <h2 class="section-title">About Us</h2>
        </div>
        <div class="minimal-about">
            <p class="minimal-lead">{{ content.about }}</p>
            <p class="minimal-sub">{{ theme_state.support_line }} We focus on building ultra-clean designs and reliable platforms.</p>
        </div>
    </section>
"""
    },
    "agency-dark": {
        "nav_class": "nav-links",
        "insert_before": '<section id="services"',
        "about_css": """
        /* Premium CSS Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .hero {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .about-panel {
            background: var(--card-bg);
            backdrop-filter: blur(16px);
            border: 1px solid var(--card-border);
            padding: 48px;
            border-radius: 16px;
            max-width: 800px;
            margin: 40px auto 0;
            text-align: center;
            box-shadow: 0 10px 30px var(--accent-glow);
            transition: all 0.4s ease;
        }
        .about-panel:hover {
            border-color: rgba(139, 92, 246, 0.4);
            box-shadow: 0 15px 35px rgba(139, 92, 246, 0.25);
            transform: translateY(-4px);
        }
        .about-hero-text {
            font-size: 20px;
            color: white;
            margin-bottom: 24px;
            font-weight: 300;
        }
        .about-desc {
            color: var(--text-muted);
            font-size: 14px;
        }
        """,
        "about_html": """
    <section id="about" class="section">
        <div class="section-header">
            <span class="section-label">About Us</span>
            <h2 class="section-title">Our Vision</h2>
        </div>
        <div class="about-panel">
            <p class="about-hero-text">{{ content.about }}</p>
            <p class="about-desc">{{ theme_state.support_line }} We combine elegant UI elements with smooth performance to deliver premium results.</p>
        </div>
    </section>
"""
    },
    "retro-brutalism": {
        "nav_class": "nav-links",
        "insert_before": '<section id="services"',
        "about_css": """
        /* Premium CSS Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .hero {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .about-brutal {
            background: white;
            border: 4px solid var(--border-color);
            box-shadow: var(--card-shadow);
            padding: 36px;
            max-width: 800px;
            margin: 40px auto 0;
            font-size: 18px;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        .about-brutal:hover {
            transform: translate(-4px, -4px);
            box-shadow: 8px 8px 0px var(--shadow-color);
        }
        .about-brutal p + p {
            margin-top: 24px;
        }
        """,
        "about_html": """
    <section id="about" class="section">
        <div class="section-header">
            <span class="section-label">Manifesto</span>
            <h2 class="section-title">About Us</h2>
        </div>
        <div class="about-brutal">
            <p>{{ content.about }}</p>
            <p style="background: var(--brutal-yellow); padding: 16px; border-top: 3px solid var(--border-color); font-weight: 700;">{{ theme_state.support_line }} Delivering high impact web design with solid digital engineering.</p>
        </div>
    </section>
"""
    },
    "restaurant-showcase": {
        "nav_class": "nav-links",
        "insert_before": '<section id="services"',
        "about_css": """
        /* Premium CSS Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .hero {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .about-restaurant {
            max-width: 800px;
            margin: 40px auto 0;
            text-align: center;
            background: #f5f2eb;
            padding: 60px 48px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            transition: all 0.3s ease;
        }
        .about-restaurant:hover {
            border-color: var(--primary-accent);
            box-shadow: 0 10px 20px rgba(0,0,0,0.02);
            transform: translateY(-2px);
        }
        .about-para {
            font-size: 16px;
            color: var(--text-muted);
            line-height: 1.8;
        }
        .italic-para {
            font-family: 'Playfair Display', serif;
            font-size: 22px;
            font-style: italic;
            color: var(--text-main);
            margin-bottom: 24px;
        }
        """,
        "about_html": """
    <section id="about" class="section">
        <div class="section-header">
            <span class="section-label">Our Heritage</span>
            <h2 class="section-title">Our Story</h2>
        </div>
        <div class="about-restaurant">
            <p class="about-para italic-para">{{ content.about }}</p>
            <p class="about-para">{{ theme_state.support_line }} We believe in quality ingredients, craft, and creating memorable experiences for all our guests.</p>
        </div>
    </section>
"""
    },
    "saas-dashboard": {
        "nav_class": "nav-links",
        "insert_before": '<section id="features"',
        "about_css": """
        /* Premium CSS Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .hero {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .about-saas {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 32px;
            max-width: 1000px;
            margin: 40px auto 0;
        }
        .about-saas-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.02);
            transition: all 0.3s ease;
        }
        .about-saas-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.05);
            border-color: var(--primary-color);
        }
        .about-saas-card h3 {
            font-size: 20px;
            margin-bottom: 16px;
            color: var(--primary-color);
        }
        .about-saas-card p {
            font-size: 15px;
            color: var(--text-muted);
        }
        @media (max-width: 768px) {
            .about-saas { grid-template-columns: 1fr; }
        }
        """,
        "about_html": """
    <section id="about" class="section">
        <div class="section-header">
            <span class="section-label">Company Overview</span>
            <h2 class="section-title">About {{ data.business_name }}</h2>
        </div>
        <div class="about-saas">
            <div class="about-saas-card">
                <h3>Our Mission</h3>
                <p>{{ content.about }}</p>
            </div>
            <div class="about-saas-card">
                <h3>Our Platform</h3>
                <p>{{ theme_state.support_line }} High performance solutions, robust cloud systems, and real-time collaboration engines.</p>
            </div>
        </div>
    </section>
"""
    },
    "creative-portfolio": {
        "nav_class": "nav-links",
        "insert_before": '<section id="work"',
        "about_css": """
        /* Premium CSS Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .hero {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .about-creative {
            max-width: 800px;
            margin: 40px auto 0;
            display: flex;
            flex-direction: column;
            gap: 24px;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            padding: 60px 48px;
            border-radius: 24px;
            transition: all 0.3s ease;
        }
        .about-creative:hover {
            border-color: var(--accent-primary);
            box-shadow: 0 15px 30px var(--accent-glow);
            transform: translateY(-4px);
        }
        .about-creative-lead {
            font-size: 22px;
            font-weight: 300;
            color: white;
            line-height: 1.6;
        }
        .about-creative-text {
            font-size: 14px;
            color: var(--text-muted);
            line-height: 1.8;
        }
        """,
        "about_html": """
    <section id="about" class="section">
        <div class="section-header">
            <span class="section-subtitle">Biography</span>
            <h2 class="section-title">About Our Studio</h2>
        </div>
        <div class="about-creative">
            <p class="about-creative-lead">{{ content.about }}</p>
            <p class="about-creative-text">{{ theme_state.support_line }} We focus on building digital solutions that push the envelope of creative excellence and functionality.</p>
        </div>
    </section>
"""
    }
}

def revamp_template(theme, config):
    file_path = TEMPLATES_DIR / f"{theme}.html"
    if not file_path.exists():
        print(f"❌ Template {theme} not found!")
        return False
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    print(f"Processing {theme}...")
    
    # 1. Update navigation links (add Home and About if not present)
    nav_class = config["nav_class"]
    
    # Find navigation ul matching the class
    nav_pattern = rf'(<ul\s+class=["\']{nav_class}["\'][^>]*>)(.*?)(</ul>)'
    match = re.search(nav_pattern, content, re.DOTALL)
    if match:
        ul_start, items_content, ul_end = match.groups()
        
        # Check if About is already there
        if 'href="#about"' not in items_content:
            # Re-generate navigation items
            new_nav_items = '\n                <li><a href="#">Home</a></li>\n                <li><a href="#about">About</a></li>'
            
            # Extract other links (skipping services if we want clean formatting, but we can just prepend)
            cleaned_items = items_content
            # Remove any existing Home or About duplicates if any
            cleaned_items = re.sub(r'<li><a\s+href=["\']#?["\']>Home</a></li>\s*', '', cleaned_items)
            cleaned_items = re.sub(r'<li><a\s+href=["\']#about["\']>About</a></li>\s*', '', cleaned_items)
            
            # Inject new items
            replacement_nav = f"{ul_start}{new_nav_items}\n{cleaned_items}{ul_end}"
            content = content.replace(match.group(0), replacement_nav)
            print("  [OK] Updated navigation links")
            
    # 2. Add id="about" to timeline-vertical if it is that theme, otherwise inject about HTML
    if theme == "timeline-vertical":
        # Add id="about" to the about-section section tag
        about_sec_pattern = r'<section class="about-section">'
        if about_sec_pattern in content:
            content = content.replace(about_sec_pattern, '<section id="about" class="about-section">')
            print("  [OK] Added id='about' to about section tag")
    else:
        # Check if #about section is already in HTML
        if 'id="about"' not in content:
            insert_before = config["insert_before"]
            if insert_before in content:
                content = content.replace(insert_before, config["about_html"] + "\n    " + insert_before)
                print("  [OK] Injected About HTML section")
            else:
                print(f"  ⚠️ Could not find insert insertion point: {insert_before}")
                
    # 3. Inject CSS styling/animations into style block
    style_end = "</style>"
    if style_end in content and "about_css" in config:
        content = content.replace(style_end, config["about_css"] + "\n    " + style_end)
        print("  [OK] Injected premium CSS styles & animations")
        
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    return True

print("Starting templates revamp...")
for theme, config in THEMES_CONFIG.items():
    revamp_template(theme, config)
print("Finished templates revamp!")
