import argparse
import csv
import json
import os
from typing import Any, Dict, List


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _suggest_era(hint_year: Any, hint_dynasty: Any) -> str:
    """
    给 Excel 一个“粗分段建议”，便于快速填 chapter（不代表教材真实章节名）。
    优先用年份区间，其次用朝代名兜底。
    """
    try:
        y = int(hint_year)
    except Exception:
        y = None

    d = str(hint_dynasty or "").strip()

    # 年份优先：大致按常见历史分期
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

    # 朝代兜底
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
    parser = argparse.ArgumentParser(description="将 mappings.json 导出为 CSV，便于用 Excel 批量填写 chapter/page/note 等字段。")
    parser.add_argument("--in", dest="inp", required=True, help="输入 mappings JSON 路径")
    parser.add_argument("--out", dest="outp", required=True, help="输出 CSV 路径")
    parser.add_argument("--excel-bom", action="store_true", help="写入 UTF-8 BOM，提升 Excel 直接打开的兼容性")
    args = parser.parse_args()

    items: List[Dict[str, Any]] = _load_json(os.path.abspath(args.inp))

    fieldnames = [
        "entityType",
        "entityId",
        "entityName",
        "sourceTitle",
        "publisher",
        # 仅建议：自动分段，方便你在 Excel 里快速填 chapter（不会被 import 脚本回写）
        "suggestedChapter",
        "chapter",
        "page",
        "line",
        "note",
        "verified",
        "hintDynasty",
        "hintYear",
    ]

    os.makedirs(os.path.dirname(os.path.abspath(args.outp)) or ".", exist_ok=True)
    encoding = "utf-8-sig" if args.excel_bom else "utf-8"
    with open(os.path.abspath(args.outp), "w", newline="", encoding=encoding) as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for it in items:
            row = {k: it.get(k, "") for k in fieldnames}
            row["suggestedChapter"] = _suggest_era(it.get("hintYear"), it.get("hintDynasty"))
            w.writerow(row)

    print(f"[export_mappings_csv] in={os.path.abspath(args.inp)} out={os.path.abspath(args.outp)} rows={len(items)}")


if __name__ == "__main__":
    main()


