import argparse
import csv
import json
import os
from typing import Any, Dict, List


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


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
            w.writerow(row)

    print(f"[export_mappings_csv] in={os.path.abspath(args.inp)} out={os.path.abspath(args.outp)} rows={len(items)}")


if __name__ == "__main__":
    main()


