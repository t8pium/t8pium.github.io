#!/usr/bin/env python3
"""Run the exact published experiment programs against data/active_mnq.pkl."""
from __future__ import annotations
import argparse, os, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PYTHON = sys.executable

def run(script: str, outdir: str, env_extra=None, args=None):
    env = os.environ.copy()
    env["FVG_ACTIVE_PKL"] = str(ROOT / "data" / "active_mnq.pkl")
    env["FVG_OUTPUT_DIR"] = str(ROOT / "results" / outdir)
    if env_extra:
        env.update({k: str(v) for k, v in env_extra.items()})
    cmd = [PYTHON, str(ROOT / "published" / script)] + (args or [])
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=ROOT, env=env, check=True)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--suite", choices=["all","deep-1m","multitimeframe","midpoint","body"], default="all")
    ns = ap.parse_args()
    if not (ROOT / "data" / "active_mnq.pkl").exists():
        raise SystemExit("Missing data/active_mnq.pkl. Run prepare_data.py first.")
    if ns.suite in ("all", "deep-1m"):
        run("fvg_final_fast.py", "deep_1m")
    if ns.suite in ("all", "multitimeframe"):
        for tf in (1,5,15,60,240):
            run("fvg_strength_one_tf.py", "multitimeframe", {"TF": tf})
    if ns.suite in ("all", "midpoint"):
        for tf in (1,5,15,60,240):
            run("fvg_midpoint_reaction.py", "midpoint", args=[str(tf)])
    if ns.suite in ("all", "body"):
        run("fvg_ce_rejection_study.py", "body_acceptance", {"CE_TFS": "1,2,3,5,10,15,30,60,120,240,360,480,720,1440"})

if __name__ == "__main__":
    main()
