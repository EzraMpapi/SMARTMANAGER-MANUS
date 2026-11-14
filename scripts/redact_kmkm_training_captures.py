"""Create non-record-bearing training frames from approved KMKM demonstration screenshots.

Source images remain outside the repository. This utility intentionally masks the
entire record-bearing main workspace and all identity/header surfaces; outputs are
only allowed to communicate module-shell orientation, never business data.
"""

from pathlib import Path

from PIL import Image, ImageDraw


SOURCE_DIR = Path("/home/ubuntu/smartmanager-training-assets/kmkm-private-source")
OUTPUT_DIR = Path("/home/ubuntu/smartmanager-training-assets/kmkm-redacted")

MODULES = {
    "dashboard-owner.webp": "DASHBOARD — TRAINING FRAME",
    "finance-owner.webp": "FINANCE — TRAINING FRAME",
    "inventory-owner.webp": "INVENTORY — TRAINING FRAME",
    "sales-owner.webp": "SALES — TRAINING FRAME",
}

BACKGROUND = "#102c28"
RAIL_OVERLAY = "#173d37"
ACCENT = "#d8b654"


def rect(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], fill: str) -> None:
    draw.rectangle(xy, fill=fill)


def redact(source_name: str, label: str) -> Path:
    source = SOURCE_DIR / source_name
    image = Image.open(source).convert("RGB")
    width, height = image.size
    draw = ImageDraw.Draw(image)

    # Header contains account, alerts, tenant, and contextual metadata.
    rect(draw, (0, 0, width, round(height * 0.105)), BACKGROUND)
    # Workspace identity is tenant/user-specific even when visual navigation is safe.
    rect(draw, (0, round(height * 0.105), round(width * 0.245), round(height * 0.205)), RAIL_OVERLAY)
    # The rail can contain dynamic notification/count badges and state labels, so
    # remove its full right edge while retaining only generic module orientation.
    rect(draw, (round(width * 0.13), round(height * 0.205), round(width * 0.245), height), RAIL_OVERLAY)
    # Remove all record-bearing workspace content, table values, KPIs, chart labels,
    # financial amounts, customer names, actions, and status fields.
    rect(draw, (round(width * 0.245), round(height * 0.105), width, height), BACKGROUND)

    # Retain an explicitly non-production, tenant-neutral training caption.
    caption_y = round(height * 0.17)
    draw.text((round(width * 0.29), caption_y), label, fill="white")
    draw.text(
        (round(width * 0.29), caption_y + 28),
        "Redacted owner-approved demonstration capture - record details intentionally removed",
        fill=ACCENT,
    )
    draw.text(
        (round(width * 0.29), caption_y + 52),
        "Use with verified 3D workflow visuals and generic Kiswahili narration only.",
        fill="white",
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    destination = OUTPUT_DIR / source_name.replace("-owner.webp", "-training-redacted.png")
    image.save(destination, format="PNG", optimize=True)
    return destination


def main() -> None:
    for source_name, label in MODULES.items():
        print(redact(source_name, label))


if __name__ == "__main__":
    main()
