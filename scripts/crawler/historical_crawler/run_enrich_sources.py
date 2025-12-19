import json
import os

from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings


def read_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    """
    运行方式（在仓库根目录）：
      python scripts/crawler/historical_crawler/run_enrich_sources.py

    功能：
    - 读取 frontend/public/data/persons.json / events.json
    - 用 Scrapy 抓取百度百科词条（人物/事件）
    - 增量写入 sources.json，并把 sourceId 回填到 persons/events 的 sources 字段
    - 默认安全模式：不追加新条目，只更新已存在条目
    """

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    data_dir = os.path.join(repo_root, "frontend", "public", "data")

    persons_path = os.path.join(data_dir, "persons.json")
    events_path = os.path.join(data_dir, "events.json")

    persons = read_json(persons_path)
    events = read_json(events_path)

    person_names = [p.get("name") for p in persons if isinstance(p, dict) and p.get("name")]
    event_titles = [e.get("title") for e in events if isinstance(e, dict) and e.get("title")]

    # Scrapy 项目目录（确保 get_project_settings 能读取 scrapy.cfg）
    scrapy_project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__)))
    os.chdir(scrapy_project_dir)

    settings = get_project_settings()
    process = CrawlerProcess(settings)

    # 直接把列表拼成逗号分隔参数（数量不大，Windows 命令行也不会爆）
    process.crawl("person", names=",".join(person_names))
    process.crawl("event", names=",".join(event_titles))
    process.start()


if __name__ == "__main__":
    main()


