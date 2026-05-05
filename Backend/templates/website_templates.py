"""
Website HTML Templates
Different HTML templates for various themes
"""

"""
Website HTML Templates
Professional business-focused templates with dynamic content
"""

def get_business_colors(business_type):
    """Get appropriate color schemes based on business type"""
    color_schemes = {
        "restaurant": {"primary": "#d97706", "secondary": "#059669", "accent": "#dc2626"},
        "spa": {"primary": "#7c3aed", "secondary": "#06b6d4", "accent": "#ec4899"},
        "fitness": {"primary": "#dc2626", "secondary": "#059669", "accent": "#f59e0b"},
        "retail": {"primary": "#2563eb", "secondary": "#7c3aed", "accent": "#059669"},
        "consulting": {"primary": "#1f2937", "secondary": "#3b82f6", "accent": "#10b981"},
        "healthcare": {"primary": "#0ea5e9", "secondary": "#059669", "accent": "#6366f1"},
        "technology": {"primary": "#4f46e5", "secondary": "#06b6d4", "accent": "#8b5cf6"},
        "education": {"primary": "#059669", "secondary": "#3b82f6", "accent": "#f59e0b"},
        "real estate": {"primary": "#1f2937", "secondary": "#d97706", "accent": "#dc2626"},
        "legal": {"primary": "#1f2937", "secondary": "#3b82f6", "accent": "#6b7280"},
    }
    
    business_lower = business_type.lower()
    for key in color_schemes:
        if key in business_lower:
            return color_schemes[key]
    
    # Default professional colors
    return {"primary": "#1f2937", "secondary": "#3b82f6", "accent": "#059669"}

def get_business_images(business_type):
    """Get appropriate stock images based on business type"""
    image_map = {
        "restaurant": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200",
        "spa": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200",
        "fitness": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200",
        "retail": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
        "consulting": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200",
        "healthcare": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200",
        "technology": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200",
        "education": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200",
        "real estate": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200",
        "legal": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200",
    }
    
    business_lower = business_type.lower()
    for key in image_map:
        if key in business_lower:
            return image_map[key]
    
    return "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200"

def get_hero_split_template(request, sections, services_list):
    """Hero Split Template - Professional split hero with business focus"""
    
    colors = get_business_colors(request.business_type)
    hero_image = get_business_images(request.business_type)
    
    # Generate services HTML
    services_html = ""
    if services_list:
        service_cards = ""
        for i, service in enumerate(services_list[:6]):
            service_cards += f'''
            <div class="service-card" style="animation-delay: {i * 0.1}s;">
                <div class="service-icon">
                    <div class="icon-circle"></div>
                </div>
                <h3>{service}</h3>
                <p>Professional {service.lower()} services tailored to your business needs and goals.</p>
                <a href="#contact" class="service-link">Learn More →</a>
            </div>'''
        services_html = f'''
        <section class="services-section">
            <div class="container">
                <h2>Our Services</h2>
                <p class="section-subtitle">Comprehensive {request.business_type.lower()} solutions designed for success</p>
                <div class="services-grid">{service_cards}</div>
            </div>
        </section>'''
    
    # Generate testimonials section
    testimonials_html = f'''
    <section class="testimonials-section">
        <div class="container">
            <h2>What Our Clients Say</h2>
            <div class="testimonials-grid">
                <div class="testimonial-card">
                    <div class="stars">★★★★★</div>
                    <p>"Exceptional {request.business_type.lower()} service. {request.business_name} exceeded our expectations in every way."</p>
                    <div class="testimonial-author">
                        <strong>Sarah Johnson</strong>
                        <span>Satisfied Customer</span>
                    </div>
                </div>
                <div class="testimonial-card">
                    <div class="stars">★★★★★</div>
                    <p>"Professional, reliable, and results-driven. Highly recommend {request.business_name} for anyone seeking quality {request.business_type.lower()} services."</p>
                    <div class="testimonial-author">
                        <strong>Michael Chen</strong>
                        <span>Business Partner</span>
                    </div>
                </div>
            </div>
        </div>
    </section>'''
    
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{request.business_name} - Professional {request.business_type} Services</title>
    <meta name="description" content="{request.description or f'Professional {request.business_type.lower()} services by {request.business_name}. Contact us today for exceptional results.'}">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        
        body {{ 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            overflow-x: hidden;
        }}
        
        .container {{ max-width: 1200px; margin: 0 auto; padding: 0 2rem; }}
        
        /* Navigation */
        .navbar {{
            position: fixed;
            top: 0;
            width: 100%;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            z-index: 1000;
            padding: 1rem 0;
            transition: all 0.3s ease;
        }}
        
        .nav-content {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
        }}
        
        .logo {{
            font-size: 1.5rem;
            font-weight: 700;
            color: {colors['primary']};
        }}
        
        .nav-links {{
            display: flex;
            gap: 2rem;
            list-style: none;
        }}
        
        .nav-links a {{
            text-decoration: none;
            color: #374151;
            font-weight: 500;
            transition: color 0.3s ease;
        }}
        
        .nav-links a:hover {{
            color: {colors['primary']};
        }}
        
        /* Hero Section */
        .hero {{ 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            min-height: 100vh; 
            align-items: center;
        }}
        
        .hero-content {{ 
            padding: 6rem 4rem; 
            background: linear-gradient(135deg, {colors['primary']} 0%, {colors['secondary']} 100%); 
            color: white; 
            display: flex;
            flex-direction: column;
            justify-content: center;
        }}
        
        .hero-image {{ 
            background: url('{hero_image}') center/cover; 
            position: relative;
        }}
        
        .hero-image::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.3));
        }}
        
        .hero h1 {{ 
            font-size: 3.5rem; 
            margin-bottom: 1.5rem; 
            font-weight: 700; 
            line-height: 1.2;
        }}
        
        .hero-subtitle {{
            font-size: 1.25rem;
            margin-bottom: 1rem;
            opacity: 0.9;
            font-weight: 500;
        }}
        
        .hero p {{ 
            font-size: 1.1rem; 
            opacity: 0.9; 
            margin-bottom: 2.5rem; 
            line-height: 1.6;
        }}
        
        .cta-buttons {{
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }}
        
        .cta-button {{ 
            background: white; 
            color: {colors['primary']}; 
            padding: 1rem 2rem; 
            border: none; 
            border-radius: 50px; 
            font-weight: 600; 
            cursor: pointer; 
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
        }}
        
        .cta-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }}
        
        .cta-button.secondary {{
            background: transparent;
            color: white;
            border: 2px solid white;
        }}
        
        /* About Section */
        .about-section {{ 
            padding: 6rem 0; 
            background: #f9fafb;
        }}
        
        .about-content {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            align-items: center;
        }}
        
        .about-text h2 {{ 
            font-size: 2.5rem; 
            margin-bottom: 1.5rem; 
            color: {colors['primary']};
            font-weight: 700;
        }}
        
        .about-text p {{
            font-size: 1.1rem;
            color: #4b5563;
            margin-bottom: 2rem;
            line-height: 1.7;
        }}
        
        .about-stats {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
        }}
        
        .stat-item {{
            text-align: center;
            padding: 1.5rem;
            background: white;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }}
        
        .stat-number {{
            font-size: 2.5rem;
            font-weight: 700;
            color: {colors['primary']};
            display: block;
        }}
        
        .stat-label {{
            color: #6b7280;
            font-weight: 500;
        }}
        
        /* Services Section */
        .services-section {{ 
            padding: 6rem 0; 
            background: white;
        }}
        
        .services-section h2 {{ 
            font-size: 2.5rem; 
            margin-bottom: 1rem; 
            text-align: center; 
            color: {colors['primary']};
            font-weight: 700;
        }}
        
        .section-subtitle {{
            text-align: center;
            font-size: 1.1rem;
            color: #6b7280;
            margin-bottom: 3rem;
        }}
        
        .services-grid {{ 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
            gap: 2rem; 
            margin-top: 3rem; 
        }}
        
        .service-card {{ 
            background: white; 
            padding: 2.5rem; 
            border-radius: 20px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
            text-align: center;
            transition: all 0.3s ease;
            border: 1px solid #f3f4f6;
            opacity: 0;
            animation: fadeInUp 0.6s ease forwards;
        }}
        
        .service-card:hover {{
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }}
        
        .service-icon {{
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            position: relative;
        }}
        
        .icon-circle {{
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, {colors['primary']}, {colors['secondary']});
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        
        .service-card h3 {{
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: {colors['primary']};
            font-weight: 600;
        }}
        
        .service-card p {{
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }}
        
        .service-link {{
            color: {colors['secondary']};
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s ease;
        }}
        
        .service-link:hover {{
            color: {colors['primary']};
        }}
        
        /* Testimonials Section */
        .testimonials-section {{
            padding: 6rem 0;
            background: #f9fafb;
        }}
        
        .testimonials-section h2 {{
            font-size: 2.5rem;
            text-align: center;
            margin-bottom: 3rem;
            color: {colors['primary']};
            font-weight: 700;
        }}
        
        .testimonials-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
        }}
        
        .testimonial-card {{
            background: white;
            padding: 2.5rem;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }}
        
        .stars {{
            color: #fbbf24;
            font-size: 1.2rem;
            margin-bottom: 1rem;
        }}
        
        .testimonial-card p {{
            font-style: italic;
            color: #4b5563;
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }}
        
        .testimonial-author strong {{
            color: {colors['primary']};
            display: block;
        }}
        
        .testimonial-author span {{
            color: #6b7280;
            font-size: 0.9rem;
        }}
        
        /* Contact Section */
        .contact-section {{
            padding: 6rem 0;
            background: linear-gradient(135deg, {colors['primary']} 0%, {colors['secondary']} 100%);
            color: white;
        }}
        
        .contact-content {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            align-items: center;
        }}
        
        .contact-info h2 {{
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
            font-weight: 700;
        }}
        
        .contact-info p {{
            font-size: 1.1rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }}
        
        .contact-details {{
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }}
        
        .contact-item {{
            display: flex;
            align-items: center;
            gap: 1rem;
        }}
        
        .contact-form {{
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }}
        
        .form-group {{
            margin-bottom: 1.5rem;
        }}
        
        .form-group input,
        .form-group textarea {{
            width: 100%;
            padding: 1rem;
            border: none;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.9);
            font-size: 1rem;
        }}
        
        .submit-btn {{
            background: white;
            color: {colors['primary']};
            padding: 1rem 2rem;
            border: none;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s ease;
        }}
        
        .submit-btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }}
        
        /* Footer */
        .footer {{
            background: #1f2937;
            color: white;
            text-align: center;
            padding: 3rem 0;
        }}
        
        .footer p {{
            opacity: 0.8;
        }}
        
        /* Animations */
        @keyframes fadeInUp {{
            from {{
                opacity: 0;
                transform: translateY(30px);
            }}
            to {{
                opacity: 1;
                transform: translateY(0);
            }}
        }}
        
        /* Responsive Design */
        @media (max-width: 768px) {{ 
            .hero {{ grid-template-columns: 1fr; }}
            .hero-content {{ padding: 4rem 2rem; }}
            .hero h1 {{ font-size: 2.5rem; }}
            .about-content {{ grid-template-columns: 1fr; }}
            .contact-content {{ grid-template-columns: 1fr; }}
            .services-grid {{ grid-template-columns: 1fr; }}
            .testimonials-grid {{ grid-template-columns: 1fr; }}
            .nav-links {{ display: none; }}
        }}
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-content">
            <div class="logo">{request.business_name}</div>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </div>
    </nav>

    <section class="hero" id="home">
        <div class="hero-content">
            <div class="hero-subtitle">Professional {request.business_type}</div>
            <h1>{request.business_name}</h1>
            <p>{sections[0].content if sections else f'Welcome to {request.business_name}, your trusted partner for professional {request.business_type.lower()} services.'}</p>
            <div class="cta-buttons">
                <a href="#contact" class="cta-button">Get Started Today</a>
                <a href="#services" class="cta-button secondary">Our Services</a>
            </div>
        </div>
        <div class="hero-image"></div>
    </section>
    
    <section class="about-section" id="about">
        <div class="container">
            <div class="about-content">
                <div class="about-text">
                    <h2>About {request.business_name}</h2>
                    <p>{sections[1].content if len(sections) > 1 else f'At {request.business_name}, we specialize in delivering exceptional {request.business_type.lower()} services. Our commitment to excellence and customer satisfaction sets us apart in the industry.'}</p>
                    {f'<p><strong>Our Approach:</strong> {request.tone.title()} and professional service delivery.</p>' if request.tone else ''}
                    {f'<p><strong>Style:</strong> {request.branding_style.title()} approach to {request.business_type.lower()}.</p>' if request.branding_style else ''}
                </div>
                <div class="about-stats">
                    <div class="stat-item">
                        <span class="stat-number">100+</span>
                        <span class="stat-label">Happy Clients</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">5+</span>
                        <span class="stat-label">Years Experience</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">24/7</span>
                        <span class="stat-label">Support</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">99%</span>
                        <span class="stat-label">Satisfaction</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    {services_html}
    
    {testimonials_html}
    
    <section class="contact-section" id="contact">
        <div class="container">
            <div class="contact-content">
                <div class="contact-info">
                    <h2>Ready to Get Started?</h2>
                    <p>Contact {request.business_name} today and discover how our professional {request.business_type.lower()} services can help you achieve your goals.</p>
                    <div class="contact-details">
                        {f'<div class="contact-item"><strong>📧 Email:</strong> {request.contact_email}</div>' if request.contact_email else ''}
                        {f'<div class="contact-item"><strong>📞 Phone:</strong> {request.contact_phone}</div>' if request.contact_phone else ''}
                        {f'<div class="contact-item"><strong>🌐 Website:</strong> {request.website_url}</div>' if request.website_url else ''}
                        <div class="contact-item"><strong>🎯 Specialization:</strong> {request.business_type}</div>
                    </div>
                </div>
                <div class="contact-form">
                    <form>
                        <div class="form-group">
                            <input type="text" placeholder="Your Name" required>
                        </div>
                        <div class="form-group">
                            <input type="email" placeholder="Your Email" required>
                        </div>
                        <div class="form-group">
                            <input type="tel" placeholder="Your Phone">
                        </div>
                        <div class="form-group">
                            <textarea rows="4" placeholder="How can we help you?" required></textarea>
                        </div>
                        <button type="submit" class="submit-btn">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    </section>
    
    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 {request.business_name}. All rights reserved. | Professional {request.business_type} Services | Generated by Saadhyam AI</p>
        </div>
    </footer>

    <script>
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {{
            anchor.addEventListener('click', function (e) {{
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({{
                    behavior: 'smooth'
                }});
            }});
        }});

        // Navbar scroll effect
        window.addEventListener('scroll', function() {{
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 100) {{
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
            }} else {{
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = 'none';
            }}
        }});
    </script>
</body>
</html>'''

def get_bento_box_template(request, sections, services_list):
    """Bento Box Template - Modern business dashboard style"""
    
    colors = get_business_colors(request.business_type)
    hero_image = get_business_images(request.business_type)
    
    # Generate services list HTML
    services_html = ""
    for service in services_list[:4]:
        services_html += f'<div class="service-tag">{service}</div>'
    
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{request.business_name} - Modern {request.business_type} Solutions</title>
    <meta name="description" content="Modern {request.business_type.lower()} solutions by {request.business_name}. Professional services with innovative approach.">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        
        body {{ 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
        }}
        
        .container {{ 
            max-width: 1400px; 
            margin: 0 auto; 
            padding: 2rem; 
        }}
        
        .header {{
            text-align: center;
            margin-bottom: 3rem;
        }}
        
        .header h1 {{
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(135deg, {colors['primary']}, {colors['secondary']});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
        }}
        
        .header p {{
            font-size: 1.2rem;
            color: #64748b;
            max-width: 600px;
            margin: 0 auto;
        }}
        
        .bento-grid {{ 
            display: grid; 
            grid-template-columns: repeat(6, 1fr); 
            grid-template-rows: repeat(4, 200px); 
            gap: 1.5rem; 
        }}
        
        .bento-item {{ 
            background: white; 
            border-radius: 24px; 
            padding: 2rem; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.08); 
            display: flex; 
            flex-direction: column; 
            justify-content: center;
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.2);
            position: relative;
            overflow: hidden;
        }}
        
        .bento-item:hover {{
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }}
        
        .bento-item::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, {colors['primary']}, {colors['secondary']});
        }}
        
        /* Hero Box */
        .hero-box {{ 
            grid-column: 1 / 4; 
            grid-row: 1 / 3; 
            background: linear-gradient(135deg, {colors['primary']} 0%, {colors['secondary']} 100%); 
            color: white;
            text-align: center;
            position: relative;
        }}
        
        .hero-box::before {{
            background: rgba(255,255,255,0.1);
        }}
        
        .hero-box h1 {{ 
            font-size: 2.5rem; 
            margin-bottom: 1rem; 
            font-weight: 700;
        }}
        
        .hero-box p {{
            font-size: 1.1rem;
            opacity: 0.9;
            margin-bottom: 2rem;
        }}
        
        .hero-cta {{
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }}
        
        .hero-cta:hover {{
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }}
        
        /* About Box */
        .about-box {{ 
            grid-column: 4 / 7; 
            grid-row: 1 / 2; 
            background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
        }}
        
        .about-box h3 {{
            color: {colors['primary']};
            font-size: 1.3rem;
            margin-bottom: 1rem;
            font-weight: 600;
        }}
        
        .about-box p {{
            color: #475569;
            line-height: 1.6;
        }}
        
        /* Services Box */
        .services-box {{ 
            grid-column: 4 / 6; 
            grid-row: 2 / 4; 
            background: linear-gradient(135deg, #fef3c7, #fde68a);
        }}
        
        .services-box h3 {{
            color: #92400e;
            font-size: 1.3rem;
            margin-bottom: 1.5rem;
            font-weight: 600;
        }}
        
        .service-tag {{
            display: inline-block;
            background: rgba(146, 64, 14, 0.1);
            color: #92400e;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            margin: 0.25rem;
            font-weight: 500;
        }}
        
        /* Contact Box */
        .contact-box {{ 
            grid-column: 6 / 7; 
            grid-row: 2 / 4; 
            background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        }}
        
        .contact-box h3 {{
            color: #1e40af;
            font-size: 1.3rem;
            margin-bottom: 1rem;
            font-weight: 600;
        }}
        
        .contact-item {{
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
            color: #1e3a8a;
            font-size: 0.9rem;
        }}
        
        /* Stats Box */
        .stats-box {{ 
            grid-column: 1 / 3; 
            grid-row: 3 / 5; 
            background: linear-gradient(135deg, #dcfce7, #bbf7d0);
            text-align: center;
        }}
        
        .stats-box h3 {{
            color: #166534;
            font-size: 1.3rem;
            margin-bottom: 1.5rem;
            font-weight: 600;
        }}
        
        .stat-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }}
        
        .stat-item {{
            text-align: center;
        }}
        
        .stat-number {{
            font-size: 1.8rem;
            font-weight: 700;
            color: #166534;
            display: block;
        }}
        
        .stat-label {{
            font-size: 0.8rem;
            color: #16a34a;
            font-weight: 500;
        }}
        
        /* Image Box */
        .image-box {{ 
            grid-column: 3 / 5; 
            grid-row: 3 / 5; 
            background: url('{hero_image}') center/cover;
            position: relative;
        }}
        
        .image-box::after {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(0,0,0,0.2), rgba(0,0,0,0.4));
            border-radius: 20px;
        }}
        
        .image-overlay {{
            position: absolute;
            bottom: 2rem;
            left: 2rem;
            color: white;
            z-index: 1;
        }}
        
        .image-overlay h4 {{
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }}
        
        .image-overlay p {{
            font-size: 0.9rem;
            opacity: 0.9;
        }}
        
        /* CTA Box */
        .cta-box {{ 
            grid-column: 5 / 7; 
            grid-row: 4 / 5; 
            background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
            text-align: center;
        }}
        
        .cta-box h3 {{
            color: #7c3aed;
            font-size: 1.3rem;
            margin-bottom: 1rem;
            font-weight: 600;
        }}
        
        .cta-button {{
            background: linear-gradient(135deg, #7c3aed, #a855f7);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }}
        
        .cta-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(124, 58, 237, 0.3);
        }}
        
        /* Responsive Design */
        @media (max-width: 1200px) {{ 
            .bento-grid {{ 
                grid-template-columns: repeat(4, 1fr); 
                grid-template-rows: repeat(6, 180px);
            }}
            
            .hero-box {{ grid-column: 1 / 3; grid-row: 1 / 3; }}
            .about-box {{ grid-column: 3 / 5; grid-row: 1 / 2; }}
            .services-box {{ grid-column: 3 / 5; grid-row: 2 / 4; }}
            .contact-box {{ grid-column: 1 / 3; grid-row: 3 / 4; }}
            .stats-box {{ grid-column: 1 / 3; grid-row: 4 / 6; }}
            .image-box {{ grid-column: 3 / 5; grid-row: 4 / 6; }}
            .cta-box {{ grid-column: 1 / 5; grid-row: 6 / 7; }}
        }}
        
        @media (max-width: 768px) {{ 
            .bento-grid {{ 
                grid-template-columns: 1fr; 
                grid-template-rows: auto;
                gap: 1rem;
            }}
            
            .bento-item {{ 
                grid-column: 1 !important; 
                grid-row: auto !important;
                min-height: 200px;
            }}
            
            .header h1 {{
                font-size: 2rem;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{request.business_name}</h1>
            <p>Modern {request.business_type} solutions designed for today's business needs</p>
        </div>
        
        <div class="bento-grid">
            <div class="bento-item hero-box">
                <h1>Excellence in {request.business_type}</h1>
                <p>{sections[0].content[:100] if sections else f'Professional {request.business_type.lower()} services'}...</p>
                <button class="hero-cta">Get Started</button>
            </div>
            
            <div class="bento-item about-box">
                <h3>About Us</h3>
                <p>{sections[1].content[:120] if len(sections) > 1 else f'We are a leading {request.business_type.lower()} company committed to delivering exceptional results for our clients.'}...</p>
            </div>
            
            <div class="bento-item services-box">
                <h3>Our Services</h3>
                <div class="services-container">
                    {services_html}
                </div>
            </div>
            
            <div class="bento-item contact-box">
                <h3>Contact</h3>
                {f'<div class="contact-item">📧 {request.contact_email}</div>' if request.contact_email else ''}
                {f'<div class="contact-item">📞 {request.contact_phone}</div>' if request.contact_phone else ''}
                <div class="contact-item">🎯 {request.business_type}</div>
                {f'<div class="contact-item">🌐 {request.website_url}</div>' if request.website_url else ''}
            </div>
            
            <div class="bento-item stats-box">
                <h3>Our Impact</h3>
                <div class="stat-grid">
                    <div class="stat-item">
                        <span class="stat-number">500+</span>
                        <span class="stat-label">Clients</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">99%</span>
                        <span class="stat-label">Success</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">24/7</span>
                        <span class="stat-label">Support</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">5★</span>
                        <span class="stat-label">Rating</span>
                    </div>
                </div>
            </div>
            
            <div class="bento-item image-box">
                <div class="image-overlay">
                    <h4>Professional {request.business_type}</h4>
                    <p>Quality service you can trust</p>
                </div>
            </div>
            
            <div class="bento-item cta-box">
                <h3>Ready to Start?</h3>
                <button class="cta-button">Contact Us Today</button>
            </div>
        </div>
    </div>

    <script>
        // Add hover effects and interactions
        document.querySelectorAll('.bento-item').forEach(item => {{
            item.addEventListener('mouseenter', function() {{
                this.style.transform = 'translateY(-8px) scale(1.02)';
            }});
            
            item.addEventListener('mouseleave', function() {{
                this.style.transform = 'translateY(0) scale(1)';
            }});
        }});
    </script>
</body>
</html>'''

def get_card_masonry_template(request, sections, services_list):
    """Card Masonry Template - Pinterest-style business showcase"""
    
    colors = get_business_colors(request.business_type)
    hero_image = get_business_images(request.business_type)
    
    # Generate service cards HTML
    service_cards_html = ""
    for i, service in enumerate(services_list[:6]):
        card_height = ["250px", "200px", "300px", "220px", "280px", "240px"][i % 6]
        service_cards_html += f'''
        <div class="card service-card" style="height: {card_height};">
            <div class="card-header">
                <div class="service-icon">
                    <div class="icon-bg"></div>
                </div>
                <h3>{service}</h3>
            </div>
            <div class="card-content">
                <p>Expert {service.lower()} solutions designed to meet your specific business requirements and drive measurable results.</p>
                <div class="card-footer">
                    <span class="price-tag">Professional Service</span>
                    <a href="#contact" class="learn-more">Learn More →</a>
                </div>
            </div>
        </div>'''
    
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{request.business_name} - Professional {request.business_type} Portfolio</title>
    <meta name="description" content="Discover our comprehensive {request.business_type.lower()} services at {request.business_name}. Professional solutions with proven results.">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        
        body {{ 
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            line-height: 1.6;
        }}
        
        /* Header */
        .header {{ 
            text-align: center; 
            padding: 6rem 2rem 4rem; 
            background: linear-gradient(135deg, {colors['primary']} 0%, {colors['secondary']} 100%);
            color: white;
            position: relative;
            overflow: hidden;
        }}
        
        .header::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('{hero_image}') center/cover;
            opacity: 0.1;
        }}
        
        .header-content {{
            position: relative;
            z-index: 1;
            max-width: 800px;
            margin: 0 auto;
        }}
        
        .header h1 {{ 
            font-size: 3.5rem; 
            color: white; 
            margin-bottom: 1rem; 
            font-weight: 700;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }}
        
        .header-subtitle {{
            font-size: 1.3rem;
            margin-bottom: 1rem;
            opacity: 0.95;
            font-weight: 500;
        }}
        
        .header p {{
            font-size: 1.1rem;
            opacity: 0.9;
            margin-bottom: 2rem;
        }}
        
        .header-cta {{
            display: inline-flex;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
        }}
        
        .cta-btn {{
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 1rem 2rem;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }}
        
        .cta-btn:hover {{
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }}
        
        .cta-btn.primary {{
            background: white;
            color: {colors['primary']};
            border-color: white;
        }}
        
        /* Masonry Layout */
        .masonry-container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 4rem 2rem;
        }}
        
        .section-header {{
            text-align: center;
            margin-bottom: 3rem;
        }}
        
        .section-header h2 {{
            font-size: 2.5rem;
            color: {colors['primary']};
            margin-bottom: 1rem;
            font-weight: 700;
        }}
        
        .section-header p {{
            font-size: 1.1rem;
            color: #64748b;
            max-width: 600px;
            margin: 0 auto;
        }}
        
        .masonry {{ 
            column-count: 3; 
            column-gap: 2rem; 
            column-fill: balance;
        }}
        
        .card {{ 
            break-inside: avoid; 
            background: white; 
            margin-bottom: 2rem; 
            border-radius: 20px; 
            overflow: hidden; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.08); 
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.2);
        }}
        
        .card:hover {{
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }}
        
        .card-image {{ 
            height: 200px; 
            background: linear-gradient(135deg, {colors['primary']}, {colors['secondary']}); 
            position: relative;
            overflow: hidden;
        }}
        
        .card-image::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('{hero_image}') center/cover;
            opacity: 0.3;
        }}
        
        .card-content {{ 
            padding: 2rem; 
        }}
        
        .card h3 {{ 
            color: {colors['primary']}; 
            margin-bottom: 1rem; 
            font-size: 1.4rem;
            font-weight: 600;
        }}
        
        .card p {{ 
            color: #64748b; 
            line-height: 1.7; 
            margin-bottom: 1.5rem;
        }}
        
        /* Hero Card */
        .hero-card {{ 
            background: linear-gradient(135deg, {colors['primary']} 0%, {colors['secondary']} 100%); 
            color: white; 
            height: 350px;
        }}
        
        .hero-card .card-content {{ 
            padding: 3rem 2rem; 
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
        }}
        
        .hero-card h3 {{
            color: white;
            font-size: 1.8rem;
            margin-bottom: 1.5rem;
        }}
        
        .hero-card p {{
            color: rgba(255,255,255,0.9);
            font-size: 1.1rem;
        }}
        
        /* Service Card */
        .service-card {{ 
            border-left: 4px solid {colors['accent']}; 
        }}
        
        .card-header {{
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }}
        
        .service-icon {{
            width: 50px;
            height: 50px;
            position: relative;
        }}
        
        .icon-bg {{
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, {colors['primary']}, {colors['secondary']});
            border-radius: 12px;
            opacity: 0.1;
        }}
        
        .card-footer {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1rem;
        }}
        
        .price-tag {{
            background: {colors['accent']};
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }}
        
        .learn-more {{
            color: {colors['secondary']};
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s ease;
        }}
        
        .learn-more:hover {{
            color: {colors['primary']};
        }}
        
        /* About Card */
        .about-card {{
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            height: 280px;
        }}
        
        /* Contact Card */
        .contact-card {{
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            height: 320px;
        }}
        
        .contact-card h3 {{
            color: #92400e;
        }}
        
        .contact-item {{
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
            color: #92400e;
            font-weight: 500;
        }}
        
        .contact-item .icon {{
            font-size: 1.2rem;
        }}
        
        /* Stats Card */
        .stats-card {{
            background: linear-gradient(135deg, #dcfce7, #bbf7d0);
            height: 300px;
        }}
        
        .stats-card h3 {{
            color: #166534;
            text-align: center;
            margin-bottom: 2rem;
        }}
        
        .stats-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
        }}
        
        .stat-item {{
            text-align: center;
        }}
        
        .stat-number {{
            font-size: 2rem;
            font-weight: 700;
            color: #166534;
            display: block;
        }}
        
        .stat-label {{
            color: #16a34a;
            font-size: 0.9rem;
            font-weight: 500;
        }}
        
        /* Testimonial Card */
        .testimonial-card {{
            background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
            height: 280px;
        }}
        
        .testimonial-card h3 {{
            color: #7c3aed;
        }}
        
        .stars {{
            color: #fbbf24;
            font-size: 1.2rem;
            margin-bottom: 1rem;
        }}
        
        .testimonial-text {{
            font-style: italic;
            color: #6b46c1;
            margin-bottom: 1rem;
        }}
        
        .testimonial-author {{
            color: #7c3aed;
            font-weight: 600;
        }}
        
        /* Responsive Design */
        @media (max-width: 1024px) {{ 
            .masonry {{ column-count: 2; }}
            .header h1 {{ font-size: 2.8rem; }}
        }}
        
        @media (max-width: 768px) {{ 
            .masonry {{ column-count: 1; }}
            .header h1 {{ font-size: 2.2rem; }}
            .header {{ padding: 4rem 1rem 3rem; }}
            .masonry-container {{ padding: 3rem 1rem; }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="header-subtitle">Professional {request.business_type}</div>
            <h1>{request.business_name}</h1>
            <p>Your trusted partner for exceptional {request.business_type.lower()} services and solutions</p>
            <div class="header-cta">
                <a href="#services" class="cta-btn primary">Explore Services</a>
                <a href="#contact" class="cta-btn">Get Quote</a>
            </div>
        </div>
    </div>
    
    <div class="masonry-container">
        <div class="section-header">
            <h2>Our Portfolio</h2>
            <p>Discover our comprehensive range of professional services and solutions</p>
        </div>
        
        <div class="masonry" id="services">
            <div class="card hero-card">
                <div class="card-content">
                    <h3>Welcome to Excellence</h3>
                    <p>{sections[0].content if sections else f'Experience the difference with {request.business_name}. We deliver professional {request.business_type.lower()} services that exceed expectations.'}</p>
                </div>
            </div>
            
            <div class="card about-card">
                <div class="card-content">
                    <h3>About {request.business_name}</h3>
                    <p>{sections[1].content if len(sections) > 1 else f'We are a leading {request.business_type.lower()} company dedicated to providing exceptional service and innovative solutions for our clients.'}</p>
                    {f'<p><strong>Our Style:</strong> {request.branding_style.title()}</p>' if request.branding_style else ''}
                </div>
            </div>
            
            {service_cards_html}
            
            <div class="card stats-card">
                <div class="card-content">
                    <h3>Our Success</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-number">500+</span>
                            <span class="stat-label">Happy Clients</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">99%</span>
                            <span class="stat-label">Success Rate</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">24/7</span>
                            <span class="stat-label">Support</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">5★</span>
                            <span class="stat-label">Rating</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card testimonial-card">
                <div class="card-content">
                    <h3>Client Testimonial</h3>
                    <div class="stars">★★★★★</div>
                    <p class="testimonial-text">"Outstanding {request.business_type.lower()} service! {request.business_name} delivered exactly what we needed."</p>
                    <div class="testimonial-author">- Sarah Johnson, CEO</div>
                </div>
            </div>
            
            <div class="card contact-card" id="contact">
                <div class="card-content">
                    <h3>Get In Touch</h3>
                    <p>Ready to start your project? Contact us today for a consultation.</p>
                    {f'<div class="contact-item"><span class="icon">📧</span> {request.contact_email}</div>' if request.contact_email else ''}
                    {f'<div class="contact-item"><span class="icon">📞</span> {request.contact_phone}</div>' if request.contact_phone else ''}
                    <div class="contact-item"><span class="icon">🎯</span> {request.business_type} Specialist</div>
                    {f'<div class="contact-item"><span class="icon">🌐</span> {request.website_url}</div>' if request.website_url else ''}
                </div>
            </div>
        </div>
    </div>

    <script>
        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {{
            anchor.addEventListener('click', function (e) {{
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {{
                    target.scrollIntoView({{ behavior: 'smooth', block: 'start' }});
                }}
            }});
        }});

        // Card hover effects
        document.querySelectorAll('.card').forEach(card => {{
            card.addEventListener('mouseenter', function() {{
                this.style.transform = 'translateY(-12px) scale(1.02)';
            }});
            
            card.addEventListener('mouseleave', function() {{
                this.style.transform = 'translateY(0) scale(1)';
            }});
        }});
    </script>
</body>
</html>'''

def get_magazine_grid_template(request, sections, services_list):
    """Magazine Grid Template - Editorial magazine style"""
    
    # Generate service items HTML
    service_items_html = ""
    for service in services_list[:4]:
        service_items_html += f'<div class="service-item"><h3>{service}</h3><p>Expert {service.lower()} solutions</p></div>'
    
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{request.business_name} - {request.business_type}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: 'Playfair Display', serif; background: white; }}
        .magazine-header {{ text-align: center; padding: 3rem 2rem; border-bottom: 3px solid #2d3748; }}
        .magazine-header h1 {{ font-size: 4rem; font-weight: 700; color: #2d3748; margin-bottom: 0.5rem; }}
        .magazine-header .subtitle {{ font-size: 1.2rem; color: #718096; text-transform: uppercase; letter-spacing: 2px; }}
        .magazine-grid {{ display: grid; grid-template-columns: 2fr 1fr; gap: 3rem; padding: 3rem; max-width: 1200px; margin: 0 auto; }}
        .main-article {{ background: #f7fafc; padding: 3rem; border-radius: 10px; }}
        .main-article h2 {{ font-size: 2.5rem; margin-bottom: 2rem; color: #2d3748; }}
        .sidebar {{ display: flex; flex-direction: column; gap: 2rem; }}
        .sidebar-item {{ background: white; padding: 2rem; border: 1px solid #e2e8f0; border-radius: 10px; }}
        .services-section {{ grid-column: 1 / 3; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-top: 3rem; }}
        .service-item {{ background: #2d3748; color: white; padding: 2rem; text-align: center; border-radius: 10px; }}
        @media (max-width: 768px) {{ .magazine-grid {{ grid-template-columns: 1fr; }} .services-section {{ grid-column: 1; }} }}
    </style>
</head>
<body>
    <header class="magazine-header">
        <h1>{request.business_name}</h1>
        <p class="subtitle">{request.business_type} Excellence</p>
    </header>
    
    <div class="magazine-grid">
        <article class="main-article">
            <h2>Our Story</h2>
            <p>{sections[1].content if len(sections) > 1 else 'Discover our journey and commitment to excellence in the industry.'}</p>
        </article>
        
        <aside class="sidebar">
            <div class="sidebar-item">
                <h3>Quick Facts</h3>
                <p>Professional {request.business_type.lower()}</p>
                <p>Trusted by clients</p>
            </div>
            
            <div class="sidebar-item">
                <h3>Contact</h3>
                <p>{request.contact_email or 'info@business.com'}</p>
                <p>{request.contact_phone or '+1-555-0123'}</p>
            </div>
        </aside>
        
        <div class="services-section">
            {service_items_html}
        </div>
    </div>
</body>
</html>"""

def get_timeline_template(request, sections, services_list):
    """Timeline Template - Vertical timeline layout"""
    
    # Generate service badges HTML
    service_badges_html = ""
    for service in services_list[:6]:
        service_badges_html += f'<div class="service-badge">{service}</div>'
    
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{request.business_name} - {request.business_type}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: 'Roboto', sans-serif; background: #f8f9fa; }}
        .hero {{ background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; text-align: center; padding: 5rem 2rem; }}
        .hero h1 {{ font-size: 3.5rem; margin-bottom: 1rem; }}
        .timeline {{ max-width: 800px; margin: 4rem auto; padding: 0 2rem; }}
        .timeline-item {{ position: relative; padding: 2rem 0 2rem 4rem; border-left: 3px solid #3498db; }}
        .timeline-item:before {{ content: ''; position: absolute; left: -8px; top: 2rem; width: 16px; height: 16px; background: #3498db; border-radius: 50%; }}
        .timeline-content {{ background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }}
        .timeline-content h3 {{ color: #2c3e50; margin-bottom: 1rem; }}
        .services-timeline {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 2rem; }}
        .service-badge {{ background: #3498db; color: white; padding: 0.5rem 1rem; border-radius: 20px; text-align: center; font-size: 0.9rem; }}
        @media (max-width: 768px) {{ .timeline-item {{ padding-left: 2rem; }} }}
    </style>
</head>
<body>
    <section class="hero">
        <h1>{request.business_name}</h1>
        <p>Your journey with {request.business_type.lower()} excellence starts here</p>
    </section>
    
    <div class="timeline">
        <div class="timeline-item">
            <div class="timeline-content">
                <h3>Welcome</h3>
                <p>{sections[0].content if sections else 'Welcome to our business journey'}</p>
            </div>
        </div>
        
        <div class="timeline-item">
            <div class="timeline-content">
                <h3>About Our Company</h3>
                <p>{sections[1].content if len(sections) > 1 else 'Learn about our mission and values'}</p>
            </div>
        </div>
        
        <div class="timeline-item">
            <div class="timeline-content">
                <h3>Our Services</h3>
                <div class="services-timeline">
                    {service_badges_html}
                </div>
            </div>
        </div>
        
        <div class="timeline-item">
            <div class="timeline-content">
                <h3>Get Started</h3>
                <p>Contact us today: {request.contact_email or 'info@business.com'}</p>
                <p>Phone: {request.contact_phone or '+1-555-0123'}</p>
            </div>
        </div>
    </div>
</body>
</html>"""

def get_template_by_theme(theme: str, request, sections, services_list):
    """Get HTML template based on theme"""
    templates = {
        "hero-split": get_hero_split_template,
        "bento-box": get_bento_box_template,
        "card-masonry": get_card_masonry_template,
        "magazine-grid": get_magazine_grid_template,
        "parallax-scroll": get_hero_split_template,  # Use hero-split as fallback
        "timeline-vertical": get_timeline_template,
    }
    
    template_func = templates.get(theme, get_hero_split_template)
    return template_func(request, sections, services_list)