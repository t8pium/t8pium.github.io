from __future__ import annotations

import json
import re
import shutil
from dataclasses import dataclass, field
from html import escape
from pathlib import Path
from typing import Any

PROJECT_GALLERY_START = "<!-- PROJECT_GALLERY_START -->"
PROJECT_GALLERY_END = "<!-- PROJECT_GALLERY_END -->"


@dataclass
class CaseStudySection:
    heading: str
    body: str = ""
    bullets: list[str] = field(default_factory=list)


@dataclass
class PortfolioProject:
    title: str
    category: str
    description: str
    status: str = "Project"
    slug: str = ""
    cover_image: str = ""
    github_url: str = ""
    tech_stack: list[str] = field(default_factory=list)
    sections: list[CaseStudySection] = field(default_factory=list)


def slugify(text: str) -> str:
    value = text.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "project"


def safe_read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def safe_write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def project_from_dict(data: dict[str, Any]) -> PortfolioProject:
    required = ["title", "category", "description"]
    missing = [key for key in required if not str(data.get(key, "")).strip()]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    sections: list[CaseStudySection] = []
    for section in data.get("sections", []):
        sections.append(
            CaseStudySection(
                heading=str(section.get("heading", "Section")).strip() or "Section",
                body=str(section.get("body", "")).strip(),
                bullets=[str(item).strip() for item in section.get("bullets", []) if str(item).strip()],
            )
        )

    project = PortfolioProject(
        title=str(data["title"]).strip(),
        category=str(data["category"]).strip(),
        description=str(data["description"]).strip(),
        status=str(data.get("status", "Project")).strip() or "Project",
        slug=str(data.get("slug", "")).strip(),
        cover_image=str(data.get("cover_image", "")).strip(),
        github_url=str(data.get("github_url", "")).strip(),
        tech_stack=[str(tag).strip() for tag in data.get("tech_stack", []) if str(tag).strip()],
        sections=sections,
    )
    project.slug = project.slug or slugify(project.title)
    return project


def load_project_json(path: Path) -> PortfolioProject:
    return project_from_dict(json.loads(safe_read_text(path)))


def copy_cover(portfolio_root: Path, project: PortfolioProject) -> str:
    if not project.cover_image:
        return ""

    source = Path(project.cover_image)
    if not source.is_absolute():
        source = portfolio_root / source

    if not source.exists():
        raise FileNotFoundError(f"Cover image not found: {source}")

    covers_dir = portfolio_root / "assets" / "covers"
    covers_dir.mkdir(parents=True, exist_ok=True)

    suffix = source.suffix.lower() or ".png"
    dest_name = f"{project.slug}-cover{suffix}"
    dest = covers_dir / dest_name
    shutil.copy2(source, dest)
    return f"assets/covers/{dest_name}"


def render_tags(tags: list[str]) -> str:
    return "".join(f"<span>{escape(tag)}</span>" for tag in tags)


def render_cover_html(project: PortfolioProject, cover_path: str, prefix: str = "") -> str:
    if cover_path:
        return (
            f'<img src="{escape(prefix + cover_path)}" alt="" loading="lazy" '
            'style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;">'
        )

    initials = "".join(word[0] for word in project.title.split()[:2]).upper() or "PR"
    return f'<div class="cover-mark">{escape(initials)}</div>'


def render_gallery_card(project: PortfolioProject, cover_path: str) -> str:
    title = escape(project.title)
    category = escape(project.category)
    description = escape(project.description)
    slug = escape(project.slug)
    tags = render_tags(project.tech_stack[:3])
    cover = render_cover_html(project, cover_path)

    return f'''            <a class="gallery-card gallery-card--image" href="projects/{slug}/" aria-label="Open {title} project page"><div class="gallery-card__cover">{cover}</div><div class="gallery-card__body"><span class="gallery-card__type">{category}</span><h3>{title}</h3><p>{description}</p><div class="gallery-card__props">{tags}</div><span class="gallery-card__open">Open &nearr;</span></div></a>'''


def render_section(section: CaseStudySection) -> str:
    heading = escape(section.heading)
    if section.bullets:
        items = "".join(f"<li>{escape(item)}</li>" for item in section.bullets)
        content = f"<ul>{items}</ul>"
    else:
        content = f"<p>{escape(section.body)}</p>"

    return f'''      <div class="page-section-grid"><h2>{heading}</h2><div>{content}</div></div>'''


def render_project_page(project: PortfolioProject, cover_path: str) -> str:
    title = escape(project.title)
    category = escape(project.category)
    description = escape(project.description)
    status = escape(project.status)
    cover = render_cover_html(project, cover_path, prefix="../../")
    stack = render_tags(project.tech_stack)
    sections = "\n".join(render_section(section) for section in project.sections)

    repo = ""
    if project.github_url:
        repo = f'<div><dt>Repo</dt><dd><a href="{escape(project.github_url)}" target="_blank" rel="noopener">GitHub</a></dd></div>'

    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} | t8pium</title>
  <link rel="icon" href="../../assets/logo-mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../../style.css?v=7">
  <link rel="stylesheet" href="../../gallery.css?v=8">
</head>
<body>
  <main id="main" class="project-page">
    <section class="page-hero">
      <div class="shell page-hero__grid">
        <div>
          <a class="back-link" href="../../#work">&larr; Back to gallery</a>
          <span class="page-kicker">Project / {category}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <aside class="page-panel"><div class="page-panel__cover gallery-card__cover">{cover}</div><div class="page-panel__body"><dl><div><dt>Status</dt><dd>{status}</dd></div><div><dt>Focus</dt><dd>{category}</dd></div>{repo}</dl></div></aside>
      </div>
    </section>
    <section class="page-content shell">
{sections}
      <div class="page-section-grid"><h2>Stack</h2><div class="detail-tags">{stack}</div></div>
    </section>
  </main>
</body>
</html>
'''


def ensure_gallery_markers(index_html: str) -> str:
    if PROJECT_GALLERY_START in index_html and PROJECT_GALLERY_END in index_html:
        return index_html

    gallery_start = '<div class="notion-gallery notion-gallery--projects" aria-label="Coding project gallery">'
    if gallery_start not in index_html:
        raise RuntimeError("Could not find the coding project gallery in index.html")

    index_html = index_html.replace(gallery_start, gallery_start + "\n              " + PROJECT_GALLERY_START, 1)
    gallery_end = "          </div>\n        </div>\n      </div>\n    </section>"
    if gallery_end not in index_html:
        raise RuntimeError("Could not find the end of the coding project gallery in index.html")

    return index_html.replace(gallery_end, "              " + PROJECT_GALLERY_END + "\n" + gallery_end, 1)


def insert_or_replace_card(index_html: str, project: PortfolioProject, card_html: str) -> str:
    index_html = ensure_gallery_markers(index_html)

    pattern = re.compile(
        rf'\s*<a class="gallery-card[^>]*" href="projects/{re.escape(project.slug)}/".*?</a>',
        re.DOTALL,
    )
    if pattern.search(index_html):
        return pattern.sub("\n" + card_html, index_html, count=1)

    before, rest = index_html.split(PROJECT_GALLERY_END, 1)
    return before.rstrip() + "\n" + card_html + "\n              " + PROJECT_GALLERY_END + rest


def add_project_to_portfolio(portfolio_root: Path, project: PortfolioProject) -> dict[str, str]:
    portfolio_root = portfolio_root.resolve()
    index_path = portfolio_root / "index.html"
    if not index_path.exists():
        raise FileNotFoundError(f"index.html not found in {portfolio_root}")

    cover_path = copy_cover(portfolio_root, project)
    page_path = portfolio_root / "projects" / project.slug / "index.html"
    safe_write_text(page_path, render_project_page(project, cover_path))

    card = render_gallery_card(project, cover_path)
    index_html = safe_read_text(index_path)
    safe_write_text(index_path, insert_or_replace_card(index_html, project, card))

    return {
        "project_page": str(page_path),
        "cover_path": cover_path,
        "slug": project.slug,
    }
