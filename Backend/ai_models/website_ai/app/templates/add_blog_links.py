import os

template_dir = r"c:\Users\surya\Desktop\Saadhyam\Backend\ai_models\website_ai\app\templates"

edits = {
    "agency-dark.html": (
        '<li><a href="#services">Services</a></li>\n                <li><a href="#faq">FAQ</a></li>\n                <li><a href="#contact">Contact</a></li>',
        '<li><a href="#services">Services</a></li>\n                <li><a href="#faq">FAQ</a></li>\n                <li><a href="#blog">Blog</a></li>\n                <li><a href="#contact">Contact</a></li>'
    ),
    "minimal-modern.html": (
        '<li><a href="#services">Services</a></li>\n                <li><a href="#faq">FAQ</a></li>\n                <li><a href="#contact">Contact</a></li>',
        '<li><a href="#services">Services</a></li>\n                <li><a href="#faq">FAQ</a></li>\n                <li><a href="#blog">Blog</a></li>\n                <li><a href="#contact">Contact</a></li>'
    ),
    "retro-brutalism.html": (
        '<li><a href="#services">Services</a></li>\n                <li><a href="#faq">FAQ</a></li>\n                <li><a href="#contact">Contact</a></li>',
        '<li><a href="#services">Services</a></li>\n                <li><a href="#faq">FAQ</a></li>\n                <li><a href="#blog">Blog</a></li>\n                <li><a href="#contact">Contact</a></li>'
    ),
    "restaurant-showcase.html": (
        '<li><a href="#services">Menu</a></li>\n                <li><a href="#faq">FAQ</a></li>\n                <li><a href="#contact">Reservation</a></li>',
        '<li><a href="#services">Menu</a></li>\n                <li><a href="#faq">FAQ</a></li>\n                <li><a href="#blog">Blog</a></li>\n                <li><a href="#contact">Reservation</a></li>'
    ),
    "saas-dashboard.html": (
        '<li><a href="#features">Features</a></li>\n                <li><a href="#faq">FAQ</a></li>\n                <li><a href="#contact">Pricing</a></li>',
        '<li><a href="#features">Features</a></li>\n                <li><a href="#faq">FAQ</a></li>\n                <li><a href="#blog">Blog</a></li>\n                <li><a href="#contact">Pricing</a></li>'
    ),
    "creative-portfolio.html": (
        '<li><a href="#work">Work</a></li>\n                <li><a href="#services">Services</a></li>\n                <li><a href="#testimonials">Clients</a></li>\n                <li><a href="#faq">FAQ</a></li>\n                <li><a href="#contact">Contact</a></li>',
        '<li><a href="#work">Work</a></li>\n                <li><a href="#services">Services</a></li>\n                <li><a href="#testimonials">Clients</a></li>\n                <li><a href="#faq">FAQ</a></li>\n                <li><a href="#blog">Blog</a></li>\n                <li><a href="#contact">Contact</a></li>'
    )
}

for fname, (old, new) in edits.items():
    fpath = os.path.join(template_dir, fname)
    if not os.path.exists(fpath):
        print(f"File {fname} does not exist!")
        continue
        
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Check both normal and carriage return endings
    if old in content:
        new_content = content.replace(old, new)
        print(f"Replacing in {fname}...")
    elif old.replace('\n', '\r\n') in content:
        new_content = content.replace(old.replace('\n', '\r\n'), new.replace('\n', '\r\n'))
        print(f"Replacing (with CRLF) in {fname}...")
    else:
        print(f"WARNING: Old block not found in {fname}!")
        continue
        
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully edited {fname}!")
