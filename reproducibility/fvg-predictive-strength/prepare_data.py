#!/usr/bin/env python3
"""Build the exact active MNQ 1-minute series used by the published FVG study.

Input: Databento GLBX.MDP3 parent-symbol OHLCV-1m export for MNQ.FUT, either
as the original .zip archive, a .csv.zst file, or decompressed .csv.

The active contract for each CME trading date is the outright quarterly MNQ
contract with the greatest total volume on that trading date. CME trading date
rolls at 18:00 America/New_York. Prices are not back-adjusted.
"""
from __future__ import annotations
import argparse, re, tempfile, zipfile
from pathlib import Path
import pandas as pd

OUTRIGHT_RE = re.compile(r"^MNQ[HMUZ]\d$")
TZ = "America/New_York"

def resolve_csv(path: Path, tempdir: Path) -> Path:
    if path.suffix.lower() != ".zip":
        return path
    with zipfile.ZipFile(path) as zf:
        names = [n for n in zf.namelist() if n.endswith((".csv.zst", ".csv")) and "ohlcv-1m" in n]
        if len(names) != 1:
            raise RuntimeError(f"Expected exactly one OHLCV-1m CSV in archive, found: {names}")
        zf.extract(names[0], tempdir)
        return tempdir / names[0]

def add_trade_date(df: pd.DataFrame) -> pd.Series:
    et = df["ts_event"].dt.tz_convert(TZ)
    local_day = et.dt.normalize().dt.tz_localize(None)
    return (local_day + pd.to_timedelta((et.dt.hour >= 18).astype("int8"), unit="D")).dt.date.astype(str)

def build_active_map(csv_path: Path, chunksize: int) -> pd.DataFrame:
    pieces = []
    for chunk in pd.read_csv(csv_path, usecols=["ts_event", "symbol", "volume"], parse_dates=["ts_event"], chunksize=chunksize):
        mask = chunk["symbol"].astype(str).str.match(OUTRIGHT_RE)
        x = chunk.loc[mask].copy()
        if x.empty:
            continue
        x["trade_date"] = add_trade_date(x)
        pieces.append(x.groupby(["trade_date", "symbol"], observed=True, as_index=False)["volume"].sum())
    vol = pd.concat(pieces, ignore_index=True).groupby(["trade_date", "symbol"], observed=True, as_index=False)["volume"].sum()
    idx = vol.groupby("trade_date", observed=True)["volume"].idxmax()
    return vol.loc[idx, ["trade_date", "symbol", "volume"]].sort_values("trade_date").reset_index(drop=True)

def build_active_series(csv_path: Path, active_map: pd.DataFrame, chunksize: int) -> pd.DataFrame:
    front = active_map.set_index("trade_date")["symbol"].astype(str)
    usecols = ["ts_event", "instrument_id", "open", "high", "low", "close", "volume", "symbol"]
    kept = []
    for chunk in pd.read_csv(csv_path, usecols=usecols, parse_dates=["ts_event"], chunksize=chunksize):
        mask = chunk["symbol"].astype(str).str.match(OUTRIGHT_RE)
        x = chunk.loc[mask].copy()
        if x.empty:
            continue
        x["trade_date"] = add_trade_date(x)
        x["front_symbol"] = x["trade_date"].map(front)
        x = x[x["symbol"].astype(str) == x["front_symbol"].astype(str)].drop(columns="front_symbol")
        if not x.empty:
            kept.append(x)
    out = pd.concat(kept, ignore_index=True).sort_values("ts_event").reset_index(drop=True)
    out["symbol"] = out["symbol"].astype("category")
    return out

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, type=Path, help="Databento MNQ.FUT OHLCV-1m .zip, .csv.zst or .csv")
    ap.add_argument("--output", default=Path("data/active_mnq.pkl"), type=Path)
    ap.add_argument("--active-map", default=Path("data/active_map.csv"), type=Path)
    ap.add_argument("--chunksize", default=500_000, type=int)
    args = ap.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.active_map.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="fvg_mnq_") as td:
        csv_path = resolve_csv(args.input, Path(td))
        amap = build_active_map(csv_path, args.chunksize)
        amap.to_csv(args.active_map, index=False)
        active = build_active_series(csv_path, amap, args.chunksize)
    active.to_pickle(args.output)
    print(f"active rows: {len(active):,}")
    print(f"contracts: {active.symbol.nunique()}")
    print(f"start: {active.ts_event.min()}")
    print(f"end: {active.ts_event.max()}")
    print(f"duplicate timestamps: {active.ts_event.duplicated().sum()}")
    print(f"missing OHLC: {active[['open','high','low','close']].isna().sum().sum()}")

if __name__ == "__main__":
    main()
