"""
Script to remove blog sections from all website templates
"""
import re
from pathlib import Path

# Template files to process
TEMPLATES_DIR = Path(__file__).parent.parent / "ai_models/website_ai/app/templates"
TEMPLATE_FILES = [
    "bento-box.html",
    "card-masonry.html",
    "hero-split.html",
    "magazine-grid.html",
    "timeline-vertical.html",
]

def remove_blog_section(content: str) -> str:
    """Remove blog section and its JavaScript from HTML content"""
    
    # Pattern to match blog section (<!-- Blog Section --> to </section>)
    blog_section_pattern = r'<!-- Blog Section -->.*?</section>\s*'
    content = re.sub(blog_section_pattern, '', content, flags=re.DOTALL)
    
    # Pattern to match blog loading script
    blog_script_pattern = r'<script>\s*async function loadBlogPosts\(\).*?</script>\s*'
    content = re.sub(blog_script_pattern, '', content, flags=re.DOTALL)
    
    # Remove "Blog" links from navigation
    content = re.sub(r'<li><a href="blogs\.html">Blog</a></li>\s*', '', content)
    content = re.sub(r'<li><a href="#blog">Blog</a></li>\s*', '', content)
    
    return content

def main():
    """Process all template files"""
    for template_file in TEMPLATE_FILES:
        template_path = TEMPLATES_DIR / template_file
        
        if not template_path.exists():
            print(f"❌ Template not found: {template_file}")
            continue
        
        print(f"Processing {template_file}...")
        
        # Read the template
        content = template_path.read_text(encoding='utf-8')
        
        # Remove blog section
        updated_content = remove_blog_section(content)
        
        # Write back
        template_path.write_text(updated_content, encoding='utf-8')
        
        print(f"✅ Updated {template_file}")
    
    print("\n✅ All templates updated successfully!")

if __name__ == "__main__":
    main()
