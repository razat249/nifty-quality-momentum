import csv
import glob
import os
from datetime import datetime
from typing import List, Dict


def read_and_collect_rows(csv_file_paths: List[str]) -> List[Dict[str, str]]:
	collected_rows: List[Dict[str, str]] = []

	for file_path in csv_file_paths:
		with open(file_path, mode="r", encoding="utf-8-sig", newline="") as f:
			reader = csv.DictReader(f)
			expected_fields = ["Index Name", "Date", "Open", "High", "Low", "Close"]

			# If the header is missing any expected fields, skip this file
			if not reader.fieldnames or not all(field in reader.fieldnames for field in expected_fields):
				continue

			for row in reader:
				date_str = row.get("Date", "").strip()
				if not date_str:
					continue

				try:
					parsed_date = datetime.strptime(date_str, "%d %b %Y")
				except ValueError:
					# Skip rows with unparseable dates
					continue

				# Carry the parsed date for sorting; keep original columns as-is
				row["_parsed_date"] = parsed_date
				collected_rows.append(row)

	return collected_rows


def write_sorted_rows(rows: List[Dict[str, str]], output_path: str) -> None:
	# Sort ascending by date
	rows.sort(key=lambda r: r["_parsed_date"])  # type: ignore[arg-type]

	fieldnames = ["Index Name", "Date", "Open", "High", "Low", "Close"]

	with open(output_path, mode="w", encoding="utf-8", newline="") as f_out:
		writer = csv.DictWriter(f_out, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
		writer.writeheader()
		for row in rows:
			# Exclude helper key
			row_to_write = {key: row.get(key, "") for key in fieldnames}
			writer.writerow(row_to_write)


def main() -> None:
	base_dir = os.path.dirname(os.path.abspath(__file__))

	# Find all relevant CSV files
	pattern = os.path.join(base_dir, "NIFTY500 VALUE 50_Historical_PR_*.csv")
	csv_file_paths = sorted(glob.glob(pattern))

	# Collect and sort rows
	rows = read_and_collect_rows(csv_file_paths)

	# Write combined output
	output_path = os.path.join(base_dir, "NIFTY500_VALUE_50_combined.csv")
	write_sorted_rows(rows, output_path)

	# Simple stdout summary
	print(f"Combined {len(csv_file_paths)} files into: {output_path}")
	print(f"Total rows (excluding header): {len(rows)}")


if __name__ == "__main__":
	main()

