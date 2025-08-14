import csv
from dataclasses import dataclass
from datetime import datetime
from typing import List, Tuple
import math


@dataclass
class PricePoint:
    date: datetime
    close: float


@dataclass
class MonthlyRecord:
    month_start: datetime
    month_end: datetime
    sip_date: datetime
    cumulative_invested: float
    cumulative_units: float
    month_end_nav: float
    portfolio_value: float
    xirr_to_date: float
    sip_nav: float
    units_bought: float


def read_prices(csv_path: str) -> List[PricePoint]:
    prices: List[PricePoint] = []
    with open(csv_path, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Handle either VALUE format (has 'Close') or MOMENTUM format (has 'Total Returns Index')
            date_str = row.get('Date') or row.get('date')
            close_str = (
                row.get('Close')
                or row.get('Total Returns Index')
                or row.get('Close Price')
                or row.get('close')
            )
            if not date_str or not close_str:
                continue
            try:
                dt = datetime.strptime(date_str.strip(), '%d %b %Y')
            except ValueError:
                # Skip unparseable dates
                continue
            try:
                close = float(str(close_str).replace(',', '').strip())
            except ValueError:
                # Skip rows without numeric close
                continue
            prices.append(PricePoint(date=dt, close=close))
    prices.sort(key=lambda p: p.date)
    return prices


def compute_monthly_sip(prices: List[PricePoint], monthly_investment: float) -> Tuple[List[MonthlyRecord], List[Tuple[datetime, float]], datetime, float]:
    if not prices:
        return [], [], datetime.today(), 0.0

    monthly_records: List[MonthlyRecord] = []
    cashflows: List[Tuple[datetime, float]] = []
    negative_cashflows_to_date: List[Tuple[datetime, float]] = []

    cumulative_units = 0.0
    cumulative_invested = 0.0

    prev_year_month = None
    current_month_end_nav = None
    current_month_end_date = None
    sip_date_for_month = None
    sip_nav_for_month = None
    units_bought_for_month = 0.0

    for p in prices:
        year_month = (p.date.year, p.date.month)

        # New month boundary
        if prev_year_month is None:
            # First month: invest on first trading day encountered
            sip_units = monthly_investment / p.close
            cumulative_units += sip_units
            cumulative_invested += monthly_investment
            cashflows.append((p.date, -monthly_investment))
            negative_cashflows_to_date.append((p.date, -monthly_investment))
            sip_date_for_month = p.date
            sip_nav_for_month = p.close
            units_bought_for_month = sip_units
            prev_year_month = year_month
        elif year_month != prev_year_month:
            # Finalize previous month record before moving to new month
            if current_month_end_nav is not None and current_month_end_date is not None and sip_date_for_month is not None:
                portfolio_value = cumulative_units * current_month_end_nav
                # XIRR up to this month-end
                cf_until_now = list(negative_cashflows_to_date)
                cf_until_now.append((current_month_end_date, portfolio_value))
                xirr_to_date_val = xirr(cf_until_now)
                monthly_records.append(
                    MonthlyRecord(
                        month_start=datetime(prev_year_month[0], prev_year_month[1], 1),
                        month_end=current_month_end_date,
                        sip_date=sip_date_for_month,
                        cumulative_invested=cumulative_invested,
                        cumulative_units=cumulative_units,
                        month_end_nav=current_month_end_nav,
                        portfolio_value=portfolio_value,
                        xirr_to_date=xirr_to_date_val,
                        sip_nav=sip_nav_for_month if sip_nav_for_month is not None else float('nan'),
                        units_bought=units_bought_for_month,
                    )
                )

            # New month: invest on its first trading day
            sip_units = monthly_investment / p.close
            cumulative_units += sip_units
            cumulative_invested += monthly_investment
            cashflows.append((p.date, -monthly_investment))
            negative_cashflows_to_date.append((p.date, -monthly_investment))
            sip_date_for_month = p.date
            sip_nav_for_month = p.close
            units_bought_for_month = sip_units
            prev_year_month = year_month

        # Update month-end trackers (last seen in the month)
        current_month_end_nav = p.close
        current_month_end_date = p.date

    # Finalize last month
    if prev_year_month is not None and current_month_end_nav is not None and current_month_end_date is not None and sip_date_for_month is not None:
        portfolio_value = cumulative_units * current_month_end_nav
        cf_until_now = list(negative_cashflows_to_date)
        cf_until_now.append((current_month_end_date, portfolio_value))
        xirr_to_date_val = xirr(cf_until_now)
        monthly_records.append(
            MonthlyRecord(
                month_start=datetime(prev_year_month[0], prev_year_month[1], 1),
                month_end=current_month_end_date,
                sip_date=sip_date_for_month,
                cumulative_invested=cumulative_invested,
                cumulative_units=cumulative_units,
                month_end_nav=current_month_end_nav,
                portfolio_value=portfolio_value,
                xirr_to_date=xirr_to_date_val,
                sip_nav=sip_nav_for_month if sip_nav_for_month is not None else float('nan'),
                units_bought=units_bought_for_month,
            )
        )

    last_date = prices[-1].date
    last_nav = prices[-1].close
    final_value = cumulative_units * last_nav
    # Positive terminal cashflow at last available date
    cashflows.append((last_date, final_value))

    return monthly_records, cashflows, last_date, final_value


def xnpv(rate: float, cashflows: List[Tuple[datetime, float]]) -> float:
    if rate <= -1.0:
        return float('inf')
    t0 = cashflows[0][0]
    total = 0.0
    for (t, cf) in cashflows:
        dt_days = (t - t0).days
        years = dt_days / 365.0
        total += cf / ((1.0 + rate) ** years)
    return total


def xirr(cashflows: List[Tuple[datetime, float]], tol: float = 1e-7, max_iter: int = 200) -> float:
    # Ensure there is at least one negative and one positive cashflow
    has_neg = any(cf < 0 for _, cf in cashflows)
    has_pos = any(cf > 0 for _, cf in cashflows)
    if not (has_neg and has_pos):
        return float('nan')

    # Bracket search for sign change
    low = -0.9999
    high = 1.0
    f_low = xnpv(low, cashflows)
    f_high = xnpv(high, cashflows)

    # Expand high until sign change or limit
    expand_steps = 0
    while f_low * f_high > 0 and expand_steps < 60:
        high = high * 2.0 + 0.5  # grow fast
        f_high = xnpv(high, cashflows)
        expand_steps += 1

    if f_low * f_high > 0:
        # Try shrinking low a bit more (towards -1)
        low = -0.999999
        f_low = xnpv(low, cashflows)

    if f_low * f_high > 0:
        # Give up and return NaN
        return float('nan')

    # Bisection
    for _ in range(max_iter):
        mid = (low + high) / 2.0
        f_mid = xnpv(mid, cashflows)
        if abs(f_mid) < tol:
            return mid
        if f_low * f_mid < 0:
            high = mid
            f_high = f_mid
        else:
            low = mid
            f_low = f_mid
    return (low + high) / 2.0


def format_currency(value: float) -> str:
    return f"{value:,.2f}"


def generate_markdown(md_path: str, records: List[MonthlyRecord], xirr_value: float, last_date: datetime, index_label: str):
    with open(md_path, 'w') as f:
        f.write(f"## Monthly SIP valuation for {index_label}\n\n")
        f.write(f"- Monthly SIP amount: Rs 1,000\n")
        f.write(f"- First data month: {records[0].month_start.strftime('%b %Y') if records else 'N/A'}\n")
        f.write(f"- Valuation date (last available): {last_date.strftime('%d %b %Y')}\n")
        if xirr_value == xirr_value:  # not NaN
            f.write(f"- XIRR to date: {xirr_value*100:.2f}%\n\n")
        else:
            f.write("- XIRR to date: Not available\n\n")

        f.write("| Month | SIP Date | Invested (Cumulative) | Units (Cumulative) | Month-end NAV | Portfolio Value | XIRR to Date |\n")
        f.write("|---|---:|---:|---:|---:|---:|---:|\n")
        for r in records:
            month_label = r.month_end.strftime('%Y-%m')
            f.write(
                f"| {month_label} | {r.sip_date.strftime('%d %b %Y')} | Rs {format_currency(r.cumulative_invested)} | "
                f"{r.cumulative_units:.6f} | {format_currency(r.month_end_nav)} | Rs {format_currency(r.portfolio_value)} | "
                f"{(r.xirr_to_date*100):.2f}% |\n"
            )

        # Rolling returns section (SIP XIRR over fixed windows)
        horizons_years = [1, 3, 5, 7, 10, 15]
        f.write("\n\n## Rolling returns (XIRR) based on monthly SIP cashflows\n\n")
        f.write("Assumes monthly SIP of Rs 1,000; each window uses SIP cashflows within the window and terminal value at that month-end.\n\n")
        # Header
        header_cols = ["Month", "Month-end NAV"] + [f"{h}Y" for h in horizons_years]
        f.write("| " + " | ".join(header_cols) + " |\n")
        f.write("|" + "---|" * len(header_cols) + "\n")

        # Precompute arrays for convenience
        month_navs = [r.month_end_nav for r in records]
        # Collect rolling SIP XIRR series for stats
        rolling_series = {h: [] for h in horizons_years}

        for i in range(len(records)):
            row = []
            row.append(records[i].month_end.strftime('%Y-%m'))
            row.append(format_currency(month_navs[i]))
            for h in horizons_years:
                months_back = 12 * h
                start_idx = i - months_back + 1
                if start_idx >= 0:
                    # Build cashflows within the window
                    window_units = 0.0
                    cashflows_window = []
                    for k in range(start_idx, i + 1):
                        cashflows_window.append((records[k].sip_date, -1000.0))
                        window_units += records[k].units_bought
                    terminal_value = window_units * records[i].month_end_nav
                    cashflows_window.append((records[i].month_end, terminal_value))
                    rate_win = xirr(cashflows_window)
                    if rate_win == rate_win:  # not NaN
                        row.append(f"{rate_win*100:.2f}%")
                        rolling_series[h].append(rate_win)
                    else:
                        row.append("NA")
                else:
                    row.append("NA")
            f.write("| " + " | ".join(row) + " |\n")

        # Summary statistics for rolling SIP XIRR
        f.write("\n### Rolling returns summary (XIRR)\n\n")
        f.write("| Horizon | Average | Minimum | Maximum |\n")
        f.write("|---|---:|---:|---:|\n")
        for h in horizons_years:
            series = rolling_series[h]
            if len(series) == 0:
                f.write(f"| {h}Y | NA | NA | NA |\n")
                continue
            avg = sum(series) / len(series)
            mn = min(series)
            mx = max(series)
            f.write(f"| {h}Y | {avg*100:.2f}% | {mn*100:.2f}% | {mx*100:.2f}% |\n")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Generate SIP markdown for an index time series CSV.')
    parser.add_argument('--csv', dest='csv_path', default='./NIFTY500_VALUE_50_combined.csv', help='Path to CSV input file')
    parser.add_argument('--out', dest='md_path', default='./NIFTY500_VALUE_50_SIP.md', help='Path to output markdown file')
    parser.add_argument('--title', dest='index_label', default='NIFTY500 VALUE 50', help='Index label to show in markdown header')
    parser.add_argument('--sip', dest='monthly_investment', type=float, default=1000.0, help='Monthly SIP amount')

    args = parser.parse_args()

    prices = read_prices(args.csv_path)
    records, cashflows, last_date, _ = compute_monthly_sip(prices, args.monthly_investment)
    rate = xirr(cashflows)
    generate_markdown(args.md_path, records, rate, last_date, args.index_label)


if __name__ == '__main__':
    main()


