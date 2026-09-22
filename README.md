# t8pium — portfolio

[Live site](https://t8pium.github.io/) · [Research platform](https://github.com/t8pium/fvg-predictive-strength)

A personal site for Python tools, robotics prototypes, market research, and working notes. Plain HTML, CSS, and a small navigation script. There are **no runtime package dependencies, remote font requests, analytics, or content APIs**.

## Run locally

From the repository root:

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. Use a web server; asset paths are relative to the site root. Deep links are ordinary directories with `index.html`, so refreshing a project or experiment page works without a router.

## Check and build

Python 3.10+ and Node.js are sufficient; no dependency installation is needed.

```sh
python -m unittest discover -s tests -v
node --check script.js
python scripts/build_site.py
```

The build validates all pages and exports production assets to `_site/`. GitHub Pages continues to serve the root of `main`; the export is available for checking or use with another static host. The GitHub Actions workflow runs the same validation and build for pushes and pull requests.

## Editing guide

- `index.html` — home, selected projects, academics, notes, contact.
- `style.css` — shared tokens, navigation, home, project notes, legal pages, responsive rules.
- `research.css` — study tables, experiment links, commands and evidence summaries.
- `report.css` — the long-form standalone research report.
- `script.js` — accessible mobile disclosure navigation and current-section indication. Content is never dependent on JavaScript.
- `projects/` — four software/hardware case studies plus the FVG study and ten methodology/experiment pages.
- `writing/` — six **working outlines**, explicitly identified as such.
- `fvg-predictive-strength/` — static MNQ report and separate public Nasdaq replication status.
- `assets/` — local SVG artwork, social preview, and self-hosted fonts with their OFL licenses.
- `scripts/`, `tests/` — static export and regression checks.
- `docs/PORTFOLIO_AUDIT.md` — audit decisions, validation, and limitations.

Keep each page's title, description, canonical and social metadata accurate when editing it. Update `sitemap.xml` when adding a route. Check every viewport after changing shared CSS, especially research tables and long titles.

## Content and evidence

Project claims come from the existing portfolio and linked source repositories. The keyboard tool remains private. The robotics page is a prototype write-up with a system diagram, not a substitute for a demo video. Academic scores remain as previously supplied; the site does not imply independent verification.

Published MNQ results and the unfinished public Nasdaq replication are separate. Historical research scripts and CSVs in `reproducibility/` are preserved snapshots. Use the maintained [research repository](https://github.com/t8pium/fvg-predictive-strength) for supported setup and reruns. This portfolio does not host the raw market dataset or run the experiments in the browser.
