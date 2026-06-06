import os
from pathlib import Path

TEMPLATES_DIR = Path("c:/Users/surya/Desktop/Saadhyam/Backend/ai_models/website_ai/app/templates")

TEMPLATES_CONTENT = {}

# ==========================================
# 1. HERO SPLIT (Split-screen sticky left column, scrolling right)
# ==========================================
TEMPLATES_CONTENT["hero-split"] = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ data.business_name }} | Split Screen</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/website-ai/static/theme-adapter.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        :root {
            --bg-left: #0d0c0a;
            --bg-right: #fafafa;
            --text-left: #f5edd8;
            --text-right: #111827;
            --text-muted: #6b7280;
            --card-bg: #ffffff;
            --border-color: #e5e7eb;
            --primary: #c9a96e;
            --primary-hover: #e8d5aa;
            --primary-dim: #8b6f3e;
            --white: #ffffff;
        }
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-right);
            color: var(--text-right);
            display: grid;
            grid-template-columns: 1fr 1.3fr;
            min-height: 100vh;
        }
        
        /* Left Column (Sticky) */
        .left-col {
            background: linear-gradient(135deg, #0d0c0a 0%, #1a1510 100%);
            color: var(--text-left);
            padding: 60px 48px;
            position: sticky;
            top: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border-right: 1px solid rgba(201,169,110,0.15);
        }
        .left-header .logo {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 800;
            font-size: 26px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--primary);
            text-decoration: none;
            margin-bottom: 40px;
            display: block;
        }
        .left-nav {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .left-nav a {
            color: rgba(245,237,216,0.7);
            text-decoration: none;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 13px;
            letter-spacing: 2px;
            transition: all 0.3s;
        }
        .left-nav a:hover { color: var(--primary); padding-left: 8px; }
        
        .left-hero { margin-top: auto; margin-bottom: auto; }
        .left-hero h1 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: clamp(32px, 4vw, 54px);
            font-weight: 800;
            line-height: 1.15;
            margin-bottom: 24px;
            color: var(--white);
        }
        .left-hero h1 em { font-style: italic; color: var(--primary); }
        .left-hero p {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 32px;
            line-height: 1.6;
            color: rgba(245,237,216,0.8);
        }
        .left-footer { font-size: 12px; opacity: 0.6; color: rgba(245,237,216,0.5); }

        .btn-gold {
            display: inline-block;
            background: var(--primary);
            color: #0d0c0a;
            padding: 14px 28px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-size: 13px;
            transition: all 0.3s;
            text-align: center;
        }
        .btn-gold:hover { background: var(--primary-hover); transform: translateY(-1px); }
        
        /* Right Column (Scrolling Sections) */
        .right-col {
            padding: 80px 60px;
            overflow-y: auto;
        }
        .section {
            padding: 100px 0;
            border-bottom: 1px solid var(--border-color);
        }
        .section-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: var(--primary-dim);
            font-weight: 700;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .section-label::before { content: ''; display: block; width: 20px; height: 1px; background: var(--primary); }
        .section-title {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 38px;
            font-weight: 800;
            margin-bottom: 40px;
            color: var(--text-right);
        }
        
        /* About layout */
        .about-wrap { display: grid; grid-template-columns: 1fr; gap: 40px; }
        .about-box {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.01);
        }
        .about-desc { font-size: 17px; margin-bottom: 20px; line-height: 1.8; color: var(--text-right); }
        .about-support { font-size: 14px; color: var(--text-muted); font-style: italic; }
        
        /* About metrics */
        .about-stats {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px;
        }
        .stat-card {
            background: var(--white); border: 1px solid var(--border-color); padding: 24px; border-radius: 8px; text-align: center;
        }
        .stat-num { font-size: 36px; font-weight: 800; color: var(--primary-dim); font-family: 'Plus Jakarta Sans', sans-serif; }
        .stat-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

        /* Checklist */
        .check-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 24px; }
        .check-item { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text-right); }
        .check-icon { width: 18px; height: 18px; border-radius: 50%; background: rgba(201,169,110,0.15); color: var(--primary-dim); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

        /* Services layout */
        .services-list { display: flex; flex-direction: column; gap: 24px; }
        .service-row {
            display: grid;
            grid-template-columns: 80px 1fr;
            gap: 20px;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            padding: 30px;
            border-radius: 8px;
            transition: all 0.3s;
            position: relative;
        }
        .service-row::before {
            content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--primary); transform: scaleY(0); transition: transform 0.3s;
        }
        .service-row:hover { transform: translateX(6px); border-color: var(--border-color); }
        .service-row:hover::before { transform: scaleY(1); }
        .service-num { font-size: 32px; font-weight: 800; color: rgba(201,169,110,0.25); font-family: 'Plus Jakarta Sans', sans-serif; }
        .service-row h3 { font-size: 20px; margin-bottom: 8px; }
        .service-row p { color: var(--text-muted); font-size: 15px; }
        
        /* FAQ accordion layout */
        .faq-wrap { display: flex; flex-direction: column; gap: 16px; }
        .faq-item {
            background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;
        }
        .faq-item summary { padding: 20px 24px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .faq-item summary::after { content: '+'; font-size: 20px; color: var(--primary-dim); transition: transform 0.3s; }
        .faq-item[open] summary::after { transform: rotate(45deg); }
        .faq-item p { padding: 0 24px 20px; color: var(--text-muted); font-size: 15px; line-height: 1.6; }
        
        /* Blog cards layout */
        .blog-list { display: flex; flex-direction: column; gap: 24px; }
        .blog-card {
            display: grid; grid-template-columns: 140px 1fr; gap: 24px;
            background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.3s;
        }
        .blog-card:hover { transform: translateY(-4px); border-color: var(--primary); }
        .blog-img { background: #f0ecdf; display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 800; color: var(--primary-dim); }
        .blog-content { padding: 24px 24px 24px 0; }
        .blog-title { font-size: 18px; margin-bottom: 8px; }
        .blog-desc { color: var(--text-muted); font-size: 14px; margin-bottom: 12px; }
        .blog-footer { font-size: 12px; color: var(--text-muted); }
        
        /* Contact Form layout */
        .contact-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
        .contact-details { font-size: 15px; line-height: 1.8; color: var(--text-muted); }
        .contact-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--primary-dim); }
        .form-group input, .form-group textarea {
            padding: 12px 16px; border: 1.5px solid var(--border-color); border-radius: 4px;
            font-family: inherit; font-size: 15px; background: #fafafa; transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); }
        
        @media (max-width: 992px) {
            body { grid-template-columns: 1fr; }
            .left-col { height: auto; position: relative; padding: 40px 24px; }
            .left-nav { flex-direction: row; flex-wrap: wrap; gap: 16px; margin-top: 24px; }
            .right-col { padding: 40px 24px; }
            .about-stats { grid-template-columns: 1fr; }
            .check-list { grid-template-columns: 1fr; }
        }
    </style>
    <script src="/website-ai/static/editor.js" defer></script>
</head>
<body data-theme="hero-split">
    <div class="left-col">
        <div class="left-header">
            <a href="#" class="logo nav-logo">{{ data.business_name }}</a>
            <ul class="left-nav">
                <li><a href="#">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </div>
        <div class="left-hero">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; color: var(--primary); display: block; margin-bottom: 16px;">✦ {{ data.business_type }}</span>
            <h1>Where Quality Meets <em>Timeless</em> Excellence</h1>
            <p>{{ content.about }}</p>
            <a href="#contact" class="btn-gold">Request Consultation</a>
        </div>
        <div class="left-footer">
            &copy; <span id="year">2026</span> {{ data.business_name }}. Crafted in style.
        </div>
    </div>

    <div class="right-col">
        <section id="about" class="section">
            <span class="section-label">Manifesto</span>
            <h2 class="section-title">Our Philosophy</h2>
            <div class="about-wrap">
                <div class="about-box">
                    <p class="about-desc lede">{{ content.about }}</p>
                    <p class="about-support">{{ theme_state.support_line }} We focus on building custom, responsive layouts designed to stand out and deliver concrete results.</p>
                </div>
                <div class="about-stats">
                    <div class="stat-card">
                        <div class="stat-num">99%</div>
                        <div class="stat-label">Satisfaction</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num">150+</div>
                        <div class="stat-label">Projects</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num">100%</div>
                        <div class="stat-label">Reliable</div>
                    </div>
                </div>
                <div class="check-list">
                    <div class="check-item"><span class="check-icon">✓</span>Certified professionals</div>
                    <div class="check-item"><span class="check-icon">✓</span>Tailored custom strategies</div>
                    <div class="check-item"><span class="check-icon">✓</span>Responsive, fast delivery</div>
                    <div class="check-item"><span class="check-icon">✓</span>Continuous ongoing support</div>
                </div>
            </div>
        </section>

        <section id="services" class="section">
            <span class="section-label">Departments</span>
            <h2 class="section-title">Our Offerings</h2>
            <div class="services-list">
                {% for service in content.services %}
                <div class="service-row service-card">
                    <div class="service-num">0{{ loop.index }}</div>
                    <div>
                        <h3>{{ service.name }}</h3>
                        <p>{{ service.description }}</p>
                    </div>
                </div>
                {% endfor %}
            </div>
        </section>

        <section id="faq" class="section">
            <span class="section-label">Inquiries</span>
            <h2 class="section-title">Common Questions</h2>
            <div class="faq-wrap">
                {% for item in content.faq %}
                <details class="faq-item">
                    <summary>{{ item.question }}</summary>
                    <p>{{ item.answer }}</p>
                </details>
                {% endfor %}
            </div>
        </section>

        <section id="blog" class="section">
            <span class="section-label">Insights</span>
            <h2 class="section-title">Latest Articles</h2>
            <div id="blog-posts-container" class="blog-list">
                <div class="blog-loading">Reading insights feed...</div>
            </div>
        </section>

        <section id="contact" class="section" style="border-bottom: none;">
            <span class="section-label">Find Us</span>
            <h2 class="section-title">Get In Touch</h2>
            <div class="contact-grid">
                <div class="contact-details lede">
                    <p>{{ content.contact }}</p>
                    <div style="margin-top: 30px; display: flex; flex-direction: column; gap: 12px;">
                        <div><strong style="color: var(--primary-dim);">OFFICE HOURS</strong><br/>Monday — Friday: 9am — 6pm</div>
                        <div><strong style="color: var(--primary-dim);">EMAIL ADDRESS</strong><br/>{{ data.contact_email or 'hello@saadhyam.ai' }}</div>
                        <div><strong style="color: var(--primary-dim);">PHONE LINE</strong><br/>{{ data.contact_phone or '+1 (555) 918-0928' }}</div>
                    </div>
                </div>
                <div class="contact-form-container" style="background: #ffffff; border: 1px solid var(--border-color); padding: 40px; border-radius: 8px;">
                    <form class="contact-form" onsubmit="event.preventDefault(); alert('Message sent!');">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" placeholder="John Doe" required />
                        </div>
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" placeholder="john@example.com" required />
                        </div>
                        <div class="form-group">
                            <label>Your Message</label>
                            <textarea rows="4" placeholder="How can we assist you?" required></textarea>
                        </div>
                        <button type="submit" class="btn-gold" style="border: none; cursor: pointer; align-self: flex-start;">Send Enquiry</button>
                    </form>
                </div>
            </div>
        </section>
    </div>

    <script>
        async function loadBlogPosts() {
            const container = document.getElementById('blog-posts-container');
            try {
                const response = await fetch('blogs.json');
                if (!response.ok) throw new Error('No blogs found');
                const data = await response.json();
                const blogs = data.blogs || [];
                if (blogs.length === 0) {
                    container.innerHTML = '<p class="blog-loading">No blog posts yet.</p>';
                    return;
                }
                container.innerHTML = blogs.slice(0, 3).map(blog => `
                    <div class="blog-card" onclick="window.location.href='blog-\${blog.slug}.html'">
                        <div class="blog-img">\${blog.title.charAt(0)}</div>
                        <div class="blog-content">
                            <h3 class="blog-title">\${blog.title}</h3>
                            <p class="blog-desc">\${blog.meta_description || blog.introduction.substring(0, 80) + '...'}</p>
                            <div class="blog-footer">Read full article</div>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                container.innerHTML = '<p class="blog-loading">No blog posts yet.</p>';
            }
        }
        document.addEventListener('DOMContentLoaded', loadBlogPosts);
    </script>
</body>
</html>"""

# ==========================================
# 2. CARD MASONRY (Offset grid layout of floating cards, dark neon theme)
# ==========================================
TEMPLATES_CONTENT["card-masonry"] = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ data.business_name }} | Studio Masonry</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Grotesk:wght@300;400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/website-ai/static/theme-adapter.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        :root {
            --bg-color: #050508;
            --card-bg: #0c0d14;
            --text-color: #ffffff;
            --text-muted: #8a99ad;
            --border-color: rgba(255,255,255,0.06);
            --primary: #8b5cf6;
            --primary-hover: #a78bfa;
            --primary-glow: rgba(139, 92, 246, 0.35);
            --neon-cyan: #06b6d4;
            --font-headings: 'Outfit', sans-serif;
            --font-body: 'Space Grotesk', sans-serif;
        }
        body {
            font-family: var(--font-body);
            background: var(--bg-color);
            color: var(--text-color);
            padding: 40px 24px;
            line-height: 1.7;
        }
        
        /* Navigation (Floating glass panel) */
        .navbar {
            background: rgba(12, 13, 20, 0.75);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border-color);
            border-radius: 50px;
            padding: 16px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto 80px;
            position: sticky;
            top: 20px;
            z-index: 1000;
        }
        .nav-logo {
            font-family: var(--font-headings);
            font-weight: 800;
            font-size: 22px;
            text-decoration: none;
            color: var(--text-color);
            letter-spacing: -0.5px;
        }
        .nav-logo span { color: var(--primary); }
        .nav-links { list-style: none; display: flex; gap: 24px; }
        .nav-links a {
            color: var(--text-muted);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: color 0.3s;
        }
        .nav-links a:hover { color: var(--text-color); }
        .nav-cta {
            background: var(--primary); color: white; padding: 10px 20px; border-radius: 30px; text-decoration: none; font-size: 13px; font-weight: 600; box-shadow: 0 4px 15px var(--primary-glow); transition: all 0.3s;
        }
        .nav-cta:hover { background: var(--primary-hover); transform: translateY(-1px); }
        
        /* Hero Section */
        .hero {
            max-width: 1000px;
            margin: 0 auto 100px;
            text-align: center;
            position: relative;
        }
        .hero-glow-orb {
            position: absolute; top: -50px; left: 50%; transform: translateX(-50%); width: 250px; height: 250px; border-radius: 50%; background: var(--primary-glow); filter: blur(80px); pointer-events: none; z-index: 0;
        }
        .hero-tag {
            display: inline-block; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139,92,246,0.3); color: var(--primary-hover); font-size: 12px; font-weight: 600; padding: 6px 16px; border-radius: 100px; margin-bottom: 24px; position: relative; z-index: 1;
        }
        .hero h1 {
            font-family: var(--font-headings);
            font-size: clamp(38px, 6vw, 64px);
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 24px;
            letter-spacing: -1.5px;
            position: relative; z-index: 1;
        }
        .hero h1 span {
            background: linear-gradient(135deg, var(--primary-hover) 0%, var(--neon-cyan) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .hero p {
            font-size: 18px; color: var(--text-muted); max-width: 600px; margin: 0 auto 40px; position: relative; z-index: 1;
        }

        /* sliding marquee */
        .marquee-bar { background: var(--card-bg); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding: 14px 0; overflow: hidden; white-space: nowrap; margin-bottom: 80px; }
        .marquee-track { display: inline-flex; animation: marquee 25s linear infinite; }
        .marquee-item { font-family: var(--font-headings); font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--text-muted); padding: 0 40px; }
        .marquee-dot { color: var(--primary); padding-right: 15px; }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        
        /* Layout Grid */
        .section-container { max-width: 1200px; margin: 0 auto 100px; }
        .grid-layout {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 24px;
        }
        
        /* Bento Cards style */
        .mason-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 40px;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
        }
        .mason-card:hover {
            transform: translateY(-4px);
            border-color: rgba(139, 92, 246, 0.3);
            box-shadow: 0 10px 30px rgba(139, 92, 246, 0.05);
        }
        
        /* Card headers */
        .card-label {
            font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: var(--primary-hover); font-weight: 600; margin-bottom: 12px; display: block;
        }
        .card-title {
            font-family: var(--font-headings); font-size: 28px; font-weight: 800; margin-bottom: 24px;
        }
        
        /* About panel sizes */
        .card-about-text { grid-column: span 7; }
        .card-about-stats { grid-column: span 5; display: flex; flex-direction: column; justify-content: space-between; gap: 20px; }
        .stat-bar { background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
        .stat-val { font-size: 32px; font-weight: 800; color: var(--neon-cyan); font-family: var(--font-headings); }
        .stat-txt { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; }

        /* Services Grid */
        .services-box { grid-column: span 12; }
        .services-masonry { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .service-inner-card {
            background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border-color); border-radius: 16px; padding: 30px; position: relative;
        }
        .service-inner-card:hover { border-color: var(--primary); }
        .service-icon { font-size: 28px; margin-bottom: 16px; color: var(--primary-hover); }
        .service-inner-card h4 { font-family: var(--font-headings); font-size: 18px; margin-bottom: 10px; }
        .service-inner-card p { font-size: 14px; color: var(--text-muted); }

        /* FAQ Box */
        .faq-box { grid-column: span 6; }
        .faq-wrap { display: flex; flex-direction: column; gap: 16px; }
        .faq-item { border-bottom: 1px solid var(--border-color); padding-bottom: 16px; }
        .faq-item summary { font-size: 16px; font-weight: 600; cursor: pointer; list-style: none; display: flex; justify-content: space-between; padding: 12px 0; }
        .faq-item summary::after { content: '↓'; color: var(--primary-hover); transition: transform 0.3s; }
        .faq-item[open] summary::after { transform: rotate(180deg); }
        .faq-item p { color: var(--text-muted); font-size: 14px; padding-top: 10px; }

        /* Blog panel */
        .blog-box { grid-column: span 6; }
        .blog-feed { display: flex; flex-direction: column; gap: 20px; }
        .blog-tile { display: grid; grid-template-columns: 80px 1fr; gap: 20px; align-items: center; border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.3s; }
        .blog-tile:hover { border-color: var(--neon-cyan); background: rgba(255,255,255,0.01); }
        .blog-tile-img { height: 60px; border-radius: 8px; background: rgba(139, 92, 246, 0.15); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: var(--primary-hover); }
        .blog-tile-info h5 { font-size: 15px; font-family: var(--font-headings); margin-bottom: 4px; }
        .blog-tile-info p { font-size: 12px; color: var(--text-muted); }

        /* Contact card */
        .contact-box { grid-column: span 12; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .contact-form { display: flex; flex-direction: column; gap: 16px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 11px; text-transform: uppercase; color: var(--text-muted); }
        .form-group input, .form-group textarea { background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; color: white; font-family: inherit; font-size: 14px; outline: none; }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--primary); }

        /* Footer */
        .footer {
            border-top: 1px solid var(--border-color); max-width: 1200px; margin: 60px auto 0; padding-top: 40px; display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted);
        }
        
        @media (max-width: 992px) {
            .navbar { margin-bottom: 40px; }
            .grid-layout { grid-template-columns: 1fr; }
            .card-about-text, .card-about-stats, .services-box, .faq-box, .blog-box, .contact-box { grid-column: span 1; }
            .services-masonry { grid-template-columns: 1fr; }
            .contact-box { grid-template-columns: 1fr; }
        }
    </style>
    <script src="/website-ai/static/editor.js" defer></script>
</head>
<body data-theme="card-masonry">
    <nav class="navbar">
        <a href="#" class="nav-logo">Studio<span>Masonry</span></a>
        <ul class="nav-links">
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
        <a href="#contact" class="nav-cta">Let's Connect</a>
    </nav>

    <header class="hero">
        <div class="hero-glow-orb"></div>
        <span class="hero-tag">✨ Digital Agency</span>
        <h1>We Build <span>Premium</span> Web Realities</h1>
        <p>{{ content.about }}</p>
        <a href="#contact" class="nav-cta" style="padding: 14px 28px;">Initiate Project</a>
    </header>

    <div class="marquee-bar">
        <div class="marquee-track">
            <span class="marquee-item"><span class="marquee-dot">◆</span>Design Engineering</span>
            <span class="marquee-item"><span class="marquee-dot">◆</span>Responsive Grids</span>
            <span class="marquee-item"><span class="marquee-dot">◆</span>Custom Animation</span>
            <span class="marquee-item"><span class="marquee-dot">◆</span>Premium Aesthetics</span>
            <span class="marquee-item"><span class="marquee-dot">◆</span>Design Engineering</span>
            <span class="marquee-item"><span class="marquee-dot">◆</span>Responsive Grids</span>
            <span class="marquee-item"><span class="marquee-dot">◆</span>Custom Animation</span>
            <span class="marquee-item"><span class="marquee-dot">◆</span>Premium Aesthetics</span>
        </div>
    </div>

    <main class="section-container grid-layout">
        <!-- ABOUT -->
        <div id="about" class="mason-card card-about-text">
            <span class="card-label">Identity</span>
            <h3 class="card-title">Who We Are</h3>
            <p style="font-size: 18px; line-height: 1.8; color: var(--text-muted); margin-bottom: 20px;">{{ content.about }}</p>
            <p style="font-size: 15px; color: var(--text-muted);">{{ theme_state.support_line }} We merge premium visual pairs with powerful structural grids to elevate products in the digital sphere.</p>
        </div>

        <div class="mason-card card-about-stats">
            <span class="card-label">Key Metrics</span>
            <div class="stat-bar">
                <span class="stat-txt">Client Care</span>
                <span class="stat-val">99%</span>
            </div>
            <div class="stat-bar">
                <span class="stat-txt">Projects Met</span>
                <span class="stat-val">150+</span>
            </div>
            <div class="stat-bar">
                <span class="stat-txt">Audience Reach</span>
                <span class="stat-val">24/7</span>
            </div>
        </div>

        <!-- SERVICES -->
        <div id="services" class="mason-card services-box">
            <span class="card-label">Services</span>
            <h3 class="card-title">Areas of Expertise</h3>
            <div class="services-masonry">
                {% for service in content.services %}
                <div class="service-inner-card">
                    <div class="service-icon">✦</div>
                    <h4>{{ service.name }}</h4>
                    <p>{{ service.description }}</p>
                </div>
                {% endfor %}
            </div>
        </div>

        <!-- FAQ -->
        <div id="faq" class="mason-card faq-box">
            <span class="card-label">FAQ</span>
            <h3 class="card-title">Inquiries</h3>
            <div class="faq-wrap">
                {% for item in content.faq %}
                <details class="faq-item">
                    <summary>{{ item.question }}</summary>
                    <p>{{ item.answer }}</p>
                </details>
                {% endfor %}
            </div>
        </div>

        <!-- BLOG -->
        <div id="blog" class="mason-card blog-box">
            <span class="card-label">Journal</span>
            <h3 class="card-title">Recent Updates</h3>
            <div id="blog-posts-container" class="blog-feed">
                <div class="blog-tile">
                    <div class="blog-tile-img">📰</div>
                    <div class="blog-tile-info">
                        <h5>Insights Loading</h5>
                        <p>Fetching recently posted insights...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- CONTACT -->
        <div id="contact" class="mason-card contact-box">
            <div>
                <span class="card-label">Connection</span>
                <h3 class="card-title">Start a Project</h3>
                <p style="color: var(--text-muted); font-size: 15px; margin-bottom: 24px;">{{ content.contact }}</p>
                <div style="font-size: 14px; color: var(--text-muted); display: flex; flex-direction: column; gap: 8px;">
                    <p>📍 address: Downtown Avenue 104, City</p>
                    <p>📞 phone: {{ data.contact_phone or '+1 (555) 918-0928' }}</p>
                    <p>✉️ email: {{ data.contact_email or 'hello@saadhyam.ai' }}</p>
                </div>
            </div>
            <form class="contact-form" onsubmit="event.preventDefault(); alert('Enquiry sent!');">
                <div class="form-row">
                    <div class="form-group"><label>First Name</label><input type="text" placeholder="John" required /></div>
                    <div class="form-group"><label>Last Name</label><input type="text" placeholder="Doe" required /></div>
                </div>
                <div class="form-group"><label>Email Address</label><input type="email" placeholder="john@example.com" required /></div>
                <div class="form-group"><label>Project Details</label><textarea rows="3" placeholder="Tell us more about your ideas..." required></textarea></div>
                <button type="submit" class="nav-cta" style="border: none; cursor: pointer; align-self: flex-start; margin-top: 8px;">Submit Request</button>
            </form>
        </div>
    </main>

    <footer class="footer">
        <span>&copy; 2026 {{ data.business_name }}</span>
        <span>Studio Masonry. All rights reserved.</span>
    </footer>

    <script>
        async function loadBlogPosts() {
            const container = document.getElementById('blog-posts-container');
            try {
                const response = await fetch('blogs.json');
                if (!response.ok) throw new Error('No blogs found');
                const data = await response.json();
                const blogs = data.blogs || [];
                if (blogs.length === 0) {
                    container.innerHTML = '<p style="color: var(--text-muted);">No blog posts yet.</p>';
                    return;
                }
                container.innerHTML = blogs.slice(0, 3).map(blog => `
                    <div class="blog-tile" onclick="window.location.href='blog-\${blog.slug}.html'">
                        <div class="blog-tile-img">\${blog.title.charAt(0)}</div>
                        <div class="blog-tile-info">
                            <h5>\${blog.title}</h5>
                            <p>\${blog.meta_description || 'Click to view full insight article'}</p>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                container.innerHTML = '<p style="color: var(--text-muted);">No blog posts yet.</p>';
            }
        }
        document.addEventListener('DOMContentLoaded', loadBlogPosts);
    </script>
</body>
</html>"""

# ==========================================
# 3. TIMELINE VERTICAL (Storytelling layout, luxury heritage theme)
# ==========================================
TEMPLATES_CONTENT["timeline-vertical"] = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ data.business_name }} | Timeline Heritage</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/website-ai/static/theme-adapter.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        :root {
            --bg-color: #faf8f5;
            --dark-color: #1a1a17;
            --text-color: #2b2a26;
            --text-muted: #7d7a72;
            --border-color: #e3dec9;
            --primary: #c5a880;
            --primary-hover: #e0cca9;
            --primary-dim: #998363;
            --white: #ffffff;
            --serif: 'Cormorant Garamond', Georgia, serif;
            --sans: 'Jost', sans-serif;
        }
        body {
            font-family: var(--sans);
            background: var(--bg-color);
            color: var(--text-color);
            line-height: 1.8;
            font-weight: 300;
        }
        h1, h2, h3, h4, .serif-text { font-family: var(--serif); font-weight: 300; color: var(--dark-color); }
        
        /* Nav */
        .navbar {
            border-bottom: 1px solid var(--border-color);
            background: rgba(250, 248, 245, 0.9);
            backdrop-filter: blur(8px);
            position: fixed; top: 0; left: 0; right: 0; z-index: 100;
        }
        .nav-container {
            max-width: 1200px; margin: 0 auto; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;
        }
        .nav-logo { font-size: 24px; font-weight: 300; text-decoration: none; color: var(--dark-color); font-family: var(--serif); letter-spacing: 1.5px; }
        .nav-logo span { font-style: italic; color: var(--primary); }
        .nav-links { list-style: none; display: flex; gap: 28px; }
        .nav-links a { color: var(--text-muted); text-decoration: none; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px; transition: color 0.3s; }
        .nav-links a:hover { color: var(--primary); }
        .nav-cta {
            background: var(--dark-color); color: var(--bg-color); padding: 10px 22px; border-radius: 0; text-decoration: none; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; transition: all 0.3s;
        }
        .nav-cta:hover { background: var(--primary); color: var(--dark-color); }
        
        /* Hero */
        .hero {
            padding: 180px 24px 100px;
            text-align: center;
            max-width: 800px; margin: 0 auto;
        }
        .hero-eyebrow {
            font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 3px; color: var(--primary); margin-bottom: 20px; display: block;
        }
        .hero h1 { font-size: clamp(38px, 6vw, 68px); line-height: 1.1; margin-bottom: 24px; }
        .hero h1 em { font-style: italic; color: var(--primary-dim); }
        .hero p { font-size: 18px; color: var(--text-muted); margin-bottom: 40px; font-family: var(--serif); font-style: italic; }

        /* Booking Bar */
        .booking-bar {
            max-width: 1000px; margin: 0 auto 100px; background: var(--white); border: 1px solid var(--border-color); padding: 24px; display: grid; grid-template-columns: repeat(3, 1fr) auto; gap: 16px; align-items: center;
        }
        .booking-field { display: flex; flex-direction: column; gap: 4px; }
        .booking-field label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); font-weight: 500; }
        .booking-field input, .booking-field select { border: none; border-bottom: 1px solid var(--border-color); padding: 8px 0; font-family: inherit; font-size: 14px; background: transparent; outline: none; }
        
        /* Timeline Structure */
        .timeline-section { max-width: 900px; margin: 0 auto 120px; padding: 0 24px; position: relative; }
        .timeline-line { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: var(--border-color); transform: translateX(-50%); }
        
        .section-header { text-align: center; margin-bottom: 60px; position: relative; z-index: 1; }
        .section-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: var(--primary-dim); font-weight: 600; display: block; margin-bottom: 10px; }
        .section-title { font-size: 36px; font-weight: 300; }

        .timeline-item { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-bottom: 60px; position: relative; }
        .timeline-node { width: 10px; height: 10px; border-radius: 50%; background: var(--primary); border: 2px solid var(--bg-color); position: absolute; left: 50%; top: 12px; transform: translateX(-50%); z-index: 2; }
        .timeline-content { background: var(--white); border: 1px solid var(--border-color); padding: 30px; border-radius: 0; }
        
        .timeline-item:nth-child(even) .timeline-content { grid-column-start: 2; }
        .timeline-item:nth-child(odd) .timeline-content { grid-column-start: 1; text-align: right; }
        
        .timeline-item-title { font-size: 22px; font-weight: 400; margin-bottom: 10px; }
        .timeline-item-desc { font-size: 14px; color: var(--text-muted); }
        
        /* Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; background: var(--border-color); margin-top: 30px; }
        .stat-card { background: var(--white); padding: 20px; text-align: center; }
        .stat-num { font-family: var(--serif); font-size: 32px; color: var(--primary-dim); }
        .stat-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); }

        /* FAQ accordion */
        .faq-wrap { display: flex; flex-direction: column; gap: 12px; }
        .faq-item { border-bottom: 1px solid var(--border-color); }
        .faq-item summary { font-family: var(--serif); font-size: 18px; padding: 16px 0; cursor: pointer; display: flex; justify-content: space-between; }
        .faq-item summary::after { content: '↓'; font-size: 14px; color: var(--primary); }
        .faq-item p { padding: 0 0 20px; font-size: 14px; color: var(--text-muted); }

        /* Blog grid */
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .blog-card { background: var(--white); border: 1px solid var(--border-color); padding: 24px; cursor: pointer; transition: all 0.3s; }
        .blog-card:hover { border-color: var(--primary); }
        .blog-card h4 { font-size: 20px; margin-bottom: 10px; }
        .blog-card p { font-size: 13px; color: var(--text-muted); }

        /* Contact Details */
        .contact-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 50px; }
        .contact-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 4px; }
        .form-group label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); }
        .form-group input, .form-group textarea { border: none; border-bottom: 1px solid var(--border-color); padding: 10px 0; background: transparent; font-family: inherit; font-size: 14px; color: var(--text-color); outline: none; }
        .form-group input:focus, .form-group textarea:focus { border-bottom-color: var(--dark-color); }

        .footer {
            border-top: 1px solid var(--border-color); max-width: 900px; margin: 80px auto 0; padding: 40px 24px 0; display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;
        }

        @media (max-width: 992px) {
            .timeline-line, .timeline-node { display: none; }
            .timeline-item { grid-template-columns: 1fr; gap: 20px; margin-bottom: 24px; }
            .timeline-item:nth-child(n) .timeline-content { grid-column-start: 1; text-align: left; }
            .booking-bar { grid-template-columns: 1fr; gap: 20px; }
            .blog-grid { grid-template-columns: 1fr; }
            .contact-layout { grid-template-columns: 1fr; }
        }
    </style>
    <script src="/website-ai/static/editor.js" defer></script>
</head>
<body data-theme="timeline-vertical">
    <nav class="navbar">
        <div class="nav-container">
            <a href="#" class="nav-logo">Heritage<span>Studio</span></a>
            <ul class="nav-links">
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
            <a href="#contact" class="nav-cta">Reserve Consult</a>
        </div>
    </nav>

    <header class="hero">
        <span class="hero-eyebrow">✦ Curated Storytelling</span>
        <h1>A Legacy of <em>Unparalleled</em> Quality</h1>
        <p>{{ content.about }}</p>
        <a href="#contact" class="nav-cta" style="padding: 14px 28px;">Initiate Your Journey</a>
    </header>

    <div class="booking-bar">
        <div class="booking-field">
            <label>Preferred Date</label>
            <input type="date" />
        </div>
        <div class="booking-field">
            <label>Service Area</label>
            <select>
                <option>General Consulting</option>
                <option>Premium Strategy</option>
                <option>Bespoke Design</option>
            </select>
        </div>
        <div class="booking-field">
            <label>Budget Tier</label>
            <select>
                <option>Under $5k</option>
                <option>$5k - $20k</option>
                <option>$20k+</option>
            </select>
        </div>
        <button class="nav-cta" style="border: none; cursor: pointer; padding: 12px 24px;">Check Schedule</button>
    </div>

    <main>
        <!-- ABOUT -->
        <section id="about" class="timeline-section">
            <div class="timeline-line"></div>
            <div class="section-header">
                <span class="section-tag">Identity</span>
                <h2 class="section-title">Our Chronicle</h2>
            </div>
            
            <div class="timeline-item">
                <div class="timeline-node"></div>
                <div class="timeline-content">
                    <h3 class="timeline-item-title">Foundation & Core</h3>
                    <p class="timeline-item-desc">{{ content.about }}</p>
                </div>
            </div>
            
            <div class="timeline-item">
                <div class="timeline-node"></div>
                <div class="timeline-content">
                    <h3 class="timeline-item-title">Philosophy</h3>
                    <p class="timeline-item-desc">{{ theme_state.support_line }} We believe in custom visual pairs, heritage typography, and grids that flow naturally to convey trust.</p>
                    <div class="stats-grid">
                        <div class="stat-card"><div class="stat-num">150+</div><div class="stat-lbl">Projects</div></div>
                        <div class="stat-card"><div class="stat-num">99%</div><div class="stat-lbl">Satisfaction</div></div>
                        <div class="stat-card"><div class="stat-num">100%</div><div class="stat-lbl">Bespoke</div></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SERVICES -->
        <section id="services" class="timeline-section">
            <div class="timeline-line"></div>
            <div class="section-header">
                <span class="section-tag">Expertise</span>
                <h2 class="section-title">Departments</h2>
            </div>
            
            {% for service in content.services %}
            <div class="timeline-item">
                <div class="timeline-node"></div>
                <div class="timeline-content service-card">
                    <h3 class="timeline-item-title">{{ service.name }}</h3>
                    <p class="timeline-item-desc">{{ service.description }}</p>
                </div>
            </div>
            {% endfor %}
        </section>

        <!-- FAQ -->
        <section id="faq" class="timeline-section" style="max-width: 700px;">
            <div class="section-header">
                <span class="section-tag">FAQ</span>
                <h2 class="section-title">Inquiries</h2>
            </div>
            <div class="faq-wrap">
                {% for item in content.faq %}
                <details class="faq-item">
                    <summary>{{ item.question }}</summary>
                    <p>{{ item.answer }}</p>
                </details>
                {% endfor %}
            </div>
        </section>

        <!-- BLOG -->
        <section id="blog" class="timeline-section" style="max-width: 900px;">
            <div class="section-header">
                <span class="section-tag">Journal</span>
                <h2 class="section-title">Recent Writing</h2>
            </div>
            <div id="blog-posts-container" class="blog-grid">
                <div style="grid-column: span 3; text-align: center; color: var(--text-muted);">Loading articles...</div>
            </div>
        </section>

        <!-- CONTACT -->
        <section id="contact" class="timeline-section" style="max-width: 900px;">
            <div class="section-header">
                <span class="section-tag">Contact</span>
                <h2 class="section-title">Connect With Us</h2>
            </div>
            <div class="contact-layout">
                <div>
                    <p class="serif-text" style="font-size: 20px; font-style: italic; margin-bottom: 24px;">{{ content.contact }}</p>
                    <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: flex; flex-direction: column; gap: 12px; color: var(--text-muted);">
                        <p>📍 downtown suite 408, city</p>
                        <p>📞 concierge line: {{ data.contact_phone or '+1 (555) 918-0928' }}</p>
                        <p>✉️ email desk: {{ data.contact_email or 'hello@saadhyam.ai' }}</p>
                    </div>
                </div>
                <form class="contact-form" onsubmit="event.preventDefault(); alert('Request logged!');">
                    <div class="form-group"><label>Full Name</label><input type="text" placeholder="John Doe" required /></div>
                    <div class="form-group"><label>Email Address</label><input type="email" placeholder="john@example.com" required /></div>
                    <div class="form-group"><label>Concierge Message</label><textarea rows="3" placeholder="How can we assist your business?" required></textarea></div>
                    <button type="submit" class="nav-cta" style="border: none; cursor: pointer; align-self: flex-start;">Send Request</button>
                </form>
            </div>
        </section>
    </main>

    <footer class="footer">
        <span>&copy; 2026 {{ data.business_name }}</span>
        <span>Timeline Heritage.</span>
    </footer>

    <script>
        async function loadBlogPosts() {
            const container = document.getElementById('blog-posts-container');
            try {
                const response = await fetch('blogs.json');
                if (!response.ok) throw new Error('No blogs');
                const data = await response.json();
                const blogs = data.blogs || [];
                if (blogs.length === 0) {
                    container.innerHTML = '<p style="grid-column: span 3; text-align: center;">No blog posts yet.</p>';
                    return;
                }
                container.innerHTML = blogs.slice(0, 3).map(blog => `
                    <div class="blog-card" onclick="window.location.href='blog-\${blog.slug}.html'">
                        <h4 class="serif-text">\${blog.title}</h4>
                        <p>\${blog.meta_description || blog.introduction.substring(0, 60) + '...'}</p>
                    </div>
                `).join('');
            } catch (error) {
                container.innerHTML = '<p style="grid-column: span 3; text-align: center;">No blog posts yet.</p>';
            }
        }
        document.addEventListener('DOMContentLoaded', loadBlogPosts);
    </script>
</body>
</html>"""

# ==========================================
# 4. MAGAZINE GRID (Editorial high-contrast newsprint layout)
# ==========================================
TEMPLATES_CONTENT["magazine-grid"] = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ data.business_name }} | Magazine Editorial</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/website-ai/static/theme-adapter.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        :root {
            --bg-color: #fcfcfc;
            --ink-black: #111111;
            --paper-gray: #f0f0f0;
            --accent-red: #e11d48;
            --border-thick: 3px solid #111111;
            --border-thin: 1px solid #111111;
            --font-headings: 'Playfair Display', Georgia, serif;
            --font-body: 'DM Sans', sans-serif;
        }
        body {
            font-family: var(--font-body);
            background: var(--bg-color);
            color: var(--ink-black);
            padding: 40px;
            line-height: 1.6;
        }
        
        /* Header Block */
        .editorial-header {
            border-bottom: var(--border-thick);
            max-width: 1200px; margin: 0 auto 60px;
            padding-bottom: 20px;
            text-align: center;
        }
        .editorial-logo {
            font-family: var(--font-headings); font-size: clamp(40px, 8vw, 84px); font-weight: 900; text-transform: uppercase; letter-spacing: -2px; margin-bottom: 10px; text-decoration: none; color: var(--ink-black); display: block;
        }
        .nav-links { list-style: none; display: flex; justify-content: center; gap: 32px; border-top: var(--border-thin); border-bottom: var(--border-thin); padding: 12px 0; }
        .nav-links a { color: var(--ink-black); text-decoration: none; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }
        .nav-links a:hover { color: var(--accent-red); }

        /* Hero layout (Newspaper block style) */
        .magazine-hero {
            max-width: 1200px; margin: 0 auto 80px; display: grid; grid-template-columns: 2fr 1fr; gap: 40px; border-bottom: var(--border-thick); padding-bottom: 60px;
        }
        .hero-left { border-right: var(--border-thin); padding-right: 40px; }
        .hero-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; font-weight: 700; color: var(--accent-red); margin-bottom: 16px; display: block; }
        .hero-headline { font-family: var(--font-headings); font-size: clamp(32px, 5vw, 56px); font-weight: 900; line-height: 1.05; margin-bottom: 24px; letter-spacing: -1px; }
        .hero-lead { font-size: 18px; line-height: 1.8; color: #444; margin-bottom: 30px; }
        .hero-right { display: flex; flex-direction: column; justify-content: space-between; padding-left: 20px; }
        .editorial-widget { background: var(--paper-gray); border: var(--border-thin); padding: 30px; }
        
        .btn-editorial { display: inline-block; padding: 14px 28px; background: var(--ink-black); color: white; text-decoration: none; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; transition: all 0.2s; }
        .btn-editorial:hover { background: var(--accent-red); }

        /* Marquee ticker */
        .ticker-wrap { border-bottom: var(--border-thick); padding: 12px 0; margin-bottom: 80px; overflow: hidden; white-space: nowrap; max-width: 1200px; margin-left: auto; margin-right: auto; }
        .ticker { display: inline-flex; animation: marquee 20s linear infinite; }
        .ticker-item { font-family: var(--font-headings); font-size: 14px; font-weight: 700; text-transform: uppercase; padding: 0 40px; }
        
        /* General sections */
        .section-block { max-width: 1200px; margin: 0 auto 100px; display: grid; grid-template-columns: 300px 1fr; gap: 60px; border-bottom: var(--border-thin); padding-bottom: 80px; }
        .sec-head { font-family: var(--font-headings); font-size: 36px; font-weight: 900; text-transform: uppercase; }
        .sec-tagline { font-size: 14px; color: #555; margin-top: 10px; }

        /* About grid */
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .about-text { font-size: 16px; line-height: 1.8; }
        .stats-column { display: flex; flex-direction: column; gap: 20px; }
        .stat-card { border: var(--border-thin); padding: 24px; }
        .stat-num { font-family: var(--font-headings); font-size: 44px; font-weight: 900; line-height: 1; }
        
        /* Services blocks */
        .services-layout { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
        .service-column { border-right: var(--border-thin); padding-right: 40px; }
        .service-column:last-child { border-right: none; padding-right: 0; }
        .service-column h4 { font-family: var(--font-headings); font-size: 22px; font-weight: 900; margin-bottom: 12px; }
        .service-column p { font-size: 14px; color: #444; }

        /* FAQ columns */
        .faq-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .faq-item { border-bottom: var(--border-thin); padding: 16px 0; }
        .faq-item summary { font-size: 16px; font-weight: 700; cursor: pointer; list-style: none; display: flex; justify-content: space-between; }
        .faq-item summary::after { content: '+'; font-weight: 900; }
        .faq-item[open] summary::after { content: '-'; }
        .faq-item p { font-size: 14px; color: #444; margin-top: 8px; }

        /* Blog news feed */
        .blog-row-layout { display: flex; flex-direction: column; gap: 30px; }
        .blog-row { display: grid; grid-template-columns: 100px 1fr; gap: 40px; border-bottom: var(--border-thin); padding-bottom: 24px; cursor: pointer; }
        .blog-row:hover h4 { color: var(--accent-red); }
        .blog-row-date { font-family: var(--font-headings); font-size: 24px; font-weight: 900; text-align: right; }
        .blog-row h4 { font-family: var(--font-headings); font-size: 22px; font-weight: 900; margin-bottom: 8px; }
        .blog-row p { font-size: 14px; color: #444; }

        /* Contact Details */
        .contact-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .contact-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .form-group input, .form-group textarea { border: var(--border-thin); padding: 12px; font-family: inherit; font-size: 14px; background: transparent; }
        
        .footer {
            max-width: 1200px; margin: 40px auto 0; padding-top: 40px; border-top: var(--border-thick); display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; text-transform: uppercase;
        }

        @media (max-width: 992px) {
            body { padding: 20px; }
            .magazine-hero { grid-template-columns: 1fr; gap: 30px; }
            .hero-left { border-right: none; padding-right: 0; }
            .hero-right { padding-left: 0; }
            .section-block { grid-template-columns: 1fr; gap: 30px; }
            .about-grid { grid-template-columns: 1fr; }
            .services-layout { grid-template-columns: 1fr; gap: 30px; }
            .service-column { border-right: none; padding-right: 0; }
            .faq-layout { grid-template-columns: 1fr; }
            .contact-layout { grid-template-columns: 1fr; }
        }
    </style>
    <script src="/website-ai/static/editor.js" defer></script>
</head>
<body data-theme="magazine-grid">
    <header class="editorial-header">
        <a href="#" class="editorial-logo nav-logo">{{ data.business_name }}</a>
        <ul class="nav-links">
            <li><a href="#about">Manifesto</a></li>
            <li><a href="#services">Departments</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#blog">Chronicle</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </header>

    <div class="ticker-wrap">
        <div class="ticker">
            <span class="ticker-item">✦ Editorial Standards</span>
            <span class="ticker-item">✦ Modern Layout Systems</span>
            <span class="ticker-item">✦ Distinct Design Columns</span>
            <span class="ticker-item">✦ High Contrast Grid</span>
            <span class="ticker-item">✦ Editorial Standards</span>
            <span class="ticker-item">✦ Modern Layout Systems</span>
        </div>
    </div>

    <section class="magazine-hero">
        <div class="hero-left">
            <span class="hero-tag">Weekly Dispatch</span>
            <h1 class="hero-headline">Redefining the <em>Art</em> of High-End Digital Presence</h1>
            <p class="hero-lead">{{ content.about }}</p>
            <a href="#contact" class="btn-editorial">Book Discovery Call</a>
        </div>
        <div class="hero-right">
            <div class="editorial-widget">
                <span class="hero-tag" style="margin-bottom: 10px;">Support Dispatch</span>
                <p style="font-size: 14px; font-style: italic; line-height: 1.6; margin-bottom: 20px;">"{{ theme_state.support_line }} We structure content layout grids that command attention and deliver clean readability."</p>
                <strong style="font-size: 12px; font-weight: 700; text-transform: uppercase;">— The Editorial Board</strong>
            </div>
        </div>
    </section>

    <main>
        <!-- ABOUT -->
        <section id="about" class="section-block">
            <div class="sec-head">
                <h3>Our Chronicle</h3>
                <p class="sec-tagline">Since 2026</p>
            </div>
            <div class="about-grid">
                <div class="about-text">
                    <p style="font-size: 18px; font-family: var(--font-headings); font-weight: 700; line-height: 1.6; margin-bottom: 20px;">Crafting layouts that reject the status quo of unified, master structures.</p>
                    <p>{{ content.about }}</p>
                </div>
                <div class="stats-column">
                    <div class="stat-card">
                        <div class="stat-num">99%</div>
                        <p style="font-size: 11px; text-transform: uppercase; font-weight: 700; margin-top: 4px;">Reader Satisfaction</p>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num">150+</div>
                        <p style="font-size: 11px; text-transform: uppercase; font-weight: 700; margin-top: 4px;">Editions Launched</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- SERVICES -->
        <section id="services" class="section-block">
            <div class="sec-head">
                <h3>Departments</h3>
                <p class="sec-tagline">Specialized services</p>
            </div>
            <div class="services-layout">
                {% for service in content.services %}
                <div class="service-column service-card">
                    <h4>{{ service.name }}</h4>
                    <p>{{ service.description }}</p>
                </div>
                {% endfor %}
            </div>
        </section>

        <!-- FAQ -->
        <section id="faq" class="section-block">
            <div class="sec-head">
                <h3>Inquiries</h3>
                <p class="sec-tagline">Common guest questions</p>
            </div>
            <div class="faq-layout">
                {% for item in content.faq %}
                <details class="faq-item">
                    <summary>{{ item.question }}</summary>
                    <p>{{ item.answer }}</p>
                </details>
                {% endfor %}
            </div>
        </section>

        <!-- BLOG -->
        <section id="blog" class="section-block">
            <div class="sec-head">
                <h3>Dispatches</h3>
                <p class="sec-tagline">Latest articles</p>
            </div>
            <div id="blog-posts-container" class="blog-row-layout">
                <div style="text-align: center; color: #555;">Loading columns...</div>
            </div>
        </section>

        <!-- CONTACT -->
        <section id="contact" class="section-block" style="border-bottom: none; padding-bottom: 0;">
            <div class="sec-head">
                <h3>Enquiry</h3>
                <p class="sec-tagline">Reach our desk</p>
            </div>
            <div class="contact-layout">
                <div>
                    <p style="font-size: 18px; margin-bottom: 24px;">{{ content.contact }}</p>
                    <p style="font-size: 13px; font-weight: 700; text-transform: uppercase;">saadhyam editorial desk</p>
                    <p style="font-size: 14px; margin-top: 8px;">{{ data.contact_email or 'hello@saadhyam.ai' }}<br/>{{ data.contact_phone or '+1 (555) 918-0928' }}</p>
                </div>
                <form class="contact-form" onsubmit="event.preventDefault(); alert('Enquiry Sent!');">
                    <div class="form-group">
                        <label>Your Name</label>
                        <input type="text" placeholder="Jane Doe" required />
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" placeholder="jane@example.com" required />
                    </div>
                    <div class="form-group">
                        <label>Your Project Brief</label>
                        <textarea rows="4" placeholder="Briefly describe your objectives..." required></textarea>
                    </div>
                    <button type="submit" class="btn-editorial" style="cursor: pointer; align-self: flex-start;">Submit briefing</button>
                </form>
            </div>
        </section>
    </main>

    <footer class="footer">
        <span>&copy; 2026 {{ data.business_name }}</span>
        <span>Magazine Grid. All rights reserved.</span>
    </footer>

    <script>
        async function loadBlogPosts() {
            const container = document.getElementById('blog-posts-container');
            try {
                const response = await fetch('blogs.json');
                if (!response.ok) throw new Error('No blogs');
                const data = await response.json();
                const blogs = data.blogs || [];
                if (blogs.length === 0) {
                    container.innerHTML = '<p>No insights published yet.</p>';
                    return;
                }
                container.innerHTML = blogs.slice(0, 3).map((blog, idx) => `
                    <div class="blog-row" onclick="window.location.href='blog-\${blog.slug}.html'">
                        <div class="blog-row-date">0\${idx+1}</div>
                        <div>
                            <h4>\${blog.title}</h4>
                            <p>\${blog.meta_description || 'Click to view full journal dispatch'}</p>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                container.innerHTML = '<p>No insights published yet.</p>';
            }
        }
        document.addEventListener('DOMContentLoaded', loadBlogPosts);
    </script>
</body>
</html>"""

# ==========================================
# 5. BENTO BOX (Apple-style glassmorphism grid layout)
# ==========================================
TEMPLATES_CONTENT["bento-box"] = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ data.business_name }} | Bento Style</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/website-ai/static/theme-adapter.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        :root {
            --bg-main: #09090b;
            --grid-bg: #18181b;
            --text-main: #fafafa;
            --text-muted: #a1a1aa;
            --primary: #3b82f6;
            --primary-glow: rgba(59, 130, 246, 0.15);
            --border-color: rgba(255,255,255,0.08);
            --card-glass: rgba(24, 24, 27, 0.65);
        }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: var(--bg-main);
            color: var(--text-main);
            padding: 40px 24px;
            line-height: 1.7;
        }
        
        /* Floating blurred Navbar */
        .navbar {
            background: rgba(9, 9, 11, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1100px;
            margin: 0 auto 60px;
            position: sticky;
            top: 20px;
            z-index: 1000;
        }
        .nav-logo { font-size: 20px; font-weight: 800; color: white; text-decoration: none; }
        .nav-links { list-style: none; display: flex; gap: 24px; }
        .nav-links a { color: var(--text-muted); text-decoration: none; font-size: 13px; font-weight: 500; transition: color 0.2s; }
        .nav-links a:hover { color: white; }
        .nav-cta { background: white; color: black; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 600; transition: opacity 0.2s; }
        .nav-cta:hover { opacity: 0.9; }

        /* Hero area */
        .hero { max-width: 800px; margin: 0 auto 80px; text-align: center; }
        .hero-badge { display: inline-block; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: white; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 50px; margin-bottom: 20px; }
        .hero h1 { font-size: clamp(36px, 6vw, 58px); font-weight: 800; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 20px; }
        .hero p { font-size: 17px; color: var(--text-muted); margin-bottom: 30px; }

        /* Bento Grid */
        .bento-grid {
            max-width: 1100px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-auto-rows: minmax(180px, auto);
            gap: 20px;
        }
        .bento-card {
            background: var(--card-glass);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            padding: 32px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .bento-card:hover {
            transform: scale(1.01);
            border-color: rgba(255,255,255,0.15);
            box-shadow: 0 15px 40px rgba(59, 130, 246, 0.05);
        }
        .bento-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
        .bento-card p { font-size: 14px; color: var(--text-muted); }

        /* Card sizes */
        .card-large { grid-column: span 2; grid-row: span 2; }
        .card-wide { grid-column: span 2; }
        .card-tall { grid-row: span 2; }
        .card-full { grid-column: span 3; }

        /* stats inside bento */
        .bento-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px; }
        .bento-stat-box { background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 16px; border-radius: 16px; text-align: center; }
        .bento-stat-num { font-size: 28px; font-weight: 800; color: var(--primary); }
        .bento-stat-lbl { font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-top: 4px; }

        /* services list */
        .service-bento-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
        .service-mini-card { background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; }
        .service-mini-card h5 { font-size: 16px; margin-bottom: 6px; color: white; }

        /* faq accordion style */
        .faq-accordion { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
        .faq-box { border-bottom: 1px solid var(--border-color); padding-bottom: 12px; }
        .faq-box summary { font-size: 15px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; }
        .faq-box p { font-size: 13px; color: var(--text-muted); margin-top: 8px; }

        /* Blog bento list */
        .blog-list { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; }
        .blog-tile { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; cursor: pointer; }
        .blog-tile h5 { font-size: 15px; color: white; }
        .blog-tile span { font-size: 12px; color: var(--text-muted); }

        /* contact fields */
        .contact-layout { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 30px; margin-top: 20px; }
        .contact-form { display: flex; flex-direction: column; gap: 12px; }
        .contact-form input, .contact-form textarea { background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; color: white; font-family: inherit; font-size: 14px; outline: none; }
        .contact-form input:focus, .contact-form textarea:focus { border-color: var(--primary); }

        .footer {
            border-top: 1px solid var(--border-color); max-width: 1100px; margin: 60px auto 0; padding-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted);
        }

        @media (max-width: 992px) {
            .bento-grid { grid-template-columns: 1fr; }
            .card-large, .card-wide, .card-tall, .card-full { grid-column: span 1; grid-row: span 1; }
            .service-bento-grid { grid-template-columns: 1fr; }
            .contact-layout { grid-template-columns: 1fr; }
        }
    </style>
    <script src="/website-ai/static/editor.js" defer></script>
</head>
<body data-theme="bento-box">
    <nav class="navbar">
        <a href="#" class="nav-logo">Bento<span>Grid</span></a>
        <ul class="nav-links">
            <li><a href="#about">Philosophy</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
        <a href="#contact" class="nav-cta">Enquire</a>
    </nav>

    <header class="hero">
        <span class="hero-badge">Apple-inspired bento grid</span>
        <h1>Polished layouts, built symmetrically.</h1>
        <p>{{ content.about }}</p>
        <a href="#contact" class="nav-cta" style="padding: 12px 24px;">Get Started</a>
    </header>

    <main class="bento-grid">
        <!-- ABOUT -->
        <div id="about" class="bento-card card-large">
            <div>
                <h3>Our Vision</h3>
                <p style="font-size: 16px; margin-bottom: 20px;">{{ content.about }}</p>
                <p>{{ theme_state.support_line }} We break from generic single templates to construct distinct user journeys inside Apple-style glassmorphic grids.</p>
            </div>
            <div class="bento-stats">
                <div class="bento-stat-box">
                    <div class="bento-stat-num">99%</div>
                    <div class="bento-stat-lbl">Satisfaction</div>
                </div>
                <div class="bento-stat-box">
                    <div class="bento-stat-num">150+</div>
                    <div class="bento-stat-lbl">Projects</div>
                </div>
                <div class="bento-stat-box">
                    <div class="bento-stat-num">24/7</div>
                    <div class="bento-stat-lbl">Access</div>
                </div>
            </div>
        </div>

        <!-- SERVICES -->
        <div id="services" class="bento-card card-tall">
            <div>
                <h3>Offerings</h3>
                <p>Tailored custom structures and components.</p>
            </div>
            <div class="faq-accordion" style="margin-top: 16px;">
                {% for service in content.services %}
                <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 8px;">
                    <strong style="font-size: 14px; color: white;">{{ service.name }}</strong>
                    <p style="font-size: 12px; color: var(--text-muted);">{{ service.description }}</p>
                </div>
                {% endfor %}
            </div>
        </div>

        <!-- FAQ -->
        <div id="faq" class="bento-card card-wide">
            <div>
                <h3>Common Inquiries</h3>
            </div>
            <div class="faq-accordion">
                {% for item in content.faq %}
                <details class="faq-box">
                    <summary>{{ item.question }}</summary>
                    <p>{{ item.answer }}</p>
                </details>
                {% endfor %}
            </div>
        </div>

        <!-- BLOG -->
        <div id="blog" class="bento-card card-tall">
            <div>
                <h3>Dispatches</h3>
                <p>Read the latest insights.</p>
            </div>
            <div id="blog-posts-container" class="blog-list">
                <p style="font-size: 13px; color: var(--text-muted);">Loading dispatches...</p>
            </div>
        </div>

        <!-- CONTACT -->
        <div id="contact" class="bento-card card-large">
            <div>
                <h3>Connect With Us</h3>
                <p>{{ content.contact }}</p>
            </div>
            <div class="contact-layout">
                <form class="contact-form" onsubmit="event.preventDefault(); alert('Request sent!');">
                    <input type="text" placeholder="Your Name" required />
                    <input type="email" placeholder="Email Address" required />
                    <textarea rows="2" placeholder="Project Description..." required></textarea>
                    <button type="submit" class="nav-cta" style="border: none; cursor: pointer; align-self: flex-start;">Send request</button>
                </form>
                <div style="font-size: 13px; color: var(--text-muted); display: flex; flex-direction: column; gap: 8px; justify-content: center;">
                    <p>📍 downtown suite 10, city</p>
                    <p>📞 {{ data.contact_phone or '+1 (555) 918-0928' }}</p>
                    <p>✉️ {{ data.contact_email or 'hello@saadhyam.ai' }}</p>
                </div>
            </div>
        </div>
    </main>

    <footer class="footer">
        <span>&copy; 2026 {{ data.business_name }}</span>
        <span>Bento Box. All rights reserved.</span>
    </footer>

    <script>
        async function loadBlogPosts() {
            const container = document.getElementById('blog-posts-container');
            try {
                const response = await fetch('blogs.json');
                if (!response.ok) throw new Error('No blogs');
                const data = await response.json();
                const blogs = data.blogs || [];
                if (blogs.length === 0) {
                    container.innerHTML = '<p style="font-size: 13px; color: var(--text-muted);">No blog posts yet.</p>';
                    return;
                }
                container.innerHTML = blogs.slice(0, 3).map(blog => `
                    <div class="blog-tile" onclick="window.location.href='blog-\${blog.slug}.html'">
                        <h5>\${blog.title}</h5>
                        <span>→</span>
                    </div>
                `).join('');
            } catch (error) {
                container.innerHTML = '<p style="font-size: 13px; color: var(--text-muted);">No blog posts yet.</p>';
            }
        }
        document.addEventListener('DOMContentLoaded', loadBlogPosts);
    </script>
</body>
</html>"""

# ==========================================
# 6. PARALLAX SCROLL (Space Grotesk, futuristic dark neon theme)
# ==========================================
TEMPLATES_CONTENT["parallax-scroll"] = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ data.business_name }} | Parallax Space</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Outfit:wght@800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/website-ai/static/theme-adapter.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        :root {
            --bg-color: #0b0c10;
            --text-color: #c5c6c7;
            --text-title: #ffffff;
            --primary: #66fcf1;
            --primary-dim: #45f3e5;
            --primary-glow: rgba(102, 252, 241, 0.2);
            --border-color: rgba(102, 252, 241, 0.15);
            --card-bg: #1f2833;
        }
        body {
            font-family: 'Space Grotesk', sans-serif;
            background: var(--bg-color);
            color: var(--text-color);
            line-height: 1.8;
            overflow-x: hidden;
        }
        h1, h2, h3 { font-family: 'Outfit', sans-serif; color: var(--text-title); letter-spacing: -0.5px; }

        /* Floating Nav */
        .navbar {
            background: rgba(11, 12, 16, 0.85);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border-color);
            position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
        }
        .nav-container {
            max-width: 1200px; margin: 0 auto; padding: 20px; display: flex; justify-content: space-between; align-items: center;
        }
        .nav-logo { font-size: 24px; font-weight: 800; text-decoration: none; color: var(--text-title); }
        .nav-logo span { color: var(--primary); }
        .nav-links { list-style: none; display: flex; gap: 28px; }
        .nav-links a { color: var(--text-color); text-decoration: none; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; transition: color 0.2s; }
        .nav-links a:hover { color: var(--primary); }
        .nav-cta {
            border: 1.5px solid var(--primary); color: var(--primary); padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s;
        }
        .nav-cta:hover { background: var(--primary-glow); transform: translateY(-1px); }

        /* Hero Parallax */
        .parallax-hero {
            height: 100vh; min-height: 700px; display: flex; align-items: center; justify-content: center; position: relative; text-align: center; overflow: hidden;
            background: radial-gradient(circle at 50% 50%, #1f2833 0%, #0b0c10 80%);
        }
        .hero-glow { position: absolute; width: 300px; height: 300px; background: var(--primary-glow); filter: blur(100px); top: 30%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }
        .hero-content { position: relative; max-width: 800px; padding: 0 24px; z-index: 2; }
        .hero-badge { display: inline-block; border: 1px solid var(--primary); color: var(--primary); font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 50px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px; }
        .parallax-hero h1 { font-size: clamp(38px, 6vw, 68px); line-height: 1.1; margin-bottom: 24px; }
        .parallax-hero h1 em { font-style: italic; color: var(--primary-dim); }
        .parallax-hero p { font-size: 18px; color: var(--text-color); margin-bottom: 40px; }

        /* Scroll progress line */
        .scroll-down { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: var(--primary); }
        .scroll-line { width: 1px; height: 60px; background: linear-gradient(to bottom, var(--primary), transparent); }

        /* Section Layouts */
        .section { padding: 120px 24px; border-bottom: 1px solid var(--border-color); }
        .section-container { max-width: 1100px; margin: 0 auto; }
        .section-header { text-align: center; margin-bottom: 60px; }
        .section-label { font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: var(--primary); font-weight: 600; display: block; margin-bottom: 10px; }
        .section-title { font-size: 38px; font-weight: 800; }

        /* About Grid */
        .about-layout { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 50px; align-items: center; }
        .about-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 40px; border-radius: 8px; }
        .about-stats { display: flex; flex-direction: column; gap: 20px; }
        .stat-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 20px; text-align: center; border-radius: 8px; }
        .stat-num { font-size: 36px; font-weight: 800; color: var(--primary); font-family: 'Space Grotesk', sans-serif; }
        
        /* Services grid */
        .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .service-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 30px; border-radius: 8px; transition: all 0.3s; }
        .service-card:hover { border-color: var(--primary); transform: translateY(-4px); box-shadow: 0 10px 25px var(--primary-glow); }
        .service-icon { font-size: 28px; margin-bottom: 16px; color: var(--primary); }
        .service-card h4 { font-size: 20px; margin-bottom: 10px; color: var(--text-title); }

        /* FAQ list */
        .faq-wrap { display: flex; flex-direction: column; gap: 16px; max-width: 800px; margin: 0 auto; }
        .faq-item { border-bottom: 1px solid var(--border-color); padding-bottom: 16px; }
        .faq-item summary { font-size: 16px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; }
        .faq-item summary::after { content: '+'; color: var(--primary); font-size: 20px; }
        .faq-item[open] summary::after { content: '-'; }
        .faq-item p { color: var(--text-color); font-size: 14px; margin-top: 10px; }

        /* Blog grid */
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .blog-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.3s; }
        .blog-card:hover { border-color: var(--primary); }
        .blog-img { height: 160px; background: rgba(102, 252, 241, 0.05); display: flex; align-items: center; justify-content: center; font-size: 44px; border-bottom: 1px solid var(--border-color); }
        .blog-info { padding: 20px; }
        .blog-info h4 { font-size: 18px; margin-bottom: 8px; color: var(--text-title); }
        .blog-info p { font-size: 13px; color: var(--text-color); }

        /* Contact cards */
        .contact-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 50px; }
        .contact-info { display: flex; flex-direction: column; gap: 20px; }
        .contact-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 20px; display: flex; align-items: center; gap: 16px; border-radius: 8px; }
        .contact-card-icon { font-size: 24px; color: var(--primary); }
        .contact-form { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 11px; text-transform: uppercase; color: var(--primary); }
        .form-group input, .form-group textarea { background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px; color: white; font-family: inherit; font-size: 14px; outline: none; }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--primary); }

        .footer {
            border-top: 1px solid var(--border-color); max-width: 1100px; margin: 60px auto 0; padding-top: 40px; display: flex; justify-content: space-between; font-size: 13px; color: var(--text-color);
        }

        @media (max-width: 992px) {
            .navbar { padding: 10px 0; }
            .about-layout { grid-template-columns: 1fr; }
            .services-grid { grid-template-columns: 1fr; }
            .blog-grid { grid-template-columns: 1fr; }
            .contact-layout { grid-template-columns: 1fr; }
        }
    </style>
    <script src="/website-ai/static/editor.js" defer></script>
</head>
<body data-theme="parallax-scroll">
    <nav class="navbar">
        <div class="nav-container">
            <a href="#" class="nav-logo">Space<span>Studio</span></a>
            <ul class="nav-links">
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
            <a href="#contact" class="nav-cta">Initiate consult</a>
        </div>
    </nav>

    <header class="parallax-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
            <span class="hero-badge">Curated Web Engineering</span>
            <h1>Interactive designs, built <em>futuristically</em></h1>
            <p>{{ content.about }}</p>
            <a href="#contact" class="nav-cta" style="padding: 14px 28px;">Start Project today</a>
        </div>
        <div class="scroll-down">
            <span>Scroll</span>
            <div class="scroll-line"></div>
        </div>
    </header>

    <main class="section-container">
        <!-- ABOUT -->
        <section id="about" class="section">
            <div class="section-header">
                <span class="section-label">Philosophy</span>
                <h2 class="section-title">Who We Are</h2>
            </div>
            <div class="about-layout">
                <div class="about-card">
                    <p style="font-size: 18px; color: var(--text-title); margin-bottom: 20px; line-height: 1.8;">{{ content.about }}</p>
                    <p>{{ theme_state.support_line }} We structure high-end web profiles pairing advanced fonts with glowing layout variables.</p>
                </div>
                <div class="about-stats">
                    <div class="stat-card">
                        <div class="stat-num">99%</div>
                        <div style="font-size: 12px; text-transform: uppercase;">Efficiency</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num">150+</div>
                        <div style="font-size: 12px; text-transform: uppercase;">Deployments</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SERVICES -->
        <section id="services" class="section">
            <div class="section-header">
                <span class="section-label">Expertise</span>
                <h2 class="section-title">Specialized Services</h2>
            </div>
            <div class="services-grid">
                {% for service in content.services %}
                <div class="service-card">
                    <div class="service-icon">⚡</div>
                    <h4>{{ service.name }}</h4>
                    <p>{{ service.description }}</p>
                </div>
                {% endfor %}
            </div>
        </section>

        <!-- FAQ -->
        <section id="faq" class="section">
            <div class="section-header">
                <span class="section-label">FAQ</span>
                <h2 class="section-title">Common Questions</h2>
            </div>
            <div class="faq-wrap">
                {% for item in content.faq %}
                <details class="faq-item">
                    <summary>{{ item.question }}</summary>
                    <p>{{ item.answer }}</p>
                </details>
                {% endfor %}
            </div>
        </section>

        <!-- BLOG -->
        <section id="blog" class="section">
            <div class="section-header">
                <span class="section-label">Chronicle</span>
                <h2 class="section-title">Insights Dispatches</h2>
            </div>
            <div id="blog-posts-container" class="blog-grid">
                <div style="grid-column: span 3; text-align: center;">Loading dispatches...</div>
            </div>
        </section>

        <!-- CONTACT -->
        <section id="contact" class="section" style="border-bottom: none;">
            <div class="section-header">
                <span class="section-label">Connection</span>
                <h2 class="section-title">Start a Project</h2>
            </div>
            <div class="contact-layout">
                <div class="contact-info">
                    <p>{{ content.contact }}</p>
                    <div class="contact-card">
                        <div class="contact-card-icon">📍</div>
                        <div>
                            <strong style="color: white; font-size: 14px;">Address</strong>
                            <p style="font-size: 13px;">downtown office suite 105, city</p>
                        </div>
                    </div>
                    <div class="contact-card">
                        <div class="contact-card-icon">✉️</div>
                        <div>
                            <strong style="color: white; font-size: 14px;">Email Desk</strong>
                            <p style="font-size: 13px;">{{ data.contact_email or 'hello@saadhyam.ai' }}</p>
                        </div>
                    </div>
                </div>
                <form class="contact-form" onsubmit="event.preventDefault(); alert('Request logged!');">
                    <div class="form-group"><label>Your Name</label><input type="text" placeholder="John Doe" required /></div>
                    <div class="form-group"><label>Email Address</label><input type="email" placeholder="john@example.com" required /></div>
                    <div class="form-group"><label>Your Message</label><textarea rows="3" placeholder="Tell us more about your timeline..." required></textarea></div>
                    <button type="submit" class="nav-cta" style="border: none; cursor: pointer; align-self: flex-start;">Send Request</button>
                </form>
            </div>
        </section>
    </main>

    <footer class="footer">
        <span>&copy; 2026 {{ data.business_name }}</span>
        <span>Parallax Space. All rights reserved.</span>
    </footer>

    <script>
        async function loadBlogPosts() {
            const container = document.getElementById('blog-posts-container');
            try {
                const response = await fetch('blogs.json');
                if (!response.ok) throw new Error('No blogs');
                const data = await response.json();
                const blogs = data.blogs || [];
                if (blogs.length === 0) {
                    container.innerHTML = '<p style="grid-column: span 3; text-align: center;">No blog posts yet.</p>';
                    return;
                }
                container.innerHTML = blogs.slice(0, 3).map(blog => `
                    <div class="blog-card" onclick="window.location.href='blog-\${blog.slug}.html'">
                        <div class="blog-img">\${blog.title.charAt(0)}</div>
                        <div class="blog-info">
                            <h4>\${blog.title}</h4>
                            <p>\${blog.meta_description || 'Click to read full article'}</p>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                container.innerHTML = '<p style="grid-column: span 3; text-align: center;">No blog posts yet.</p>';
            }
        }
        document.addEventListener('DOMContentLoaded', loadBlogPosts);
    </script>
</body>
</html>"""

# ==========================================
# 7. MINIMAL MODERN (Asymmetric layout, Outfit font, hairline borders)
# ==========================================
TEMPLATES_CONTENT["minimal-modern"] = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ data.business_name }} | Minimal Modern</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/website-ai/static/theme-adapter.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        :root {
            --bg-color: #faf9f6;
            --text-color: #18181b;
            --text-muted: #71717a;
            --border-color: #e4e4e7;
            --font-headings: 'Outfit', sans-serif;
            --font-body: 'Plus Jakarta Sans', sans-serif;
        }
        body {
            font-family: var(--font-body);
            background: var(--bg-color);
            color: var(--text-color);
            padding: 60px 40px;
            line-height: 1.8;
        }
        h1, h2, h3 { font-family: var(--font-headings); font-weight: 500; letter-spacing: -0.03em; }
        
        /* Minimal Top Navigation */
        .navbar {
            max-width: 1000px; margin: 0 auto 80px; display: flex; justify-content: space-between; align-items: center;
        }
        .nav-logo { font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-color); text-decoration: none; }
        .nav-links { list-style: none; display: flex; gap: 32px; }
        .nav-links a { color: var(--text-muted); text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; transition: color 0.2s; }
        .nav-links a:hover { color: var(--text-color); }
        
        /* Off-center Hero */
        .hero {
            max-width: 800px; margin: 0 auto 120px 10%; padding-right: 40px;
        }
        .hero-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: var(--text-muted); margin-bottom: 24px; display: block; }
        .hero h1 { font-size: clamp(38px, 6vw, 64px); line-height: 1.1; margin-bottom: 32px; font-weight: 600; }
        .hero p { font-size: 20px; font-weight: 300; color: var(--text-muted); margin-bottom: 40px; }
        .btn-minimal {
            display: inline-block; padding: 14px 28px; border: 1.5px solid var(--text-color); color: var(--text-color); text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; transition: all 0.3s;
        }
        .btn-minimal:hover { background: var(--text-color); color: white; }
        
        /* Section layouts (Asymmetric whitespace) */
        .sec {
            max-width: 1000px; margin: 0 auto 140px; display: grid; grid-template-columns: 300px 1fr; gap: 60px;
        }
        .sec-header h2 { font-size: 32px; font-weight: 500; }
        
        /* About layout (Simple list) */
        .about-text { font-size: 18px; font-weight: 300; color: var(--text-muted); }
        .about-support { margin-top: 24px; font-size: 14px; color: var(--text-color); font-weight: 600; border-left: 2px solid var(--text-color); padding-left: 16px; }
        
        /* Services layout (Linear list with divides) */
        .services-list { display: flex; flex-direction: column; }
        .service-row { border-top: 1.5px solid var(--border-color); padding: 32px 0; display: grid; grid-template-columns: 1.5fr 2fr; gap: 40px; }
        .service-row:last-child { border-bottom: 1.5px solid var(--border-color); }
        .service-row h3 { font-size: 20px; font-weight: 600; }
        .service-row p { color: var(--text-muted); font-size: 14px; }
        
        /* FAQ layout (Clean hairline lines) */
        .faq-accordion { display: flex; flex-direction: column; }
        .faq-item { border-top: 1px solid var(--border-color); }
        .faq-item:last-child { border-bottom: 1px solid var(--border-color); }
        .faq-item summary { padding: 24px 0; font-weight: 600; cursor: pointer; list-style: none; display: flex; justify-content: space-between; }
        .faq-item summary::after { content: '↓'; font-weight: 300; }
        .faq-item[open] summary::after { content: '↑'; }
        .faq-item p { padding: 0 0 24px; color: var(--text-muted); font-size: 15px; }
        
        /* Blog grid */
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .blog-card { cursor: pointer; border-top: 1.5px solid var(--border-color); padding-top: 24px; }
        .blog-card:hover h4 { color: var(--text-muted); }
        .blog-card h4 { font-family: var(--font-headings); font-size: 18px; font-weight: 600; margin-bottom: 8px; }
        .blog-card p { font-size: 13px; color: var(--text-muted); }
        .blog-loading { color: var(--text-muted); }
        
        /* Contact Block */
        .contact-layout { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 40px; }
        .contact-form { display: flex; flex-direction: column; gap: 24px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group input, .form-group textarea {
            padding: 12px 0; border: none; border-bottom: 1.5px solid var(--border-color); background: transparent; font-family: inherit; font-size: 15px; color: var(--text-color);
        }
        .form-group input:focus, .form-group textarea:focus { outline: none; border-bottom-color: var(--text-color); }
        
        .footer { max-width: 1000px; margin: 80px auto 0; padding-top: 40px; border-top: 1.5px solid var(--border-color); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted); }
        
        @media (max-width: 992px) {
            .sec { grid-template-columns: 1fr; gap: 24px; }
            .hero { margin-left: 0; }
            .service-row { grid-template-columns: 1fr; gap: 12px; }
            .blog-grid { grid-template-columns: 1fr; }
            .contact-layout { grid-template-columns: 1fr; }
        }
    </style>
    <script src="/website-ai/static/editor.js" defer></script>
</head>
<body data-theme="minimal-modern">
    <nav class="navbar">
        <a href="#" class="nav-logo">{{ data.business_name }}</a>
        <ul class="nav-links">
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </nav>

    <header class="hero">
        <span class="hero-tag">✨ Manifesto</span>
        <h1>Minimal designs, built with spacious elegance.</h1>
        <p>{{ content.about }}</p>
        <a href="#contact" class="btn-minimal">Start Your Project</a>
    </header>

    <main>
        <!-- ABOUT -->
        <section id="about" class="sec">
            <div class="sec-header">
                <h2>Manifesto</h2>
            </div>
            <div class="about-text">
                <p class="lede" style="font-size: 20px; line-height: 1.8; color: var(--text-color); margin-bottom: 24px;">{{ content.about }}</p>
                <p class="about-support">{{ theme_state.support_line }} We Pair asymmetric layout spacing with fine hairline borders to establish premium digital profiles.</p>
            </div>
        </section>

        <!-- SERVICES -->
        <section id="services" class="sec">
            <div class="sec-header">
                <h2>Services</h2>
            </div>
            <div class="services-list">
                {% for service in content.services %}
                <div class="service-row service-card">
                    <h3>{{ service.name }}</h3>
                    <p>{{ service.description }}</p>
                </div>
                {% endfor %}
            </div>
        </section>

        <!-- FAQ -->
        <section id="faq" class="sec">
            <div class="sec-header">
                <h2>Inquiries</h2>
            </div>
            <div class="faq-accordion">
                {% for item in content.faq %}
                <details class="faq-item">
                    <summary>{{ item.question }}</summary>
                    <p>{{ item.answer }}</p>
                </details>
                {% endfor %}
            </div>
        </section>

        <!-- BLOG -->
        <section id="blog" class="sec">
            <div class="sec-header">
                <h2>Chronicle</h2>
            </div>
            <div id="blog-posts-container" class="blog-grid">
                <div class="blog-loading">Reading insights feed...</div>
            </div>
        </section>

        <!-- CONTACT -->
        <section id="contact" class="sec" style="margin-bottom: 0;">
            <div class="sec-header">
                <h2>Connect</h2>
            </div>
            <div class="contact-layout">
                <form class="contact-form" onsubmit="event.preventDefault(); alert('Message sent!');">
                    <div class="form-group">
                        <input type="text" placeholder="Name" required />
                    </div>
                    <div class="form-group">
                        <input type="email" placeholder="Email Address" required />
                    </div>
                    <div class="form-group">
                        <textarea rows="4" placeholder="Briefly describe your objectives..." required></textarea>
                    </div>
                    <button type="submit" class="btn-minimal" style="align-self: flex-start; cursor: pointer;">Send Message</button>
                </form>
                <div class="lede" style="color: var(--text-muted); font-size: 15px;">
                    <p>{{ content.contact }}</p>
                    <p style="margin-top: 32px;">{{ data.contact_email or 'hello@saadhyam.ai' }}<br/>{{ data.contact_phone or '+1 (555) 918-0928' }}</p>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <span>&copy; 2026 {{ data.business_name }}</span>
        <span>Minimal Modern. All rights reserved.</span>
    </footer>

    <script>
        async function loadBlogPosts() {
            const container = document.getElementById('blog-posts-container');
            try {
                const response = await fetch('blogs.json');
                if (!response.ok) throw new Error('No blogs');
                const data = await response.json();
                const blogs = data.blogs || [];
                if (blogs.length === 0) {
                    container.innerHTML = '<p class="blog-loading">No blog posts yet.</p>';
                    return;
                }
                container.innerHTML = blogs.slice(0, 3).map(blog => `
                    <div class="blog-card" onclick="window.location.href='blog-\${blog.slug}.html'">
                        <h4>\${blog.title}</h4>
                        <p>\${blog.meta_description || 'Click to view full insight article'}</p>
                    </div>
                `).join('');
            } catch (error) {
                container.innerHTML = '<p class="blog-loading">No blog posts yet.</p>';
            }
        }
        document.addEventListener('DOMContentLoaded', loadBlogPosts);
    </script>
</body>
</html>"""

# ==========================================
# 8. AGENCY DARK (Sleek cyberpunk dark layout, glowing center visual)
# ==========================================
TEMPLATES_CONTENT["agency-dark"] = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ data.business_name }} | Agency Dark</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/website-ai/static/theme-adapter.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        :root {
            --bg-main: #07070a;
            --bg-alt: #0e0e13;
            --text-main: #ffffff;
            --text-muted: #80809b;
            --primary: #8b5cf6;
            --primary-hover: #a78bfa;
            --primary-glow: rgba(139, 92, 246, 0.25);
            --card-bg: rgba(14, 14, 19, 0.7);
            --border-color: rgba(255,255,255,0.06);
            --font-headings: 'Plus Jakarta Sans', sans-serif;
            --font-body: 'Plus Jakarta Sans', sans-serif;
            --nav-bg: rgba(7, 7, 10, 0.85);
        }
        body {
            font-family: var(--font-body);
            background: var(--bg-main);
            color: var(--text-main);
            line-height: 1.7;
            overflow-x: hidden;
        }
        h1, h2, h3 { font-family: var(--font-headings); font-weight: 800; color: white; letter-spacing: -1px; }

        /* Floating glowing Navbar */
        .navbar {
            background: var(--nav-bg);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border-color);
            position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
        }
        .nav-container {
            max-width: 1200px; margin: 0 auto; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;
        }
        .nav-logo { font-size: 24px; font-weight: 800; text-decoration: none; color: white; }
        .nav-logo span { color: var(--primary); }
        .nav-links { list-style: none; display: flex; gap: 28px; }
        .nav-links a { color: var(--text-muted); text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; transition: color 0.3s; }
        .nav-links a:hover { color: white; }
        .nav-cta {
            background: var(--primary); color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s; box-shadow: 0 4px 14px var(--primary-glow);
        }
        .nav-cta:hover { background: var(--primary-hover); transform: translateY(-1px); }

        /* Hero */
        .hero {
            padding: 180px 24px 100px; text-align: center; max-width: 900px; margin: 0 auto; position: relative;
        }
        .hero-glow { position: absolute; top: 100px; left: 50%; transform: translateX(-50%); width: 300px; height: 300px; background: var(--primary-glow); filter: blur(80px); pointer-events: none; }
        .hero-badge { display: inline-block; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139,92,246,0.3); color: var(--primary-hover); font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 50px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px; }
        .hero h1 { font-size: clamp(38px, 6vw, 68px); line-height: 1.1; margin-bottom: 24px; }
        .hero h1 em { font-style: italic; color: var(--primary-hover); }
        .hero p { font-size: 18px; color: var(--text-muted); margin-bottom: 40px; }

        /* Center Rotating graphic */
        .rotating-visual-wrapper { display: flex; justify-content: center; margin-bottom: 80px; position: relative; }
        .glowing-orb { width: 140px; height: 140px; border-radius: 50%; background: linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%); filter: blur(40px); opacity: 0.6; position: absolute; top: 10px; }
        .orbital-core {
            width: 160px; height: 160px; border-radius: 50%; border: 1.5px dashed var(--primary); animation: spin 20s linear infinite; display: flex; align-items: center; justify-content: center; z-index: 2;
        }
        .orbital-inner {
            width: 110px; height: 110px; border-radius: 50%; border: 1.5px dashed rgba(255,255,255,0.2); animation: spin-reverse 15s linear infinite; display: flex; align-items: center; justify-content: center;
        }
        .orbital-center { width: 60px; height: 60px; border-radius: 50%; background: var(--primary); box-shadow: 0 0 30px var(--primary-glow); }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes spin-reverse { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }

        /* General layout */
        .section { padding: 120px 24px; border-bottom: 1px solid var(--border-color); }
        .sec-container { max-width: 1100px; margin: 0 auto; }
        .sec-header { text-align: center; margin-bottom: 60px; }
        .sec-label { font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: var(--primary-hover); font-weight: 600; display: block; margin-bottom: 10px; }
        .sec-title { font-size: 38px; font-weight: 800; }

        /* About layout */
        .about-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 50px; align-items: center; }
        .about-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 40px; border-radius: 12px; backdrop-filter: blur(8px); }
        .about-stats { display: flex; flex-direction: column; gap: 20px; }
        .stat-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 24px; border-radius: 12px; text-align: center; }
        .stat-num { font-size: 36px; font-weight: 800; color: var(--primary-hover); }

        /* Services layout */
        .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .service-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 30px; border-radius: 12px; position: relative; transition: all 0.3s; }
        .service-card:hover { border-color: var(--primary); transform: translateY(-4px); }
        .service-icon { font-size: 28px; margin-bottom: 16px; color: var(--primary-hover); }
        .service-card h4 { font-size: 20px; margin-bottom: 10px; }

        /* FAQ columns */
        .faq-wrap { display: flex; flex-direction: column; gap: 16px; max-width: 800px; margin: 0 auto; }
        .faq-item { border-bottom: 1px solid var(--border-color); padding-bottom: 16px; }
        .faq-item summary { font-size: 16px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; }
        .faq-item summary::after { content: '+'; color: var(--primary); }
        .faq-item p { color: var(--text-muted); font-size: 14px; margin-top: 10px; }

        /* Blog grid */
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .blog-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; cursor: pointer; transition: all 0.3s; }
        .blog-card:hover { border-color: var(--primary); }
        .blog-img { height: 160px; background: rgba(139, 92, 246, 0.05); display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 800; color: var(--primary-hover); border-bottom: 1px solid var(--border-color); }
        .blog-info { padding: 20px; }
        .blog-info h4 { font-size: 18px; margin-bottom: 8px; }
        .blog-info p { font-size: 13px; color: var(--text-muted); }

        /* Contact Details */
        .contact-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 50px; }
        .contact-form { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 11px; text-transform: uppercase; color: var(--primary-hover); }
        .form-group input, .form-group textarea { background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; color: white; font-family: inherit; font-size: 14px; outline: none; }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--primary); }

        .footer {
            border-top: 1px solid var(--border-color); max-width: 1100px; margin: 60px auto 0; padding-top: 40px; display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted);
        }

        @media (max-width: 992px) {
            .about-grid { grid-template-columns: 1fr; }
            .services-grid { grid-template-columns: 1fr; }
            .blog-grid { grid-template-columns: 1fr; }
            .contact-layout { grid-template-columns: 1fr; }
        }
    </style>
    <script src="/website-ai/static/editor.js" defer></script>
</head>
<body data-theme="agency-dark">
    <nav class="navbar">
        <div class="nav-container">
            <a href="#" class="nav-logo">Agency<span>Dark</span></a>
            <ul class="nav-links">
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
            <a href="#contact" class="nav-cta">Let's Talk</a>
        </div>
    </nav>

    <header class="hero">
        <div class="hero-glow"></div>
        <span class="hero-badge">✦ Software studio</span>
        <h1>We design premium <em>digital</em> futures</h1>
        <p>{{ content.about }}</p>
        <a href="#contact" class="nav-cta" style="padding: 14px 28px;">Initiate Project</a>
    </header>

    <div class="rotating-visual-wrapper">
        <div class="glowing-orb"></div>
        <div class="orbital-core">
            <div class="orbital-inner">
                <div class="orbital-center"></div>
            </div>
        </div>
    </div>

    <main class="sec-container">
        <!-- ABOUT -->
        <section id="about" class="section">
            <div class="sec-header">
                <span class="sec-label">Manifesto</span>
                <h2 class="sec-title">Our Philosophy</h2>
            </div>
            <div class="about-grid">
                <div class="about-card">
                    <p style="font-size: 18px; color: white; margin-bottom: 20px; line-height: 1.8;">{{ content.about }}</p>
                    <p>{{ theme_state.support_line }} We merge responsive styling variables inside glassmorphic layout elements to command attention.</p>
                </div>
                <div class="about-stats">
                    <div class="stat-card">
                        <div class="stat-num">99%</div>
                        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-top: 4px;">Success rate</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num">150+</div>
                        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-top: 4px;">Sites live</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SERVICES -->
        <section id="services" class="section">
            <div class="sec-header">
                <span class="sec-label">Areas</span>
                <h2 class="sec-title">What We Offer</h2>
            </div>
            <div class="services-grid">
                {% for service in content.services %}
                <div class="service-card">
                    <div class="service-icon">✦</div>
                    <h4>{{ service.name }}</h4>
                    <p style="font-size: 14px; color: var(--text-muted); margin-top: 8px;">{{ service.description }}</p>
                </div>
                {% endfor %}
            </div>
        </section>

        <!-- FAQ -->
        <section id="faq" class="section">
            <div class="sec-header">
                <span class="sec-label">FAQ</span>
                <h2 class="section-title">Common Questions</h2>
            </div>
            <div class="faq-wrap">
                {% for item in content.faq %}
                <details class="faq-item">
                    <summary>{{ item.question }}</summary>
                    <p>{{ item.answer }}</p>
                </details>
                {% endfor %}
            </div>
        </section>

        <!-- BLOG -->
        <section id="blog" class="section">
            <div class="sec-header">
                <span class="sec-label">Journal</span>
                <h2 class="section-title">Recent Dispatches</h2>
            </div>
            <div id="blog-posts-container" class="blog-grid">
                <div style="grid-column: span 3; text-align: center;">Loading chronicle feed...</div>
            </div>
        </section>

        <!-- CONTACT -->
        <section id="contact" class="section" style="border-bottom: none;">
            <div class="sec-header">
                <span class="sec-label">Connection</span>
                <h2 class="sec-title">Start a Project</h2>
            </div>
            <div class="contact-layout">
                <div>
                    <p style="font-size: 18px; margin-bottom: 24px;">{{ content.contact }}</p>
                    <div style="font-size: 13px; color: var(--text-muted); display: flex; flex-direction: column; gap: 12px;">
                        <p>📍 downtown suite 405, city</p>
                        <p>📞 concierge: {{ data.contact_phone or '+1 (555) 918-0928' }}</p>
                        <p>✉️ email: {{ data.contact_email or 'hello@saadhyam.ai' }}</p>
                    </div>
                </div>
                <form class="contact-form" onsubmit="event.preventDefault(); alert('Enquiry Sent!');">
                    <div class="form-group"><label>First Name</label><input type="text" placeholder="John" required /></div>
                    <div class="form-group"><label>Email Address</label><input type="email" placeholder="john@example.com" required /></div>
                    <div class="form-group"><label>Your Message</label><textarea rows="3" placeholder="Tell us more about your ideas..." required></textarea></div>
                    <button type="submit" class="nav-cta" style="border: none; cursor: pointer; align-self: flex-start;">Submit request</button>
                </form>
            </div>
        </section>
    </main>

    <footer class="footer">
        <span>&copy; 2026 {{ data.business_name }}</span>
        <span>Agency Dark. All rights reserved.</span>
    </footer>

    <script>
        async function loadBlogPosts() {
            const container = document.getElementById('blog-posts-container');
            try {
                const response = await fetch('blogs.json');
                if (!response.ok) throw new Error('No blogs');
                const data = await response.json();
                const blogs = data.blogs || [];
                if (blogs.length === 0) {
                    container.innerHTML = '<p style="grid-column: span 3; text-align: center;">No blog posts yet.</p>';
                    return;
                }
                container.innerHTML = blogs.slice(0, 3).map(blog => `
                    <div class="blog-card" onclick="window.location.href='blog-\${blog.slug}.html'">
                        <div class="blog-img">\${blog.title.charAt(0)}</div>
                        <div class="blog-info">
                            <h4>\${blog.title}</h4>
                            <p>\${blog.meta_description || 'Click to view full insight'}</p>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                container.innerHTML = '<p style="grid-column: span 3; text-align: center;">No blog posts yet.</p>';
            }
        }
        document.addEventListener('DOMContentLoaded', loadBlogPosts);
    </script>
</body>
</html>"""

# ==========================================
# 9. RETRO BRUTALISM (Bold flat shadows, yellow/pink/blue blocks, 4px borders)
# ==========================================
TEMPLATES_CONTENT["retro-brutalism"] = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ data.business_name }} | Retro Brutalism</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/website-ai/static/theme-adapter.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        :root {
            --bg-color: #f3f4f6;
            --brutal-yellow: #fef08a;
            --brutal-pink: #fbcfe8;
            --brutal-blue: #bfdbfe;
            --border-color: #111827;
            --shadow-flat: 8px 8px 0px #111827;
            --shadow-flat-sm: 4px 4px 0px #111827;
            --font-headings: 'Syne', sans-serif;
            --font-body: 'Space Grotesk', sans-serif;
        }
        body {
            font-family: var(--font-body);
            background: var(--bg-color);
            color: #111827;
            padding: 40px 24px;
        }
        h1, h2, h3, h4 { font-family: var(--font-headings); font-weight: 800; text-transform: uppercase; }
        
        /* Navigation (Bordered block navbar) */
        .navbar {
            background: #ffffff; border: 4px solid var(--border-color); box-shadow: var(--shadow-flat-sm);
            padding: 16px 32px; display: flex; justify-content: space-between; align-items: center;
            max-width: 1100px; margin: 0 auto 60px; position: sticky; top: 20px; z-index: 1000;
        }
        .nav-logo {
            font-weight: 800; font-size: 22px; color: #111827; text-decoration: none;
            border: 3px solid var(--border-color); padding: 4px 12px; background: var(--brutal-yellow); box-shadow: var(--shadow-flat-sm);
        }
        .nav-links { list-style: none; display: flex; gap: 20px; }
        .nav-links a {
            color: #111827; text-decoration: none; font-size: 14px; font-weight: 700;
            border: 2px solid var(--border-color); padding: 6px 12px; background: #ffffff; box-shadow: 2px 2px 0 var(--border-color); transition: all 0.1s;
        }
        .nav-links a:hover { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--border-color); background: var(--brutal-blue); }
        
        /* Hero (Offset thick bordered card) */
        .hero {
            max-width: 1100px; margin: 0 auto 80px; padding: 60px 40px; background: white;
            border: 4px solid var(--border-color); box-shadow: var(--shadow-flat); text-align: center;
        }
        .hero-tag {
            display: inline-block; font-size: 13px; font-weight: 700; text-transform: uppercase; color: #111827;
            background: var(--brutal-pink); border: 3px solid var(--border-color); padding: 6px 16px; box-shadow: var(--shadow-flat-sm); margin-bottom: 24px;
        }
        .hero h1 { font-size: clamp(36px, 6vw, 60px); margin-bottom: 24px; }
        .hero p { font-size: 20px; max-width: 800px; margin: 0 auto 36px; font-weight: 500; }
        .btn-brutal {
            display: inline-block; padding: 14px 28px; background: var(--brutal-yellow); color: #111827;
            text-decoration: none; font-weight: 700; text-transform: uppercase; border: 3px solid var(--border-color); box-shadow: var(--shadow-flat-sm); transition: all 0.1s;
        }
        .btn-brutal:hover { transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--border-color); }

        /* sliding marquee */
        .marquee-bar { background: var(--brutal-yellow); border-top: 4px solid var(--border-color); border-bottom: 4px solid var(--border-color); padding: 12px 0; overflow: hidden; white-space: nowrap; margin-bottom: 80px; max-width: 1100px; margin-left: auto; margin-right: auto; }
        .marquee-track { display: inline-flex; animation: marquee 20s linear infinite; }
        .marquee-item { font-family: var(--font-headings); font-size: 14px; font-weight: 800; text-transform: uppercase; color: #111827; padding: 0 40px; }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        
        /* Sections flow (Bordered blocks) */
        .sec {
            max-width: 1100px; margin: 0 auto 80px; padding: 60px 40px; background: white;
            border: 4px solid var(--border-color); box-shadow: var(--shadow-flat);
        }
        .sec-header { margin-bottom: 40px; border-bottom: 4px solid var(--border-color); padding-bottom: 16px; }
        .sec-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--border-color); letter-spacing: 1px; }
        .sec-title { font-size: 32px; font-weight: 800; }
        
        /* About section layout */
        .about-wrap { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 40px; }
        .about-desc { font-size: 18px; font-weight: 500; line-height: 1.7; }
        .about-support { background: var(--brutal-blue); padding: 16px; border: 3px solid var(--border-color); font-weight: 700; box-shadow: var(--shadow-flat-sm); margin-top: 20px; }
        .about-stats { display: flex; flex-direction: column; gap: 20px; }
        .stat-card { border: 3px solid var(--border-color); padding: 20px; background: var(--brutal-pink); box-shadow: var(--shadow-flat-sm); text-align: center; }
        .stat-num { font-size: 36px; font-weight: 800; }
        
        /* Services layout (Grid cards) */
        .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .s-card { border: 3px solid var(--border-color); padding: 30px; background: #ffffff; box-shadow: var(--shadow-flat-sm); transition: all 0.1s; }
        .s-card:hover { transform: translate(-4px, -4px); box-shadow: 8px 8px 0 var(--border-color); border-color: var(--border-color); }
        .s-card h3 { font-size: 20px; margin-bottom: 12px; }
        .s-card p { font-size: 14px; font-weight: 500; color: #4b5563; }
        
        /* FAQ list */
        .faq-list { display: flex; flex-direction: column; gap: 16px; }
        .faq-item { border: 3px solid var(--border-color); }
        .faq-item[open] { background: var(--brutal-blue); }
        .faq-item summary { padding: 20px; font-weight: 700; cursor: pointer; display: flex; justify-content: space-between; }
        .faq-item p { padding: 0 20px 20px; font-size: 15px; font-weight: 500; }
        
        /* Blog list */
        .blog-deck { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .blog-card { border: 3px solid var(--border-color); background: white; box-shadow: var(--shadow-flat-sm); cursor: pointer; transition: all 0.1s; overflow: hidden; }
        .blog-card:hover { transform: translate(-4px, -4px); box-shadow: 8px 8px 0 var(--border-color); }
        .blog-img { height: 160px; background: var(--brutal-pink); display: flex; align-items: center; justify-content: center; font-size: 48px; border-bottom: 3px solid var(--border-color); }
        .blog-body { padding: 20px; }
        
        /* Contact Block */
        .contact-layout { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 40px; }
        .contact-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 13px; font-weight: 700; text-transform: uppercase; }
        .form-group input, .form-group textarea {
            padding: 12px; border: 3px solid var(--border-color); font-family: inherit; font-size: 15px; color: #111827; outline: none; background: white;
        }
        .form-group input:focus, .form-group textarea:focus { background: var(--brutal-yellow); }
        
        .footer {
            max-width: 1100px; margin: 40px auto 0; padding: 40px 0 0; border-top: 4px solid var(--border-color); display: flex; justify-content: space-between; font-weight: 700; font-size: 14px;
        }
        
        @media (max-width: 992px) {
            .about-wrap { grid-template-columns: 1fr; }
            .services-grid { grid-template-columns: 1fr; }
            .blog-deck { grid-template-columns: 1fr; }
            .contact-layout { grid-template-columns: 1fr; }
        }
    </style>
    <script src="/website-ai/static/editor.js" defer></script>
</head>
<body data-theme="retro-brutalism">
    <nav class="navbar">
        <a href="#" class="nav-logo">{{ data.business_name }}</a>
        <ul class="nav-links">
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </nav>

    <header class="hero">
        <span class="hero-tag">✦ Retro Dispatch ✦</span>
        <h1>We design bold, <em>high-contrast</em> web platforms</h1>
        <p>{{ content.about }}</p>
        <a href="#contact" class="btn-brutal">Initiate Project</a>
    </header>

    <div class="marquee-bar">
        <div class="marquee-track">
            <span class="marquee-item">✦ Neo Brutalism Layouts</span>
            <span class="marquee-item">✦ Flat Solid Shadows</span>
            <span class="marquee-item">✦ High Contrast Grid System</span>
            <span class="marquee-item">✦ Neo Brutalism Layouts</span>
            <span class="marquee-item">✦ Flat Solid Shadows</span>
        </div>
    </div>

    <main>
        <!-- ABOUT -->
        <section id="about" class="sec">
            <div class="sec-header">
                <span class="sec-label">Who We Are</span>
                <h2 class="sec-title">Our Manifesto</h2>
            </div>
            <div class="about-wrap">
                <div>
                    <p class="about-desc">{{ content.about }}</p>
                    <p class="about-support">{{ theme_state.support_line }} We Pair asymmetric layout structures with thick 4px black borders to command proud web presence.</p>
                </div>
                <div class="about-stats">
                    <div class="stat-card">
                        <div class="stat-num">99%</div>
                        <div style="font-weight: 700; font-size: 12px; text-transform: uppercase; margin-top: 4px;">Satisfaction</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num">150+</div>
                        <div style="font-weight: 700; font-size: 12px; text-transform: uppercase; margin-top: 4px;">Deploys</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SERVICES -->
        <section id="services" class="sec">
            <div class="sec-header">
                <span class="sec-label">What We Do</span>
                <h2 class="sec-title">Our Departments</h2>
            </div>
            <div class="services-grid">
                {% for service in content.services %}
                <div class="s-card service-card">
                    <h3>{{ service.name }}</h3>
                    <p>{{ service.description }}</p>
                </div>
                {% endfor %}
            </div>
        </section>

        <!-- FAQ -->
        <section id="faq" class="sec">
            <div class="sec-header">
                <span class="sec-label">FAQ</span>
                <h2 class="sec-title">Common Questions</h2>
            </div>
            <div class="faq-list">
                {% for item in content.faq %}
                <details class="faq-item">
                    <summary>{{ item.question }}</summary>
                    <p>{{ item.answer }}</p>
                </details>
                {% endfor %}
            </div>
        </section>

        <!-- BLOG -->
        <section id="blog" class="sec">
            <div class="sec-header">
                <span class="sec-label">Journal</span>
                <h2 class="sec-title">Latest Articles</h2>
            </div>
            <div id="blog-posts-container" class="blog-deck">
                <div class="blog-card">
                    <div class="blog-img">📰</div>
                    <div class="blog-body">
                        <h4>Reading dispatches...</h4>
                    </div>
                </div>
            </div>
        </section>

        <!-- CONTACT -->
        <section id="contact" class="sec" style="margin-bottom: 0;">
            <div class="sec-header">
                <span class="sec-label">Connect</span>
                <h2 class="sec-title">Reach Our Desk</h2>
            </div>
            <div class="contact-layout">
                <form class="contact-form" onsubmit="event.preventDefault(); alert('Message sent!');">
                    <div class="form-group">
                        <label>Your Name</label>
                        <input type="text" placeholder="John Doe" required />
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" placeholder="john@example.com" required />
                    </div>
                    <div class="form-group">
                        <label>Your Project Brief</label>
                        <textarea rows="4" placeholder="Briefly describe your objectives..." required></textarea>
                    </div>
                    <button type="submit" class="btn-brutal" style="cursor: pointer; align-self: flex-start;">Send Enquiry</button>
                </form>
                <div style="font-size: 15px; font-weight: 500; line-height: 1.8;">
                    <p>{{ content.contact }}</p>
                    <p style="margin-top: 32px;">{{ data.contact_email or 'hello@saadhyam.ai' }}<br/>{{ data.contact_phone or '+1 (555) 918-0928' }}</p>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <span>&copy; 2026 {{ data.business_name }}</span>
        <span>Brutalist Design.</span>
    </footer>

    <script>
        async function loadBlogPosts() {
            const container = document.getElementById('blog-posts-container');
            try {
                const response = await fetch('blogs.json');
                if (!response.ok) throw new Error('No blogs');
                const data = await response.json();
                const blogs = data.blogs || [];
                if (blogs.length === 0) {
                    container.innerHTML = '<p>No blog posts yet.</p>';
                    return;
                }
                container.innerHTML = blogs.slice(0, 3).map(blog => `
                    <div class="blog-card" onclick="window.location.href='blog-\${blog.slug}.html'">
                        <div class="blog-img">\${blog.title.charAt(0)}</div>
                        <div class="blog-body">
                            <h4 style="font-size: 18px; font-weight: 800; margin-bottom: 6px;">\${blog.title}</h4>
                            <p style="font-size: 13px; color: #4b5563;">\${blog.meta_description || 'Click to view full dispatch'}</p>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                container.innerHTML = '<p>No blog posts yet.</p>';
            }
        }
        document.addEventListener('DOMContentLoaded', loadBlogPosts);
    </script>
</body>
</html>"""

# ==========================================
# 10. RESTAURANT SHOWCASE (Cocoa/warm gold food theme, plate rotator, menus)
# ==========================================
TEMPLATES_CONTENT["restaurant-showcase"] = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ data.business_name }} | Restaurant Showcase</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,800;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/website-ai/static/theme-adapter.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        :root {
            --bg-color: #1a0d00;
            --card-bg: #2b1704;
            --text-color: #fffdfa;
            --text-muted: #c8b99a;
            --primary: #d4af37;
            --primary-hover: #f3e5ab;
            --border-color: rgba(212, 175, 55, 0.15);
            --font-headings: 'Playfair Display', Georgia, serif;
            --font-body: 'Jost', sans-serif;
        }
        body {
            font-family: var(--font-body);
            background: var(--bg-color);
            color: var(--text-color);
            line-height: 1.8;
            font-weight: 300;
        }
        h1, h2, h3, h4 { font-family: var(--font-headings); font-weight: 300; color: white; }

        /* Navigation */
        .navbar {
            background: rgba(26, 13, 0, 0.9);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border-color);
            position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
        }
        .nav-container {
            max-width: 1200px; margin: 0 auto; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;
        }
        .nav-logo { font-size: 24px; font-family: var(--font-headings); text-decoration: none; color: white; letter-spacing: 1px; }
        .nav-logo span { font-style: italic; color: var(--primary); }
        .nav-links { list-style: none; display: flex; gap: 28px; }
        .nav-links a { color: var(--text-muted); text-decoration: none; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px; transition: color 0.3s; }
        .nav-links a:hover { color: var(--primary); }
        .nav-cta {
            background: var(--primary); color: var(--bg-color); padding: 10px 22px; border-radius: 0; text-decoration: none; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; transition: all 0.3s;
        }
        .nav-cta:hover { background: var(--primary-hover); }

        /* Hero */
        .hero {
            padding: 180px 24px 100px; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; max-width: 1200px; margin: 0 auto; align-items: center;
        }
        .hero-left { padding-right: 40px; }
        .hero-tag { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 3px; color: var(--primary); margin-bottom: 20px; display: block; }
        .hero h1 { font-size: clamp(38px, 6vw, 64px); line-height: 1.15; margin-bottom: 24px; }
        .hero h1 em { font-style: italic; color: var(--primary-hover); }
        .hero p { font-size: 18px; color: var(--text-muted); margin-bottom: 40px; font-family: var(--font-headings); font-style: italic; }

        /* Rotating Plate widget */
        .plate-rotator { display: flex; justify-content: center; position: relative; }
        .plate-circle {
            width: 280px; height: 280px; border-radius: 50%; border: 1.5px dashed var(--primary); animation: spin 25s linear infinite; display: flex; align-items: center; justify-content: center;
        }
        .plate-inner { width: 200px; height: 200px; border-radius: 50%; background: linear-gradient(135deg, var(--card-bg) 0%, #1a0d00 100%); border: 1px solid var(--border-color); }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* Booking/Reservation bar */
        .reservation-bar {
            max-width: 1000px; margin: 0 auto 100px; background: var(--card-bg); border: 1px solid var(--border-color); padding: 24px; display: grid; grid-template-columns: repeat(3, 1fr) auto; gap: 16px; align-items: center;
        }
        .booking-field { display: flex; flex-direction: column; gap: 4px; }
        .booking-field label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); font-weight: 500; }
        .booking-field input, .booking-field select { border: none; border-bottom: 1px solid var(--border-color); padding: 8px 0; font-family: inherit; font-size: 14px; background: transparent; color: white; outline: none; }
        .booking-field select option { background: var(--card-bg); }

        /* Sections */
        .section { padding: 100px 24px; border-bottom: 1px solid var(--border-color); }
        .sec-container { max-width: 1100px; margin: 0 auto; }
        .sec-header { text-align: center; margin-bottom: 60px; }
        .sec-label { font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: var(--primary); font-weight: 600; display: block; margin-bottom: 10px; }
        .sec-title { font-size: 38px; font-weight: 300; }

        /* About layout */
        .about-layout { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 50px; align-items: center; }
        .about-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 40px; }
        .about-stats { display: flex; flex-direction: column; gap: 20px; }
        .stat-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 20px; text-align: center; }
        .stat-num { font-family: var(--font-headings); font-size: 36px; color: var(--primary); }

        /* Services / Menu showcase grid */
        .menu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .menu-item { display: flex; flex-direction: column; border-bottom: 1px dashed var(--border-color); padding-bottom: 16px; }
        .menu-item-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px; }
        .menu-item-name { font-family: var(--font-headings); font-size: 18px; font-weight: 700; }
        .menu-item-price { color: var(--primary); font-weight: 600; }
        .menu-item-desc { font-size: 13px; color: var(--text-muted); }

        /* FAQ columns */
        .faq-wrap { display: flex; flex-direction: column; gap: 16px; max-width: 800px; margin: 0 auto; }
        .faq-item { border-bottom: 1px solid var(--border-color); padding-bottom: 16px; }
        .faq-item summary { font-size: 16px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; }
        .faq-item summary::after { content: '↓'; color: var(--primary); }
        .faq-item p { color: var(--text-muted); font-size: 14px; margin-top: 10px; }

        /* Blog grid */
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .blog-card { background: var(--card-bg); border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s; }
        .blog-card:hover { border-color: var(--primary); }
        .blog-img { height: 160px; background: rgba(212, 175, 55, 0.05); display: flex; align-items: center; justify-content: center; font-size: 40px; color: var(--primary); border-bottom: 1px solid var(--border-color); }
        .blog-info { padding: 20px; }
        .blog-info h4 { font-family: var(--font-headings); font-size: 20px; margin-bottom: 10px; }
        .blog-info p { font-size: 13px; color: var(--text-muted); }

        /* Contact Details */
        .contact-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 50px; }
        .contact-form { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 11px; text-transform: uppercase; color: var(--primary); }
        .form-group input, .form-group textarea { background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 12px; color: white; font-family: inherit; font-size: 14px; outline: none; }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--primary); }

        .footer {
            border-top: 1px solid var(--border-color); max-width: 1100px; margin: 60px auto 0; padding-top: 40px; display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted);
        }

        @media (max-width: 992px) {
            .hero { grid-template-columns: 1fr; gap: 40px; }
            .hero-left { padding-right: 0; }
            .reservation-bar { grid-template-columns: 1fr; gap: 20px; }
            .about-layout { grid-template-columns: 1fr; }
            .menu-grid { grid-template-columns: 1fr; }
            .blog-grid { grid-template-columns: 1fr; }
            .contact-layout { grid-template-columns: 1fr; }
        }
    </style>
    <script src="/website-ai/static/editor.js" defer></script>
</head>
<body data-theme="restaurant-showcase">
    <nav class="navbar">
        <div class="nav-container">
            <a href="#" class="nav-logo">Culinary<span>Studio</span></a>
            <ul class="nav-links">
                <li><a href="#about">Story</a></li>
                <li><a href="#services">Menu</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#blog">Journal</a></li>
                <li><a href="#contact">Reservation</a></li>
            </ul>
            <a href="#contact" class="nav-cta">Reserve Table</a>
        </div>
    </nav>

    <header class="hero">
        <div class="hero-left">
            <span class="hero-tag">✦ Fine Dining & Cuisine</span>
            <h1>Where culinary art meets <em>timeless</em> flavor</h1>
            <p>{{ content.about }}</p>
            <a href="#contact" class="nav-cta" style="padding: 14px 28px;">Reserve A Table</a>
        </div>
        <div class="plate-rotator">
            <div class="plate-circle">
                <div class="plate-inner"></div>
            </div>
        </div>
    </header>

    <div class="reservation-bar">
        <div class="booking-field">
            <label>Select Date</label>
            <input type="date" />
        </div>
        <div class="booking-field">
            <label>Guests</label>
            <select>
                <option>2 Guests</option>
                <option>4 Guests</option>
                <option>6+ Guests</option>
            </select>
        </div>
        <div class="booking-field">
            <label>Preferred Time</label>
            <select>
                <option>7:00 PM</option>
                <option>8:30 PM</option>
                <option>10:00 PM</option>
            </select>
        </div>
        <button class="nav-cta" style="border: none; cursor: pointer; padding: 12px 24px;">Find Table</button>
    </div>

    <main class="sec-container">
        <!-- ABOUT -->
        <section id="about" class="section">
            <div class="sec-header">
                <span class="sec-label">Our Story</span>
                <h2 class="sec-title">A Legacy of Hospitality</h2>
            </div>
            <div class="about-layout">
                <div class="about-card">
                    <p style="font-size: 18px; font-family: var(--font-headings); font-style: italic; margin-bottom: 20px; line-height: 1.8;">{{ content.about }}</p>
                    <p>{{ theme_state.support_line }} We structure warm, dining-focused layouts featuring menu lists with dots and prices.</p>
                </div>
                <div class="about-stats">
                    <div class="stat-card">
                        <div class="stat-num">99%</div>
                        <div style="font-size: 12px; text-transform: uppercase;">Satisfaction</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num">150+</div>
                        <div style="font-size: 12px; text-transform: uppercase;">Dishes crafted</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SERVICES / MENU -->
        <section id="services" class="section">
            <div class="sec-header">
                <span class="sec-label">Gastronomy</span>
                <h2 class="sec-title">Featured Menu</h2>
            </div>
            <div class="menu-grid">
                {% for service in content.services %}
                <div class="menu-item service-card">
                    <div class="menu-item-header">
                        <span class="menu-item-name">{{ service.name }}</span>
                        <span class="menu-item-price">$24.00</span>
                    </div>
                    <p class="menu-item-desc">{{ service.description }}</p>
                </div>
                {% endfor %}
            </div>
        </section>

        <!-- FAQ -->
        <section id="faq" class="section">
            <div class="sec-header">
                <span class="sec-label">Inquiries</span>
                <h2 class="sec-title">Common Questions</h2>
            </div>
            <div class="faq-wrap">
                {% for item in content.faq %}
                <details class="faq-item">
                    <summary>{{ item.question }}</summary>
                    <p>{{ item.answer }}</p>
                </details>
                {% endfor %}
            </div>
        </section>

        <!-- BLOG -->
        <section id="blog" class="section">
            <div class="sec-header">
                <span class="sec-label">Journal</span>
                <h2 class="sec-title">Food Chronicle</h2>
            </div>
            <div id="blog-posts-container" class="blog-grid">
                <div style="grid-column: span 3; text-align: center;">Loading journal columns...</div>
            </div>
        </section>

        <!-- CONTACT -->
        <section id="contact" class="section" style="border-bottom: none;">
            <div class="sec-header">
                <span class="sec-label">Reservations</span>
                <h2 class="sec-title">Book Dinner</h2>
            </div>
            <div class="contact-layout">
                <div>
                    <p style="font-size: 18px; font-family: var(--font-headings); font-style: italic; margin-bottom: 24px;">{{ content.contact }}</p>
                    <div style="font-size: 13px; color: var(--text-muted); display: flex; flex-direction: column; gap: 12px;">
                        <p>📍 downtown avenue 204, city</p>
                        <p>📞 dining desk: {{ data.contact_phone or '+1 (555) 918-0928' }}</p>
                        <p>✉️ email: {{ data.contact_email or 'hello@saadhyam.ai' }}</p>
                    </div>
                </div>
                <form class="contact-form" onsubmit="event.preventDefault(); alert('Reservation logged!');">
                    <div class="form-group"><label>First Name</label><input type="text" placeholder="John" required /></div>
                    <div class="form-group"><label>Email Address</label><input type="email" placeholder="john@example.com" required /></div>
                    <div class="form-group"><label>Special request / concern</label><textarea rows="3" placeholder="Let us know about dietary restrictions..." required></textarea></div>
                    <button type="submit" class="nav-cta" style="border: none; cursor: pointer; align-self: flex-start;">Send Request</button>
                </form>
            </div>
        </section>
    </main>

    <footer class="footer">
        <span>&copy; 2026 {{ data.business_name }}</span>
        <span>Culinary Studio. All rights reserved.</span>
    </footer>

    <script>
        async function loadBlogPosts() {
            const container = document.getElementById('blog-posts-container');
            try {
                const response = await fetch('blogs.json');
                if (!response.ok) throw new Error('No blogs');
                const data = await response.json();
                const blogs = data.blogs || [];
                if (blogs.length === 0) {
                    container.innerHTML = '<p style="grid-column: span 3; text-align: center;">No blog posts yet.</p>';
                    return;
                }
                container.innerHTML = blogs.slice(0, 3).map(blog => `
                    <div class="blog-card" onclick="window.location.href='blog-\${blog.slug}.html'">
                        <div class="blog-img">\${blog.title.charAt(0)}</div>
                        <div class="blog-info">
                            <h4>\${blog.title}</h4>
                            <p>\${blog.meta_description || 'Click to view full insight'}</p>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                container.innerHTML = '<p style="grid-column: span 3; text-align: center;">No blog posts yet.</p>';
            }
        }
        document.addEventListener('DOMContentLoaded', loadBlogPosts);
    </script>
</body>
</html>"""

# ==========================================
# 11. SAAS DASHBOARD (Sleek light dashboard mockup, tech grids)
# ==========================================
TEMPLATES_CONTENT["saas-dashboard"] = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ data.business_name }} | SaaS Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/website-ai/static/theme-adapter.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        :root {
            --bg-main: #f8fafc;
            --bg-alt: #f1f5f9;
            --text-main: #0f172a;
            --text-muted: #475569;
            --primary: #2563eb;
            --primary-hover: #1d4ed8;
            --primary-glow: rgba(37, 99, 235, 0.15);
            --card-bg: #ffffff;
            --border-color: #e2e8f0;
            --font-headings: 'Plus Jakarta Sans', sans-serif;
            --font-body: 'Plus Jakarta Sans', sans-serif;
        }
        body {
            font-family: var(--font-body);
            background: var(--bg-main);
            color: var(--text-main);
            line-height: 1.7;
        }
        h1, h2, h3 { font-family: var(--font-headings); font-weight: 800; letter-spacing: -1px; }

        /* Navigation */
        .navbar {
            background: rgba(248, 250, 252, 0.85);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border-color);
            position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
        }
        .nav-container {
            max-width: 1200px; margin: 0 auto; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;
        }
        .nav-logo { font-size: 24px; font-weight: 800; text-decoration: none; color: var(--text-main); }
        .nav-logo span { color: var(--primary); }
        .nav-links { list-style: none; display: flex; gap: 28px; }
        .nav-links a { color: var(--text-muted); text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; transition: color 0.2s; }
        .nav-links a:hover { color: var(--primary); }
        .nav-cta {
            background: var(--primary); color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; box-shadow: 0 4px 14px var(--primary-glow); transition: all 0.3s;
        }
        .nav-cta:hover { background: var(--primary-hover); transform: translateY(-1px); }

        /* Hero */
        .hero {
            padding: 180px 24px 100px; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; max-width: 1200px; margin: 0 auto; align-items: center;
        }
        .hero-left { padding-right: 40px; }
        .hero-tag { display: inline-block; background: rgba(37, 99, 235, 0.08); color: var(--primary); font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 50px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px; }
        .hero h1 { font-size: clamp(38px, 6vw, 64px); line-height: 1.1; margin-bottom: 24px; }
        .hero h1 em { font-style: italic; color: var(--primary-hover); }
        .hero p { font-size: 18px; color: var(--text-muted); margin-bottom: 40px; }

        /* Simulated Dashboard panel */
        .saas-visual-panel {
            width: 440px; height: 320px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 20px;
            box-shadow: 0 20px 40px rgba(37,99,235,0.08); overflow: hidden; display: flex; flex-direction: column;
        }
        .saas-panel-bar {
            background: var(--bg-alt); padding: 10px 16px; border-bottom: 1px solid var(--border-color); display: flex; gap: 6px;
        }
        .saas-dot { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; }
        .saas-panel-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .saas-mock-row { height: 12px; background: var(--bg-alt); border-radius: 4px; }
        .saas-mock-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .saas-mock-chart { height: 80px; background: linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(37,99,235,0.01) 100%); border: 1px solid var(--border-color); border-radius: 8px; }

        /* General layout */
        .section { padding: 100px 24px; border-bottom: 1px solid var(--border-color); }
        .sec-container { max-width: 1100px; margin: 0 auto; }
        .sec-header { text-align: center; margin-bottom: 60px; }
        .sec-label { font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: var(--primary); font-weight: 600; display: block; margin-bottom: 10px; }
        .sec-title { font-size: 38px; font-weight: 800; }

        /* About layout */
        .about-layout { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 50px; align-items: center; }
        .about-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
        .about-stats { display: flex; flex-direction: column; gap: 20px; }
        .stat-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 24px; border-radius: 16px; text-align: center; }
        .stat-num { font-size: 36px; font-weight: 800; color: var(--primary); }

        /* Services grid */
        .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .service-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 30px; border-radius: 16px; transition: all 0.3s; }
        .service-card:hover { border-color: var(--primary); transform: translateY(-4px); box-shadow: 0 10px 25px var(--primary-glow); }
        .service-icon { font-size: 28px; margin-bottom: 16px; color: var(--primary); }
        .service-card h4 { font-size: 20px; margin-bottom: 10px; }

        /* FAQ columns */
        .faq-wrap { display: flex; flex-direction: column; gap: 16px; max-width: 800px; margin: 0 auto; }
        .faq-item { border-bottom: 1px solid var(--border-color); padding-bottom: 16px; }
        .faq-item summary { font-size: 16px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; }
        .faq-item summary::after { content: '+'; color: var(--primary); }
        .faq-item p { color: var(--text-muted); font-size: 14px; margin-top: 10px; }

        /* Blog grid */
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .blog-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; cursor: pointer; transition: all 0.3s; }
        .blog-card:hover { border-color: var(--primary); }
        .blog-img { height: 160px; background: rgba(37, 99, 235, 0.05); display: flex; align-items: center; justify-content: center; font-size: 40px; color: var(--primary); border-bottom: 1px solid var(--border-color); }
        .blog-info { padding: 20px; }
        .blog-info h4 { font-size: 18px; margin-bottom: 8px; }
        .blog-info p { font-size: 13px; color: var(--text-muted); }

        /* Contact Details */
        .contact-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 50px; }
        .contact-form { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 11px; text-transform: uppercase; color: var(--primary); }
        .form-group input, .form-group textarea { background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; font-family: inherit; font-size: 14px; outline: none; }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--primary); }

        .footer {
            border-top: 1px solid var(--border-color); max-width: 1100px; margin: 60px auto 0; padding-top: 40px; display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted);
        }

        @media (max-width: 992px) {
            .hero { grid-template-columns: 1fr; gap: 40px; }
            .hero-left { padding-right: 0; }
            .saas-visual-panel { width: 100%; height: auto; aspect-ratio: 4/3; }
            .about-layout { grid-template-columns: 1fr; }
            .services-grid { grid-template-columns: 1fr; }
            .blog-grid { grid-template-columns: 1fr; }
            .contact-layout { grid-template-columns: 1fr; }
        }
    </style>
    <script src="/website-ai/static/editor.js" defer></script>
</head>
<body data-theme="saas-dashboard">
    <nav class="navbar">
        <div class="nav-container">
            <a href="#" class="nav-logo">SaaS<span>Dashboard</span></a>
            <ul class="nav-links">
                <li><a href="#about">Overview</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
            <a href="#contact" class="nav-cta">Get Started</a>
        </div>
    </nav>

    <header class="hero">
        <div class="hero-left">
            <span class="hero-tag">✦ Custom B2B software</span>
            <h1>Launch your product with <em>premium</em> analytics</h1>
            <p>{{ content.about }}</p>
            <a href="#contact" class="nav-cta" style="padding: 14px 28px;">Initiate Free Trial</a>
        </div>
        <div class="saas-visual-panel">
            <div class="saas-panel-bar">
                <div class="saas-dot"></div>
                <div class="saas-dot"></div>
                <div class="saas-dot"></div>
            </div>
            <div class="saas-panel-body">
                <div class="saas-mock-row" style="width: 60%;"></div>
                <div class="saas-mock-grid">
                    <div class="saas-mock-chart"></div>
                    <div class="saas-mock-chart" style="background: linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(37,99,235,0.01) 100%);"></div>
                </div>
                <div class="saas-mock-row" style="width: 80%;"></div>
            </div>
        </div>
    </header>

    <main class="sec-container">
        <!-- ABOUT -->
        <section id="about" class="section">
            <div class="sec-header">
                <span class="sec-label">Overview</span>
                <h2 class="sec-title">Why SaaS Analytics</h2>
            </div>
            <div class="about-layout">
                <div class="about-card">
                    <p style="font-size: 18px; color: var(--text-main); margin-bottom: 20px; line-height: 1.8;">{{ content.about }}</p>
                    <p>{{ theme_state.support_line }} We Pair custom technology grids with mock analytics panels to showcase product benefits.</p>
                </div>
                <div class="about-stats">
                    <div class="stat-card">
                        <div class="stat-num">99%</div>
                        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-top: 4px;">Uptime</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num">150+</div>
                        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-top: 4px;">Teams joined</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SERVICES -->
        <section id="services" class="section">
            <div class="sec-header">
                <span class="sec-label">Services</span>
                <h2 class="sec-title">What We Offer</h2>
            </div>
            <div class="services-grid">
                {% for service in content.services %}
                <div class="service-card">
                    <div class="service-icon">⚙️</div>
                    <h4>{{ service.name }}</h4>
                    <p style="font-size: 14px; color: var(--text-muted); margin-top: 8px;">{{ service.description }}</p>
                </div>
                {% endfor %}
            </div>
        </section>

        <!-- FAQ -->
        <section id="faq" class="section">
            <div class="sec-header">
                <span class="sec-label">FAQ</span>
                <h2 class="sec-title">Common Questions</h2>
            </div>
            <div class="faq-wrap">
                {% for item in content.faq %}
                <details class="faq-item">
                    <summary>{{ item.question }}</summary>
                    <p>{{ item.answer }}</p>
                </details>
                {% endfor %}
            </div>
        </section>

        <!-- BLOG -->
        <section id="blog" class="section">
            <div class="sec-header">
                <span class="sec-label">Chronicle</span>
                <h2 class="sec-title">Tech Chronicles</h2>
            </div>
            <div id="blog-posts-container" class="blog-grid">
                <div style="grid-column: span 3; text-align: center;">Loading dispatches...</div>
            </div>
        </section>

        <!-- CONTACT -->
        <section id="contact" class="section" style="border-bottom: none;">
            <div class="sec-header">
                <span class="sec-label">Connection</span>
                <h2 class="sec-title">Talk to Sales</h2>
            </div>
            <div class="contact-layout">
                <div>
                    <p style="font-size: 18px; margin-bottom: 24px;">{{ content.contact }}</p>
                    <div style="font-size: 13px; color: var(--text-muted); display: flex; flex-direction: column; gap: 12px;">
                        <p>📍 tech district building 2, city</p>
                        <p>📞 sales line: {{ data.contact_phone or '+1 (555) 918-0928' }}</p>
                        <p>✉️ email: {{ data.contact_email or 'hello@saadhyam.ai' }}</p>
                    </div>
                </div>
                <form class="contact-form" onsubmit="event.preventDefault(); alert('Sales team notified!');">
                    <div class="form-group"><label>First Name</label><input type="text" placeholder="John" required /></div>
                    <div class="form-group"><label>Email Address</label><input type="email" placeholder="john@example.com" required /></div>
                    <div class="form-group"><label>Your Message</label><textarea rows="3" placeholder="Tell us more about your team size..." required></textarea></div>
                    <button type="submit" class="nav-cta" style="border: none; cursor: pointer; align-self: flex-start;">Submit request</button>
                </form>
            </div>
        </section>
    </main>

    <footer class="footer">
        <span>&copy; 2026 {{ data.business_name }}</span>
        <span>SaaS Dashboard. All rights reserved.</span>
    </footer>

    <script>
        async function loadBlogPosts() {
            const container = document.getElementById('blog-posts-container');
            try {
                const response = await fetch('blogs.json');
                if (!response.ok) throw new Error('No blogs');
                const data = await response.json();
                const blogs = data.blogs || [];
                if (blogs.length === 0) {
                    container.innerHTML = '<p style="grid-column: span 3; text-align: center;">No blog posts yet.</p>';
                    return;
                }
                container.innerHTML = blogs.slice(0, 3).map(blog => `
                    <div class="blog-card" onclick="window.location.href='blog-\${blog.slug}.html'">
                        <div class="blog-img">\${blog.title.charAt(0)}</div>
                        <div class="blog-info">
                            <h4>\${blog.title}</h4>
                            <p>\${blog.meta_description || 'Click to read full article'}</p>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                container.innerHTML = '<p style="grid-column: span 3; text-align: center;">No blog posts yet.</p>';
            }
        }
        document.addEventListener('DOMContentLoaded', loadBlogPosts);
    </script>
</body>
</html>"""

# ==========================================
# 12. CREATIVE PORTFOLIO (Syne/Plus Jakarta Sans, huge typography, wireframe orbital core)
# ==========================================
TEMPLATES_CONTENT["creative-portfolio"] = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ data.business_name }} | Creative Portfolio</title>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/website-ai/static/theme-adapter.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        :root {
            --bg-color: #0c0c0e;
            --text-color: #eaeaea;
            --text-title: #ffffff;
            --primary: #f43f5e;
            --primary-hover: #fb7185;
            --primary-glow: rgba(244, 63, 94, 0.2);
            --border-color: rgba(255,255,255,0.06);
            --card-bg: #141416;
            --font-headings: 'Syne', sans-serif;
            --font-body: 'Plus Jakarta Sans', sans-serif;
        }
        body {
            font-family: var(--font-body);
            background: var(--bg-color);
            color: var(--text-color);
            padding: 40px 24px;
            line-height: 1.8;
            overflow-x: hidden;
        }
        h1, h2, h3 { font-family: var(--font-headings); font-weight: 800; color: var(--text-title); letter-spacing: -0.5px; text-transform: uppercase; }

        /* Navigation */
        .navbar {
            background: rgba(12, 12, 14, 0.9);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border-color);
            position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
        }
        .nav-container {
            max-width: 1200px; margin: 0 auto; padding: 20px; display: flex; justify-content: space-between; align-items: center;
        }
        .nav-logo { font-size: 24px; font-weight: 800; text-decoration: none; color: var(--text-title); font-family: var(--font-headings); }
        .nav-logo span { color: var(--primary); }
        .nav-links { list-style: none; display: flex; gap: 28px; }
        .nav-links a { color: var(--text-color); text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; transition: color 0.2s; }
        .nav-links a:hover { color: var(--primary); }
        .nav-cta {
            background: var(--primary); color: white; padding: 10px 20px; border-radius: 0; text-decoration: none; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s;
        }
        .nav-cta:hover { background: var(--primary-hover); transform: translateY(-1px); }

        /* Hero */
        .hero {
            padding: 180px 24px 100px; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; max-width: 1200px; margin: 0 auto; align-items: center;
        }
        .hero-left { padding-right: 40px; }
        .hero-tag { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; color: var(--primary); margin-bottom: 20px; display: block; }
        .hero h1 { font-size: clamp(38px, 6vw, 64px); line-height: 1.05; margin-bottom: 24px; }
        .hero h1 em { font-style: italic; color: var(--primary-hover); }
        .hero p { font-size: 18px; color: var(--text-color); margin-bottom: 40px; }

        /* Rotating center visual */
        .portfolio-visual { display: flex; justify-content: center; position: relative; }
        .orbital-core {
            width: 200px; height: 200px; border-radius: 50%; border: 1.5px dashed var(--primary); animation: spin 20s linear infinite; display: flex; align-items: center; justify-content: center;
        }
        .orbital-inner { width: 140px; height: 140px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* Sections */
        .section { padding: 120px 24px; border-bottom: 1px solid var(--border-color); }
        .sec-container { max-width: 1100px; margin: 0 auto; }
        .sec-header { text-align: center; margin-bottom: 60px; }
        .sec-label { font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: var(--primary); font-weight: 800; display: block; margin-bottom: 10px; }
        .sec-title { font-size: 38px; font-weight: 800; }

        /* About layout */
        .about-layout { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 50px; align-items: center; }
        .about-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 40px; }
        .about-stats { display: flex; flex-direction: column; gap: 20px; }
        .stat-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 20px; text-align: center; }
        .stat-num { font-family: var(--font-headings); font-size: 36px; color: var(--primary); }

        /* Services grid */
        .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .service-card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 30px; transition: all 0.3s; }
        .service-card:hover { border-color: var(--primary); transform: translateY(-4px); box-shadow: 0 10px 25px var(--primary-glow); }
        .service-icon { font-size: 28px; margin-bottom: 16px; color: var(--primary); }
        .service-card h4 { font-size: 20px; margin-bottom: 10px; }

        /* FAQ columns */
        .faq-wrap { display: flex; flex-direction: column; gap: 16px; max-width: 800px; margin: 0 auto; }
        .faq-item { border-bottom: 1px solid var(--border-color); padding-bottom: 16px; }
        .faq-item summary { font-size: 16px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; }
        .faq-item summary::after { content: '+'; color: var(--primary); }
        .faq-item p { color: var(--text-color); font-size: 14px; margin-top: 10px; }

        /* Blog grid */
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .blog-card { background: var(--card-bg); border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s; }
        .blog-card:hover { border-color: var(--primary); }
        .blog-img { height: 160px; background: rgba(244, 63, 94, 0.05); display: flex; align-items: center; justify-content: center; font-size: 40px; color: var(--primary); border-bottom: 1px solid var(--border-color); }
        .blog-info { padding: 20px; }
        .blog-info h4 { font-family: var(--font-headings); font-size: 20px; margin-bottom: 10px; }
        .blog-info p { font-size: 13px; color: var(--text-color); }

        /* Contact Details */
        .contact-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 50px; }
        .contact-form { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 11px; text-transform: uppercase; color: var(--primary); }
        .form-group input, .form-group textarea { background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 12px; color: white; font-family: inherit; font-size: 14px; outline: none; }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--primary); }

        .footer {
            border-top: 1px solid var(--border-color); max-width: 1100px; margin: 60px auto 0; padding-top: 40px; display: flex; justify-content: space-between; font-size: 13px; color: var(--text-color);
        }

        @media (max-width: 992px) {
            .hero { grid-template-columns: 1fr; gap: 40px; }
            .hero-left { padding-right: 0; }
            .about-layout { grid-template-columns: 1fr; }
            .services-grid { grid-template-columns: 1fr; }
            .blog-grid { grid-template-columns: 1fr; }
            .contact-layout { grid-template-columns: 1fr; }
        }
    </style>
    <script src="/website-ai/static/editor.js" defer></script>
</head>
<body data-theme="creative-portfolio">
    <nav class="navbar">
        <div class="nav-container">
            <a href="#" class="nav-logo">Creative<span>Studio</span></a>
            <ul class="nav-links">
                <li><a href="#about">Philosophy</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
            <a href="#contact" class="nav-cta">Get Quote</a>
        </div>
    </nav>

    <header class="hero">
        <div class="hero-left">
            <span class="hero-tag">✦ Artistic Design Studio</span>
            <h1>Curating premium <em>artistic</em> interfaces</h1>
            <p>{{ content.about }}</p>
            <a href="#contact" class="nav-cta" style="padding: 14px 28px;">Initiate Project</a>
        </div>
        <div class="portfolio-visual">
            <div class="orbital-core">
                <div class="orbital-inner"></div>
            </div>
        </div>
    </header>

    <main class="sec-container">
        <!-- ABOUT -->
        <section id="about" class="section">
            <div class="sec-header">
                <span class="sec-label">Philosophy</span>
                <h2 class="sec-title">Our Manifesto</h2>
            </div>
            <div class="about-layout">
                <div class="about-card">
                    <p style="font-size: 18px; font-family: var(--font-headings); margin-bottom: 20px; line-height: 1.8;">{{ content.about }}</p>
                    <p>{{ theme_state.support_line }} We structure premium layouts using rotating core wireframes and custom typography.</p>
                </div>
                <div class="about-stats">
                    <div class="stat-card">
                        <div class="stat-num">99%</div>
                        <div style="font-size: 12px; text-transform: uppercase;">Satisfaction</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num">150+</div>
                        <div style="font-size: 12px; text-transform: uppercase;">Deploys</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SERVICES -->
        <section id="services" class="section">
            <div class="sec-header">
                <span class="sec-label">Offerings</span>
                <h2 class="sec-title">What We Do</h2>
            </div>
            <div class="services-grid">
                {% for service in content.services %}
                <div class="service-card">
                    <div class="service-icon">✦</div>
                    <h4>{{ service.name }}</h4>
                    <p style="font-size: 14px; color: var(--text-color); margin-top: 8px;">{{ service.description }}</p>
                </div>
                {% endfor %}
            </div>
        </section>

        <!-- FAQ -->
        <section id="faq" class="section">
            <div class="sec-header">
                <span class="sec-label">FAQ</span>
                <h2 class="sec-title">Common Questions</h2>
            </div>
            <div class="faq-wrap">
                {% for item in content.faq %}
                <details class="faq-item">
                    <summary>{{ item.question }}</summary>
                    <p>{{ item.answer }}</p>
                </details>
                {% endfor %}
            </div>
        </section>

        <!-- BLOG -->
        <section id="blog" class="section">
            <div class="sec-header">
                <span class="sec-label">Journal</span>
                <h2 class="sec-title">Recent Entries</h2>
            </div>
            <div id="blog-posts-container" class="blog-grid">
                <div style="grid-column: span 3; text-align: center;">Loading feed...</div>
            </div>
        </section>

        <!-- CONTACT -->
        <section id="contact" class="section" style="border-bottom: none;">
            <div class="sec-header">
                <span class="sec-label">Connection</span>
                <h2 class="sec-title">Start Project</h2>
            </div>
            <div class="contact-layout">
                <div>
                    <p style="font-size: 18px; font-family: var(--font-headings); margin-bottom: 24px;">{{ content.contact }}</p>
                    <div style="font-size: 13px; color: var(--text-color); display: flex; flex-direction: column; gap: 12px;">
                        <p>📍 downtown design block 4, city</p>
                        <p>📞 concierge: {{ data.contact_phone or '+1 (555) 918-0928' }}</p>
                        <p>✉️ email: {{ data.contact_email or 'hello@saadhyam.ai' }}</p>
                    </div>
                </div>
                <form class="contact-form" onsubmit="event.preventDefault(); alert('Request logged!');">
                    <div class="form-group"><label>First Name</label><input type="text" placeholder="John" required /></div>
                    <div class="form-group"><label>Email Address</label><input type="email" placeholder="john@example.com" required /></div>
                    <div class="form-group"><label>Your Message</label><textarea rows="3" placeholder="Tell us more about your artistic goals..." required></textarea></div>
                    <button type="submit" class="nav-cta" style="border: none; cursor: pointer; align-self: flex-start;">Send Request</button>
                </form>
            </div>
        </section>
    </main>

    <footer class="footer">
        <span>&copy; 2026 {{ data.business_name }}</span>
        <span>Creative Studio. All rights reserved.</span>
    </footer>

    <script>
        async function loadBlogPosts() {
            const container = document.getElementById('blog-posts-container');
            try {
                const response = await fetch('blogs.json');
                if (!response.ok) throw new Error('No blogs');
                const data = await response.json();
                const blogs = data.blogs || [];
                if (blogs.length === 0) {
                    container.innerHTML = '<p style="grid-column: span 3; text-align: center;">No blog posts yet.</p>';
                    return;
                }
                container.innerHTML = blogs.slice(0, 3).map(blog => `
                    <div class="blog-card" onclick="window.location.href='blog-\${blog.slug}.html'">
                        <div class="blog-img">\${blog.title.charAt(0)}</div>
                        <div class="blog-info">
                            <h4>\${blog.title}</h4>
                            <p>\${blog.meta_description || 'Click to read full article'}</p>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                container.innerHTML = '<p style="grid-column: span 3; text-align: center;">No blog posts yet.</p>';
            }
        }
        document.addEventListener('DOMContentLoaded', loadBlogPosts);
    </script>
</body>
</html>"""


def generate_theme_file(theme_id, html):
    output_path = TEMPLATES_DIR / f"{theme_id}.html"
    print(f"Generating {theme_id}.html...")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html.strip())
    print(f"  [OK] Saved to {output_path}")


def main():
    TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
    for theme_id, html in TEMPLATES_CONTENT.items():
        generate_theme_file(theme_id, html)
    print("All premium templates successfully rebuilt!")


if __name__ == "__main__":
    main()
