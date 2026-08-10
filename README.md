# AIware Lab — group website

Website of the research group of Prof. Lionel C. Briand at
[Lero](https://lero.ie/), the Research Ireland Centre for Software, in the
Department of Computer Science and Information Systems at the
[University of Limerick](https://www.ul.ie/).

Static HTML, CSS and vanilla JavaScript. No framework, no build step for the
site itself — `site/` is what gets served.

## Layout

```
site/                     the website; this directory is what GitHub Pages serves
  index.html  team.html  publications.html  partners.html  join.html
  assets/js/data.js                     all editable content lives here
  assets/js/publications.generated.js   generated from DBLP — do not edit
  assets/js/main.js                     rendering
  assets/css/style.css
  assets/img/
build/                    maintenance scripts (not served)
```

## Editing content

Everything a person would want to change — people, research areas, news,
partners, open positions, the lab name — is in **`site/assets/js/data.js`**,
which is plain JavaScript with comments. Nothing else needs touching.

Open `site/index.html` in a browser to preview, or serve the directory:

```bash
python3 -m http.server 4173 --directory site
```

## Publications

The publication list is generated from [DBLP](https://dblp.org/). To pick up
newly indexed papers:

```bash
python3 build/fetch-publications.py
```

This reads each person's DBLP id from `data.js`, fetches their record, and
rewrites `site/assets/js/publications.generated.js`.

Two rules are applied at generation time:

- **Only work accepted for publication is listed.** DBLP marks arXiv/CoRR
  entries as `publtype="informal"`; those are dropped, as are edited volumes
  and datasets. Papers that are accepted but not yet indexed can be staged by
  hand in `PUBLICATIONS_MANUAL` in `data.js`; the DBLP record supersedes the
  manual entry automatically once it appears, so nothing is listed twice.
- **Homonyms are filtered.** DBLP keeps researchers who share a name on one
  page until an editor separates them, so a name match is not proof of
  authorship. Keys confirmed to belong to someone else are listed per person
  under `excludeDblp` in `data.js`. New papers are included by default, so this
  never blocks a genuine one — but it does mean the fetch output is worth
  reading occasionally. It reports how many entries were excluded for each
  person, and warns when an excluded key disappears from a DBLP page (which
  means DBLP has split that name and the key can be deleted).

The figures on the home page — researchers, papers, co-authors, partner
organisations — are all counted from this data at page load. None are typed in.

## Other scripts

```bash
python3 build/check-links.py        # verify every external link still resolves
python3 build/make-avatar.py IN OUT --head-top Y --chin Y --face-x X
python3 build/make-single-file.py   # bundle the whole site into one HTML file
```

`make-avatar.py` produces the 600×600 headshots: it scales the portrait so the
head sits at a consistent size, and fills the surrounding area either with the
backdrop colour or with a blurred copy of the photo, chosen by sampling the
image's own corners.

`make-single-file.py` writes `dist/aiware-lab.html`, the entire site inlined
into a single self-contained file — useful for sending to someone who should
not need a web server.

## Deployment

Pushing to `main` runs `.github/workflows/pages.yml`, which publishes `site/`
to GitHub Pages. Nothing else in the repository is served.
