import json
import os
import re
from typing import Any, Dict, List, Tuple


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
EVENTS_PATH = os.path.join(ROOT, "frontend", "public", "data", "events.json")
PERSONS_PATH = os.path.join(ROOT, "frontend", "public", "data", "persons.json")


PATTERN = re.compile(r"^时代分段：(.+?)（待补页码）$")


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: str, data: Any) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def _upgrade_items(items: List[Dict[str, Any]]) -> Tuple[int, int]:
    changed = 0
    scanned = 0
    for it in items:
        cits = it.get("citations")
        if not isinstance(cits, list):
            continue
        for c in cits:
            if not isinstance(c, dict):
                continue
            scanned += 1
            note = c.get("note")
            if not isinstance(note, str):
                continue
            note = note.strip()
            m = PATTERN.match(note)
            if not m:
                continue

            era = m.group(1).strip()
            # chapter 为空才填，避免覆盖用户后续手填
            if not isinstance(c.get("chapter"), str) or not c.get("chapter", "").strip():
                c["chapter"] = era
            # note 统一为“待补页码”，便于 UI 做统一标识
            c["note"] = "待补页码"
            # 占位引用明确为未验证
            c["verified"] = bool(c.get("verified", False))
            changed += 1
    return changed, scanned


def main() -> None:
    events: List[Dict[str, Any]] = _load_json(EVENTS_PATH)
    persons: List[Dict[str, Any]] = _load_json(PERSONS_PATH)

    e_changed, e_scanned = _upgrade_items(events)
    p_changed, p_scanned = _upgrade_items(persons)

    if e_changed:
        _save_json(EVENTS_PATH, events)
    if p_changed:
        _save_json(PERSONS_PATH, persons)

    print(
        "[upgrade_placeholder_citations] "
        f"events_changed={e_changed}/{e_scanned} persons_changed={p_changed}/{p_scanned}"
    )


if __name__ == "__main__":
    main()


