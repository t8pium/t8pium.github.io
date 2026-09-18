from __future__ import annotations
from pathlib import Path
import pandas as pd
from fvg_research.config import RAW, PROCESSED
from fvg_research.io import read_any

def cme_trade_date(index: pd.DatetimeIndex) -> pd.Series:
    # CME equity index futures trading day rolls at 17:00 CT. Convert to Chicago
    # time, subtract 17h, then use the resulting calendar date.
    ct = index.tz_convert("America/Chicago")
    return pd.Series((ct - pd.Timedelta(hours=17)).date, index=index, name="trade_date")

src = RAW / "mnq_ohlcv_1m.parquet"
df = read_any(src)
if "symbol" not in df.columns:
    raise SystemExit("Input needs a symbol/raw_symbol column so listed expiries can be separated.")

df["trade_date"] = cme_trade_date(df.index)
daily = df.groupby(["trade_date","symbol"], observed=True)["volume"].sum()
active = daily.groupby(level=0).idxmax().map(lambda x: x[1]).rename("active_symbol")
df = df.join(active, on="trade_date")
active_df = df[df["symbol"] == df["active_symbol"]].copy()
active_df = active_df[~active_df.index.duplicated(keep="last")].sort_index()

# Flag roll dates so experiments can exclude formation near transitions.
symbols = active_df.groupby("trade_date", observed=True)["symbol"].first()
roll_dates = symbols.index[symbols.ne(symbols.shift())]
active_df["roll_date"] = active_df["trade_date"].isin(set(roll_dates))

out = PROCESSED / "mnq_active_1m.parquet"
active_df.reset_index().to_parquet(out, index=False)
print(f"Wrote {len(active_df):,} active-contract bars to {out}")
print(f"Contract transitions: {max(0, len(roll_dates)-1)}")
