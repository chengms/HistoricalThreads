import json
import os
from typing import Any, Dict, List, Optional, Tuple


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SOURCES_PATH = os.path.join(ROOT, "frontend", "public", "data", "sources.json")
EVENTS_PATH = os.path.join(ROOT, "frontend", "public", "data", "events.json")
PERSONS_PATH = os.path.join(ROOT, "frontend", "public", "data", "persons.json")
MAPPINGS_PATH = os.path.join(os.path.dirname(__file__), "mappings_template.json")


def _norm(v: Any) -> str:
    return str(v).strip() if v is not None else ""


def _lower(v: Any) -> str:
    return _norm(v).lower()


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: str, data: Any) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def _find_source_id(sources: List[Dict[str, Any]], title: str, publisher: str) -> Optional[int]:
    t = _lower(title)
    p = _lower(publisher)
    for s in sources:
        if _lower(s.get("title")) == t and (not p or _lower(s.get("publisher")) == p):
            sid = s.get("id")
            if isinstance(sid, int):
                return sid
    # 放宽：仅按 title 匹配
    for s in sources:
        if _lower(s.get("title")) == t:
            sid = s.get("id")
            if isinstance(sid, int):
                return sid
    return None


def _ensure_list(obj: Dict[str, Any], key: str) -> List[Any]:
    v = obj.get(key)
    if isinstance(v, list):
        return v
    obj[key] = []
    return obj[key]


def _append_unique_int(arr: List[Any], value: int) -> None:
    if value not in arr:
        arr.append(value)


def _append_unique_citation(arr: List[Dict[str, Any]], cit: Dict[str, Any]) -> None:
    # 去重：sourceId + page + chapter + line
    key = (
        cit.get("sourceId"),
        _norm(cit.get("page")),
        _norm(cit.get("chapter")),
        _norm(cit.get("line")),
    )
    for e in arr:
        ek = (
            e.get("sourceId"),
            _norm(e.get("page")),
            _norm(e.get("chapter")),
            _norm(e.get("line")),
        )
        if ek == key:
            return
    arr.append(cit)


def _find_entity(items: List[Dict[str, Any]], entity_type: str, entity_name: str) -> Tuple[Optional[Dict[str, Any]], str]:
    name = _lower(entity_name)
    if entity_type == "event":
        for it in items:
            if _lower(it.get("title")) == name:
                return it, ""
        return None, f"未找到事件 title={entity_name}"
    if entity_type == "person":
        for it in items:
            if _lower(it.get("name")) == name:
                return it, ""
        return None, f"未找到人物 name={entity_name}"
    return None, f"未知 entityType={entity_type}"


def main() -> None:
    for p in [SOURCES_PATH, EVENTS_PATH, PERSONS_PATH, MAPPINGS_PATH]:
        if not os.path.exists(p):
            raise SystemExit(f"文件不存在：{p}")

    sources: List[Dict[str, Any]] = _load_json(SOURCES_PATH)
    events: List[Dict[str, Any]] = _load_json(EVENTS_PATH)
    persons: List[Dict[str, Any]] = _load_json(PERSONS_PATH)
    mappings: List[Dict[str, Any]] = _load_json(MAPPINGS_PATH)

    warnings: List[str] = []
    applied = 0

    for m in mappings:
        entity_type = _norm(m.get("entityType"))
        entity_name = _norm(m.get("entityName"))
        source_title = _norm(m.get("sourceTitle"))
        publisher = _norm(m.get("publisher"))

        if not entity_type or not entity_name or not source_title:
            warnings.append(f"跳过无效映射：{m}")
            continue

        source_id = _find_source_id(sources, source_title, publisher)
        if source_id is None:
            warnings.append(f"未找到教材 source：title={source_title} publisher={publisher}")
            continue

        target_list = events if entity_type == "event" else persons if entity_type == "person" else []
        target, err = _find_entity(target_list, entity_type, entity_name)
        if not target:
            warnings.append(err)
            continue

        # backward compatible：同时维护 sources 数组（sourceId 列表）
        src_ids = _ensure_list(target, "sources")
        _append_unique_int(src_ids, source_id)

        citations = _ensure_list(target, "citations")
        cit = {
            "sourceId": source_id,
            "page": _norm(m.get("page")) or None,
            "line": _norm(m.get("line")) or None,
            "chapter": _norm(m.get("chapter")) or None,
            "note": _norm(m.get("note")) or None,
            "verified": bool(m.get("verified", False)),
        }
        # remove None fields to keep JSON tidy
        cit = {k: v for k, v in cit.items() if v is not None}
        _append_unique_citation(citations, cit)
        applied += 1

    if applied:
        _save_json(EVENTS_PATH, events)
        _save_json(PERSONS_PATH, persons)

    print(f"[apply_mappings] applied={applied} warnings={len(warnings)}")
    if warnings:
        print("Warnings:")
        for w in warnings[:200]:
            print("-", w)


if __name__ == "__main__":
    main()


