#!/usr/bin/env python3
"""Validate and export the static production site to _site (no packages needed)."""
from pathlib import Path
import shutil
from check_site import ROOT, audit, site_files

PUBLISH_SUFFIXES={'.html','.css','.js','.svg','.png','.ico','.woff2','.csv'}

def build():
    errors,count=audit()
    if errors: raise SystemExit('\n'.join(errors))
    output=ROOT/'_site'
    if output.exists(): shutil.rmtree(output)
    output.mkdir()
    for path in site_files():
        relative=path.relative_to(ROOT)
        if relative.parts[0] in {'scripts','tests','docs','.github'}: continue
        if path.suffix not in PUBLISH_SUFFIXES and path.name not in {'robots.txt','sitemap.xml','.nojekyll'} and not path.name.endswith('-OFL.txt'): continue
        target=output/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
    errors,_=audit(output)
    if errors: raise SystemExit('\n'.join(errors))
    print(f'Built {count} pages in {output}; zero runtime packages.')

if __name__=='__main__': build()
