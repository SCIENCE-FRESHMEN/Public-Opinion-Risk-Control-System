"""路径工具模块。"""

from __future__ import annotations

import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
CONFIG_DIR = ROOT / "config"
