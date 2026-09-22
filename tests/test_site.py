"""Regression gates for broken navigation and accidental evidence changes."""
import csv
import hashlib
import json
from pathlib import Path
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from check_site import ROOT, Page, audit, resolve_local

class SiteTests(unittest.TestCase):
    def test_all_routes_and_assets(self):
        errors,count=audit()
        self.assertGreaterEqual(count,24)
        self.assertEqual(errors,[],'\n'.join(errors))
    def test_relative_links_resolve_from_nested_routes(self):
        source=ROOT/'projects/fvg-predictive-strength/experiments/01-raw-fill/index.html'
        self.assertEqual(resolve_local(source,'../../')[0],ROOT/'projects/fvg-predictive-strength/index.html')
    def test_published_snapshots_have_not_changed(self):
        manifest=json.loads((ROOT/'docs/research-snapshot-sha256.json').read_text())
        for name,digest in manifest.items():
            self.assertEqual(hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),digest,name)
    def test_homepage_numbers_match_published_evidence(self):
        with (ROOT/'reproducibility/fvg-predictive-strength/reference_results/deep1m_main_results.csv').open() as handle:
            rows=list(csv.DictReader(handle))
        values={r['test']:float(r['Difference'])*100 for r in rows}
        self.assertEqual(f"{values['touch_5']:.2f}",'3.03')
        self.assertEqual(f"{values['touch_60']:.2f}",'0.58')
        self.assertEqual(f"{values['touch_1380']:.3f}",'0.003')
        homepage=(ROOT/'index.html').read_text()
        for value in ['+3.03','+0.58','+0.003']:self.assertIn(value,homepage)
    def test_deep_links_preserved(self):
        ids=Page((ROOT/'index.html').read_text()).ids
        for anchor in ['home','work','quant','about','academics','writing','social']: self.assertIn(anchor,ids)
    def test_primary_navigation_exists_without_javascript(self):
        home=Page((ROOT/'index.html').read_text())
        hrefs={a.get('href') for tag,a in home.tags if tag=='a'}
        self.assertTrue({'#work','#about','#writing','#social'}<=hrefs)
        css=(ROOT/'style.css').read_text()
        self.assertIn('.nav-ready .nav-menu',css)
        self.assertNotIn('.js .reveal',css)
    def test_no_runtime_service_or_reveal_dependency(self):
        script=(ROOT/'script.js').read_text()
        for forbidden in ['fetch(', 'localStorage', 'setInterval(', 'innerHTML']:
            self.assertNotIn(forbidden,script)
    def test_fonts_and_social_card_exist(self):
        for name in ['assets/fonts/manrope-latin.woff2','assets/fonts/ibm-plex-mono-latin.woff2','assets/social-preview.png']:
            self.assertGreater((ROOT/name).stat().st_size,1000)

if __name__=='__main__':unittest.main()
