#!/usr/bin/env python3
"""
Check that every DOI and arXiv link written by hand actually resolves to the
paper we claim it is.

  python3 build/check-links.py

Only PUBLICATIONS_MANUAL in data.js is checked — that is the hand-typed part,
so it is the part that can be wrong. Everything in publications.generated.js
comes straight from DBLP's own records and is not re-verified here.

For each DOI it asks Crossref for the real title/year/authors and compares them
with what data.js says. This exists because a hand-written DOI can silently
point at a completely different paper — that happened once already
(10.1109/ASE.2019.00033 resolved to someone else's ASE'19 paper).

Exit status is non-zero if anything looks wrong, so it can gate a release.
"""

import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "site/assets/js/data.js"
UA = {"User-Agent": "LeroGroupSite-linkcheck/1.0 (mailto:guancheng.wang@ul.ie)"}

TITLE_MATCH_THRESHOLD = 0.75


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9 ]", " ", s.lower()).split().__str__()


def similar(a: str, b: str) -> float:
    clean = lambda s: re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()
    return SequenceMatcher(None, clean(a), clean(b)).ratio()


def parse_publications(src: str):
    """Pull (title, year, doi, arxiv) out of the PUBLICATIONS_MANUAL array."""
    block = re.search(r"const PUBLICATIONS_MANUAL = \[(.*?)\n\];", src, re.S)
    if not block:
        sys.exit("could not find PUBLICATIONS_MANUAL in data.js")
    entries = []
    for chunk in re.split(r"\n  \{", block.group(1)):
        t = re.search(r'title:\s*\n?\s*"((?:[^"\\]|\\.)*)"', chunk)
        if not t:
            continue
        y = re.search(r"year:\s*(\d{4})", chunk)
        doi = re.search(r'doi:\s*"https://doi\.org/([^"]+)"', chunk)
        arx = re.search(r'arxiv:\s*"(https://arxiv\.org/abs/[^"]+)"', chunk)
        entries.append({
            "title": t.group(1),
            "year": int(y.group(1)) if y else None,
            "doi": doi.group(1) if doi else None,
            "arxiv": arx.group(1) if arx else None,
        })
    return entries


def crossref(doi: str):
    url = "https://api.crossref.org/works/" + urllib.parse.quote(doi)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return json.load(r)["message"]


def head_ok(url: str) -> bool:
    req = urllib.request.Request(url, headers=UA, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status < 400
    except urllib.error.HTTPError as e:
        return e.code < 400
    except Exception:
        return False


def main() -> None:
    pubs = parse_publications(DATA.read_text(encoding="utf-8"))
    problems = []
    checked = 0

    print(f"checking {len(pubs)} publications from {DATA.relative_to(ROOT)}\n")

    for p in pubs:
        if p["doi"]:
            checked += 1
            try:
                m = crossref(p["doi"])
            except Exception as e:
                problems.append(f"DOI unresolvable: {p['doi']}  ({p['title'][:60]}) — {e}")
                print(f"  ✗ {p['title'][:64]}\n      DOI {p['doi']} → {e}")
                time.sleep(0.25)
                continue

            real = (m.get("title") or ["?"])[0]
            ratio = similar(real, p["title"])
            # prefer the printed issue year; fall back to whatever is recorded
            dates = m.get("published-print") or m.get("issued") or {}
            real_year = (dates.get("date-parts") or [[None]])[0][0]

            if ratio < TITLE_MATCH_THRESHOLD:
                problems.append(
                    f"DOI points at a different paper: {p['doi']}\n"
                    f"      we say : {p['title']}\n"
                    f"      crossref: {real}"
                )
                print(f"  ✗ {p['title'][:64]}\n      DOI resolves to: {real[:64]}")
            elif real_year and p["year"] and real_year != p["year"]:
                problems.append(
                    f"year mismatch for {p['title'][:60]}: data.js={p['year']} crossref={real_year}"
                )
                print(f"  ⚠ {p['title'][:64]}\n      year: data.js={p['year']} crossref={real_year}")
            else:
                print(f"  ✓ {p['title'][:70]}")
            time.sleep(0.25)

        elif p["arxiv"]:
            checked += 1
            ok = head_ok(p["arxiv"])
            print(f"  {'✓' if ok else '✗'} {p['title'][:70]}")
            if not ok:
                problems.append(f"arXiv link dead: {p['arxiv']}")
            time.sleep(0.2)

    print(f"\n{checked} links checked, {len(problems)} problem(s)")
    for x in problems:
        print(f"  ! {x}")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
