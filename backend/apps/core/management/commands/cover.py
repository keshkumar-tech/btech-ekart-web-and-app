"""Generate clean, book-style cover images for seeded catalog products.

Kept separate from ``seed_data`` so the drawing code stays readable and can be
reused (e.g. by a management command or a one-off backfill). No external assets
are required — everything is drawn with Pillow primitives.
"""
import io

from PIL import Image, ImageDraw, ImageFont

# Accent palette per product type: (top color, bottom color).
COVER_THEMES = {
    "notes": ((37, 99, 235), (30, 64, 175)),
    "pyq": ((124, 58, 237), (76, 29, 149)),
    "quantum": ((217, 119, 6), (146, 64, 14)),
    "syllabus": ((5, 150, 105), (6, 95, 70)),
    "combo": ((225, 29, 72), (159, 18, 57)),
}

TYPE_COVER_LABELS = {
    "notes": "NOTES",
    "pyq": "PYQ",
    "quantum": "QUANTUM",
    "syllabus": "SYLLABUS",
    "combo": "COMBO PACK",
}


def _load_font(size: int, bold: bool = False):
    """Load Arial from the system, falling back to Pillow's default font."""
    for name in (("arialbd.ttf", "ARIALBD.TTF") if bold else ("arial.ttf", "ARIAL.TTF")):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size)
    except TypeError:  # Pillow < 10.1 has no size argument here
        return ImageFont.load_default()


def _wrap_text(draw, text: str, font, max_width: int, max_lines: int = 3):
    """Greedy word-wrap so long subject names fit inside the cover panel."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textlength(candidate, font=font) <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1][: max(0, len(lines[-1]) - 1)].rstrip() + "…"
    return lines


def make_book_cover(
    title: str,
    type_key: str = "notes",
    branch: str = "",
    semester: int | None = None,
) -> bytes:
    """Draw a clean, book-style cover (spine + title panel + branding).

    Produces a real textbook-looking cover instead of random decoration so the
    seeded catalog looks presentable out of the box.
    """
    W, H = 600, 800
    top, bottom = COVER_THEMES.get(type_key, COVER_THEMES["notes"])

    img = Image.new("RGB", (W, H), top)
    # Vertical gradient background (smooth top -> bottom fade).
    grad = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        grad.line(
            [(0, y), (W, y)],
            fill=(
                int(top[0] + (bottom[0] - top[0]) * t),
                int(top[1] + (bottom[1] - top[1]) * t),
                int(top[2] + (bottom[2] - top[2]) * t),
            ),
        )

    draw = ImageDraw.Draw(img)

    # Book spine on the left edge.
    draw.rectangle([0, 0, 34, H], fill=bottom)
    draw.rectangle([34, 0, 38, H], fill=(255, 255, 255))

    margin = 74
    # Brand row: small logo square + "B.Tech eKart".
    draw.rectangle([margin, 52, margin + 44, 96], fill=(255, 255, 255))
    draw.text((margin + 13, 60), "e", font=_load_font(30, bold=True), fill=top)
    draw.text(
        (margin + 58, 62),
        "B.Tech eKart",
        font=_load_font(22, bold=True),
        fill=(255, 255, 255),
    )

    # Type badge (pill).
    badge_text = TYPE_COVER_LABELS.get(type_key, str(type_key).upper())
    badge_font = _load_font(20, bold=True)
    bw = draw.textlength(badge_text, font=badge_font)
    pad = 18
    bx0, by0 = margin, 150
    draw.rounded_rectangle(
        [bx0, by0, bx0 + bw + pad * 2, by0 + 44], radius=22, fill=(255, 255, 255)
    )
    draw.text((bx0 + pad, by0 + 9), badge_text, font=badge_font, fill=top)

    # Title (wrapped, up to 3 lines) — the subject name.
    title_font = _load_font(38, bold=True)
    lines = _wrap_text(draw, title, title_font, W - margin * 2)
    y = 250
    for line in lines:
        draw.text((margin, y), line, font=title_font, fill=(255, 255, 255))
        y += title_font.size + 12
    draw.line([(margin, y + 18), (W - margin, y + 18)], fill=(255, 255, 255), width=3)

    # Branch + semester line.
    meta = "  ·  ".join(
        p
        for p in (branch, f"Semester {semester}" if semester else "", "AKTU B.Tech")
        if p
    )
    draw.text((margin, y + 40), meta, font=_load_font(22), fill=(255, 255, 255))

    # Footer band with a small book glyph + value line.
    draw.rectangle([margin, H - 150, W - margin, H - 78], fill=(255, 255, 255))
    ix, iy = margin + 24, H - 138
    draw.rectangle([ix, iy, ix + 10, iy + 44], fill=top)
    draw.polygon(
        [(ix + 12, iy), (ix + 34, iy + 4), (ix + 34, iy + 44), (ix + 12, iy + 44)],
        fill=top,
    )
    draw.polygon(
        [(ix + 38, iy + 4), (ix + 60, iy), (ix + 60, iy + 44), (ix + 38, iy + 44)],
        fill=top,
    )
    draw.text(
        (ix + 78, H - 130),
        "Instant Download PDF",
        font=_load_font(24, bold=True),
        fill=bottom,
    )
    draw.text(
        (margin, H - 60),
        "Curated, exam-focused study material",
        font=_load_font(16),
        fill=(255, 255, 255),
    )

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# Blog covers are landscape (16:9) and slightly different in feel from product
# covers — a friendly gradient with the post title and a small "BLOG" tag.
BLOG_THEMES = [
    ((37, 99, 235), (67, 56, 202)),
    ((124, 58, 237), (157, 23, 77)),
    ((5, 150, 105), (6, 95, 70)),
    ((217, 119, 6), (180, 83, 9)),
    ((14, 116, 144), (30, 64, 175)),
    ((219, 39, 119), (159, 18, 57)),
]


def make_blog_cover(title: str, index: int = 0) -> bytes:
    """Draw a clean landscape (1200x675, 16:9) cover for a blog post."""
    W, H = 1200, 675
    top, bottom = BLOG_THEMES[index % len(BLOG_THEMES)]

    img = Image.new("RGB", (W, H), top)
    grad = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        grad.line(
            [(0, y), (W, y)],
            fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)),
        )

    draw = ImageDraw.Draw(img)

    # Soft decorative circles for depth.
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([W - 320, -140, W + 120, 300], fill=(255, 255, 255, 26))
    od.ellipse([-120, H - 220, 240, H + 140], fill=(255, 255, 255, 20))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    margin = 90
    # Brand mark + "BLOG" tag.
    draw.rectangle([margin, 70, margin + 46, 116], fill=(255, 255, 255))
    draw.text((margin + 14, 78), "e", font=_load_font(32, bold=True), fill=top)
    draw.text(
        (margin + 62, 82), "B.Tech eKart", font=_load_font(22, bold=True), fill=(255, 255, 255)
    )
    tag_font = _load_font(18, bold=True)
    draw.rounded_rectangle([margin, 150, margin + 108, 190], radius=20, fill=(255, 255, 255))
    draw.text((margin + 20, 158), "BLOG", font=tag_font, fill=top)

    # Wrapped title (up to 3 lines).
    title_font = _load_font(52, bold=True)
    lines = _wrap_text(draw, title, title_font, W - margin * 2)
    y = 300
    for line in lines:
        draw.text((margin, y), line, font=title_font, fill=(255, 255, 255))
        y += title_font.size + 14

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
