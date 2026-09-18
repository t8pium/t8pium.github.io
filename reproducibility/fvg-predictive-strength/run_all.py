from __future__ import annotations
import subprocess, sys
from pathlib import Path

root = Path(__file__).resolve().parent
scripts = sorted((root / "experiments").glob("[0-9][0-9]_*.py"))
for script in scripts:
    print(f"\n=== {script.name} ===")
    subprocess.run([sys.executable, str(script)], check=True, cwd=root)
print("\nAll experiments completed. See results/.")
