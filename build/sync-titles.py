#!/usr/bin/env python3
"""
Write the lab name from data.js into the static <title> of every page.

main.js also substitutes the name at runtime, which is enough for a reader with
JavaScript — but search engines and link unfurlers (Slack, LinkedIn, X, and most
messaging apps) read the raw HTML and never run it. A page that ships a template
placeholder in its <title> gets shared with that placeholder visible.

So the name is written into the files, and this script is what keeps that copy
honest. Run it after changing SITE.labName or SITE.tagline in data.js:

    python3 build/sync-titles.py

Rewriting the whole <title> rather than substituting a placeholder makes it
idempotent — it can run any number of times, before or after a rename.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
DATA = SITE / "assets/js/data.js"

# One template per page. {lab} and {tagline} come from data.js.
TITLES = {
    "index": "{lab} — {tagline}",
    "team": "Team — {lab}",
    "publications": "Publications — {lab}",
    "partners": "Collaboration — {lab}",
    "join": "Join Us — {lab}",
}


def field(src: str, name: str) -> str:
    m = re.search(rf'^\s*{name}:\s*"([^"]*)"', src, re.M)
    if not m:
        sys.exit(f"could not read SITE.{name} from {DATA.relative_to(ROOT)}")
    return m.group(1)


def main():
    src = DATA.read_text(encoding="utf-8")
    values = {"lab": field(src, "labName"), "tagline": field(src, "tagline")}

    changed = 0
    for page, template in TITLES.items():
        path = SITE / f"{page}.html"
        html = path.read_text(encoding="utf-8")
        want = template.format(**values)

        new, n = re.subn(r"<title>.*?</title>", f"<title>{want}</title>", html,
                         count=1, flags=re.S)
        if not n:
            sys.exit(f"no <title> in {path.name}")

        # The home page headline is the tagline too; keep the one copy of the
        # wording in data.js rather than in two files that can disagree.
        if page == "index":
            new = re.sub(r"<h1>.*?</h1>", f"<h1>{values['tagline']}</h1>", new,
                         count=1, flags=re.S)
        if new != html:
            path.write_text(new, encoding="utf-8")
            changed += 1
            print(f"  {path.name:<20} -> {want}")

    print(f"{changed} file(s) updated" if changed else "already in sync")


if __name__ == "__main__":
    main()
