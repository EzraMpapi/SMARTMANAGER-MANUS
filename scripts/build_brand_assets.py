from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw


SOURCE = Path("/home/ubuntu/upload/file_00000000963881f4b6f6239b9f506019.png")
OUTPUT = Path("/home/ubuntu/webdev-static-assets/smart-manager-brand-kit")


def save_png(image: Image.Image, destination: str) -> None:
    image.save(OUTPUT / destination, format="PNG", optimize=True)


def make_rounded_icon(master: Image.Image) -> Image.Image:
    # The crop encloses the original hexagonal mark, Tanzania accent, circuit paths,
    # and growth chart without drawing a replacement logo.
    icon = master.crop((360, 0, 1176, 816)).resize((1024, 1024), Image.Resampling.LANCZOS)
    mask = Image.new("L", icon.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 1024, 1024), radius=224, fill=255)
    icon.putalpha(ImageChops.multiply(icon.getchannel("A"), mask))
    return icon


def make_source_embedded_svg(source_bytes: bytes, filename: str, width: int, height: int) -> None:
    encoded = base64.b64encode(source_bytes).decode("ascii")
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="Smart Manager official logo">
  <image width="{width}" height="{height}" href="data:image/png;base64,{encoded}" />
</svg>\n'''
    (OUTPUT / filename).write_text(svg, encoding="utf-8")


if __name__ == "__main__":
    from PIL import ImageChops

    OUTPUT.mkdir(parents=True, exist_ok=True)
    source_bytes = SOURCE.read_bytes()
    master = Image.open(BytesIO(source_bytes)).convert("RGBA")

    save_png(master, "smart-manager-official-master.png")
    master.save(OUTPUT / "smart-manager-full.webp", format="WEBP", quality=92, method=6)
    make_source_embedded_svg(source_bytes, "smart-manager-full.svg", master.width, master.height)

    icon = make_rounded_icon(master)
    save_png(icon, "smart-manager-mobile-icon.png")
    icon.save(OUTPUT / "smart-manager-mobile-icon.webp", format="WEBP", quality=92, method=6)
    make_source_embedded_svg((OUTPUT / "smart-manager-mobile-icon.png").read_bytes(), "smart-manager-mobile-icon.svg", 1024, 1024)

    for size in (1024, 512, 256, 192, 180, 144, 128, 96, 72, 64, 48, 32, 16):
        save_png(icon.resize((size, size), Image.Resampling.LANCZOS), f"smart-manager-app-icon-{size}.png")

    favicon = icon.resize((256, 256), Image.Resampling.LANCZOS)
    save_png(favicon, "smart-manager-favicon-source.png")
    favicon.save(OUTPUT / "smart-manager-favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
