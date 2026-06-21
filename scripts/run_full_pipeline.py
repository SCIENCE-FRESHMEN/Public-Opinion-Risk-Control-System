"""第 4 周流程固化：一键执行 data -> sentiment -> alert -> backtest。"""

from __future__ import annotations

import pathlib
import subprocess
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]


def run_step(script_name: str) -> None:
    cmd = [sys.executable, str(ROOT / "scripts" / script_name)]
    start = time.time()
    print(f"[RUN] {script_name}")
    proc = subprocess.run(cmd, cwd=str(ROOT))
    if proc.returncode != 0:
        raise SystemExit(f"[FAIL] {script_name} (code={proc.returncode})")
    print(f"[OK] {script_name} ({time.time() - start:.2f}s)")


def main() -> None:
    for step in [
        "run_data_pipeline.py",
        "run_sentiment_pipeline.py",
        "run_alert_pipeline.py",
        "run_backtest_pipeline.py",
    ]:
        run_step(step)
    print("[DONE] full pipeline completed")


if __name__ == "__main__":
    main()

