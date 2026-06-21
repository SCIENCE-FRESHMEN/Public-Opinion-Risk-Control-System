from pathlib import Path

from scripts import export_submission_batch_to_duckdb


def test_export_submission_batch_writes_expected_tables(tmp_path) -> None:
    package_dir = Path("submission_final/data_package")
    db_path = tmp_path / "submission_batch.duckdb"

    summary = export_submission_batch_to_duckdb.export_submission_batch(
        package_dir=package_dir,
        db_path=db_path,
    )

    assert db_path.exists()
    assert summary["db_path"] == str(db_path)
    assert summary["tables"]["unified_text_events"] == 121768
    assert summary["tables"]["selected_stocks"] == 1000
    assert summary["tables"]["source_coverage_report"] == 6000
    assert summary["tables"]["stock_source_overview"] == 1000
    assert summary["tables"]["tencent_realtime_quote"] == 1000

    conn = export_submission_batch_to_duckdb.get_connection(str(db_path))
    try:
        table_df = conn.sql(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'main'
            ORDER BY table_name
            """
        ).df()
        table_names = table_df["table_name"].tolist()
        assert table_names == [
            "selected_stocks",
            "source_coverage_report",
            "stock_source_overview",
            "tencent_realtime_quote",
            "unified_text_events",
        ]

        sample_df = conn.sql(
            """
            SELECT stock_code, stock_name, source, event_type
            FROM unified_text_events
            ORDER BY timestamp DESC
            LIMIT 1
            """
        ).df()
    finally:
        conn.close()

    assert set(sample_df.columns) == {"stock_code", "stock_name", "source", "event_type"}
    assert sample_df.iloc[0]["stock_code"]
    assert sample_df.iloc[0]["source"] in {
        "eastmoney_guba",
        "sina_news",
        "cninfo_announcement",
        "sse_announcement",
    }
