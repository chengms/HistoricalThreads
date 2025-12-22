import json
import os
from typing import Any, Dict, List, Tuple


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SOURCES_PATH = os.path.join(ROOT, "frontend", "public", "data", "sources.json")
SEED_PATH = os.path.join(os.path.dirname(__file__), "textbook_sources_seed.json")


def _norm_str(v: Any) -> str:
    if v is None:
        return ""
    return str(v).strip()


def _dedupe_key(src: Dict[str, Any]) -> Tuple[str, str, str, str, str, str, str, str]:
    """
    以“教材书目”视角做去重：标题 + 出版社 + ISBN + 版次 + 学段 + 年级 + 册别 + 学科
    """
    return (
        _norm_str(src.get("title")).lower(),
        _norm_str(src.get("publisher")).lower(),
        _norm_str(src.get("isbn")).replace("-", "").lower(),
        _norm_str(src.get("edition")).lower(),
        _norm_str(src.get("stage")).lower(),
        _norm_str(src.get("grade")).lower(),
        _norm_str(src.get("term")).lower(),
        _norm_str(src.get("subject")).lower(),
    )


def main() -> None:
    if not os.path.exists(SOURCES_PATH):
        raise SystemExit(f"未找到 sources.json: {SOURCES_PATH}")
    if not os.path.exists(SEED_PATH):
        raise SystemExit(f"未找到 seed 文件: {SEED_PATH}")

    with open(SOURCES_PATH, "r", encoding="utf-8") as f:
        sources: List[Dict[str, Any]] = json.load(f)

    with open(SEED_PATH, "r", encoding="utf-8") as f:
        seed: List[Dict[str, Any]] = json.load(f)

    max_id = 0
    existing_keys = set()
    for s in sources:
        sid = s.get("id")
        if isinstance(sid, int) and sid > max_id:
            max_id = sid
        existing_keys.add(_dedupe_key(s))

    added = 0
    for s in seed:
        if s.get("sourceType") != "textbook":
            continue
        key = _dedupe_key(s)
        if key in existing_keys:
            continue

        max_id += 1
        out = dict(s)
        out["id"] = max_id
        # 合理默认值（seed 里可以覆盖）
        out.setdefault("credibilityLevel", 5)
        out.setdefault("verified", False)

        sources.append(out)
        existing_keys.add(key)
        added += 1

    if added:
        with open(SOURCES_PATH, "w", encoding="utf-8") as f:
            json.dump(sources, f, ensure_ascii=False, indent=2)
            f.write("\n")

    print(f"[merge_textbook_sources] done. added={added}, total={len(sources)}, max_id={max_id}")


if __name__ == "__main__":
    main()


