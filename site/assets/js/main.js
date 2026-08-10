/* =============================================================================
   main.js — renders the pages from data.js.
   No fetch(), no build step: open any .html file directly in a browser.
   ========================================================================== */

/* ---------- small helpers ------------------------------------------------ */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/* Author names are not written consistently across venues:
   "Lionel C. Briand" / "Lionel Briand", "John Phillip Ayotunde" / "John Ayotunde".
   Compare on first + last name with initials and middle names dropped.        */
const nameParts = (n) =>
  n.replace(/\b[A-Z]\.\s*/g, " ").trim().toLowerCase().split(/\s+/).filter(Boolean);

const sameName = (a, b) => {
  const x = nameParts(a);
  const y = nameParts(b);
  return x.length > 0 && y.length > 0 && x[0] === y[0] && x[x.length - 1] === y[y.length - 1];
};

/* ---------- publications: merge the DBLP dump with the manual staging list -- */

/* Single source of truth for what the site is allowed to show.
   See the PUBLICATION POLICY block at the top of data.js. */
const isPublished = (p) => SHOW_PREPRINTS || p.status !== "preprint";

const titleKey = (t) => String(t).toLowerCase().replace(/[^a-z0-9]/g, "");
const doiKey = (p) =>
  (p.links && p.links.doi ? String(p.links.doi).toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "") : null);

let _merged = null;

/* Manual entries win; a DBLP record for the same paper is then dropped, so an
   entry left in the staging list after DBLP catches up cannot show up twice. */
function allPublications() {
  if (_merged) return _merged;

  const fromDblp = typeof PUBLICATIONS_DBLP !== "undefined" ? PUBLICATIONS_DBLP : [];
  const manual = typeof PUBLICATIONS_MANUAL !== "undefined" ? PUBLICATIONS_MANUAL : [];

  const seenTitles = new Set();
  const seenDois = new Set();
  const out = [];

  const add = (p, source) => {
    const tk = titleKey(p.title);
    const dk = doiKey(p);
    if (seenTitles.has(tk) || (dk && seenDois.has(dk))) return;
    seenTitles.add(tk);
    if (dk) seenDois.add(dk);

    // apply hand-added detail (awards etc.) — exact title match only
    const extra = PUB_CURATION[Object.keys(PUB_CURATION).find((k) => titleKey(k) === tk)] || {};
    out.push({ ...p, ...extra, source });
  };

  manual.forEach((p) => add(p, "manual"));
  fromDblp.forEach((p) => add(p, "dblp"));

  out.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  _merged = out;
  return out;
}

const LISTED = () => allPublications().filter(isPublished);

const ROSTER = [];

function collectMembers() {
  ROSTER.length = 0;
  ["pi", "fellows", "postdocs", "phd", "alumni"].forEach((k) => {
    (PEOPLE[k] || []).forEach((p) => ROSTER.push(p.name));
  });
}

const isMember = (author) => ROSTER.some((name) => sameName(author, name));

/* ---------- monogram avatars --------------------------------------------- */

const AVATAR_GRADIENTS = [
  ["#001e62", "#0067b9"],
  ["#6b2f8f", "#ce0058"],
  ["#0067b9", "#00a3a3"],
  ["#ce0058", "#f2724b"],
  ["#243b7a", "#6b2f8f"],
  ["#00566b", "#0a8f7a"]
];

function initials(name) {
  const parts = name.trim().split(/\s+/).filter((p) => !/^[A-Z]\.$/.test(p));
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashOf(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/* In the single-file bundle the build step supplies data: URIs for these. */
const photoSrc = (file) =>
  (typeof window !== "undefined" && window.__PHOTOS__ && window.__PHOTOS__[file]) ||
  `assets/img/people/${file}`;

function avatarHTML(person, cls = "") {
  if (person.photo) {
    return `<div class="avatar ${cls}"><img src="${esc(photoSrc(person.photo))}"
              alt="${esc(person.name)}" loading="lazy" width="240" height="240"></div>`;
  }
  const [a, b] = AVATAR_GRADIENTS[hashOf(person.name) % AVATAR_GRADIENTS.length];
  return `<div class="avatar avatar-mono ${cls}" aria-hidden="true"
            style="background:linear-gradient(140deg, ${a}, ${b})">${esc(initials(person.name))}</div>`;
}

/* ---------- link labels -------------------------------------------------- */

const LINK_LABELS = {
  site: "Homepage",
  scholar: "Scholar",
  github: "GitHub",
  linkedin: "LinkedIn",
  dblp: "DBLP",
  orcid: "ORCID",
  twitter: "X",
  lero: "Lero",
  simula: "Simula",
  nanda: "Nanda Lab",
  email: "Email"
};

/* Link types kept in data.js but deliberately not rendered as chips:
   email — personal addresses are not published; contact goes via the Join Us page
   lero  — the Lero directory entry only repeats what the card already says      */
const HIDDEN_LINKS = new Set(["email", "lero"]);

function personLinksHTML(links = {}) {
  const items = Object.entries(links)
    .filter(([k, v]) => v && !HIDDEN_LINKS.has(k))
    .map(([k, v]) => {
      const href = k === "email" ? `mailto:${v}` : v;
      const ext = k === "email" ? "" : ' target="_blank" rel="noopener"';
      return `<a class="plink" href="${esc(href)}"${ext}>${esc(LINK_LABELS[k] || k)}</a>`;
    });
  return items.length ? `<div class="plinks">${items.join("")}</div>` : "";
}

/* ---------- header / footer ---------------------------------------------- */

const NAV = [
  ["index.html", "Home"],
  ["team.html", "Team"],
  ["publications.html", "Publications"],
  ["partners.html", "Partners"],
  ["join.html", "Join Us"]
];

const MARK_SVG = `
<svg class="brand-mark" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="bm" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
      <stop stop-color="#001e62"/><stop offset=".52" stop-color="#6b2f8f"/><stop offset="1" stop-color="#ce0058"/>
    </linearGradient>
  </defs>
  <rect x="1.6" y="1.6" width="36.8" height="36.8" rx="10.5" stroke="url(#bm)" stroke-width="2.4"/>
  <circle cx="13.4" cy="20" r="3.5" fill="url(#bm)"/>
  <path d="M18.6 20h8.2" stroke="url(#bm)" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="28.4" cy="20" r="2.1" fill="url(#bm)"/>
  <path d="M13.4 13.2c4.6-3.4 9.6-1.6 11.6 2.4M13.4 26.8c4.6 3.4 9.6 1.6 11.6-2.4"
        stroke="url(#bm)" stroke-width="2.1" stroke-linecap="round" opacity=".55"/>
</svg>`;

/* Single-file bundle mode: build/make-single-file.py sets window.__SINGLE_FILE__,
   stacks every page into one document and drives navigation off the hash. */
const SINGLE_FILE = typeof window !== "undefined" && window.__SINGLE_FILE__ === true;
const pageHref = (file) => (SINGLE_FILE ? "#" + file.replace(".html", "") : file);
const currentPage = () =>
  SINGLE_FILE
    ? (location.hash.slice(1) || "index") + ".html"
    : (location.pathname.split("/").pop() || "index.html").toLowerCase();

function renderChrome() {
  const here = currentPage();

  const header = $("#site-header");
  if (header) {
    header.innerHTML = `
      <div class="wrap">
        <a class="brand" href="${pageHref("index.html")}">
          ${MARK_SVG}
          <span class="brand-text">
            <span class="brand-name">${esc(SITE.labName)}</span>
            <span class="brand-sub">Lero · University of Limerick</span>
          </span>
        </a>
        <button class="nav-toggle" aria-label="Menu" aria-expanded="false" aria-controls="primary-nav">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <path d="M3 6h14M3 10h14M3 14h14"/>
          </svg>
        </button>
        <nav class="nav" id="primary-nav" aria-label="Primary">
          ${NAV.map(([href, label]) =>
            `<a href="${pageHref(href)}"${href.toLowerCase() === here ? ' class="is-active" aria-current="page"' : ""}>${label}</a>`
          ).join("")}
        </nav>
      </div>`;

    const toggle = $(".nav-toggle", header);
    const nav = $("#primary-nav", header);
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const footer = $("#site-footer");
  if (!footer) return;

  const credits = IMAGE_CREDITS.map((c) => {
    const who = c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.who)}</a>` : esc(c.who);
    const lic = c.licence
      ? ` (<a href="${esc(c.licenceUrl)}" target="_blank" rel="noopener">${esc(c.licence)}</a>)`
      : "";
    return `${esc(c.what)}: ${who}${lic}`;
  }).join(" · ");

  footer.innerHTML = `
    <div class="wrap">
      <div class="funders-strip">
        <img src="assets/img/brand/lero-funders-banner.png"
             alt="Lero is funded by Research Ireland and its partner organisations" loading="lazy">
      </div>
      <p class="funders-caption">${esc(SITE.labName)} is part of ${esc(SITE.parent)}.</p>

      <div class="footer-grid" style="margin-top:40px">
        <div class="footer-brand">
          <span class="brand-text">
            <span class="brand-name">${esc(SITE.labName)}</span>
            <span class="brand-sub">${esc(SITE.tagline)}</span>
          </span>
          <p>${esc(SITE.department)},<br>${esc(SITE.university)}<br>${esc(SITE.address)}</p>
          <a class="footer-lero" href="${esc(SITE.leroUrl)}" target="_blank" rel="noopener"
             aria-label="Lero — the Research Ireland Centre for Software">
            <img src="assets/img/brand/lero-logo.png" alt="Lero" width="505" height="75" loading="lazy">
          </a>
        </div>
        <div class="footer-col">
          <h4>Pages</h4>
          <ul>${NAV.map(([h, l]) => `<li><a href="${pageHref(h)}">${l}</a></li>`).join("")}</ul>
        </div>
        <div class="footer-col">
          <h4>Elsewhere</h4>
          <ul>
            <li><a href="${esc(SITE.leroUrl)}" target="_blank" rel="noopener">Lero</a></li>
            <li><a href="${esc(SITE.universityUrl)}" target="_blank" rel="noopener">University of Limerick</a></li>
            <li><a href="${esc(SITE.departmentUrl)}" target="_blank" rel="noopener">Dept. of CSIS</a></li>
            <li><a href="https://sites.google.com/view/nanda-lab/" target="_blank" rel="noopener">Nanda Lab, uOttawa</a></li>
            <li><a href="mailto:${esc(SITE.contactEmail)}">${esc(SITE.contactEmail)}</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>© ${new Date().getFullYear()} ${esc(SITE.labName)}, ${esc(SITE.university)}. Last updated ${esc(SITE.lastUpdated)}.</p>
        <p class="credits">Images — ${credits}</p>
      </div>
    </div>`;
}

/* ---------- home page ---------------------------------------------------- */

/* The header wordmark is deliberately small, so the hero carries the name at
   display size. Its own gradient id and light palette keep it legible on the
   navy photograph — the header mark's navy-to-magenta ramp would disappear. */
const HERO_MARK_SVG = `
<svg class="hero-mark" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="bm-hero" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
      <stop stop-color="#cfe3fb"/><stop offset=".5" stop-color="#9fc6f4"/><stop offset="1" stop-color="#ff5f93"/>
    </linearGradient>
  </defs>
  <rect x="1.6" y="1.6" width="36.8" height="36.8" rx="10.5" stroke="url(#bm-hero)" stroke-width="2.4"/>
  <circle cx="13.4" cy="20" r="3.5" fill="url(#bm-hero)"/>
  <path d="M18.6 20h8.2" stroke="url(#bm-hero)" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="28.4" cy="20" r="2.1" fill="url(#bm-hero)"/>
  <path d="M13.4 13.2c4.6-3.4 9.6-1.6 11.6 2.4M13.4 26.8c4.6 3.4 9.6 1.6 11.6-2.4"
        stroke="url(#bm-hero)" stroke-width="2.1" stroke-linecap="round" opacity=".55"/>
</svg>`;

function renderHome() {
  const brand = $("#hero-brand");
  if (brand) {
    brand.innerHTML = `
      ${HERO_MARK_SVG}
      <span class="hero-brand-text">
        <span class="hero-brand-name">${esc(SITE.labName)}</span>
        <span class="hero-brand-sub">${esc(SITE.parent.split("—")[0].trim())} · ${esc(SITE.university)}</span>
      </span>`;
  }

  const research = $("#research-grid");
  if (research) {
    research.innerHTML = RESEARCH.map((r, i) => `
      <article class="rcard" id="${esc(r.id)}">
        <span class="rcard-num">${String(i + 1).padStart(2, "0")}</span>
        <h3>${esc(r.title)}</h3>
        <p class="rcard-lead">${esc(r.lead)}</p>
        <p class="rcard-body">${esc(r.body)}</p>
        <ul class="tags">${r.tags.map((t) => `<li class="tag">${esc(t)}</li>`).join("")}</ul>
      </article>`).join("");
  }

  const news = $("#news-list");
  if (news) {
    news.innerHTML = newsItems().map((n) => `
      <li>
        <time datetime="${esc(n.date)}">${fmtMonth(n.date)}</time>
        <p>${n.text}</p>
      </li>`).join("");
  }

  const stats = $("#stats");
  if (stats) {
    // Every figure here is counted from the data on the page, and each label
    // states exactly what was counted. The group itself is new — its own joint
    // output is a handful of papers — so the honest headline is the members'
    // combined record, labelled as such, not a number that reads as the
    // group's own. Anything narrower belongs on the publications page, where
    // the "work from the group" filter already reports its own count.
    const pubs = LISTED();
    const headcount =
      PEOPLE.pi.length + PEOPLE.fellows.length + PEOPLE.postdocs.length + PEOPLE.phd.length;

    const firstYear = pubs.length ? Math.min(...pubs.map((p) => p.year)) : null;
    // co-authors = everyone the members have published with, minus the members
    const coauthors = new Set(
      pubs.flatMap((p) => p.authors).filter((a) => !isMember(a))
    ).size;

    const items = [
      [headcount, "researchers"],
      [pubs.length,
        firstYear ? `peer-reviewed papers by members since ${firstYear}`
                  : "peer-reviewed papers by members"],
      [coauthors, "co-authors worldwide"],
      [PARTNERS.academic.length + PARTNERS.industry.length, "collaborating organisations"]
    ];
    stats.innerHTML = items.map(([n, l]) =>
      `<div class="stat"><div class="stat-num">${n}</div><div class="stat-label">${esc(l)}</div></div>`
    ).join("");
  }

  const preview = $("#people-preview");
  if (preview) {
    const all = [...PEOPLE.pi, ...PEOPLE.fellows, ...PEOPLE.postdocs, ...PEOPLE.phd];
    preview.innerHTML = all.map((p) => `
      <a class="pcard" href="${pageHref("team.html")}" style="display:block">
        ${avatarHTML(p)}
        <h3>${esc(p.name)}</h3>
        <p class="prole">${esc(p.role)}</p>
      </a>`).join("");
  }

  const recent = $("#recent-pubs");
  if (recent) {
    recent.innerHTML = LISTED().filter((p) => p.group).slice(0, 5).map(pubHTML).join("");
  }
}

/* News = hand-written entries (awards, grants, arrivals) merged with an entry
   generated for each of the group's most recent publications. The generated
   ones inherit the preprint rule for free: LISTED() never returns a preprint,
   so nothing under review is ever announced here. Anything already covered by
   a hand-written entry is skipped, so there are no duplicates. */
const NEWS_AUTO_COUNT = 5;

/* Match a paper against hand-written news on its short name — the bit before
   the colon ("SWE-ABS"), since that is what a news line actually says, not the
   full subtitle. Falls back to a title prefix for papers with no colon. */
function newsMatchKey(title) {
  const head = titleKey(String(title).split(":")[0]);
  return head.length >= 5 ? head : titleKey(title).slice(0, 20);
}

function newsItems() {
  const manual = (typeof NEWS !== "undefined" ? NEWS : []).map((n) => ({ ...n, manual: true }));
  const mentioned = manual.map((n) => titleKey(n.text));

  const auto = LISTED()
    .filter((p) => p.group)
    .slice(0, NEWS_AUTO_COUNT)
    .filter((p) => !mentioned.some((m) => m.includes(newsMatchKey(p.title))))
    .map((p) => ({
      date: String(p.year),
      text: `<em>${esc(p.title)}</em> published in ${esc(p.venueLong || p.venue)}.`
    }));

  return [...manual, ...auto]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 6);
}

function fmtMonth(iso) {
  const [y, m] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return m ? `${months[Number(m) - 1]} ${y}` : y;
}

/* ---------- team page ---------------------------------------------------- */

function personCardHTML(p) {
  return `
    <article class="pcard">
      ${avatarHTML(p)}
      <h3>${esc(p.name)}</h3>
      <p class="prole">${esc(p.role)}</p>
      ${p.bio ? `<p class="pbio">${esc(p.bio)}</p>` : ""}
      ${p.interests && p.interests.length
        ? `<ul class="tags">${p.interests.map((t) => `<li class="tag">${esc(t)}</li>`).join("")}</ul>`
        : ""}
      ${personLinksHTML(p.links)}
    </article>`;
}

function renderTeam() {
  const piBox = $("#pi-block");
  if (piBox) {
    piBox.innerHTML = PEOPLE.pi.map((p) => `
      <article class="pi-card">
        ${avatarHTML(p)}
        <div>
          <h3>${esc(p.name)}</h3>
          <p class="prole">${esc(p.role)}</p>
          <p class="paffil">${esc(p.affil)}</p>
          ${p.honours ? `<span class="phonours">${esc(p.honours)}</span>` : ""}
          <p class="pbio">${esc(p.bio)}</p>
          ${p.interests ? `<ul class="tags" style="margin-bottom:18px">${p.interests.map((t) => `<li class="tag">${esc(t)}</li>`).join("")}</ul>` : ""}
          ${p.awards ? `<ul class="award-list">${p.awards.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}
          ${personLinksHTML(p.links)}
        </div>
      </article>`).join("");
  }

  const groups = [
    ["fellows", "Research Fellows"],
    ["postdocs", "Postdoctoral Researchers"],
    ["phd", "PhD Students"],
    ["alumni", "Alumni"]
  ];

  const host = $("#people-blocks");
  if (!host) return;

  host.innerHTML = groups
    .filter(([key]) => (PEOPLE[key] || []).length)
    .map(([key, label]) => `
      <section class="people-section">
        <div class="people-heading">
          <h2>${esc(label)}</h2>
          <span class="count">${PEOPLE[key].length}</span>
        </div>
        <div class="people-grid">${PEOPLE[key].map(personCardHTML).join("")}</div>
      </section>`).join("");
}

/* ---------- publications page -------------------------------------------- */

function authorsHTML(list) {
  return list
    .map((a) => (isMember(a) ? `<span class="me">${esc(a)}</span>` : esc(a)))
    .join(", ");
}

function pubHTML(p) {
  const links = Object.entries(p.links || {})
    .map(([k, v]) => {
      const label = { arxiv: "arXiv", doi: "DOI", code: "Code", scholar: "Scholar", pdf: "PDF" }[k] || k;
      return `<a href="${esc(v)}" target="_blank" rel="noopener">${label}</a>`;
    })
    .join("");

  return `
    <li class="pub">
      <div class="pub-main">
        <h3 class="pub-title">${esc(p.title)}</h3>
        <p class="pub-authors">${authorsHTML(p.authors)}</p>
        <div class="pub-meta">
          <span class="venue venue--${esc(p.status)}"${p.venueLong ? ` title="${esc(p.venueLong)}"` : ""}>${esc(p.venue)}</span>
          ${p.award ? `<span class="badge-award">★ ${esc(p.award)}</span>` : ""}
          ${(p.topics || []).map((t) => `<span class="tag">${esc(TOPIC_LABELS[t] || t)}</span>`).join("")}
        </div>
      </div>
      ${links ? `<div class="pub-links">${links}</div>` : ""}
    </li>`;
}

function renderPublications() {
  const host = $("#pub-list");
  if (!host) return;

  const state = { scope: "group", topic: "all", member: "all" };

  const scopeBar = $("#scope-filters");
  const topicBar = $("#topic-filters");
  const memberBar = $("#member-filters");

  const scopes = [
    ["group", "Work from the group"],
    ["all", "All publications by members"]
  ];
  scopeBar.innerHTML =
    `<span class="filter-label">Show</span>` +
    scopes.map(([v, l]) =>
      `<button class="chip" data-scope="${v}" aria-pressed="${v === state.scope}">${l}</button>`
    ).join("");

  const topics = ["all", ...new Set(LISTED().flatMap((p) => p.topics || []))];
  topicBar.innerHTML =
    `<span class="filter-label">Topic</span>` +
    topics.map((t) =>
      `<button class="chip" data-topic="${t}" aria-pressed="${t === state.topic}">${
        t === "all" ? "All" : esc(TOPIC_LABELS[t] || t)
      }</button>`
    ).join("");

  // One chip per member who appears on at least one listed paper.
  if (memberBar) {
    const roster = [...PEOPLE.pi, ...PEOPLE.fellows, ...PEOPLE.postdocs, ...PEOPLE.phd];
    const withWork = roster.filter((p) =>
      LISTED().some((pub) => pub.authors.some((a) => sameName(a, p.name)))
    );
    memberBar.innerHTML =
      `<span class="filter-label">Member</span>` +
      `<button class="chip" data-member="all" aria-pressed="true">Everyone</button>` +
      withWork
        .map((p) => `<button class="chip" data-member="${esc(p.name)}" aria-pressed="false">${esc(p.name)}</button>`)
        .join("");
  }

  function apply() {
    const list = LISTED().filter(
      (p) =>
        (state.scope === "all" || p.group) &&
        (state.topic === "all" || (p.topics || []).includes(state.topic)) &&
        (state.member === "all" || p.authors.some((a) => sameName(a, state.member)))
    );

    $("#result-count").textContent =
      `${list.length} publication${list.length === 1 ? "" : "s"}` +
      (state.scope === "group"
        ? " produced in the group"
        : " — the full record of everyone currently in the group, from DBLP");

    if (!list.length) {
      host.innerHTML = `<p class="empty-state">Nothing listed under this filter yet.</p>`;
      return;
    }

    const years = [...new Set(list.map((p) => p.year))].sort((a, b) => b - a);
    host.innerHTML = years.map((y) => `
      <section class="year-block">
        <div class="year-head"><h2>${y}</h2></div>
        <ul class="publist">${list.filter((p) => p.year === y).map(pubHTML).join("")}</ul>
      </section>`).join("");
  }

  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    if (chip.dataset.scope) {
      state.scope = chip.dataset.scope;
      $$("[data-scope]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.scope === state.scope)));
    }
    if (chip.dataset.member) {
      state.member = chip.dataset.member;
      $$("[data-member]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.member === state.member)));
    }
    if (chip.dataset.topic) {
      state.topic = chip.dataset.topic;
      $$("[data-topic]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.topic === state.topic)));
    }
    apply();
  });

  apply();
}

/* ---------- partners page ------------------------------------------------ */

function partnerListHTML(items) {
  return `<ul class="plist">${items.map((p) => `
    <li>
      <span class="pname">${p.url
        ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a>`
        : esc(p.name)}</span>
      <span class="pnote">${esc(p.note)}
        ${p.evidence ? `<span class="pevidence">Basis for listing: ${esc(p.evidence)}</span>` : ""}
      </span>
    </li>`).join("")}</ul>`;
}

function renderPartners() {
  const i = $("#partners-industry");
  const a = $("#partners-academic");
  const f = $("#partners-funders");
  if (i) i.innerHTML = partnerListHTML(PARTNERS.industry);
  if (a) a.innerHTML = partnerListHTML(PARTNERS.academic);
  if (f) f.innerHTML = partnerListHTML(PARTNERS.funders);
}

/* ---------- join page ---------------------------------------------------- */

function renderJoin() {
  const host = $("#openings");
  if (!host) return;

  // No advertised vacancy is a state worth stating, not an empty box.
  if (!OPENINGS.length) {
    host.innerHTML = `
      <article class="opening opening--none">
        <h3>No advertised vacancies at present</h3>
        <p>
          Posts are funded project by project, so openings appear at irregular intervals rather than on a
          yearly cycle. When one is advertised it is listed here and on the
          <a href="https://www.ul.ie/vacancies" target="_blank" rel="noopener">University of Limerick vacancies page</a>.
        </p>
        <p>
          Strong candidates are still worth hearing from between rounds — several people joined after
          getting in touch speculatively, and applicants who bring their own fellowship funding
          (for example a <a href="https://mariecuriealumni.eu/" target="_blank" rel="noopener">Marie
          Skłodowska-Curie</a> or Research Ireland award) can be supported in applying at any time.
        </p>
      </article>`;
    return;
  }

  host.innerHTML = OPENINGS.map((o) => `
    <article class="opening">
      <div class="opening-head">
        <h3>${o.url ? `<a href="${esc(o.url)}" target="_blank" rel="noopener">${esc(o.title)}</a>` : esc(o.title)}</h3>
        <span class="opening-status">${esc(o.status)}</span>
      </div>
      <p>${esc(o.detail)}</p>
    </article>`).join("");
}

/* ---------- boot --------------------------------------------------------- */

function boot() {
  collectMembers();

  // Fill any element marked with data-site="<key>" from SITE
  $$("[data-site]").forEach((el) => {
    const v = SITE[el.dataset.site];
    if (v != null) el.textContent = v;
  });

  const title = $("title");
  if (title && title.dataset.suffix !== "off") {
    title.textContent = title.textContent.replace(/\{\{lab\}\}/g, SITE.labName);
  }

  renderChrome();
  renderHome();
  renderTeam();
  renderPublications();
  renderPartners();
  renderJoin();

  if (SINGLE_FILE) initSingleFileRouter();
}

/* Show one stacked <section class="page"> at a time, driven by the hash. */
function initSingleFileRouter() {
  const pages = $$(".page");
  const show = () => {
    const id = "page-" + (location.hash.slice(1) || "index");
    const target = document.getElementById(id) || pages[0];
    pages.forEach((p) => (p.hidden = p !== target));
    renderChrome();
    $("#primary-nav")?.classList.remove("is-open");
    window.scrollTo({ top: 0, behavior: "instant" });
    const h1 = $("h1", target);
    document.title = (h1 ? h1.textContent + " — " : "") + SITE.labName;
  };
  window.addEventListener("hashchange", show);
  show();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
