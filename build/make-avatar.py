#!/usr/bin/env python3
"""
Turn any portrait into a 600x600 site avatar matching the existing headshots.

Member avatars render as 118px circles, the PI's as a 200px rounded square, so
the head wants to sit centred at roughly 60% of the frame height with the eyes
around 42% from the top — the framing Lionel's and Boxi's photos already use.

Tight selfies rarely have that much room around the head. When the scaled
portrait does not fill the square, the gap is filled with a heavily blurred,
cover-scaled copy of the same photo and the seam is feathered away. On shots
with an already-blurred background this is invisible; on sharp backgrounds it
reads as a deliberate soft vignette.

Usage:
    python3 build/make-avatar.py IN OUT --head-top 472 --chin 3456 --face-x 1642
    python3 build/make-avatar.py IN OUT            # centre crop, no rescaling

Coordinates are in source pixels: --head-top is the top of the hair, --chin the
bottom of the chin, --face-x the horizontal centre of the face.
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    sys.exit("Pillow is required:  python3 -m pip install Pillow")

SIZE = 600          # output edge, px
HEAD_FRACTION = 0.60  # head height as a share of the frame
EYE_LINE = 0.42     # eyes this far down the frame
FEATHER = 26        # px of alpha falloff at the portrait edge
BLUR = 42           # backdrop blur radius


def build(src: Image.Image, head_top=None, chin=None, face_x=None, pad="auto") -> Image.Image:
    src = src.convert("RGB")
    w, h = src.size

    # --- no landmarks given: plain centre crop -------------------------------
    if head_top is None or chin is None:
        edge = min(w, h)
        left = (w - edge) // 2
        top = min((h - edge) // 2, int(h * 0.08))   # bias upward for portraits
        return src.crop((left, top, left + edge, top + edge)).resize(
            (SIZE, SIZE), Image.LANCZOS)

    # --- scale so the head occupies HEAD_FRACTION of the frame ---------------
    head_h = chin - head_top
    if head_h <= 0:
        sys.exit("--chin must be below --head-top")
    scale = (SIZE * HEAD_FRACTION) / head_h

    fg = src.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)

    # eyes sit a little above the midpoint of head-top..chin
    eye_y = head_top + head_h * 0.42
    off_y = round(SIZE * EYE_LINE - eye_y * scale)
    off_x = round(SIZE / 2 - (face_x if face_x is not None else w / 2) * scale)

    # --- backdrop ------------------------------------------------------------
    flat = flat_background(src) if pad == "auto" else (
        corner_colour(src) if pad == "solid" else None)

    if flat is not None:
        # Studio shot on a plain backdrop: extend it with the same colour and
        # skip the feather — any softening would show as a halo against flat ink.
        out = Image.new("RGB", (SIZE, SIZE), flat)
        out.paste(fg, (off_x, off_y))
        return out

    cover = max(SIZE / w, SIZE / h)
    bg = src.resize((max(1, round(w * cover)), max(1, round(h * cover))), Image.LANCZOS)
    bg = bg.crop((
        (bg.width - SIZE) // 2, (bg.height - SIZE) // 2,
        (bg.width - SIZE) // 2 + SIZE, (bg.height - SIZE) // 2 + SIZE,
    )).filter(ImageFilter.GaussianBlur(BLUR))

    # --- feathered mask so the portrait dissolves into the backdrop ----------
    mask = Image.new("L", fg.size, 0)
    ImageDraw.Draw(mask).rectangle(
        (FEATHER, FEATHER, fg.width - FEATHER, fg.height - FEATHER), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(FEATHER / 2))

    out = bg.copy()
    out.paste(fg, (off_x, off_y), mask)
    return out


def corner_colour(img: Image.Image):
    """Median colour of the two upper corners — the backdrop in any portrait."""
    w, h = img.size
    patch = max(8, min(w, h) // 25)
    px = []
    for box in ((0, 0, patch, patch), (w - patch, 0, w, patch)):
        px += list(img.crop(box).getdata())
    return tuple(sorted(c[i] for c in px)[len(px) // 2] for i in range(3))


def flat_background(img: Image.Image, tolerance: int = 14):
    """Return the backdrop colour if the upper corners are flat and matching,
    else None. Bokeh corners vary far more than `tolerance` and fall through
    to the blur path."""
    w, h = img.size
    patch = max(8, min(w, h) // 25)
    stats = []
    for box in ((0, 0, patch, patch), (w - patch, 0, w, patch)):
        data = list(img.crop(box).getdata())
        mean = [sum(c[i] for c in data) / len(data) for i in range(3)]
        spread = max(max(c[i] for c in data) - min(c[i] for c in data) for i in range(3))
        stats.append((mean, spread))

    if any(s > tolerance * 3 for _, s in stats):
        return None                                    # corner is not uniform
    if max(abs(stats[0][0][i] - stats[1][0][i]) for i in range(3)) > tolerance:
        return None                                    # corners disagree
    return corner_colour(img)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("src"); p.add_argument("dst")
    p.add_argument("--head-top", type=int)
    p.add_argument("--chin", type=int)
    p.add_argument("--face-x", type=int)
    p.add_argument("--pad", choices=("auto", "solid", "blur"), default="auto",
                   help="how to fill around the portrait (default: detect from the corners)")
    p.add_argument("--quality", type=int, default=88)
    a = p.parse_args()

    img = build(Image.open(a.src), a.head_top, a.chin, a.face_x, a.pad)
    dst = Path(a.dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, "JPEG", quality=a.quality, optimize=True, progressive=True)
    print(f"wrote {dst}  {img.size[0]}x{img.size[1]}  {dst.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
