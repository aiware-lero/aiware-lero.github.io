/*
 * Checks data.js before it can be deployed.
 *
 * The site renders entirely from data.js in the browser, so a stray comma there
 * is not a small mistake: every page goes blank, and because the deploy job only
 * copies files it would report success while doing it. Anyone editing content
 * through the GitHub web editor has no way to notice before it is live.
 *
 * This runs in CI ahead of the upload step and fails the job instead.
 *
 *     node build/validate-data.js
 *
 * It reports every problem it finds, not just the first, so a web edit that
 * breaks two things does not need two round trips to fix.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SITE = path.join(ROOT, "site");
const errors = [];
const fail = (m) => errors.push(m);

/* ---------- load ---------------------------------------------------------- */

function load() {
  const files = ["assets/js/data.js", "assets/js/publications.generated.js"];
  let src = "";
  for (const f of files) {
    const p = path.join(SITE, f);
    if (!fs.existsSync(p)) {
      console.error(`missing file: site/${f}`);
      process.exit(1);
    }
    src += fs.readFileSync(p, "utf8") + "\n";
  }
  // top-level `const` does not land on globalThis, so hand the bindings over
  src += `
    globalThis.__out = {
      SITE, PEOPLE, PARTNERS, NEWS, OPENINGS, RESEARCH,
      PUBLICATIONS_MANUAL, PUBLICATIONS_DBLP, PUB_CURATION, SHOW_PREPRINTS
    };`;

  const ctx = { console, Date, Math, JSON };
  try {
    vm.runInNewContext(src, ctx, { timeout: 10000 });
  } catch (e) {
    console.error(`data.js does not parse or run:\n  ${e.message}`);
    process.exit(1);
  }
  return ctx.__out;
}

/* ---------- checks -------------------------------------------------------- */

const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;

function checkSite(SITE_) {
  for (const k of ["labName", "tagline", "parent", "university", "contactEmail"]) {
    if (!nonEmpty(SITE_?.[k])) fail(`SITE.${k} is missing or empty`);
  }
  if (SITE_?.contactEmail && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(SITE_.contactEmail)) {
    fail(`SITE.contactEmail is not an address: ${SITE_.contactEmail}`);
  }
}

function checkPeople(PEOPLE) {
  const groups = ["pi", "fellows", "postdocs", "phd"];
  const seen = new Set();

  for (const g of groups) {
    if (!Array.isArray(PEOPLE?.[g])) {
      fail(`PEOPLE.${g} is missing or not an array`);
      continue;
    }
    PEOPLE[g].forEach((p, i) => {
      const at = `PEOPLE.${g}[${i}]`;
      if (!nonEmpty(p?.name)) return fail(`${at}.name is missing`);
      if (!nonEmpty(p.role)) fail(`${at} (${p.name}): role is missing`);

      if (seen.has(p.name)) fail(`${p.name} is listed more than once`);
      seen.add(p.name);

      // a photo that does not exist renders as a broken image, not a monogram
      if (p.photo) {
        const f = path.join(SITE, "assets/img/people", p.photo);
        if (!fs.existsSync(f)) fail(`${at} (${p.name}): photo not found — assets/img/people/${p.photo}`);
      }
      for (const [k, v] of Object.entries(p.links || {})) {
        if (k !== "email" && v && !/^https?:\/\//.test(v)) {
          fail(`${at} (${p.name}): links.${k} is not a URL — ${v}`);
        }
      }
      if (p.interests && !Array.isArray(p.interests)) fail(`${at} (${p.name}): interests must be an array`);
      if (p.excludeDblp && !Array.isArray(p.excludeDblp)) fail(`${at} (${p.name}): excludeDblp must be an array`);
    });
  }
  if (!PEOPLE?.pi?.length) fail("PEOPLE.pi is empty — the page needs a principal investigator");
}

function checkPublications(manual, curation) {
  if (!Array.isArray(manual)) return fail("PUBLICATIONS_MANUAL is not an array");
  const year = new Date().getFullYear();
  manual.forEach((p, i) => {
    const at = `PUBLICATIONS_MANUAL[${i}]`;
    if (!nonEmpty(p?.title)) return fail(`${at}.title is missing`);
    if (!nonEmpty(p.venue)) fail(`${at} (${p.title.slice(0, 40)}…): venue is missing`);
    if (!Number.isInteger(p.year) || p.year < 1990 || p.year > year + 2) {
      fail(`${at} (${p.title.slice(0, 40)}…): year looks wrong — ${p.year}`);
    }
    if (!nonEmpty(p.status)) fail(`${at} (${p.title.slice(0, 40)}…): status is missing`);
    if (!Array.isArray(p.authors) || !p.authors.length) {
      fail(`${at} (${p.title.slice(0, 40)}…): authors is missing or empty`);
    }
  });
  if (curation && typeof curation !== "object") fail("PUB_CURATION must be an object");
}

function checkPartners(PARTNERS) {
  for (const g of ["industry", "academic", "funders"]) {
    if (!Array.isArray(PARTNERS?.[g])) {
      fail(`PARTNERS.${g} is missing or not an array`);
      continue;
    }
    PARTNERS[g].forEach((o, i) => {
      if (!nonEmpty(o?.name)) fail(`PARTNERS.${g}[${i}].name is missing`);
      if (o?.url && !/^https?:\/\//.test(o.url)) fail(`PARTNERS.${g}[${i}] (${o.name}): url is not a URL`);
    });
  }
}

function checkNews(NEWS) {
  if (!Array.isArray(NEWS)) return fail("NEWS is not an array");
  NEWS.forEach((n, i) => {
    if (!/^\d{4}-\d{2}(-\d{2})?$/.test(n?.date || "")) {
      fail(`NEWS[${i}].date must look like 2026-08 or 2026-08-10 — got ${JSON.stringify(n?.date)}`);
    }
    if (!nonEmpty(n?.text)) fail(`NEWS[${i}].text is missing`);
  });
}

function checkOpenings(OPENINGS) {
  if (!Array.isArray(OPENINGS)) return fail("OPENINGS is not an array (use [] when nothing is advertised)");
  OPENINGS.forEach((o, i) => {
    for (const k of ["title", "detail", "status"]) {
      if (!nonEmpty(o?.[k])) fail(`OPENINGS[${i}].${k} is missing`);
    }
  });
}

/* ---------- run ----------------------------------------------------------- */

const d = load();
checkSite(d.SITE);
checkPeople(d.PEOPLE);
checkPublications(d.PUBLICATIONS_MANUAL, d.PUB_CURATION);
checkPartners(d.PARTNERS);
checkNews(d.NEWS);
checkOpenings(d.OPENINGS);

if (errors.length) {
  console.error(`\n${errors.length} problem(s) in site content:\n`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  console.error("\nNothing was deployed. Fix these and push again.\n");
  process.exit(1);
}

const n = (d.PEOPLE.pi.length + d.PEOPLE.fellows.length +
           d.PEOPLE.postdocs.length + d.PEOPLE.phd.length);
console.log(`content OK — ${n} people, ` +
            `${d.PUBLICATIONS_DBLP.length + d.PUBLICATIONS_MANUAL.length} publications, ` +
            `${d.PARTNERS.industry.length + d.PARTNERS.academic.length} collaborating organisations`);
