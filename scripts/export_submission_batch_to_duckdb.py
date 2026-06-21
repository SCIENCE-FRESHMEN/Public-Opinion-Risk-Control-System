"""将 submission_final 小包数据导入 DuckDB，供 B / D 联调与答辩复现使用。"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.data.duckdb_client import get_connection, write_df

DEFAULT_PACKAGE_DIR = ROOT / "submission_final" / "data_package"
DEFAULT_DB_PATH = DEFAULT_PACKAGE_DIR / "submission_batch.duckdb"
TABLE_FILES = {
    "selected_stocks": "selected_stocks.csv",
    "unified_text_events": "unified_text_events.csv",
    "source_coverage_report": "source_coverage_report.csv",
    "stock_source_overview": "stock_source_overview.csv",
    "tencent_realtime_quote": "tencent_realtime_quote.csv",
}


def _load_csv(csv_path: pathlib.Path) -> pd.DataFrame:
    return pd.read_csv(csv_path, encoding="utf-8-sig")


def export_submission_batch(
    package_dir: pathlib.Path = DEFAULT_PACKAGE_DIR,
    db_path: pathlib.Path = DEFAULT_DB_PATH,
) -> dict:
    package_dir = pathlib.Path(package_dir)
    db_path = pathlib.Path(db_path)

    missing = [name for name in TABLE_FILES.values() if not (package_dir / name).exists()]
    if missing:
        raise FileNotFoundError(
            f"submission_final 数据包不完整，缺少文件: {', '.join(missing)}"
        )

    db_path.parent.mkdir(parents=True, exist_ok=True)
    table_counts: dict[str, int] = {}
    conn = get_connection(str(db_path))
    try:
        for table_name, file_name in TABLE_FILES.items():
            csv_path = package_dir / file_name
            df = _load_csv(csv_path)
            write_df(conn, table_name, df)
            table_counts[table_name] = int(len(df))
    finally:
        conn.close()

    return {
        "package_dir": str(package_dir),
        "db_path": str(db_path),
        "tables": table_counts,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="将 submission_final/data_package 导入 DuckDB。"
    )
    parser.add_argument(
        "--package-dir",
        type=pathlib.Path,
        default=DEFAULT_PACKAGE_DIR,
        help="submission_final/data_package 目录路径",
    )
    parser.add_argument(
        "--db-path",
        type=pathlib.Path,
        default=DEFAULT_DB_PATH,
        help="导出的 DuckDB 文件路径",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    summary = export_submission_batch(
        package_dir=args.package_dir,
        db_path=args.db_path,
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
