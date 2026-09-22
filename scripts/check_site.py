#!/usr/bin/env python3
"""Dependency-free checks for the static site. Never fetch visitor-facing APIs."""
from __future__ import annotations
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {'.git', '_site', 'node_modules'}
ORIGIN = 'https://t8pium.github.io'

class Page(HTMLParser):
    def __init__(self, source: str):
        super().__init__(convert_charrefs=True)
        self.tags: list[tuple[str, dict[str, str | None]]] = []
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
    @property
    def ids(self):
        return [a['id'] for _, a in self.tags if a.get('id')]


def site_files(root=ROOT):
    return sorted(p for p in root.rglob('*') if p.is_file() and not EXCLUDED.intersection(p.relative_to(root).parts))


def resolve_local(source: Path, href: str, root=ROOT):
    url = urlsplit(href)
    if url.scheme or url.netloc:
        if f'{url.scheme}://{url.netloc}' != ORIGIN:
            return None
    raw = unquote(url.path)
    target = root / raw.lstrip('/') if raw.startswith('/') else source.parent / raw
    if not raw:
        target = source
    target = target.resolve()
    if target.is_dir():
        target /= 'index.html'
    return target, unquote(url.fragment)


def audit(root=ROOT):
    root = root.resolve()
    files = site_files(root)
    pages = {p: Page(p.read_text(encoding='utf-8')) for p in files if p.suffix == '.html'}
    errors = []
    for path, page in pages.items():
        label = str(path.relative_to(root))
        fail = lambda message: errors.append(f'{label}: {message}')
        if sum(tag == 'h1' for tag, _ in page.tags) != 1: fail('expected exactly one h1')
        if sum(tag == 'main' for tag, _ in page.tags) != 1: fail('expected exactly one main')
        if not any(tag == 'html' and a.get('lang') == 'en' for tag, a in page.tags): fail('missing document language')
        for ident, count in Counter(page.ids).items():
            if count > 1: fail(f'duplicate id {ident}')
        meta = {a.get('name') or a.get('property'): a.get('content') for t, a in page.tags if t == 'meta'}
        for key in ('viewport', 'description', 'theme-color', 'og:title', 'og:description', 'og:url', 'og:image', 'twitter:card'):
            if not meta.get(key): fail(f'missing {key}')
        canonical = [a.get('href') for t, a in page.tags if t == 'link' and a.get('rel') == 'canonical']
        if len(canonical) != 1 or canonical[0] != meta.get('og:url'): fail('canonical and og:url must agree')
        preview = resolve_local(path, meta.get('og:image') or '', root)
        if preview and not preview[0].is_file(): fail('missing social preview image')
        if not any(t == 'a' and a.get('href') == '#main' for t, a in page.tags): fail('missing skip link')
        for tag, attrs in page.tags:
            if tag == 'img':
                if 'alt' not in attrs: fail('image missing alt')
                if not attrs.get('width') or not attrs.get('height'): fail('image dimensions missing')
            if tag == 'th' and not attrs.get('scope'): fail('table heading missing scope')
            if tag == 'pre' and 'research-code' not in (attrs.get('class') or '').split(): fail('code block needs the shared overflow treatment')
            if tag == 'pre' and attrs.get('tabindex') != '0': fail('code block needs keyboard scroll access')
            for attr in ('src', 'href'):
                href = attrs.get(attr)
                if not href: continue
                local = resolve_local(path, href, root)
                if local:
                    target, fragment = local
                    if not target.is_relative_to(root) or not target.is_file(): fail(f'broken local {attr}: {href}')
                    elif fragment and target in pages and fragment not in pages[target].ids: fail(f'missing anchor: {href}')
                elif attr == 'src' or (tag == 'link' and attrs.get('rel') == 'stylesheet'):
                    fail(f'external runtime dependency: {href}')
            for attr in ('aria-labelledby', 'aria-describedby', 'aria-controls'):
                for ident in (attrs.get(attr) or '').split():
                    if ident not in page.ids: fail(f'{attr} points to missing {ident}')
        text = path.read_text(encoding='utf-8')
        for stale in ('dsaiugbadfsigh', '\\ncd ', 'api.sketchfab.com', '/blob/main/published/'):
            if stale in text: fail(f'obsolete content: {stale}')
    for path in files:
        if path.suffix == '.svg':
            try: ET.fromstring(path.read_text())
            except ET.ParseError as error: errors.append(f'{path.relative_to(root)}: invalid SVG: {error}')
        if path.suffix == '.css':
            for href in re.findall(r'url\([\'"]?([^\)\'\"]+)', path.read_text()):
                local = resolve_local(path, href, root)
                if local and not local[0].is_file(): errors.append(f'{path.name}: missing CSS asset {href}')
    return errors, len(pages)

if __name__ == '__main__':
    errors, count = audit(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT)
    if errors:
        print('\n'.join(errors));sys.exit(1)
    print(f'PASS: {count} pages; local links, anchors, images, metadata, ARIA references, SVG and CSS assets.')
