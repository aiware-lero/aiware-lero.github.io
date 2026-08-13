/* =============================================================================
   data.js — ALL editable content for the group website lives in this file.
   Everything else (HTML/CSS/JS) is presentation only.

   THE LAB NAME lives in the three fields at the top of SITE below. Change them
   and the header, footer, page titles and the note on the home page all follow;
   nothing else needs editing.
   ========================================================================== */

const SITE = {
  labName: "AIware Lab",
  labShort: "AIware",
  labNameNote:
    "AIware — software with AI at its core rather than bolted on. Building such systems, and establishing when they can be trusted, is the work of this group.",
  tagline: "Software and AI We Can Trust",
  parent: "Lero — the Research Ireland Centre for Software",
  university: "University of Limerick",
  department: "Department of Computer Science and Information Systems",
  contactEmail: "lionel.briand@lero.ie",
  address: "Tierney Building, University of Limerick, Limerick V94 NYD3, Ireland",
  leroUrl: "https://lero.ie/",
  universityUrl: "https://www.ul.ie/",
  departmentUrl: "https://www.ul.ie/scieng/computer-science-and-information-systems",
  lastUpdated: "August 2026"
};

/* -------------------------------------------------------------------------- */
/* PUBLICATION POLICY                                                         */
/*                                                                            */
/* The site lists only work that has been accepted for publication. Papers    */
/* that exist solely as an arXiv preprint are kept in PUBLICATIONS below —     */
/* with status: "preprint" — but are not rendered anywhere, including News.   */
/*                                                                            */
/* When one is accepted, edit its entry in place:                             */
/*     status: "preprint"        →  "journal" or "conference"                 */
/*     venue:  "arXiv preprint"  →  "IEEE TSE" / "ICSE 2027" / …              */
/*     year / date               →  the acceptance or publication date        */
/* and add a matching line to NEWS. It appears on the site immediately.        */
/*                                                                            */
/* Setting this to true would surface preprints as well — left here only so   */
/* the rule is visible and reversible in one place. Keep it false.            */
/* -------------------------------------------------------------------------- */

const SHOW_PREPRINTS = false;

/* -------------------------------------------------------------------------- */
/* Research areas — shown on the home page                                    */
/* -------------------------------------------------------------------------- */

const RESEARCH = [
  {
    id: "ai4se",
    title: "AI for Software Engineering",
    lead: "Using AI to automate the expensive, repetitive, judgement-heavy parts of building software.",
    body:
      "We build techniques that generate tests, localise faults, repair code and analyse programs with large language models, program analysis and automated reasoning working together. Our emphasis is on methods that hold up on real industrial codebases, not just on benchmarks.",
    tags: ["Test generation", "Debugging & repair", "Program analysis", "Code agents"]
  },
  {
    id: "se4ai",
    title: "Software Engineering for AI-enabled Systems",
    lead: "Making systems that contain AI components dependable enough to deploy.",
    body:
      "When a machine-learned component sits inside a safety- or business-critical system, classical verification assumptions break down. We develop testing, monitoring and analysis techniques for LLM-based applications, autonomous systems and cyber-physical systems, so that their failure modes can be found before users do.",
    tags: ["LLM system testing", "Runtime monitoring", "Digital twins", "Uncertainty"]
  },
  {
    id: "trust",
    title: "Trustworthy Evaluation",
    lead: "Measuring AI systems in ways that do not flatter them.",
    body:
      "Progress in AI for software engineering is only as real as the benchmarks that measure it. We study where evaluations overstate capability — weak test suites, contaminated data, unrepresentative tasks — and build stronger, adversarial ways to assess what these systems can actually do.",
    tags: ["Benchmarking", "Adversarial evaluation", "Empirical studies"]
  },
  {
    id: "industry",
    title: "Research with Industry",
    lead: "Problems that come from practice, and solutions that go back to it.",
    body:
      "Much of our work starts from a concrete problem brought by an industrial partner and is validated in their setting. Scalability, integration cost and the realities of an existing engineering process are treated as first-class research constraints rather than as future work.",
    tags: ["Empirical SE", "Technology transfer", "Case studies"]
  }
];

/* -------------------------------------------------------------------------- */
/* People                                                                     */
/*                                                                            */
/*   photo:  path under assets/img/people/ — leave null for a monogram avatar */
/*   links:  { scholar, site, github, linkedin, dblp, orcid, twitter, email }  */
/* -------------------------------------------------------------------------- */

const PEOPLE = {
  pi: [
    {
      name: "Lionel C. Briand",
      photo: "lionel-briand.jpg",
      role: "Director of Lero · Professor of Software Engineering",
      affil: "University of Limerick · University of Ottawa",
      honours: "ACM Fellow · IEEE Fellow · FRSC · Academia Europaea",
      bio:
        "Lionel Briand is Director of Lero and Professor of Software Engineering at the University of Limerick, with a shared appointment at the University of Ottawa, where he holds a Canada Research Chair (Tier 1) on Intelligent Software Dependability and Compliance. Over more than thirty years he has run research projects with partners in the automotive, satellite, aerospace, energy, financial and legal sectors. He was elected Fellow of the ACM and of the IEEE for his work on software testing and verification, and received an ERC Advanced Grant in 2016.",
      interests: [
        "Software testing and verification",
        "Trustworthy AI",
        "AI for software engineering",
        "Requirements engineering",
        "Model-driven development",
        "Empirical software engineering"
      ],
      awards: [
        "IEEE Computer Society Harlan Mills Award (2012)",
        "ACM SIGSOFT Outstanding Research Award (2022)",
        "IEEE Reliability Society Engineer of the Year (2013)",
        "ERC Advanced Grant (2016)",
        "Fellow of the Royal Society of Canada (2023)"
      ],
      links: {
        site: "https://www.lbriand.info/",
        scholar: "https://scholar.google.com/citations?user=Zj897NoAAAAJ",
        dblp: "https://dblp.org/pid/93/1501",
        lero: "https://lero.ie/people/lionel-briand/",
        nanda: "https://sites.google.com/view/nanda-lab/",
        email: "lionel.briand@lero.ie"
      }
    }
  ],

  fellows: [
    {
      name: "Qinghua Xu",
      // DBLP lists several researchers named Qinghua Xu on one page. These keys
      // are not this author's work; checked against his own publication list.
      excludeDblp: [
        "conf/smartgridcomm/WuXSZCL19",   // DC bus power systems
        "journals/kbs/WangWXZX21",        // image clustering
        "conf/dsie/XuWYZ22",              // extensometer deformation detection
        "journals/apin/TaoXLL23",         // sliding window / DTW
        "journals/chinaf/LeongLWXSP23",   // WS2-ZnO materials physics
        "journals/ijcse/XuSG25",          // air pollution prediction
        "journals/computing/WangXYZHH25"  // multi-view clustering
      ],
      photo: "qinghua-xu.jpg",
      role: "Senior Research Fellow",
      bio:
        "Qinghua works on testing and analysis for AI-enabled systems, with a background in digital twins and anomaly detection for cyber-physical systems. He received his PhD from the University of Oslo in 2023, based at Simula Research Laboratory, for a thesis on dependable cyber-physical systems through digital twins. He now leads work on multi-agent LLM approaches to test generation and specification alignment.",
      interests: ["LLM-based test generation", "Cyber-physical systems", "Digital twins", "Anomaly detection"],
      links: {
        scholar: "https://scholar.google.com/citations?user=_4RYAuUAAAAJ",
        dblp: "https://dblp.org/pid/254/6098",
        lero: "https://lero.ie/people/qinghua-xu/",
        linkedin: "https://www.linkedin.com/in/qinghua-xu-4145b525b/"
      }
    },
    {
      name: "Guancheng Wang",
      photo: "guancheng-wang.jpg",
      role: "Senior Research Fellow",
      bio:
        "Guancheng works on software testing and debugging, in particular on how large language models, program analysis and automated reasoning can be combined to generate stronger tests and diagnose failures. He received his PhD from Peking University, advised by Yingfei Xiong and Lu Zhang, and holds two ACM SIGSOFT Distinguished Paper Awards.",
      interests: ["Test generation", "Debugging and delta debugging", "Program analysis", "Compiler testing"],
      awards: [
        "ACM SIGSOFT Distinguished Paper Award, ESEC/FSE 2021",
        "ACM SIGSOFT Distinguished Paper Award, ASE 2019"
      ],
      links: {
        site: "https://guanchengwang.github.io",
        scholar: "https://scholar.google.com/citations?user=WbkgdnIAAAAJ",
        dblp: "https://dblp.org/pid/196/5011-1",
        github: "https://github.com/Amocy-Wang",
        lero: "https://lero.ie/people/guancheng-wang/",
        twitter: "https://x.com/Amocy_W",
        email: "guancheng.wang@ul.ie"
      }
    },
    {
      name: "Boxi Yu",
      // DBLP lists several researchers named Boxi Yu on one page. These keys are
      // not this author's work; checked against his own publication list.
      excludeDblp: [
        "journals/anor/YuU24",            // multi-objective optimisation (OR)
        "journals/tits/LiuZYYJ25"         // traffic flow estimation
      ],
      photo: "boxi-yu.jpg",
      role: "Senior Research Fellow",
      bio:
        "Boxi works on trustworthy AI and automated testing, including code agents, test oracle construction and the question of whether our benchmarks actually measure what we think they measure. He received his PhD from the Chinese University of Hong Kong, Shenzhen in 2025, advised by Pinjia He.",
      interests: ["Trustworthy AI", "Code agents", "Automated testing", "Benchmark design"],
      links: {
        site: "https://boxiyu.github.io/",
        scholar: "https://scholar.google.com/citations?user=Tat3jMQAAAAJ",
        dblp: "https://dblp.org/pid/291/6296",
        github: "https://github.com/BoxiYu",
        orcid: "https://orcid.org/0000-0001-5213-7189",
        linkedin: "https://www.linkedin.com/in/boxi-yu-194b63279/",
        twitter: "https://twitter.com/BoshCavendish"
      }
    },
    {
      name: "Liting Lin",
      // DBLP lists several researchers named Liting Lin on one page. This key is
      // not this author's work; checked against his own publication list.
      excludeDblp: [
        "conf/IEEEwisa/LinMWY25"          // zeroth-order optimisation survey
      ],
      photo: "liting-lin.jpg",
      role: "Research Fellow",
      bio:
        "Liting joins the group from computer vision, where he is known for the LaSOT tracking benchmark and the SwinTrack and LoRAT trackers. He now applies that background in large-scale modelling and evaluation to the testing of conversational LLM agents and to hallucination detection in retrieval-augmented systems.",
      interests: ["LLM agent testing", "Hallucination detection", "Visual object tracking", "Representation learning"],
      links: {
        scholar: "https://scholar.google.com/citations?user=BJv0a1cAAAAJ",
        dblp: "https://dblp.org/pid/227/2204",
        github: "https://github.com/LitingLin"
      }
    }
  ],

  postdocs: [
    {
      name: "Maryam Maryam",
      photo: null,
      role: "Postdoctoral Researcher",
      bio: "",
      interests: [],
      links: {}
    }
  ],

  phd: [
    {
      name: "John Phillip Ayotunde",
      photo: "john-ayotunde.jpg",
      role: "PhD Student",
      bio:
        "John works on safety monitoring for cyber-physical systems, in particular on handling the severe label imbalance that makes learned monitors unreliable in practice. He holds an MSc in Artificial Intelligence and Machine Learning from the University of Limerick and a first degree in aeronautical engineering.",
      interests: ["CPS safety monitoring", "Uncertainty quantification", "Machine learning for dependability"],
      links: {
        dblp: "https://dblp.org/pid/433/2089",
        linkedin: "https://www.linkedin.com/in/john-phillip-ayotunde-068b2b117/"
      }
    }
  ],

  alumni: []
};

/* -------------------------------------------------------------------------- */
/* Publications                                                               */
/*                                                                            */
/*   group:  true  → produced within the Limerick group                       */
/*           false → selected earlier work by a member, before joining        */
/*   status: "journal" | "conference" | "preprint"                            */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* PUBLICATIONS — two sources, merged at render time                          */
/*                                                                            */
/* 1. publications.generated.js  — the bulk of the record, pulled from DBLP by */
/*    build/fetch-publications.py. Never edit that file; re-run the script.    */
/*    arXiv/CoRR preprints are already excluded there.                        */
/*                                                                            */
/* 2. PUBLICATIONS_MANUAL below — a small staging area, for two things only:  */
/*                                                                            */
/*    (a) ACCEPTED, NOT YET IN DBLP. DBLP only indexes a paper once the issue  */
/*        or proceedings actually appears, which can lag acceptance by months. */
/*        Anything accepted in the meantime goes here so it shows up right     */
/*        away. Once DBLP catches up the duplicate is dropped automatically    */
/*        (matched on DOI, else on title), so you can leave entries here and   */
/*        tidy up whenever — nothing will appear twice.                        */
/*                                                                            */
/*    (b) PREPRINTS, status: "preprint". These are NOT rendered anywhere —     */
/*        not on the publications page, not in News. They sit here purely so   */
/*        the arXiv id and author list are ready to promote on acceptance:     */
/*        change status to "journal"/"conference" and fill in venue + year.    */
/* -------------------------------------------------------------------------- */

const PUBLICATIONS_MANUAL = [
  /* ---- accepted, awaiting DBLP indexing ---- */
  {
    title: "SWE-ABS: Adversarial Benchmark Strengthening Exposes Inflated Success Rates on Test-based Benchmark",
    authors: [
      "Boxi Yu", "Yang Cao", "Yuzhong Zhang", "Liting Lin", "Junjielong Xu", "Zhiqing Zhong",
      "Qinghua Xu", "Guancheng Wang", "Jialun Cao", "Shing-Chi Cheung", "Pinjia He", "Lionel Briand"
    ],
    venue: "ICML 2026",
    venueLong: "International Conference on Machine Learning",
    year: 2026,
    status: "conference",
    group: true,
    topics: ["code-agents", "benchmarking"],
    links: {
      arxiv: "https://arxiv.org/abs/2603.00520",
      code: "https://github.com/OpenAgentEval/SWE-ABS"
    }
  },
  {
    title: "Hallucination to Consensus: Multi-Agent LLMs for End-to-End JUnit Test Generation",
    authors: ["Qinghua Xu", "Guancheng Wang", "Lionel Briand", "Kui Liu"],
    venue: "ACM TOSEM",
    venueLong: "ACM Transactions on Software Engineering and Methodology",
    year: 2026,
    status: "journal",
    group: true,
    topics: ["test-generation"],
    links: {
      arxiv: "https://arxiv.org/abs/2506.02943",
      doi: "https://doi.org/10.1145/3803418"
    }
  },
  {
    title: "LLM meets ML: Data-efficient Anomaly Detection on Unstable Logs",
    authors: ["Fatemeh Hadadi", "Qinghua Xu", "Domenico Bianculli", "Lionel Briand"],
    venue: "ACM TOSEM",
    venueLong: "ACM Transactions on Software Engineering and Methodology",
    year: 2026,
    status: "journal",
    group: true,
    topics: ["logs", "empirical"],
    links: { doi: "https://doi.org/10.1145/3771283" }
  },

  /* ---- preprints: held here, never rendered (see PUBLICATION POLICY) ---- */
  {
    title: "Mining Workflow Graphs for Black-Box Boundary Testing of Conversational LLM Agents",
    authors: ["Liting Lin", "Boxi Yu", "Yuzhong Zhang", "Lionel Briand", "David-Paul Niland", "Emir Munoz"],
    venue: "arXiv preprint", year: 2026, status: "preprint", group: true,
    topics: ["llm-systems", "testing"],
    links: { arxiv: "https://arxiv.org/abs/2607.06873" }
  },
  {
    title: "TATG: Tracking-Aware Testing Objective for LLM-based Test Generation",
    authors: ["Guancheng Wang", "Qinghua Xu", "Lionel C. Briand"],
    venue: "arXiv preprint", year: 2026, status: "preprint", group: true,
    topics: ["test-generation"],
    links: { arxiv: "https://arxiv.org/abs/2607.03194" }
  },
  {
    title: "BeSpec: Behavior-Level Specification Alignment for Code Generation",
    authors: ["Qinghua Xu", "Guancheng Wang", "Boxi Yu", "Lionel Briand"],
    venue: "arXiv preprint", year: 2026, status: "preprint", group: true,
    topics: ["code-generation"],
    links: { arxiv: "https://arxiv.org/abs/2607.02949" }
  },
  {
    title: "LLM-based Mockless Unit Test Generation for Java",
    authors: ["Qinghua Xu", "Guancheng Wang", "Lionel Briand", "Zhaoqiang Guo", "Kui Liu"],
    venue: "arXiv preprint", year: 2026, status: "preprint", group: true,
    topics: ["test-generation"],
    links: { arxiv: "https://arxiv.org/abs/2605.26851" }
  },
  {
    title: "Characterizing the Failure Modes of LLMs in Resolving Real-World GitHub Issues",
    authors: ["Yanjie Jiang", "Yian Huang", "Guancheng Wang", "Junjie Chen", "Hui Liu", "Lionel Briand"],
    venue: "arXiv preprint", year: 2026, status: "preprint", group: true,
    topics: ["code-agents", "empirical"],
    links: { arxiv: "https://arxiv.org/abs/2605.12270" }
  },
  {
    title: "Call-Chain-Aware LLM-Based Test Generation for Java Projects",
    authors: ["Guancheng Wang", "Qinghua Xu", "Lionel C. Briand", "Zhaoqiang Guo", "Kui Liu"],
    venue: "arXiv preprint", year: 2026, status: "preprint", group: true,
    topics: ["test-generation"],
    links: { arxiv: "https://arxiv.org/abs/2604.22046" }
  },
  {
    title: "Retromorphic Testing with Hierarchical Verification for Hallucination Detection in RAG",
    authors: ["Boxi Yu", "Yuzhong Zhang", "Liting Lin", "Lionel Briand", "Emir Munoz"],
    venue: "arXiv preprint", year: 2026, status: "preprint", group: true,
    topics: ["llm-systems", "testing"],
    links: { arxiv: "https://arxiv.org/abs/2603.27752" }
  },
  {
    title: "Uncertainty-Guided Label Rebalancing for CPS Safety Monitoring",
    authors: ["John Ayotunde", "Qinghua Xu", "Guancheng Wang", "Lionel C. Briand"],
    venue: "arXiv preprint", year: 2026, status: "preprint", group: true,
    topics: ["cps"],
    links: { arxiv: "https://arxiv.org/abs/2603.25670" }
  }
];

/* -------------------------------------------------------------------------- */
/* Hand-added detail for individual papers, keyed by a distinctive lowercase   */
/* fragment of the title. DBLP records no awards, so they are added here.      */
/* -------------------------------------------------------------------------- */

/* Keys are matched on the FULL title, punctuation and case ignored — not as a
   substring, or "Probabilistic Delta Debugging" (FSE'21, which won the award)
   would also tag "A Probabilistic Delta Debugging Approach for Abstract Syntax
   Trees" (ISSRE'23, which did not). Copy the title exactly as DBLP has it. */
const PUB_CURATION = {
  "Probabilistic Delta debugging":
    { award: "ACM SIGSOFT Distinguished Paper Award" },
  "History-Guided Configuration Diversification for Compiler Test-Program Generation":
    { award: "ACM SIGSOFT Distinguished Paper Award" }
};

const TOPIC_LABELS = {
  "test-generation": "Test generation",
  "testing": "Testing",
  "debugging": "Debugging",
  "code-agents": "Code agents",
  "code-generation": "Code generation",
  "llm-systems": "LLM systems",
  "benchmarking": "Benchmarking",
  "cps": "Cyber-physical systems",
  "digital-twins": "Digital twins",
  "logs": "Log analysis",
  "empirical": "Empirical studies",
  "vision": "Computer vision",
  "requirements": "Requirements & compliance",
  "security": "Security",
  "model-driven": "Model-driven engineering",
  "chapter": "Book chapter"
};

/* -------------------------------------------------------------------------- */
/* News / highlights — shown on the home page                                 */
/* -------------------------------------------------------------------------- */

/* Acceptances and publications only — no preprint announcements. See the
   PUBLICATION POLICY note at the top of this file.                          */
const NEWS = [
  {
    date: "2026-07",
    text: "<em>LLM meets ML: Data-efficient Anomaly Detection on Unstable Logs</em> published in ACM Transactions on Software Engineering and Methodology."
  },
  {
    date: "2026-04",
    text: "<em>Mutation-Guided Unit Test Generation with a Large Language Model</em> accepted in IEEE Transactions on Software Engineering."
  },
  {
    date: "2026-03",
    text: "<em>Hallucination to Consensus: Multi-Agent LLMs for End-to-End JUnit Test Generation</em> accepted in ACM Transactions on Software Engineering and Methodology."
  },
  {
    date: "2026-02",
    text: "<em>SWE-ABS</em> accepted at ICML 2026 — adversarially strengthening SWE-Bench test suites drops the top agent from 78.8% to 62.2%."
  }
];

/* -------------------------------------------------------------------------- */
/* Partners                                                                   */
/*   Collaborations with a public record — joint projects and joint papers.    */
/* -------------------------------------------------------------------------- */

const PARTNERS = {
  industry: [
    {
      name: "Genesys",
      note: "Joint papers with researchers at Genesys Cloud Ireland on testing conversational LLM agents and on hallucination detection in retrieval-augmented generation.",
      evidence: "co-authorship with Emir Muñoz and David-Paul Niland (Genesys Cloud, Ireland) on two 2026 papers",
      url: "https://www.genesys.com/"
    },
    {
      name: "Huawei",
      note: "Joint papers with researchers at Huawei's Software Engineering Application Technology Lab on LLM-based unit test generation for Java.",
      evidence: "co-authorship with Kui Liu and Zhaoqiang Guo (Software Engineering Application Technology Lab) on four papers",
      url: null
    }
  ],
  academic: [
    {
      name: "Nanda Lab, University of Ottawa",
      note: "Prof. Briand's Canadian laboratory. The two groups share a research agenda and collaborate continuously.",
      url: "https://sites.google.com/view/nanda-lab/"
    },
    {
      name: "SnT — University of Luxembourg",
      note: "Long-standing ties with the Software Verification and Validation lab, which Prof. Briand founded and headed.",
      url: "https://www.uni.lu/snt-en/"
    },
    {
      name: "Simula Research Laboratory",
      note: "Collaboration on digital twins and anomaly detection for cyber-physical systems.",
      url: "https://www.simula.no/"
    }
  ],
  funders: [
    {
      name: "Research Ireland",
      note: "Lero is the Research Ireland Centre for Software.",
      url: "https://www.researchireland.ie/"
    },
    {
      name: "Canada Research Chairs Programme",
      note: "Supports Prof. Briand's Tier 1 Chair on Intelligent Software Dependability and Compliance.",
      url: "https://www.chairs-chaires.gc.ca/"
    }
  ]
};

/* -------------------------------------------------------------------------- */
/* Open positions — shown on the Join Us page                                 */
/*                                                                            */
/* Only list posts that are genuinely open. An empty array is not a gap: the   */
/* page then states plainly that nothing is advertised and still invites       */
/* speculative enquiries, which is more useful to a candidate than a vacancy   */
/* that does not exist.                                                        */
/*                                                                            */
/* To advertise a real post, add an entry:                                     */
/*     { title: "Postdoctoral Researcher — LLM testing",                       */
/*       detail: "One or two sentences on the work and who it suits.",         */
/*       status: "Open · closes 30 September 2026",                            */
/*       url: "https://www.ul.ie/vacancies/…" }        // url optional         */
/* -------------------------------------------------------------------------- */

const OPENINGS = [];

/* -------------------------------------------------------------------------- */
/* Image credits — rendered on the credits line in the footer                 */
/* -------------------------------------------------------------------------- */

const IMAGE_CREDITS = [
  {
    what: "Campus and Living Bridge photographs",
    who: "William Murphy",
    licence: "CC BY-SA 2.0",
    url: "https://commons.wikimedia.org/wiki/Category:University_of_Limerick",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0/"
  },
  {
    what: "Portrait of Prof. Briand",
    who: "University of Limerick (press photo, marked repro-free)",
    licence: "",
    url: "https://www.ul.ie/news/top-international-researcher-appointed-to-key-position-at-university-of-limerick-and-lero",
    licenceUrl: null
  }
];
