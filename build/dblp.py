"""
Shared DBLP client.

DBLP is a free, volunteer-run service and rate-limits aggressively (429/503).
Everything here goes through one throttled, retrying fetcher so we stay a polite
client: a real User-Agent with a contact address, a minimum gap between requests,
and exponential backoff on refusal.
"""

import time
import urllib.error
import urllib.parse
import urllib.request

CONTACT = "guancheng.wang@ul.ie"
UA = f"LeroGroupSite/1.0 (+mailto:{CONTACT})"

MIN_GAP = 2.5      # seconds between any two requests
MAX_TRIES = 6
BACKOFF = 4.0      # seconds, doubled each retry

_last_request = [0.0]


def fetch(url: str, timeout: int = 45) -> bytes:
    """GET with throttling and backoff. Raises after MAX_TRIES."""
    delay = BACKOFF
    last_err = None

    for attempt in range(1, MAX_TRIES + 1):
        gap = time.monotonic() - _last_request[0]
        if gap < MIN_GAP:
            time.sleep(MIN_GAP - gap)

        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                _last_request[0] = time.monotonic()
                return r.read()
        except urllib.error.HTTPError as e:
            _last_request[0] = time.monotonic()
            last_err = e
            if e.code not in (429, 500, 502, 503, 504):
                raise
        except Exception as e:                       # connection reset, timeout…
            _last_request[0] = time.monotonic()
            last_err = e

        if attempt < MAX_TRIES:
            print(f"    dblp busy ({last_err}) — retry {attempt}/{MAX_TRIES - 1} in {delay:.0f}s")
            time.sleep(delay)
            delay *= 2

    raise RuntimeError(f"dblp failed after {MAX_TRIES} tries: {url} — {last_err}")


def author_xml(pid: str) -> bytes:
    """Full publication record for one author PID, e.g. '93/1501'."""
    return fetch(f"https://dblp.org/pid/{pid}.xml")


def search_author(name: str, limit: int = 6) -> list:
    """Return [(pid, name, affiliation)] candidates for a person's name."""
    import json

    q = urllib.parse.urlencode({"q": name, "format": "json", "h": str(limit)})
    d = json.loads(fetch(f"https://dblp.org/search/author/api?{q}"))
    hits = d["result"]["hits"].get("hit", [])
    out = []
    for h in hits:
        i = h["info"]
        notes = i.get("notes", {}).get("note", [])
        if isinstance(notes, dict):
            notes = [notes]
        aff = "; ".join(x.get("text", "") for x in notes if x.get("@type") == "affiliation")
        out.append((i["url"].split("/pid/")[-1], i["author"], aff))
    return out
