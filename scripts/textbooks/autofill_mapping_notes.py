import argparse
import json
import os
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


def main() -> None:
    parser = argparse.ArgumentParser(description="为 mappings 条目自动填充占位 note（用于生成可见 citations）。")
    parser.add_argument("--mappings", required=True, help="mappings JSON 路径（将被原地更新）")
    parser.add_argument("--prefix", default="时代分段：", help="写入 note 的前缀")
    parser.add_argument("--suffix", default="（待补页码）", help="写入 note 的后缀")
    parser.add_argument("--only-empty", action="store_true", help="仅在 note 为空时才写入（默认开启）")
    args = parser.parse_args()

    path = os.path.abspath(args.mappings)
    items: List[Dict[str, Any]] = _load_json(path)

    changed = 0
    for it in items:
        note = str(it.get("note") or "").strip()
        if args.only_empty and note:
            continue

        era = _suggest_era(it.get("hintYear"), it.get("hintDynasty")).strip()
        if not era:
            continue

        it["note"] = f"{args.prefix}{era}{args.suffix}"
        # 仍保持 verified=false，明确为占位引用
        it["verified"] = bool(it.get("verified", False))
        changed += 1

    _save_json(path, items)
    print(f"[autofill_mapping_notes] mappings={path} changed={changed} total={len(items)}")


if __name__ == "__main__":
    main()


