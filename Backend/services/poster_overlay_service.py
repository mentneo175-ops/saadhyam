"""
Poster Text Overlay Service
Adds readable marketing text overlay on generated images
Uses PIL/Pillow for professional text rendering
"""

import logging
from pathlib import Path
from datetime import datetime
from typing import Tuple
from PIL import Image, ImageDraw, ImageFont, ImageFilter

logger = logging.getLogger(__name__)


def overlay_poster_text(
    image_path: str,
    headline: str,
    subheadline: str,
    cta: str,
    style: str = "modern",
    output_dir: Path = None
) -> str:
    """
    Add professional text overlay on generated image
    
    Args:
        image_path: Path to generated background image
        headline: Main headline text
        subheadline: Supporting text
        cta: Call-to-action text
        style: Visual style (modern, premium, vibrant)
        output_dir: Output directory for final image
    
    Returns:
        Path to final image with text overlay
    """
    try:
        # Load image
        img = Image.open(image_path).convert("RGBA")
        width, height = img.size
        
        # Create overlay layer
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # Add semi-transparent gradient at top for text readability
        _add_gradient_overlay(overlay, width, height, style)
        
        # Load fonts (with fallback to default)
        try:
            # Try to use system fonts
            headline_font = ImageFont.truetype("arial.ttf", size=int(height * 0.08))
            subheadline_font = ImageFont.truetype("arial.ttf", size=int(height * 0.04))
            cta_font = ImageFont.truetype("arialbd.ttf", size=int(height * 0.045))
        except:
            try:
                # Fallback to other common fonts
                headline_font = ImageFont.truetype("Arial.ttf", size=int(height * 0.08))
                subheadline_font = ImageFont.truetype("Arial.ttf", size=int(height * 0.04))
                cta_font = ImageFont.truetype("Arial Bold.ttf", size=int(height * 0.045))
            except:
                # Use default font
                logger.warning("⚠️ Custom fonts not available, using default")
                headline_font = ImageFont.load_default()
                subheadline_font = ImageFont.load_default()
                cta_font = ImageFont.load_default()
        
        # Calculate positions
        margin = int(width * 0.05)
        y_start = int(height * 0.08)
        
        # Draw headline
        headline_color = _get_text_color(style, "headline")
        _draw_text_with_shadow(
            draw,
            (margin, y_start),
            headline.upper(),
            headline_font,
            headline_color,
            shadow_offset=3
        )
        
        # Draw subheadline
        subheadline_y = y_start + int(height * 0.12)
        subheadline_color = _get_text_color(style, "subheadline")
        
        # Wrap subheadline if too long
        wrapped_subheadline = _wrap_text(subheadline, subheadline_font, width - 2 * margin, draw)
        for i, line in enumerate(wrapped_subheadline):
            _draw_text_with_shadow(
                draw,
                (margin, subheadline_y + i * int(height * 0.05)),
                line,
                subheadline_font,
                subheadline_color,
                shadow_offset=2
            )
        
        # Draw CTA button
        cta_y = height - int(height * 0.15)
        _draw_cta_button(
            draw,
            (margin, cta_y),
            cta.upper(),
            cta_font,
            style,
            width
        )
        
        # Composite overlay on image
        img = Image.alpha_composite(img, overlay)
        
        # Convert back to RGB for saving
        final_img = img.convert("RGB")
        
        # Save final image
        if output_dir is None:
            output_dir = Path(image_path).parent
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
        final_filename = f"final_{timestamp}.png"
        final_path = output_dir / final_filename
        
        final_img.save(final_path, format="PNG", quality=95)
        
        logger.info(f"✅ Text overlay added successfully: {final_path}")
        return str(final_path)
        
    except Exception as e:
        logger.error(f"❌ Text overlay failed: {e}", exc_info=True)
        # Return original image path if overlay fails
        return image_path


def _add_gradient_overlay(overlay: Image.Image, width: int, height: int, style: str):
    """Add semi-transparent gradient for text readability"""
    gradient_height = int(height * 0.4)
    
    for y in range(gradient_height):
        # Calculate alpha (0-180 for semi-transparency)
        alpha = int(180 * (1 - y / gradient_height))
        
        # Color based on style
        if style == "premium":
            color = (0, 0, 0, alpha)  # Black gradient
        elif style == "vibrant":
            color = (20, 20, 40, alpha)  # Dark blue gradient
        else:  # modern
            color = (10, 10, 10, alpha)  # Dark gray gradient
        
        draw = ImageDraw.Draw(overlay)
        draw.rectangle([(0, y), (width, y + 1)], fill=color)


def _get_text_color(style: str, text_type: str) -> Tuple[int, int, int, int]:
    """Get text color based on style"""
    if style == "premium":
        if text_type == "headline":
            return (255, 215, 0, 255)  # Gold
        else:
            return (255, 255, 255, 255)  # White
    elif style == "vibrant":
        if text_type == "headline":
            return (255, 100, 100, 255)  # Vibrant red
        else:
            return (255, 255, 255, 255)  # White
    else:  # modern
        if text_type == "headline":
            return (255, 255, 255, 255)  # White
        else:
            return (230, 230, 230, 255)  # Light gray


def _draw_text_with_shadow(
    draw: ImageDraw.Draw,
    position: Tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    color: Tuple[int, int, int, int],
    shadow_offset: int = 2
):
    """Draw text with shadow for better readability"""
    x, y = position
    
    # Draw shadow
    draw.text(
        (x + shadow_offset, y + shadow_offset),
        text,
        font=font,
        fill=(0, 0, 0, 180)
    )
    
    # Draw main text
    draw.text(
        (x, y),
        text,
        font=font,
        fill=color
    )


def _draw_cta_button(
    draw: ImageDraw.Draw,
    position: Tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    style: str,
    max_width: int
):
    """Draw CTA button with background"""
    x, y = position
    
    # Get text size
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
    except:
        text_width = len(text) * 20
        text_height = 30
    
    # Button dimensions
    padding_x = 30
    padding_y = 15
    button_width = text_width + 2 * padding_x
    button_height = text_height + 2 * padding_y
    
    # Button color based on style
    if style == "premium":
        button_color = (255, 215, 0, 255)  # Gold
        text_color = (0, 0, 0, 255)  # Black
    elif style == "vibrant":
        button_color = (255, 50, 50, 255)  # Vibrant red
        text_color = (255, 255, 255, 255)  # White
    else:  # modern
        button_color = (70, 130, 255, 255)  # Blue
        text_color = (255, 255, 255, 255)  # White
    
    # Draw button background with rounded corners
    button_rect = [x, y, x + button_width, y + button_height]
    draw.rounded_rectangle(button_rect, radius=8, fill=button_color)
    
    # Draw button text
    text_x = x + padding_x
    text_y = y + padding_y
    draw.text((text_x, text_y), text, font=font, fill=text_color)


def _wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int, draw: ImageDraw.Draw) -> list:
    """Wrap text to fit within max width"""
    words = text.split()
    lines = []
    current_line = []
    
    for word in words:
        test_line = ' '.join(current_line + [word])
        try:
            bbox = draw.textbbox((0, 0), test_line, font=font)
            width = bbox[2] - bbox[0]
        except:
            width = len(test_line) * 10
        
        if width <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(' '.join(current_line))
            current_line = [word]
    
    if current_line:
        lines.append(' '.join(current_line))
    
    return lines if lines else [text]
