from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG_DIR = ROOT / "config"
PROCESSED_DIR = ROOT / "data" / "processed"
CONFIG_PATH = CONFIG_DIR / "config.yaml"
A_SHARE_INSTRUMENTS_PATH = CONFIG_DIR / "instruments_a_share.yaml"
