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
    复制 export_mappings_csv.py 的粗分段建议逻辑，避免导出脚本间行为不一致。
    """
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


def _export_one(mappings_json: str, out_csv: str, excel_bom: bool) -> int:
    items: List[Dict[str, Any]] = _load_json(mappings_json)

    fieldnames = [
        "entityType",
        "entityId",
        "entityName",
        "sourceTitle",
        "publisher",
        "suggestedChapter",
        "chapter",
        "page",
        "line",
        "note",
        "verified",
        "hintDynasty",
        "hintYear",
    ]

    os.makedirs(os.path.dirname(os.path.abspath(out_csv)) or ".", exist_ok=True)
    encoding = "utf-8-sig" if excel_bom else "utf-8"
    with open(os.path.abspath(out_csv), "w", newline="", encoding=encoding) as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for it in items:
            row = {k: it.get(k, "") for k in fieldnames}
            row["suggestedChapter"] = _suggest_era(it.get("hintYear"), it.get("hintDynasty"))
            w.writerow(row)

    return len(items)


def main() -> None:
    parser = argparse.ArgumentParser(description="一键导出 scripts/textbooks/mappings_*.json 为 CSV（Excel 友好，含 suggestedChapter）。")
    parser.add_argument("--dir", dest="dirp", default="scripts/textbooks", help="mappings_*.json 所在目录（默认 scripts/textbooks）")
    parser.add_argument("--out-dir", dest="out_dir", default=r"C:\Temp\textbook-mappings", help="CSV 输出目录（默认 C:\\Temp\\textbook-mappings）")
    parser.add_argument("--excel-bom", action="store_true", help="写入 UTF-8 BOM，提升 Excel 直接打开的兼容性")
    args = parser.parse_args()

    dirp = os.path.abspath(args.dirp)
    out_dir = os.path.abspath(args.out_dir)
    os.makedirs(out_dir, exist_ok=True)

    files = []
    for name in os.listdir(dirp):
        if not name.startswith("mappings_") or not name.endswith(".json"):
            continue
        files.append(os.path.join(dirp, name))
    files.sort()

    total_rows = 0
    for fp in files:
        base = os.path.splitext(os.path.basename(fp))[0]
        out_csv = os.path.join(out_dir, f"{base}.csv")
        rows = _export_one(fp, out_csv, args.excel_bom)
        total_rows += rows
        print(f"[export_all_mappings_csv] {fp} -> {out_csv} rows={rows}")

    print(f"[export_all_mappings_csv] done files={len(files)} total_rows={total_rows} out_dir={out_dir}")


if __name__ == "__main__":
    main()


