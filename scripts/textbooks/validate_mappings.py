import argparse
import json
import os
from typing import Any, Dict, List, Optional, Set, Tuple


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SOURCES_PATH = os.path.join(ROOT, "frontend", "public", "data", "sources.json")
EVENTS_PATH = os.path.join(ROOT, "frontend", "public", "data", "events.json")
PERSONS_PATH = os.path.join(ROOT, "frontend", "public", "data", "persons.json")


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _norm(v: Any) -> str:
    return str(v).strip() if v is not None else ""


def _lower(v: Any) -> str:
    return _norm(v).lower()


def _is_truthy_str(v: Any) -> bool:
    return bool(_norm(v))


def _get_entity_index(events: List[Dict[str, Any]], persons: List[Dict[str, Any]]) -> Tuple[Dict[int, Dict[str, Any]], Dict[int, Dict[str, Any]]]:
    ev = {e["id"]: e for e in events if isinstance(e.get("id"), int)}
    pe = {p["id"]: p for p in persons if isinstance(p.get("id"), int)}
    return ev, pe


def _find_source_ids(sources: List[Dict[str, Any]], title: str, publisher: str) -> List[int]:
    t = _lower(title)
    p = _lower(publisher)
    ids: List[int] = []
    for s in sources:
        if _lower(s.get("title")) != t:
            continue
        if p and _lower(s.get("publisher")) != p:
            continue
        sid = s.get("id")
        if isinstance(sid, int):
            ids.append(sid)
    if ids:
        return ids
    # 放宽：仅 title 匹配
    for s in sources:
        if _lower(s.get("title")) == t:
            sid = s.get("id")
            if isinstance(sid, int):
                ids.append(sid)
    return ids


def main() -> None:
    parser = argparse.ArgumentParser(description="校验教材 mappings 文件质量（不写入数据）。")
    parser.add_argument("--mappings", required=True, help="mappings JSON 路径")
    parser.add_argument("--max-issues", type=int, default=50, help="最多打印多少条问题明细")
    parser.add_argument("--fail-on-issues", action="store_true", help="若存在问题则退出码非 0")
    args = parser.parse_args()

    mappings_path = os.path.abspath(args.mappings)
    for p in [SOURCES_PATH, EVENTS_PATH, PERSONS_PATH, mappings_path]:
        if not os.path.exists(p):
            raise SystemExit(f"文件不存在：{p}")

    sources: List[Dict[str, Any]] = _load_json(SOURCES_PATH)
    events: List[Dict[str, Any]] = _load_json(EVENTS_PATH)
    persons: List[Dict[str, Any]] = _load_json(PERSONS_PATH)
    mappings: List[Dict[str, Any]] = _load_json(mappings_path)

    events_by_id, persons_by_id = _get_entity_index(events, persons)

    issues: List[str] = []
    seen_keys: Set[Tuple[str, int, str, str]] = set()

    # 教材页码/行号会随版本变动：此脚本只关注“实体/来源是否能匹配、是否重复”
    # chapter/page/line/note 仅作为可选补充信息，不作为质量门槛统计。
    unmatched_entity = 0
    unmatched_source = 0
    duplicates = 0

    total = 0

    for i, m in enumerate(mappings):
        total += 1
        et = _norm(m.get("entityType"))
        eid = m.get("entityId")
        name = _norm(m.get("entityName"))
        st = _norm(m.get("sourceTitle"))
        pub = _norm(m.get("publisher"))

        if et not in ("event", "person"):
            issues.append(f"[{i}] entityType 非法：{et!r}")
            continue
        if not isinstance(eid, int):
            issues.append(f"[{i}] entityId 缺失/非法：{eid!r} ({et} {name})")
            continue
        if not st:
            issues.append(f"[{i}] sourceTitle 为空：({et} id={eid} {name})")
            continue

        # duplicate detection (same entity + same source title/publisher)
        dk = (et, eid, _lower(st), _lower(pub))
        if dk in seen_keys:
            duplicates += 1
            issues.append(f"[{i}] 重复映射：({et} id={eid}) sourceTitle={st} publisher={pub}")
        else:
            seen_keys.add(dk)

        # entity existence
        if et == "event":
            e = events_by_id.get(eid)
            if not e:
                unmatched_entity += 1
                issues.append(f"[{i}] 未找到事件 id={eid} name={name}")
            else:
                # optional name check
                if name and _norm(e.get("title")) and _norm(e.get("title")) != name:
                    issues.append(f"[{i}] 事件名称不一致：mapping={name} data={e.get('title')}")
        else:
            p = persons_by_id.get(eid)
            if not p:
                unmatched_entity += 1
                issues.append(f"[{i}] 未找到人物 id={eid} name={name}")
            else:
                if name and _norm(p.get("name")) and _norm(p.get("name")) != name:
                    issues.append(f"[{i}] 人物名称不一致：mapping={name} data={p.get('name')}")

        # source existence
        sids = _find_source_ids(sources, st, pub)
        if not sids:
            unmatched_source += 1
            issues.append(f"[{i}] 未找到 source：title={st} publisher={pub}")

        # optional meta fields ignored for validation

    print(f"[validate_mappings] file={mappings_path}")
    print(f"- total: {total}")
    print(f"- duplicates: {duplicates}")
    print(f"- unmatched_entity: {unmatched_entity}")
    print(f"- unmatched_source: {unmatched_source}")

    if issues:
        print("Issues:")
        for msg in issues[: args.max_issues]:
            print("-", msg)
        if len(issues) > args.max_issues:
            print(f"... {len(issues) - args.max_issues} more")

    if args.fail_on_issues and issues:
        raise SystemExit(2)


if __name__ == "__main__":
    main()


