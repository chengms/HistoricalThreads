import argparse
import json
import os
from typing import Any, Dict, List, Optional, Tuple


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SOURCES_PATH = os.path.join(ROOT, "frontend", "public", "data", "sources.json")
EVENTS_PATH = os.path.join(ROOT, "frontend", "public", "data", "events.json")
PERSONS_PATH = os.path.join(ROOT, "frontend", "public", "data", "persons.json")
DEFAULT_MAPPINGS_PATH = os.path.join(os.path.dirname(__file__), "mappings_template.json")


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


def _find_entity(
    items: List[Dict[str, Any]],
    entity_type: str,
    entity_name: str,
    entity_id: Optional[int],
) -> Tuple[Optional[Dict[str, Any]], str]:
    name = _lower(entity_name)
    if entity_type == "event":
        if isinstance(entity_id, int):
            for it in items:
                if it.get("id") == entity_id:
                    return it, ""
            return None, f"未找到事件 id={entity_id}（name={entity_name}）"
        for it in items:
            if _lower(it.get("title")) == name:
                return it, ""
        return None, f"未找到事件 title={entity_name}"
    if entity_type == "person":
        if isinstance(entity_id, int):
            for it in items:
                if it.get("id") == entity_id:
                    return it, ""
            return None, f"未找到人物 id={entity_id}（name={entity_name}）"
        for it in items:
            if _lower(it.get("name")) == name:
                return it, ""
            # 支持别名匹配（nameVariants）
            variants = it.get("nameVariants")
            if isinstance(variants, list) and any(_lower(v) == name for v in variants):
                return it, ""
        return None, f"未找到人物 name={entity_name}"
    return None, f"未知 entityType={entity_type}"


def main() -> None:
    parser = argparse.ArgumentParser(description="将教材条目映射写入 events/persons 的 citations，并保持 sources 兼容。")
    parser.add_argument("--mappings", default=DEFAULT_MAPPINGS_PATH, help="映射文件路径（默认：mappings_template.json）")
    parser.add_argument("--dry-run", action="store_true", help="仅打印将要应用的条目数，不写入 JSON")
    parser.add_argument(
        "--write-empty-citations",
        action="store_true",
        help="即使 chapter/page/line/note 全为空，也写入 citations（默认：跳过空 citations，只维护 sources）",
    )
    args = parser.parse_args()

    mappings_path = os.path.abspath(args.mappings)
    for p in [SOURCES_PATH, EVENTS_PATH, PERSONS_PATH, mappings_path]:
        if not os.path.exists(p):
            raise SystemExit(f"文件不存在：{p}")

    sources: List[Dict[str, Any]] = _load_json(SOURCES_PATH)
    events: List[Dict[str, Any]] = _load_json(EVENTS_PATH)
    persons: List[Dict[str, Any]] = _load_json(PERSONS_PATH)
    mappings: List[Dict[str, Any]] = _load_json(mappings_path)

    warnings: List[str] = []
    applied = 0
    citations_added = 0
    citations_skipped_empty = 0

    for m in mappings:
        entity_type = _norm(m.get("entityType"))
        entity_name = _norm(m.get("entityName"))
        entity_id = m.get("entityId")
        entity_id = int(entity_id) if isinstance(entity_id, int) else None
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
        target, err = _find_entity(target_list, entity_type, entity_name, entity_id)
        if not target:
            warnings.append(err)
            continue

        # backward compatible：同时维护 sources 数组（sourceId 列表）
        src_ids = _ensure_list(target, "sources")
        _append_unique_int(src_ids, source_id)

        page = _norm(m.get("page"))
        line = _norm(m.get("line"))
        chapter = _norm(m.get("chapter"))
        note = _norm(m.get("note"))

        # 默认：如果 citation 元信息全为空，就不写 citations（避免骨架文件把数据污染成一堆空引用）
        if (not page and not line and not chapter and not note) and not args.write_empty_citations:
            citations_skipped_empty += 1
        else:
            citations = _ensure_list(target, "citations")
            cit = {
                "sourceId": source_id,
                "page": page or None,
                "line": line or None,
                "chapter": chapter or None,
                "note": note or None,
                "verified": bool(m.get("verified", False)),
            }
            # remove None fields to keep JSON tidy
            cit = {k: v for k, v in cit.items() if v is not None}
            _append_unique_citation(citations, cit)
            citations_added += 1
        applied += 1

    if applied and not args.dry_run:
        _save_json(EVENTS_PATH, events)
        _save_json(PERSONS_PATH, persons)

    print(
        f"[apply_mappings] applied={applied} citations_added={citations_added} "
        f"citations_skipped_empty={citations_skipped_empty} warnings={len(warnings)} "
        f"dry_run={bool(args.dry_run)} mappings={mappings_path}"
    )
    if warnings:
        print("Warnings:")
        for w in warnings[:200]:
            print("-", w)


if __name__ == "__main__":
    main()


