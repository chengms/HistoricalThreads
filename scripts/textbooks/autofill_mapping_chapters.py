import argparse
import json
import os
import re
from typing import Any, Dict, List


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: str, data: Any) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def _suggest_era(hint_year: Any, hint_dynasty: Any) -> str:
    try:
        y = int(hint_year)
    except Exception:
        y = None

    d = str(hint_dynasty or "").strip()

    if y is not None:
        if y < -1046:
            return "上古（夏商周以前）"
        if -1046 <= y < -770:
            return "西周"
        if -770 <= y < -475:
            return "春秋"
        if -475 <= y < -221:
            return "战国"
        if -221 <= y < 220:
            return "秦汉"
        if 220 <= y < 589:
            return "魏晋南北朝"
        if 589 <= y < 960:
            return "隋唐"
        if 960 <= y < 1279:
            return "宋"
        if 1279 <= y < 1368:
            return "元"
        if 1368 <= y < 1644:
            return "明"
        if 1644 <= y < 1840:
            return "清前期"
        if 1840 <= y < 1949:
            return "近代（1840-1949）"
        if 1949 <= y:
            return "现代（1949-）"

    if d:
        if "夏" in d or "商" in d:
            return "上古（夏商）"
        if "周" in d:
            return "西周/东周"
        if "春秋" in d:
            return "春秋"
        if "战国" in d:
            return "战国"
        if "秦" in d:
            return "秦"
        if "汉" in d:
            return "汉"
        if "三国" in d or "晋" in d or "南北朝" in d:
            return "魏晋南北朝"
        if "隋" in d or "唐" in d:
            return "隋唐"
        if "宋" in d:
            return "宋"
        if "元" in d:
            return "元"
        if "明" in d:
            return "明"
        if "清" in d:
            return "清"
        return d

    return ""


ERA_NOTE_RE = re.compile(r"时代分段：([^（]+)")


def _pick_chapter_from_note(note: str) -> str:
    s = (note or "").strip()
    if not s:
        return ""
    m = ERA_NOTE_RE.search(s)
    if not m:
        return ""
    return m.group(1).strip()


def _is_blank(s: Any) -> bool:
    return not str(s or "").strip()


def main() -> None:
    parser = argparse.ArgumentParser(description="为教材 mappings 自动填充 chapter（不填页码）。")
    parser.add_argument("--dir", default="scripts/textbooks", help="mappings_*.json 所在目录")
    parser.add_argument("--pattern", default="mappings_*.json", help="文件名模式（默认 mappings_*.json）")
    parser.add_argument("--dry-run", action="store_true", help="只统计不写回")
    args = parser.parse_args()

    dirp = os.path.abspath(args.dir)
    files = [os.path.join(dirp, n) for n in os.listdir(dirp) if n.startswith("mappings_") and n.endswith(".json")]
    files.sort()

    total_items = 0
    filled = 0
    skipped = 0

    for fp in files:
        items: List[Dict[str, Any]] = _load_json(fp)
        changed = 0
        for it in items:
            total_items += 1
            if not isinstance(it, dict):
                skipped += 1
                continue
            if not _is_blank(it.get("chapter")):
                continue

            # 优先：note 中已有“时代分段”
            note = str(it.get("note") or "")
            ch = _pick_chapter_from_note(note)
            if not ch:
                ch = _suggest_era(it.get("hintYear"), it.get("hintDynasty"))
            if not ch:
                continue

            it["chapter"] = ch
            changed += 1
            filled += 1

        if changed and not args.dry_run:
            _save_json(fp, items)

        if changed:
            print(f"[autofill_mapping_chapters] file={fp} filled={changed}")

    print(
        "[autofill_mapping_chapters] done",
        {
            "dryRun": bool(args.dry_run),
            "files": len(files),
            "totalItems": total_items,
            "filled": filled,
            "skipped": skipped,
        },
    )


if __name__ == "__main__":
    main()


