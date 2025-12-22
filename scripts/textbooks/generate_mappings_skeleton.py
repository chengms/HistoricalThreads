import argparse
import json
import os
from typing import Any, Dict, List, Set, Tuple


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
EVENTS_PATH = os.path.join(ROOT, "frontend", "public", "data", "events.json")
PERSONS_PATH = os.path.join(ROOT, "frontend", "public", "data", "persons.json")
DYNasties_PATH = os.path.join(ROOT, "frontend", "public", "data", "dynasties.json")


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: str, data: Any) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def _as_int(v: Any) -> int:
    return int(v)


def main() -> None:
    parser = argparse.ArgumentParser(description="从现有 events/persons 生成教材 mappings 骨架（用于填页码/章节）。")
    # 预设：教材书目 + 默认时间范围（可自行覆盖）
    presets = {
        "grade7_up": {
            "sourceTitle": "义务教育教科书·历史 七年级 上册（统编版）",
            "yearMin": -3000,
            "yearMax": -221,
        },
        "grade7_down": {
            "sourceTitle": "义务教育教科书·历史 七年级 下册（统编版）",
            "yearMin": -221,
            "yearMax": 589,
        },
        "grade8_up": {
            "sourceTitle": "义务教育教科书·历史 八年级 上册（统编版）",
            "yearMin": 589,
            "yearMax": 1279,
        },
        "grade8_down": {
            "sourceTitle": "义务教育教科书·历史 八年级 下册（统编版）",
            "yearMin": 1279,
            "yearMax": 1912,
        },
        "grade9_up": {
            "sourceTitle": "义务教育教科书·历史 九年级 上册（统编版）",
            "yearMin": 1840,
            "yearMax": 1949,
        },
        "grade9_down": {
            "sourceTitle": "义务教育教科书·历史 九年级 下册（统编版）",
            "yearMin": 1949,
            "yearMax": 2100,
        },
        "hs_outline_up": {
            "sourceTitle": "普通高中教科书·历史 必修·中外历史纲要（上）（统编版）",
            "yearMin": -3000,
            "yearMax": 1840,
        },
        "hs_outline_down": {
            "sourceTitle": "普通高中教科书·历史 必修·中外历史纲要（下）（统编版）",
            "yearMin": 1840,
            "yearMax": 2100,
        },
    }
    parser.add_argument("--preset", choices=sorted(presets.keys()), help="内置教材预设（避免 Windows/PowerShell 引号转义问题）")
    parser.add_argument("--source-title", help="教材 source 的 title（需与 sources.json 一致）")
    parser.add_argument("--publisher", default="人民教育出版社", help="出版社（可选，用于帮助 apply_mappings 定位 sourceId）")
    parser.add_argument("--out", required=True, help="输出 mappings JSON 文件路径")
    parser.add_argument("--year-min", type=int, help="筛选事件年份下限（含）。若使用 preset 且未传入，则采用 preset 默认值")
    parser.add_argument("--year-max", type=int, help="筛选事件年份上限（含）。若使用 preset 且未传入，则采用 preset 默认值")
    parser.add_argument("--include-persons", action="store_true", help="同时生成相关人物条目（来自事件 persons 引用）")
    args = parser.parse_args()

    source_title = args.source_title
    if args.preset:
        source_title = presets[args.preset]["sourceTitle"]
    if not source_title:
        raise SystemExit("必须提供 --source-title 或 --preset")

    year_min = args.year_min
    year_max = args.year_max
    if args.preset:
        if year_min is None:
            year_min = presets[args.preset]["yearMin"]
        if year_max is None:
            year_max = presets[args.preset]["yearMax"]
    if year_min is None:
        year_min = -3000
    if year_max is None:
        year_max = 2100

    events: List[Dict[str, Any]] = _load_json(EVENTS_PATH)
    persons: List[Dict[str, Any]] = _load_json(PERSONS_PATH)
    dynasties: List[Dict[str, Any]] = _load_json(DYNasties_PATH) if os.path.exists(DYNasties_PATH) else []
    dynasty_name_by_id = {d.get("id"): d.get("name") for d in dynasties if isinstance(d.get("id"), int)}

    # 过滤事件：按 eventYear
    picked_events: List[Dict[str, Any]] = []
    person_ids: Set[int] = set()
    for e in events:
        y = e.get("eventYear")
        if not isinstance(y, int):
            continue
        if y < year_min or y > year_max:
            continue
        picked_events.append(e)
        for pid in e.get("persons") or []:
            if isinstance(pid, int):
                person_ids.add(pid)

    picked_events.sort(key=lambda x: (_as_int(x.get("eventYear", 0)), _as_int(x.get("id", 0))))

    person_by_id = {p.get("id"): p for p in persons if isinstance(p.get("id"), int)}
    picked_persons: List[Tuple[int, Dict[str, Any]]] = []
    if args.include_persons:
        for pid in sorted(person_ids):
            p = person_by_id.get(pid)
            if p:
                picked_persons.append((pid, p))

    out: List[Dict[str, Any]] = []

    for e in picked_events:
        dname = dynasty_name_by_id.get(e.get("dynastyId"))
        out.append(
            {
                "entityType": "event",
                "entityId": e.get("id"),
                "entityName": e.get("title", ""),
                "sourceTitle": source_title,
                "publisher": args.publisher,
                "chapter": "",
                "page": "",
                "line": "",
                "note": "",
                "hintDynasty": dname or "",
                "hintYear": e.get("eventYear"),
                "verified": False,
            }
        )

    if args.include_persons:
        for pid, p in picked_persons:
            dname = dynasty_name_by_id.get(p.get("dynastyId"))
            out.append(
                {
                    "entityType": "person",
                    "entityId": pid,
                    "entityName": p.get("name", ""),
                    "sourceTitle": source_title,
                    "publisher": args.publisher,
                    "chapter": "",
                    "page": "",
                    "line": "",
                    "note": "",
                    "hintDynasty": dname or "",
                    "verified": False,
                }
            )

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    _save_json(args.out, out)
    print(
        f"[generate_mappings_skeleton] out={os.path.abspath(args.out)} "
        f"events={len(picked_events)} persons={len(picked_persons)} "
        f"year=[{year_min},{year_max}] preset={args.preset or ''}"
    )


if __name__ == "__main__":
    main()


