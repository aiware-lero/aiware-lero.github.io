#!/usr/bin/env python3
"""
Bundle the whole site into ONE self-contained .html file.

  python3 build/make-single-file.py

Output: dist/aiware-lab.html

Everything is inlined — CSS, JS, and every image as a data: URI — so the
result opens by double-clicking, can be emailed as a single attachment, and
works with no server and no network. Page navigation becomes hash-based
(#index, #team, …) instead of separate files.

Re-run this after any change under site/.
"""

import base64
import mimetypes
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
DIST = ROOT / "dist"
OUT = DIST / "aiware-lab.html"

PAGES = ["index", "team", "publications", "partners", "join"]


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def data_uri(rel: str) -> str:
    path = SITE / rel
    if not path.exists():
        sys.exit(f"missing asset: {rel}")
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    if path.suffix == ".svg":
        mime = "image/svg+xml"
    b64 = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{b64}"


def inline_assets(html: str) -> str:
    """Replace every assets/img/... reference with a data: URI."""
    return re.sub(
        r'(?<=["\'(])(assets/img/[A-Za-z0-9_./-]+)(?=["\')])',
        lambda m: data_uri(m.group(1)),
        html,
    )


def extract_main(html: str) -> str:
    m = re.search(r"<main[^>]*>(.*?)</main>", html, re.S)
    if not m:
        sys.exit("no <main> found")
    body = m.group(1)
    # index.html -> #index, team.html -> #team, and keep any anchor suffix
    body = re.sub(r'href="([a-z]+)\.html(#[^"]*)?"',
                  lambda m: f'href="#{m.group(1)}"', body)
    return body


def main() -> None:
    css = read(SITE / "assets/css/style.css")
    data_js = read(SITE / "assets/js/data.js")
    generated_js = read(SITE / "assets/js/publications.generated.js")
    main_js = read(SITE / "assets/js/main.js")

    # Photos are referenced from JS as assets/img/people/${person.photo}, so the
    # plain text substitution below can't see them. Hand them over as a map.
    photos = {
        p.name: data_uri(f"assets/img/people/{p.name}")
        for p in sorted((SITE / "assets/img/people").iterdir())
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    }
    photo_map = ",\n  ".join(f'"{k}": "{v}"' for k, v in photos.items())

    head = read(SITE / "index.html")
    desc = re.search(r'<meta name="description" content="([^"]*)"', head)

    # Title comes from data.js so a rename does not have to be repeated here.
    title = re.search(r"<title>(.*?)</title>", head, re.S)
    title = title.group(1) if title else "Group website"

    sections = []
    for name in PAGES:
        body = extract_main(read(SITE / f"{name}.html"))
        hidden = "" if name == "index" else " hidden"
        sections.append(f'<section class="page" id="page-{name}"{hidden}>{body}</section>')

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc.group(1) if desc else ''}">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="{data_uri('assets/img/brand/favicon.svg')}" type="image/svg+xml">
<style>
{css}
/* single-file bundle: stacked pages, one visible at a time */
.page[hidden] {{ display: none; }}
</style>
</head>
<body>

<a class="skip" href="#main">Skip to content</a>
<header class="site-header" id="site-header"></header>

<main id="main">
{chr(10).join(sections)}
</main>

<footer class="site-footer" id="site-footer"></footer>

<script>
window.__SINGLE_FILE__ = true;
window.__PHOTOS__ = {{
  {photo_map}
}};
</script>
<script>
{data_js}
</script>
<script>
{generated_js}
</script>
<script>
{main_js}
</script>
</body>
</html>
"""

    html = inline_assets(html)

    DIST.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    size = OUT.stat().st_size
    print(f"wrote {OUT.relative_to(ROOT)}  —  {size/1_048_576:.2f} MB, {len(PAGES)} pages inlined")


if __name__ == "__main__":
    main()
