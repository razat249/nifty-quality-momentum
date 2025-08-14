import os
import csv
import time
import json
import datetime as dt
from typing import List, Dict, Optional, Tuple
import argparse

import requests


URL = "https://niftyindices.com/Backpage.aspx/getHistoricaldatatabletoString"

HEADERS = {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-IN,en-US;q=0.9,en-GB;q=0.8,en;q=0.7,hi;q=0.6",
    "Connection": "keep-alive",
    "Content-Type": "application/json; charset=UTF-8",
    "Origin": "https://niftyindices.com",
    "Referer": "https://niftyindices.com/reports/historical-data",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
    "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
}

COOKIE_HEADER = os.environ.get("NIFTY_COOKIE", "")

_SESSION_WARMED_UP = False


def format_nse_date(d: dt.date) -> str:
    return d.strftime("%d-%b-%Y")


def build_cinfo(start_date: dt.date, end_date: dt.date) -> str:
    return (
        "{"
        "'name':'NIFTY500MOMENTM50',"
        f"'startDate':'{format_nse_date(start_date)}',"
        f"'endDate':'{format_nse_date(end_date)}',"
        "'indexName':'NIFTY500 MOMENTUM 50'"
        "}"
    )


def fetch_year_payload(start_date: dt.date, end_date: dt.date, session: requests.Session) -> str:
    global _SESSION_WARMED_UP
    if not _SESSION_WARMED_UP:
        try:
            session.get(HEADERS.get("Referer", "https://niftyindices.com/"), headers={
                k: v for k, v in HEADERS.items() if k not in ("Content-Type",)
            }, timeout=30)
        except Exception:
            pass
        _SESSION_WARMED_UP = True

    payload = {"cinfo": build_cinfo(start_date, end_date)}
    headers = dict(HEADERS)
    if COOKIE_HEADER:
        headers["Cookie"] = COOKIE_HEADER

    last_exc: Optional[Exception] = None
    for attempt in range(3):
        try:
            resp = session.post(URL, headers=headers, json=payload, timeout=60)
            if resp.status_code >= 500:
                time.sleep(1.0 * (attempt + 1))
                continue
            resp.raise_for_status()
            data = resp.json()
            break
        except Exception as e:
            last_exc = e
            time.sleep(1.0 * (attempt + 1))
    else:
        if last_exc:
            raise last_exc
        raise RuntimeError("Failed to fetch after retries")
    html_or_json = data.get("d") if isinstance(data, dict) else None
    if not html_or_json:
        html_or_json = data.get("Data") if isinstance(data, dict) else None
    if not html_or_json or not isinstance(html_or_json, str):
        try:
            return resp.text
        except Exception:
            raise RuntimeError(f"Unexpected response schema: {json.dumps(data)[:500]}")
    return html_or_json


def parse_table_or_json_to_rows(content: str) -> Tuple[List[str], List[Dict[str, str]]]:
    s = content.strip()
    if s.startswith("[") or s.startswith("{"):
        try:
            parsed = json.loads(s)
            if isinstance(parsed, list) and (len(parsed) == 0 or isinstance(parsed[0], dict)):
                headers: List[str] = []
                rows: List[Dict[str, str]] = []
                for rec in parsed:
                    if not isinstance(rec, dict):
                        continue
                    for k in rec.keys():
                        if k not in headers:
                            headers.append(k)
                for rec in parsed:
                    if not isinstance(rec, dict):
                        continue
                    row: Dict[str, str] = {}
                    for h in headers:
                        val = rec.get(h, "")
                        row[h] = "" if val is None else str(val)
                    rows.append(row)
                return headers, rows
        except Exception:
            pass

    try:
        from bs4 import BeautifulSoup  # type: ignore

        soup = BeautifulSoup(content, "html.parser")
        table = soup.find("table")
        if table is None:
            raise ValueError("No <table> found")

        header_cells = table.find("tr").find_all(["th", "td"]) if table.find("tr") else []
        headers = [cell.get_text(strip=True) for cell in header_cells]
        if not headers:
            thead = table.find("thead")
            if thead:
                headers = [th.get_text(strip=True) for th in thead.find_all("th")]

        rows: List[Dict[str, str]] = []
        for tr in table.find_all("tr")[1:]:
            cells = tr.find_all(["td", "th"])
            if not cells:
                continue
            values = [c.get_text(strip=True) for c in cells]
            if len(values) < len(headers):
                values += [""] * (len(headers) - len(values))
            if len(values) > len(headers):
                values = values[: len(headers)]
            row = {h: v for h, v in zip(headers, values)}
            if not any(v for v in row.values()):
                continue
            rows.append(row)
        return headers, rows
    except ImportError:
        pass

    try:
        import pandas as pd  # type: ignore

        dfs = pd.read_html(content)
        if not dfs:
            raise ValueError("pandas.read_html returned no tables")
        df = dfs[0]
        headers = [str(c) for c in df.columns]
        rows = [
            {str(col): ("" if pd.isna(val) else str(val)) for col, val in record.items()}
            for record in df.to_dict(orient="records")
        ]
        return headers, rows
    except Exception as e:
        raise RuntimeError(
            "Failed to parse HTML table. Install beautifulsoup4 or pandas."
        ) from e


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def write_csv(path: str, headers: List[str], rows: List[Dict[str, str]]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def main(
    user_start_year: Optional[int] = None,
    user_end_year: Optional[int] = None,
    only_years: Optional[List[int]] = None,
    sort_order: str = "desc",
) -> None:
    workspace_root = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(workspace_root, "data_NIFTY500_MOMENTUM_50")
    ensure_dir(data_dir)

    current_year = dt.date.today().year
    today = dt.date.today()
    start_year = 2005 if user_start_year is None else user_start_year
    end_year = 2025 if user_end_year is None else user_end_year

    all_rows: List[Dict[str, str]] = []
    unified_headers: List[str] = []

    with requests.Session() as session:
        if only_years is not None and len(only_years) > 0:
            years_to_fetch = sorted(set(only_years))
        else:
            years_to_fetch = list(range(start_year, end_year + 1))

        for year in years_to_fetch:
            if year == 2005:
                start_date = dt.date(2005, 4, 1)
            else:
                start_date = dt.date(year, 1, 1)

            if year < current_year:
                end_date = dt.date(year, 12, 31)
            else:
                end_date = today

            print(
                f"Fetching {year}: {format_nse_date(start_date)} to {format_nse_date(end_date)}"
            )

            body = fetch_year_payload(start_date, end_date, session)

            # Save raw response per year
            raw_path = os.path.join(data_dir, f"historical_{year}.raw")
            with open(raw_path, "w", encoding="utf-8") as f:
                f.write(body)

            headers, rows = parse_table_or_json_to_rows(body)

            # Persist per-year CSV
            year_csv_path = os.path.join(data_dir, f"historical_{year}.csv")
            write_csv(year_csv_path, headers, rows)

            for h in headers:
                if h not in unified_headers:
                    unified_headers.append(h)

            all_rows.extend(rows)
            time.sleep(0.6)

    # Try to sort by a date-like column if present
    date_key_candidates = [
        "Date",
        "DATE",
        "Index Date",
        "Index date",
        "HistoricalDate",
    ]
    date_key: Optional[str] = next((k for k in date_key_candidates if k in unified_headers), None)
    if date_key:
        def parse_date_any(s: str) -> Tuple[int, int, int]:
            for fmt in ("%d-%b-%Y", "%d %b %Y", "%d-%B-%Y", "%d %B %Y"):
                try:
                    d = dt.datetime.strptime(s, fmt).date()
                    return (d.year, d.month, d.day)
                except Exception:
                    pass
            return (0, 0, 0)

        all_rows.sort(key=lambda r: parse_date_any(r.get(date_key, "")), reverse=(sort_order.lower() == "desc"))

    combined_csv = os.path.join(workspace_root, "NIFTY500_MOMENTUM_50_Historical.csv")
    write_csv(combined_csv, unified_headers, all_rows)

    print(f"Combined CSV written to: {combined_csv}")
    print(f"Per-year files located in: {data_dir}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Download NIFTY500 MOMENTUM 50 yearly historical data"
    )
    parser.add_argument(
        "--year",
        type=int,
        help="Download only this year",
    )
    parser.add_argument(
        "--years",
        type=str,
        help="Comma-separated list of years to download (e.g. 2018,2020)",
    )
    parser.add_argument(
        "--start-year",
        type=int,
        help="First year to download (inclusive)",
    )
    parser.add_argument(
        "--end-year",
        type=int,
        help="Last year to download (inclusive)",
    )
    parser.add_argument(
        "--sort",
        type=str,
        choices=["asc", "desc"],
        default="desc",
        help="Sort order for combined CSV (default: desc)",
    )
    args = parser.parse_args()

    if args.years:
        parts = [p.strip() for p in args.years.split(",") if p.strip()]
        year_list: List[int] = []
        for p in parts:
            try:
                year_list.append(int(p))
            except ValueError:
                raise SystemExit(f"Invalid year in --years: {p}")
        if not year_list:
            raise SystemExit("No valid years provided to --years")
        main(only_years=year_list, sort_order=args.sort)
    elif args.year is not None:
        main(args.year, args.year, sort_order=args.sort)
    else:
        main(args.start_year, args.end_year, sort_order=args.sort)


