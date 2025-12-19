import json
import os
import re


BAD_URL_PATTERNS = [
    re.compile(r'baike\.baidu\.com/(help|usercenter|operation)\b', re.I),
    re.compile(r'beian\.miit\.gov\.cn', re.I),
    re.compile(r'beian\.gov\.cn', re.I),
    re.compile(r'ufosdk\.baidu\.com', re.I),
    re.compile(r'tieba\.baidu\.com', re.I),
    re.compile(r'www\.baidu\.com/duty', re.I),
]

BAD_TITLES = {
    '成长任务', '编辑入门', '编辑规则', '个人编辑', '在线客服', '官方贴吧',
    '举报不良信息', '未通过词条申诉', '投诉侵权信息', '封禁查询与解封',
    '使用百度前必读', '百科协议', '隐私政策', '百度百科合作平台',
    '京ICP证030173号', '京公网安备11000002000001号',
    '本人编辑'
}


def read_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path, data):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def is_bad_source(s):
    if not isinstance(s, dict):
        return False
    title = (s.get("title") or "").strip()
    url = (s.get("url") or "").strip()
    if title in BAD_TITLES:
        return True
    if url:
        for p in BAD_URL_PATTERNS:
            if p.search(url):
                return True
    return False


def remove_ids_from_entities(entities, bad_ids):
    changed = 0
    for e in entities:
        if not isinstance(e, dict):
            continue
        src = e.get("sources")
        if not isinstance(src, list):
            continue
        new_src = [x for x in src if not (isinstance(x, int) and x in bad_ids)]
        if new_src != src:
            e["sources"] = new_src
            changed += 1
    return changed


def remove_dangling_ids_from_entities(entities, existing_source_ids):
    """移除 entities.sources 中不存在于 sources.json 的 id"""
    changed = 0
    for e in entities:
        if not isinstance(e, dict):
            continue
        src = e.get("sources")
        if not isinstance(src, list):
            continue
        new_src = [x for x in src if not (isinstance(x, int) and x not in existing_source_ids)]
        if new_src != src:
            e["sources"] = new_src
            changed += 1
    return changed


def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    data_dir = os.path.join(repo_root, "frontend", "public", "data")

    sources_path = os.path.join(data_dir, "sources.json")
    persons_path = os.path.join(data_dir, "persons.json")
    events_path = os.path.join(data_dir, "events.json")

    sources = read_json(sources_path)
    persons = read_json(persons_path)
    events = read_json(events_path)

    bad_ids = set()
    kept_sources = []
    for s in sources:
        if is_bad_source(s):
            sid = s.get("id")
            if isinstance(sid, int):
                bad_ids.add(sid)
        else:
            kept_sources.append(s)

    persons_changed = remove_ids_from_entities(persons, bad_ids)
    events_changed = remove_ids_from_entities(events, bad_ids)

    kept_ids = set([s.get("id") for s in kept_sources if isinstance(s, dict) and isinstance(s.get("id"), int)])
    persons_dangling = remove_dangling_ids_from_entities(persons, kept_ids)
    events_dangling = remove_dangling_ids_from_entities(events, kept_ids)

    should_write = bool(bad_ids) or persons_changed or events_changed or persons_dangling or events_dangling
    if should_write:
        # 如果仅修复 dangling，则 sources 内容不变；但为了保证一致性，仍写回 sources/persons/events。
        write_json(sources_path, kept_sources)
        write_json(persons_path, persons)
        write_json(events_path, events)

    print(
        f"removed_sources={len(bad_ids)} "
        f"persons_updated={persons_changed} events_updated={events_changed} "
        f"persons_dangling_fixed={persons_dangling} events_dangling_fixed={events_dangling}"
    )


if __name__ == "__main__":
    main()


