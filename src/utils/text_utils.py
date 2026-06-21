"""文本处理工具模块。"""


def normalize_text(text: str) -> str:
    return text.strip() if isinstance(text, str) else ""
