"""DuckDB 连接与查询封装。"""

from __future__ import annotations

import duckdb


def get_connection(db_path: str):
    """创建 DuckDB 连接。"""
    return duckdb.connect(db_path)


def query_df(conn, sql: str):
    """执行 SQL 并返回 DataFrame。"""
    return conn.sql(sql).df()


def write_df(conn, table_name: str, df):
    """将 DataFrame 写入 DuckDB 表。"""
    conn.register("tmp_df", df)
    conn.execute(f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM tmp_df")
    conn.unregister("tmp_df")
