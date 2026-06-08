import random
import re
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from ai_models.website_ai.app.models.schema import WebsiteContent, WebsiteRequest


BASE_DIR = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = BASE_DIR / "templates"
OUTPUT_DIR = Path(__file__).resolve().parents[4] / "website_ai_output"
THEMES = (
    "hero-split",
    "card-masonry",
    "timeline-vertical",
    "magazine-grid",
    "bento-box",
    "parallax-scroll",
    "minimal-modern",
    "agency-dark",
    "retro-brutalism",
    "restaurant-showcase",
    "saas-dashboard",
    "creative-portfolio"
)


def select_random_theme() -> str:
    return random.choice(THEMES)


def select_template(business_type: str) -> str:
    normalized = business_type.strip().lower()
    if any(keyword in normalized for keyword in ("salon", "spa", "beauty", "hair")):
        return "salon.html"
    if any(keyword in normalized for keyword in ("restaurant", "cafe", "food", "bistro", "diner")):
        return "restaurant.html"
    return "generic.html"


def _environment() -> Environment:
    return Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=select_autoescape(enabled_extensions=("html", "xml")),
        trim_blocks=True,
        lstrip_blocks=True,
    )


def render_website(theme: str, content: WebsiteContent, data: WebsiteRequest) -> str:
    template_name = f"{theme}.html"
    template = _environment().get_template(template_name)
    section_order = random.sample(["overview", "services", "faq", "contact"], k=4)
    headline_options = [
        f"{data.business_name} for modern customers",
        f"A refined web presence for {data.business_name}",
        f"Designed to make {data.business_name} stand out",
        f"A sharper digital identity for {data.business_name}",
    ]
    cta_options = [
        "Book a discovery call",
        "Start your project today",
        "Request a custom quote",
        "See the full experience",
    ]
    support_lines = [
        "Built to convert visitors into customers.",
        "Responsive, polished, and ready to launch.",
        "Crafted for speed, clarity, and trust.",
    ]
    theme_state = {
        "headline": random.choice(headline_options),
        "cta_line": random.choice(cta_options),
        "support_line": random.choice(support_lines),
        "section_order": section_order,
    }
    return template.render(data=data, content=content, theme=template_name, theme_state=theme_state)


def _safe_filename(business_name: str) -> str:
    filename = re.sub(r"[^a-zA-Z0-9]+", "-", business_name.strip().lower()).strip("-")
    return f"{filename or 'website'}.html"


def save_website(html: str, business_name: str, theme: str) -> str:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    file_path = OUTPUT_DIR / f"{_safe_filename(business_name).removesuffix('.html')}_{theme}.html"
    file_path.write_text(html, encoding="utf-8")
    return str(file_path.resolve())


def list_themes() -> tuple[str, ...]:
    """Return the available theme names."""
    return THEMES


def generate_demo(theme: str) -> str:
    """Render a small demo page for the given theme and save it to the output dir.

    Returns the absolute file path to the saved demo HTML.
    """
    # Minimal demo data that will always render without contacting any AI service
    demo_request = WebsiteRequest(business_name="Demo Business", business_type="Demo")
    demo_content = WebsiteContent(
        about="Demo Business provides exemplary services tailored to its customers.",
        services=[
            {"name": "Service A", "description": "High-quality offering to help customers."},
            {"name": "Service B", "description": "Professional support for every need."},
            {"name": "Service C", "description": "Reliable delivery and excellent results."},
        ],
        faq=[
            {"question": "What is Demo Business?", "answer": "A demo provider of quality services."},
            {"question": "How do I get started?", "answer": "Contact us via the form or phone."},
            {"question": "Is support available?", "answer": "Yes — we provide friendly support."},
        ],
        contact="Contact Demo Business to learn more.",
        audience="general customers",
        tone="friendly and professional",
        branding_style="clean and modern",
    )

    html = render_website(theme, demo_content, demo_request)
    return save_website(html, "demo", theme)

