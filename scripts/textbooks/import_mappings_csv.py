import argparse
import csv
import json
import os
from typing import Any, Dict, List, Tuple


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: str, data: Any) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def _key(row: Dict[str, Any]) -> Tuple[str, int]:
    et = str(row.get("entityType") or "").strip()
    eid = row.get("entityId")
    try:
        eid_i = int(eid)
    except Exception:
        eid_i = -1
    return et, eid_i


def _to_bool(v: Any) -> bool:
    if isinstance(v, bool):
        return v
    s = str(v).strip().lower()
    if s in ("1", "true", "yes", "y", "是"):
        return True
    if s in ("0", "false", "no", "n", "否", ""):
        return False
    return False


def main() -> None:
    parser = argparse.ArgumentParser(description="将 CSV 中填写的 chapter/page/note 等回写到 mappings.json。")
    parser.add_argument("--mappings", required=True, help="原 mappings JSON 路径（将被更新）")
    parser.add_argument("--csv", required=True, help="CSV 路径（来自 export_mappings_csv.py 后编辑）")
    args = parser.parse_args()

    mappings_path = os.path.abspath(args.mappings)
    csv_path = os.path.abspath(args.csv)

    items: List[Dict[str, Any]] = _load_json(mappings_path)

    # build index
    idx: Dict[Tuple[str, int], Dict[str, Any]] = {}
    for it in items:
        et = str(it.get("entityType") or "").strip()
        eid = it.get("entityId")
        if isinstance(eid, int) and et:
            idx[(et, eid)] = it

    updated = 0
    missing = 0

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            k = _key(row)
            if k not in idx:
                missing += 1
                continue
            it = idx[k]

            for field in ("chapter", "page", "line", "note"):
                val = (row.get(field) or "").strip()
                it[field] = val

            it["verified"] = _to_bool(row.get("verified"))
            updated += 1

    _save_json(mappings_path, items)
    print(f"[import_mappings_csv] mappings={mappings_path} csv={csv_path} updated={updated} missing={missing}")


if __name__ == "__main__":
    main()


