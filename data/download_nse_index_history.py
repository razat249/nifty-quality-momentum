import argparse
import csv
import time
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

import requests


NSE_HOME_URL = "https://www.nseindia.com"
INDICES_HISTORY_API = "https://www.nseindia.com/api/indices-history"


def parse_date(date_str: str) -> datetime:
    return datetime.strptime(date_str, "%Y-%m-%d")


def format_date_for_api(dt: datetime) -> str:
    # NSE historical API expects dd-mm-yyyy
    return dt.strftime("%d-%m-%Y")


def warm_up_session(session: requests.Session) -> None:
    # Hit home to get cookies (NSE blocks requests without proper cookies)
    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/126.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": NSE_HOME_URL,
            "Connection": "keep-alive",
        }
    )
    session.get(NSE_HOME_URL, timeout=15)


def generate_chunks(start: datetime, end: datetime, max_days: int) -> List[Tuple[datetime, datetime]]:
    chunks: List[Tuple[datetime, datetime]] = []
    current = start
    while current <= end:
        chunk_end = min(current + timedelta(days=max_days - 1), end)
        chunks.append((current, chunk_end))
        current = chunk_end + timedelta(days=1)
    return chunks


def fetch_chunk(session: requests.Session, index_type: str, start: datetime, end: datetime) -> List[Dict[str, str]]:
    params = {
        "indexType": index_type,
        "from": format_date_for_api(start),
        "to": format_date_for_api(end),
    }

    # First attempt JSON
    headers_json = {
        "Accept": "application/json, text/plain, */*",
        "Referer": f"{NSE_HOME_URL}/indices/historicalData?indexType={index_type}",
    }
    try:
        resp = session.get(INDICES_HISTORY_API, params=params, headers=headers_json, timeout=30)
        if resp.ok and resp.headers.get("content-type", "").startswith("application/json"):
            payload = resp.json()
            data = payload.get("data") or payload.get("grapthData") or []
            rows: List[Dict[str, str]] = []
            for item in data:
                # Known JSON keys from NSE indices-history API
                date_str = (
                    item.get("CH_TIMESTAMP")
                    or item.get("timestamp")
                    or item.get("Date")
                    or item.get("date")
                )
                if not date_str:
                    continue
                # Expected date like '01-Jan-2020' or '01-01-2020'
                dt = None
                for fmt in ("%d-%b-%Y", "%d-%m-%Y", "%d %b %Y"):
                    try:
                        dt = datetime.strptime(str(date_str).strip(), fmt)
                        break
                    except ValueError:
                        pass
                if dt is None:
                    continue
                open_val = _coerce_float(
                    item.get("CH_OPENING_VALUE")
                    or item.get("open")
                    or item.get("Open")
                )
                high_val = _coerce_float(
                    item.get("CH_HIGH_INDEX_VAL")
                    or item.get("high")
                    or item.get("High")
                )
                low_val = _coerce_float(
                    item.get("CH_LOW_INDEX_VAL")
                    or item.get("low")
                    or item.get("Low")
                )
                close_val = _coerce_float(
                    item.get("CH_CLOSING_VALUE")
                    or item.get("close")
                    or item.get("Close")
                )
                if close_val is None:
                    # Skip if no usable close
                    continue
                rows.append(
                    {
                        "Index Name": index_type,
                        "Date": dt.strftime("%d %b %Y"),
                        "Open": _format_num(open_val),
                        "High": _format_num(high_val),
                        "Low": _format_num(low_val),
                        "Close": _format_num(close_val),
                    }
                )
            if rows:
                return rows
    except Exception:
        pass

    # Fallback: try CSV (some deployments support csv=true)
    params_csv = dict(params)
    params_csv["csv"] = "true"
    headers_csv = {
        "Accept": "text/csv,application/octet-stream,application/vnd.ms-excel;q=0.9,*/*;q=0.8",
        "Referer": f"{NSE_HOME_URL}/indices/historicalData?indexType={index_type}",
    }
    resp2 = session.get(INDICES_HISTORY_API, params=params_csv, headers=headers_csv, timeout=30)
    rows_csv = _parse_csv_text(index_type, resp2.text)
    return rows_csv


def _coerce_float(value) -> float:
    if value is None:
        return None  # type: ignore[return-value]
    try:
        return float(str(value).replace(",", "").strip())
    except Exception:
        return None  # type: ignore[return-value]


def _format_num(value) -> str:
    if value is None:
        return ""
    return ("%f" % float(value)).rstrip("0").rstrip(".")


def _parse_csv_text(index_type: str, text: str) -> List[Dict[str, str]]:
    # CSV may include a preamble; locate header line
    lines = [ln for ln in text.splitlines() if ln.strip()]
    header_idx = -1
    for i, ln in enumerate(lines):
        if (
            "Date" in ln
            and "Open" in ln
            and "High" in ln
            and "Low" in ln
            and ("Close" in ln or "Closing" in ln)
        ):
            header_idx = i
            break
    if header_idx == -1:
        return []

    reader = csv.DictReader(lines[header_idx:])
    rows: List[Dict[str, str]] = []
    for row in reader:
        date_str = row.get("Date") or row.get("Date ") or row.get("DATE")
        if not date_str:
            continue
        dt = None
        for fmt in ("%d-%b-%Y", "%d-%m-%Y", "%d %b %Y"):
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                break
            except ValueError:
                pass
        if dt is None:
            continue
        rows.append(
            {
                "Index Name": index_type,
                "Date": dt.strftime("%d %b %Y"),
                "Open": (row.get("Open") or row.get("OPEN") or row.get("Opening Value") or "").replace(",", ""),
                "High": (row.get("High") or row.get("HIGH") or row.get("High Index Value") or "").replace(",", ""),
                "Low": (row.get("Low") or row.get("LOW") or row.get("Low Index Value") or "").replace(",", ""),
                "Close": (row.get("Close") or row.get("CLOSE") or row.get("Closing Value") or row.get("Closing Index Value") or "").replace(",", ""),
            }
        )
    return rows


def write_output_csv(output_path: str, rows: List[Dict[str, str]]) -> None:
    # Deduplicate by date (last one wins) and sort by date
    by_date: Dict[str, Dict[str, str]] = {}
    for r in rows:
        by_date[r["Date"]] = r
    sorted_dates = sorted(
        by_date.keys(), key=lambda s: datetime.strptime(s, "%d %b %Y")
    )
    fieldnames = ["Index Name", "Date", "Open", "High", "Low", "Close"]
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for d in sorted_dates:
            writer.writerow(by_date[d])


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download historical NSE index data and save as CSV."
    )
    parser.add_argument(
        "--index",
        default="NIFTY 50",
        help="Index name as shown on NSE (e.g., 'NIFTY 50', 'NIFTY 500 VALUE 50')",
    )
    parser.add_argument(
        "--start",
        required=True,
        help="Start date (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--end",
        required=True,
        help="End date (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--out",
        default="index_history.csv",
        help="Output CSV path",
    )
    parser.add_argument(
        "--max-days-per-request",
        type=int,
        default=365,
        help="Maximum days to request per API call (avoid server limits)",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.8,
        help="Seconds to sleep between chunk requests",
    )

    args = parser.parse_args()

    start_dt = parse_date(args.start)
    end_dt = parse_date(args.end)
    if start_dt > end_dt:
        raise SystemExit("Start date must be <= end date")

    session = requests.Session()
    warm_up_session(session)

    all_rows: List[Dict[str, str]] = []
    chunks = generate_chunks(start_dt, end_dt, args.max_days_per_request)
    for (chunk_start, chunk_end) in chunks:
        rows = fetch_chunk(session, args.index, chunk_start, chunk_end)
        all_rows.extend(rows)
        if args.sleep > 0:
            time.sleep(args.sleep)

    if not all_rows:
        raise SystemExit(
            "No data returned. The NSE API may have changed, or the index name/date range is invalid."
        )

    write_output_csv(args.out, all_rows)
    print(
        f"Saved {len(all_rows)} rows for '{args.index}' to: {args.out} (de-duplicated and sorted)"
    )


if __name__ == "__main__":
    main()


