import os
import csv
import time
import json
import datetime as dt
from typing import List, Dict, Optional, Tuple

import requests


URL = "https://niftyindices.com/Backpage.aspx/getHistoricaldatatabletoString"

# Reuse the exact headers from the user's working curl, adjusting only dates per request
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

# Cookie header captured from the provided curl. This may expire; if requests fail with 401/403,
# refresh cookies from a fresh session and update this value or set NIFTY_COOKIE env var.
COOKIE_HEADER = os.environ.get(
    "NIFTY_COOKIE",
    "_gid=GA1.2.1231936863.1755007381; ASP.NET_SessionId=i0s2umvr5oo1dkbucbubjaxj; ak_bmsc=18C2253C11E6DEE2869B2097F373342A~000000000000000000000000000000~YAAQDGfRFzrdyJ2YAQAADNUKpxxWOqUfOhRtKv3N8uCTSu1blkWxVYZStBbBdy5vjoGnIcZb9ViHDhbD0tTvXHfr3iht7Uf19CQPsPvsRboCAHZM48hIuI22CTgLcgLJmK3+Kuneb38FTDWCNbGrTSioIKtm3PemTkVAac7ZlE41bBoRYFQ8RsPjVPN2bxelJRMg2YjuqOBwbW3Im/M8joUf91gfNAJtdxEP0eQX2uJkIgex8lYtoKgHBepHFSqam7XUa6hJ7+6jGOtUM3o/WOaUOew+Uc51nQ2dkccKP37umMA3c7HpZ2xuMVHs/Cz5ati855tciM4oEbZuNxiWGuLjZBS84+jtSAZ721KG7DpZt4YRu8h41ejKRaKm2BSj7NBMxlLzf8jaIBc9RKvGI5qSIanIko+vLFuqZlaHH1hQxwIRCdtryf0LrK64j1Ra00HqWVf7UXlgc9A=; _ga_GWBG20V2KQ=GS2.1.s1755149157$o5$g1$t1755149175$j42$l0$h0; _ga=GA1.2.1414856752.1754998734; _ga_9GG6L3WL64=GS2.1.s1755149157$o6$g1$t1755149210$j7$l0$h0; bm_sv=94C09F8DD912D192B9FB515343EE6468~YAAQDGfRF7P/yJ2YAQAACLoLpxwqEFIIS9D6y0/TTUBPgY0jG07TAm7pFkuMAmtSBnlB7ydkWRTwQ2HH4QalJyZPiSMdVpwlE8kExDUe2/tcWetNRupLfb8uFyu8arv3EXY9nvNcEfh/44TL1j706jHN3okNZFoCOxKzMYmY3CouecYgiuKtKdGA8cTz+hhTYxUZ6gMT3PrmTnBFeO8E9svRfYPYOGCpPPjyIpXZ696RWMjTzRHB8tLl8tL3AZw1tPGxOGuP~1",
)


def format_nse_date(d: dt.date) -> str:
    return d.strftime("%d-%b-%Y")


def build_cinfo(start_date: dt.date, end_date: dt.date) -> str:
    # The API expects a string that looks like a JS object using single quotes
    return (
        "{"
        "'name':'NIFTY MULTI MQ 50',"
        f"'startDate':'{format_nse_date(start_date)}',"
        f"'endDate':'{format_nse_date(end_date)}',"
        "'indexName':'NIFTY500 MULTICAP MOMENTUM QUALITY 50'"
        "}"
    )


def fetch_year_html(start_date: dt.date, end_date: dt.date, session: requests.Session) -> str:
    payload = {"cinfo": build_cinfo(start_date, end_date)}
    headers = dict(HEADERS)
    headers["Cookie"] = COOKIE_HEADER
    resp = session.post(URL, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    # API typically returns HTML table string in key 'd'
    html_str = data.get("d") if isinstance(data, dict) else None
    if not html_str:
        # Some responses nest differently; try common alternatives
        html_str = data.get("Data") if isinstance(data, dict) else None
    if not html_str or not isinstance(html_str, str):
        raise RuntimeError(f"Unexpected response schema: {json.dumps(data)[:500]}")
    return html_str


def parse_table_or_json_to_rows(content: str) -> Tuple[List[str], List[Dict[str, str]]]:
    """
    Parses response content that can be either:
    - JSON array of records (as a string), or
    - HTML table string
    Returns (headers, rows)
    """
    s = content.strip()

    # JSON-first path
    if s.startswith("[") or s.startswith("{"):
        try:
            parsed = json.loads(s)
            if isinstance(parsed, list) and (len(parsed) == 0 or isinstance(parsed[0], dict)):
                headers: List[str] = []
                rows: List[Dict[str, str]] = []
                # Merge keys from all records to preserve order of first appearance
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
            # fallthrough to HTML parsing
            pass

    # HTML fallback path
    # Try BeautifulSoup if present
    try:
        from bs4 import BeautifulSoup  # type: ignore

        soup = BeautifulSoup(content, "html.parser")
        table = soup.find("table")
        if table is None:
            raise ValueError("No <table> found")

        # Extract headers
        header_cells = table.find("tr").find_all(["th", "td"]) if table.find("tr") else []
        headers = [cell.get_text(strip=True) for cell in header_cells]
        if not headers:
            # fallback: use all th in thead if present
            thead = table.find("thead")
            if thead:
                headers = [th.get_text(strip=True) for th in thead.find_all("th")]

        rows: List[Dict[str, str]] = []
        for tr in table.find_all("tr")[1:]:
            cells = tr.find_all(["td", "th"])
            if not cells:
                continue
            values = [c.get_text(strip=True) for c in cells]
            # pad or trim to length of headers
            if len(values) < len(headers):
                values += [""] * (len(headers) - len(values))
            if len(values) > len(headers):
                values = values[: len(headers)]
            row = {h: v for h, v in zip(headers, values)}
            # Skip empty rows
            if not any(v for v in row.values()):
                continue
            rows.append(row)
        return headers, rows
    except ImportError:
        pass

    # Fallback to pandas.read_html if available
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


def main() -> None:
    workspace_root = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(
        workspace_root, "data_NIFTY500_MULTICAP_MOMENTUM_QUALITY_50"
    )
    ensure_dir(data_dir)

    current_year = dt.date.today().year
    today = dt.date.today()
    start_year = 2005
    end_year = 2025

    all_rows: List[Dict[str, str]] = []
    unified_headers: List[str] = []

    with requests.Session() as session:
        for year in range(start_year, end_year + 1):
            start_date = dt.date(year, 1, 1)
            if year < current_year:
                end_date = dt.date(year, 12, 31)
            else:
                # Use today's date for the current year
                end_date = today

            print(f"Fetching {year}: {format_nse_date(start_date)} to {format_nse_date(end_date)}")

            html = fetch_year_html(start_date, end_date, session)

            # Save raw HTML per year for traceability
            raw_path = os.path.join(data_dir, f"historical_{year}.html")
            with open(raw_path, "w", encoding="utf-8") as f:
                f.write(html)

            headers, rows = parse_table_or_json_to_rows(html)

            # Persist per-year CSV
            year_csv_path = os.path.join(data_dir, f"historical_{year}.csv")
            write_csv(year_csv_path, headers, rows)

            # Grow unified header set preserving order of first appearance
            for h in headers:
                if h not in unified_headers:
                    unified_headers.append(h)

            all_rows.extend(rows)

            # Be polite to the server
            time.sleep(0.6)

    # Optional: sort by Date column if present (descending -> ascending)
    date_key_candidates = [
        "Date",
        "DATE",
        "Index Date",
        "Index date",
    ]
    date_key: Optional[str] = next((k for k in date_key_candidates if k in unified_headers), None)
    if date_key:
        def parse_date_str(s: str) -> Tuple[int, int, int]:
            try:
                d = dt.datetime.strptime(s, "%d-%b-%Y").date()
                return (d.year, d.month, d.day)
            except Exception:
                return (0, 0, 0)

        all_rows.sort(key=lambda r: parse_date_str(r.get(date_key, "")))

    # Write combined CSV
    combined_csv = os.path.join(
        workspace_root, "NIFTY500_MULTICAP_MOMENTUM_QUALITY_50_Historical.csv"
    )
    write_csv(combined_csv, unified_headers, all_rows)

    print(f"Combined CSV written to: {combined_csv}")
    print(f"Per-year files located in: {data_dir}")


if __name__ == "__main__":
    main()


