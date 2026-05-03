#!/usr/bin/env python3
"""
WB all-time financial analytics (WB-consistent formula)

Usage:
  python3 scripts/wb_financial_all_time_report.py \
    --supplier "ИП Градов_Е_В" \
    --supabase-url "https://...supabase.co" \
    --supabase-anon "sb_publishable_..." \
    --out "./exports/analitika_wb_all_time.xlsx"
"""

import argparse
import json
import time
from datetime import datetime
from pathlib import Path

import pandas as pd
import requests


def fetch_wb_chunk(session, token: str, date_from: str, date_to: str, rrdid: int):
    url = "https://statistics-api.wildberries.ru/api/v5/supplier/reportDetailByPeriod"
    params = {"dateFrom": date_from, "dateTo": date_to, "rrdid": rrdid}

    last_err = ""
    for attempt in range(8):
        try:
            resp = session.get(url, params=params, headers={"Authorization": token}, timeout=60)
            if resp.status_code == 429:
                retry_after = resp.headers.get("retry-after")
                wait = float(retry_after) if retry_after else min(2 * (attempt + 1), 30)
                time.sleep(wait)
                continue
            if resp.status_code >= 500:
                time.sleep(min(2 * (attempt + 1), 20))
                continue
            if not resp.ok:
                raise RuntimeError(f"WB API {resp.status_code}: {resp.text[:500]}")

            raw = resp.text.strip()
            if not raw:
                return []
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, list) else []
        except Exception as e:
            last_err = str(e)
            time.sleep(min(2 * (attempt + 1), 20))

    raise RuntimeError(last_err or "WB fetch failed")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--supplier", required=True)
    ap.add_argument("--supabase-url", required=True)
    ap.add_argument("--supabase-anon", required=True)
    ap.add_argument("--start-year", type=int, default=2020)
    ap.add_argument("--out", default="./exports/analitika_wb_all_time.xlsx")
    args = ap.parse_args()

    s_headers = {
        "apikey": args.supabase_anon,
        "Authorization": f"Bearer {args.supabase_anon}",
    }
    rs = requests.get(
        f"{args.supabase_url}/rest/v1/suppliers",
        params={"select": "id,name,wb_api_token", "name": f"eq.{args.supplier}"},
        headers=s_headers,
        timeout=30,
    )
    rs.raise_for_status()
    rows = rs.json()
    if not rows:
        raise SystemExit(f"Supplier not found: {args.supplier}")

    token = (rows[0].get("wb_api_token") or "").strip()
    if not token:
        raise SystemExit("Supplier has no wb_api_token")

    session = requests.Session()

    all_rows = []
    current_year = datetime.now().year
    for year in range(args.start_year, current_year + 1):
        dfrom = f"{year}-01-01"
        dto = f"{year}-12-31" if year < current_year else datetime.now().strftime("%Y-%m-%d")
        rrdid = 0
        for _ in range(40):
            chunk = fetch_wb_chunk(session, token, dfrom, dto, rrdid)
            if not chunk:
                break
            all_rows.extend(chunk)
            last = chunk[-1]
            next_id = int(last.get("rrd_id") or last.get("rrdid") or 0)
            if not next_id or next_id <= rrdid:
                break
            rrdid = next_id
            if len(chunk) < 100000:
                break
            time.sleep(0.25)

    if not all_rows:
        raise SystemExit("No rows from WB API")

    df = pd.DataFrame(all_rows)

    # normalize fields
    if "nm_id" in df.columns:
        df["Код номенклатуры"] = df["nm_id"]
    elif "nmId" in df.columns:
        df["Код номенклатуры"] = df["nmId"]
    else:
        df["Код номенклатуры"] = 0

    if "sa_name" in df.columns:
        df["Название"] = df["sa_name"]
    elif "subject_name" in df.columns:
        df["Название"] = df["subject_name"]
    else:
        df["Название"] = "(без названия)"

    doc = df.get("doc_type_name", pd.Series("", index=df.index)).astype(str).str.lower()
    sale_mask = doc.str.contains("продажа")
    ret_mask = doc.str.contains("возврат")

    def as_num(src):
        return pd.to_numeric(df.get(src, 0), errors="coerce").fillna(0)

    df["Продажи сумма"] = as_num("retail_amount")
    df["К перечислению сумма"] = as_num("ppvz_for_pay")
    df["Логистика сумма"] = as_num("delivery_rub")
    df["Штрафы сумма"] = as_num("penalty")
    df["Хранение сумма"] = as_num("storage_fee")
    df["Удержания сумма"] = as_num("deduction")
    df["Возмещение издержек сумма"] = as_num("sup_rating_prc_up")

    keys = ["Код номенклатуры", "Название"]

    base = df.groupby(keys, dropna=False).agg(
        **{
            "Сумма логистики": ("Логистика сумма", "sum"),
            "Сумма штрафов": ("Штрафы сумма", "sum"),
            "Сумма хранения": ("Хранение сумма", "sum"),
            "Прочие удержания": ("Удержания сумма", "sum"),
            "Возмещение издержек перевозка/склад": ("Возмещение издержек сумма", "sum"),
        }
    ).reset_index()

    sales = df[sale_mask].groupby(keys, dropna=False)["Продажи сумма"].sum().reset_index().rename(columns={"Продажи сумма": "Продажи (gross)"})
    rets = df[ret_mask].groupby(keys, dropna=False)["Продажи сумма"].sum().reset_index().rename(columns={"Продажи сумма": "Возвраты (gross)"})
    ps = df[sale_mask].groupby(keys, dropna=False)["К перечислению сумма"].sum().reset_index().rename(columns={"К перечислению сумма": "К перечислению за товар (gross)"})
    pr = df[ret_mask].groupby(keys, dropna=False)["К перечислению сумма"].sum().reset_index().rename(columns={"К перечислению сумма": "Возвраты к перечислению (gross)"})

    out = (
        base.merge(sales, on=keys, how="left")
        .merge(rets, on=keys, how="left")
        .merge(ps, on=keys, how="left")
        .merge(pr, on=keys, how="left")
        .fillna(0)
    )

    out["Продажи (net, WB)"] = out["Продажи (gross)"] - out["Возвраты (gross)"]
    out["К перечислению за товар (net, WB)"] = out["К перечислению за товар (gross)"] - out["Возвраты к перечислению (gross)"]
    out["Итого к оплате (WB)"] = (
        out["К перечислению за товар (net, WB)"]
        - out["Сумма логистики"]
        - out["Сумма хранения"]
        - out["Сумма штрафов"]
        - out["Прочие удержания"]
    )

    out = out.sort_values("Продажи (net, WB)", ascending=False)

    summary = pd.DataFrame(
        {
            "Метрика": [
                "Строк WB API",
                "Номенклатур",
                "Продажи (net, WB)",
                "К перечислению за товар (net, WB)",
                "Сумма логистики",
                "Сумма хранения",
                "Сумма штрафов",
                "Прочие удержания",
                "Итого к оплате (WB)",
            ],
            "Значение": [
                len(df),
                len(out),
                float(out["Продажи (net, WB)"].sum()),
                float(out["К перечислению за товар (net, WB)"].sum()),
                float(out["Сумма логистики"].sum()),
                float(out["Сумма хранения"].sum()),
                float(out["Сумма штрафов"].sum()),
                float(out["Прочие удержания"].sum()),
                float(out["Итого к оплате (WB)"].sum()),
            ],
        }
    )

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(out_path, engine="openpyxl") as w:
        summary.to_excel(w, sheet_name="Сводка WB all-time", index=False)
        out.to_excel(w, sheet_name="Товары WB all-time", index=False)

    print(f"Saved: {out_path}")


if __name__ == "__main__":
    main()
