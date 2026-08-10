#!/usr/bin/env python3
"""
Pull every member's publication record from DBLP and regenerate
site/assets/js/publications.generated.js

  python3 build/fetch-publications.py

Run this whenever someone in the group has a paper accepted. DBLP indexes new
entries within days of publication, so this is the maintenance step that keeps
the Publications page and the News list current.

WHY DBLP AND NOT GOOGLE SCHOLAR
  Scholar has no public API and its terms forbid scraping; anything built on it
  breaks the first time Google shows a CAPTCHA. DBLP publishes a documented XML
  API, is curated by human editors, and — the deciding factor here — tags arXiv
  preprints as publtype="informal", which is exactly the line we need to draw.

WHAT IS EXCLUDED
  * publtype="informal"      arXiv / CoRR preprints        <- the site's rule
  * publtype="withdrawn"     retracted or withdrawn
  * <proceedings>            volumes the person edited, not wrote
  * <editor> roles           likewise

Member PIDs are read out of data.js, so that file stays the single place where
the roster is defined. Add someone there with a dblp link and they are picked up
automatically.
"""

import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

import dblp

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "site/assets/js/data.js"
OUT = ROOT / "site/assets/js/publications.generated.js"

# A paper counts as the group's own work when at least this many current members
# co-authored it. Two is the honest threshold: it separates work done together
# here from work a member did before joining, with no need for start dates.
GROUP_MIN_MEMBERS = 2

# Kinds of DBLP record we keep, mapped to the status the site renders.
KIND_STATUS = {
    "article": "journal",
    "inproceedings": "conference",
    "incollection": "chapter",
    "book": "book",
    "phdthesis": "thesis",
}

# DBLP writes journal names in its own abbreviated style. Map the ones this
# group actually publishes in to the form people expect to read.
VENUE_SHORT = {
    "IEEE Trans. Software Eng.": "IEEE TSE",
    "ACM Trans. Softw. Eng. Methodol.": "ACM TOSEM",
    "Empir. Softw. Eng.": "EMSE",
    "Softw. Test. Verification Reliab.": "STVR",
    "Softw. Syst. Model.": "SoSyM",
    "J. Syst. Softw.": "JSS",
    "Inf. Softw. Technol.": "IST",
    "IEEE Softw.": "IEEE Software",
    "Commun. ACM": "CACM",
    "IEEE Trans. Reliab.": "IEEE TR",
    "Autom. Softw. Eng.": "ASE Journal",
    "Requir. Eng.": "REJ",
    "Int. J. Comput. Vis.": "IJCV",
    "IEEE Trans. Pattern Anal. Mach. Intell.": "IEEE TPAMI",
    "ACM Comput. Surv.": "ACM CSUR",
}

# Crude but useful: derive topic tags from the title so the filter still works
# across a few hundred auto-imported entries.
TOPIC_RULES = [
    ("test-generation", r"\btest (generation|case generation)\b|unit test|junit"),
    ("testing",         r"\btest|testing|mutation|oracle|fuzz"),
    ("debugging",       r"debug|fault localis|fault localiz|repair|delta debugging"),
    ("code-agents",     r"\bagent|swe-bench|coding agent"),
    ("code-generation", r"code generation|program synthesis|code compl"),
    ("llm-systems",     r"\bllm\b|large language model|retrieval-augmented|\brag\b|hallucination|prompt"),
    ("benchmarking",    r"benchmark"),
    ("cps",             r"cyber-physical|cyber physical|\bcps\b|autonomous driving|automotive|satellite|robot"),
    ("digital-twins",   r"digital twin"),
    ("logs",            r"\blog\b|\blogs\b|log-based|anomaly detection"),
    ("requirements",    r"requirement|regulatory|compliance|legal"),
    ("security",        r"security|vulnerab|attack|intrusion|malware"),
    ("empirical",       r"empirical|case study|systematic review|survey|statistical|metrics|measurement"),
    ("model-driven",    r"\buml\b|model-driven|model driven|modeling|modelling"),
    ("vision",          r"tracking|image|visual|object detection|segmentation|captioning"),
]


# --------------------------------------------------------------------------- #
# reading the roster out of data.js
# --------------------------------------------------------------------------- #

def read_roster():
    """[(display name, dblp pid, excluded keys)] for everyone in data.js."""
    src = DATA.read_text(encoding="utf-8")
    people = re.search(r"const PEOPLE = \{(.*?)\n\};", src, re.S)
    if not people:
        sys.exit("could not find PEOPLE in data.js")

    roster = []
    # each person object starts with `name: "..."`; that person's fields run
    # until the next such marker
    chunks = re.split(r'\n      name: "', people.group(1))
    for chunk in chunks[1:]:
        name = chunk.split('"', 1)[0]
        pid = re.search(r'dblp: "https://dblp\.org/pid/([^"]+)"', chunk)
        block = re.search(r"excludeDblp: \[(.*?)\]", chunk, re.S)
        excluded = set(re.findall(r'"([^"]+)"', block.group(1))) if block else set()
        roster.append((name, pid.group(1) if pid else None, excluded))
    return roster


def name_parts(n):
    n = re.sub(r"\b[A-Z]\.\s*", " ", n)
    return [p for p in re.split(r"\s+", n.strip().lower()) if p]


def same_person(a, b):
    x, y = name_parts(a), name_parts(b)
    return bool(x) and bool(y) and x[0] == y[0] and x[-1] == y[-1]


# --------------------------------------------------------------------------- #
# DBLP record -> our shape
# --------------------------------------------------------------------------- #

def clean_venue(v: str) -> str:
    """Tidy DBLP's proceedings naming: 'ACL (1) 2025' -> 'ACL 2025'."""
    v = re.sub(r"\s*\(\d+\)", "", v)                       # split-volume marker
    v = v.replace("ESEC/SIGSOFT FSE", "ESEC/FSE")
    v = re.sub(r"\s{2,}", " ", v).strip()
    return v


def parse_record(rec):
    kind = rec.tag
    if kind not in KIND_STATUS:
        return None

    publtype = rec.get("publtype") or ""
    if publtype in ("informal", "informalpublished", "withdrawn"):
        return None                                    # arXiv / CoRR / retracted

    journal = (rec.findtext("journal") or "").strip()
    booktitle = (rec.findtext("booktitle") or "").strip()
    if journal == "CoRR":                              # belt and braces
        return None

    title = " ".join((rec.findtext("title") or "").split()).rstrip(".")
    if not title:
        return None

    year = rec.findtext("year")
    if not year or not year.isdigit():
        return None

    authors = [" ".join(a.text.split()) for a in rec.findall("author") if a.text]
    if not authors:
        return None
    # DBLP disambiguates duplicate names with a trailing number: "Wei Wang 0001"
    authors = [re.sub(r"\s+\d{4}$", "", a) for a in authors]

    raw_venue = journal or booktitle or ""
    venue = VENUE_SHORT.get(raw_venue, raw_venue)
    venue = clean_venue(venue)
    if kind == "inproceedings" and venue and not re.search(r"\d{4}", venue):
        venue = f"{venue} {year}"

    doi = None
    for ee in rec.findall("ee"):
        if ee.text and "doi.org" in ee.text:
            doi = ee.text
            break

    blob = title.lower()
    topics = [t for t, pat in TOPIC_RULES if re.search(pat, blob)][:3]

    return {
        "key": rec.get("key"),
        "title": html.unescape(title),
        "authors": [html.unescape(a) for a in authors],
        "venue": venue or "—",
        "venueLong": raw_venue if raw_venue != venue else None,
        "year": int(year),
        "status": KIND_STATUS[kind],
        "topics": topics,
        "links": {k: v for k, v in (("doi", doi),) if v},
    }


# --------------------------------------------------------------------------- #

def main():
    roster = read_roster()
    named = [(n, p, x) for n, p, x in roster if p]
    missing = [n for n, p, _ in roster if not p]

    print(f"roster: {len(roster)} people, {len(named)} with a DBLP id")
    for n in missing:
        print(f"  – no DBLP id, skipped: {n}")

    # Union of every person's exclusions. DBLP keeps homonymous researchers on a
    # single page until an editor splits them, so a name match is not proof of
    # authorship; these keys were checked against the person's own Scholar
    # profile and belong to someone else. See excludeDblp in data.js.
    excluded_keys = {k for _, _, x in roster for k in x}

    by_key = {}
    for name, pid, exclude in named:
        print(f"\nfetching {name} ({pid}) …")
        root = ET.fromstring(dblp.author_xml(pid))
        kept = dropped = wrong_person = 0
        for rec in root.findall(".//r/*"):
            if rec.get("key") in excluded_keys:
                wrong_person += 1
                continue
            p = parse_record(rec)
            if p is None:
                dropped += 1
                continue
            kept += 1
            by_key.setdefault(p["key"], p)
        note = f", {wrong_person} another person of the same name" if wrong_person else ""
        print(f"    {kept} published, {dropped} skipped (preprints, edited volumes, …){note}")
        if exclude - {r.get("key") for r in root.findall(".//r/*")}:
            stale = exclude - {r.get("key") for r in root.findall(".//r/*")}
            print(f"    ⚠ {len(stale)} excludeDblp key(s) no longer on this DBLP page: {', '.join(sorted(stale))}")

    pubs = list(by_key.values())

    roster_names = [n for n, _, _ in roster]
    for p in pubs:
        members = sum(1 for rn in roster_names
                      if any(same_person(a, rn) for a in p["authors"]))
        p["group"] = members >= GROUP_MIN_MEMBERS
        p["memberCount"] = members

    pubs.sort(key=lambda p: (-p["year"], p["title"]))
    n_group = sum(1 for p in pubs if p["group"])

    print(f"\n{len(pubs)} published works total, {n_group} classed as the group's own "
          f"(≥{GROUP_MIN_MEMBERS} members as co-authors)")

    body = json.dumps(pubs, ensure_ascii=False, indent=1)
    OUT.write_text(
        "/* GENERATED FILE — do not edit by hand.\n"
        "   Produced by build/fetch-publications.py from DBLP.\n"
        "   Re-run that script to refresh; anything typed here will be overwritten.\n"
        "   arXiv/CoRR preprints are excluded at generation time. */\n\n"
        f"const PUBLICATIONS_DBLP = {body};\n",
        encoding="utf-8",
    )
    size = OUT.stat().st_size
    print(f"wrote {OUT.relative_to(ROOT)} — {size/1024:.0f} KB")


if __name__ == "__main__":
    main()
