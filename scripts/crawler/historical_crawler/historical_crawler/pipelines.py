# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html

import json
import os
import pathlib
import re
from itemadapter import ItemAdapter


class HistoricalCrawlerPipeline:
    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            append_new=crawler.settings.getbool('HISTORICAL_CRAWLER_APPEND_NEW', False),
            enrich_sources=crawler.settings.getbool('HISTORICAL_CRAWLER_ENRICH_SOURCES', True),
        )

    def __init__(self, append_new=False, enrich_sources=True):
        # 定义输出文件路径
        self.data_dir = "../../../frontend/public/data"
        self.images_dir = "../../../frontend/public/images"
        self.append_new = append_new
        self.enrich_sources = enrich_sources
        
        # 确保目录存在
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.images_dir, exist_ok=True)
        
        # 初始化数据列表
        self.persons_data = self._load_existing_data('persons.json')
        self.events_data = self._load_existing_data('events.json')
        self.sources_data = self._load_existing_data('sources.json')
        
        # 记录已存在的名称，避免重复
        self.person_index = {person.get('name'): i for i, person in enumerate(self.persons_data) if person.get('name')}
        self.event_index = {event.get('title'): i for i, event in enumerate(self.events_data) if event.get('title')}

        # sources 索引（优先按 url 去重）
        self.source_by_url = {}
        self.source_by_title = {}
        max_id = 0
        for s in self.sources_data:
            if isinstance(s, dict):
                sid = int(s.get('id') or 0)
                max_id = max(max_id, sid)
                url = (s.get('url') or '').strip()
                title = (s.get('title') or '').strip()
                if url:
                    self.source_by_url[url] = sid
                if title:
                    self.source_by_title[title] = sid
        self.next_source_id = max_id + 1

    def _load_existing_data(self, filename):
        """加载已存在的数据"""
        file_path = os.path.join(self.data_dir, filename)
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                return []
        return []

    def _save_data(self, data, filename):
        """保存数据到JSON文件"""
        file_path = os.path.join(self.data_dir, filename)
        tmp_path = file_path + ".tmp"
        with open(tmp_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, file_path)

    def _guess_source_type(self, title, url):
        title = (title or '').strip()
        url = (url or '').strip()
        # 书籍/文献优先
        if re.search(r'《[^》]+》', title):
            return 'academic_book', 4
        # 常见正史/编年体（简单启发式）
        for k in ['史记', '汉书', '后汉书', '三国志', '资治通鉴', '旧唐书', '新唐书', '宋史', '辽史', '金史', '元史', '明史', '清史稿']:
            if k in title:
                return 'official_history', 5
        # 档案/馆藏
        if 'nlc.cn' in url or '国家图书馆' in title:
            return 'archive', 5
        if '博物馆' in title:
            return 'museum', 4
        return 'authoritative_website', 3

    def _upsert_source(self, title, url, prefer_type=None, prefer_cred=None):
        """根据 url/title 去重写入 sources.json，返回 sourceId"""
        title = (title or '').strip()
        url = (url or '').strip() or None

        if url and url in self.source_by_url:
            return self.source_by_url[url]
        if title and title in self.source_by_title:
            return self.source_by_title[title]

        if prefer_type and prefer_cred:
            source_type, cred = prefer_type, prefer_cred
        else:
            source_type, cred = self._guess_source_type(title, url or '')

        sid = self.next_source_id
        self.next_source_id += 1
        entry = {
            "id": sid,
            "title": title or (url or f"source-{sid}"),
            "url": url,
            "sourceType": source_type,
            "credibilityLevel": cred,
            "verified": False
        }
        self.sources_data.append(entry)
        if url:
            self.source_by_url[url] = sid
        if entry["title"]:
            self.source_by_title[entry["title"]] = sid

        return sid

    def _merge_source_ids(self, target_obj, new_source_ids):
        if not new_source_ids:
            return
        if not isinstance(target_obj, dict):
            return
        existing = target_obj.get('sources')
        if not isinstance(existing, list):
            existing = []
        merged = set([x for x in existing if isinstance(x, int)])
        for sid in new_source_ids:
            if isinstance(sid, int):
                merged.add(sid)
        target_obj['sources'] = sorted(list(merged))

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        
        if 'name' in adapter.keys():
            # 处理人物数据
            self._process_person_item(item, adapter)
        elif 'title' in adapter.keys():
            # 处理事件数据
            self._process_event_item(item, adapter)
        
        return item

    def _process_person_item(self, item, adapter):
        """处理人物数据"""
        person_name = adapter['name']
        
        # 处理图片信息 - 即使人物已存在也要更新图片信息
        if adapter.get('images'):
            # 设置头像URL（使用第一张图片作为头像）
            if adapter['images']:
                first_image = adapter['images'][0]
                image_path = first_image['path']
                # 转换为相对路径 - 保留full子目录
                relative_path = f"/images/{image_path}"
                adapter['avatarUrl'] = relative_path
        
        # 移除内部使用的字段
        if 'image_urls' in adapter:
            del adapter['image_urls']
        if 'images' in adapter:
            del adapter['images']

        idx = self.person_index.get(person_name)
        if idx is None:
            if self.append_new:
                # 兼容旧行为：允许追加（不推荐）
                self.persons_data.append(dict(item))
                self.person_index[person_name] = len(self.persons_data) - 1
                self.logger.info(f"追加新人物（append_new=True）: {person_name}")
                self._save_data(self.persons_data, 'persons.json')
            else:
                self.logger.info(f"人物 {person_name} 不存在于 persons.json，已跳过（安全增量模式）")
            return

        # 更新已存在人物：头像/简介/生卒年 + sources
        target = self.persons_data[idx]

        if adapter.get('avatarUrl'):
            target['avatarUrl'] = adapter.get('avatarUrl')

        # biography 字段是前端使用的，爬虫字段叫 description
        desc = (adapter.get('description') or '').strip()
        if desc and not (target.get('biography') or '').strip():
            target['biography'] = desc

        if adapter.get('birthYear') is not None and target.get('birthYear') in (None, '', 0):
            target['birthYear'] = adapter.get('birthYear')
        if adapter.get('deathYear') is not None and target.get('deathYear') in (None, '', 0):
            target['deathYear'] = adapter.get('deathYear')

        new_source_ids = []
        if self.enrich_sources:
            page_url = (adapter.get('pageUrl') or '').strip()
            if page_url and 'baike.baidu.com' in page_url:
                sid = self._upsert_source(f"百度百科：{person_name}", page_url, prefer_type='authoritative_website', prefer_cred=3)
                new_source_ids.append(sid)
            # references: [{title,url}]
            refs = adapter.get('references') or []
            if isinstance(refs, list):
                for r in refs[:30]:
                    if isinstance(r, dict):
                        rt = (r.get('title') or '').strip()
                        ru = (r.get('url') or '').strip()
                        if rt and ru:
                            sid2 = self._upsert_source(rt, ru)
                            new_source_ids.append(sid2)
        self._merge_source_ids(target, new_source_ids)

        # 保存 persons/sources
        self._save_data(self.persons_data, 'persons.json')
        if self.enrich_sources and new_source_ids:
            self._save_data(self.sources_data, 'sources.json')
        self.logger.info(f"增量更新人物: {person_name} (sources +{len(new_source_ids)})")

    def _process_event_item(self, item, adapter):
        """处理事件数据"""
        event_title = adapter['title']

        idx = self.event_index.get(event_title)
        if idx is None:
            if self.append_new:
                # 兼容旧行为：允许追加（不推荐）
                self.events_data.append(dict(item))
                self.event_index[event_title] = len(self.events_data) - 1
                self.logger.info(f"追加新事件（append_new=True）: {event_title}")
                self._save_data(self.events_data, 'events.json')
            else:
                self.logger.info(f"事件 {event_title} 不存在于 events.json，已跳过（安全增量模式）")
            return

        target = self.events_data[idx]

        # 仅补缺：description/location/eventYear
        desc = (adapter.get('description') or '').strip()
        if desc and not (target.get('description') or '').strip():
            target['description'] = desc

        if adapter.get('location') and not (target.get('location') or '').strip():
            target['location'] = adapter.get('location')

        if adapter.get('year') is not None and (target.get('eventYear') in (None, '', 0)):
            target['eventYear'] = adapter.get('year')

        new_source_ids = []
        if self.enrich_sources:
            page_url = (adapter.get('pageUrl') or '').strip()
            if page_url and 'baike.baidu.com' in page_url:
                sid = self._upsert_source(f"百度百科：{event_title}", page_url, prefer_type='authoritative_website', prefer_cred=3)
                new_source_ids.append(sid)
            refs = adapter.get('references') or []
            if isinstance(refs, list):
                for r in refs[:30]:
                    if isinstance(r, dict):
                        rt = (r.get('title') or '').strip()
                        ru = (r.get('url') or '').strip()
                        if rt and ru:
                            sid2 = self._upsert_source(rt, ru)
                            new_source_ids.append(sid2)
        self._merge_source_ids(target, new_source_ids)

        self._save_data(self.events_data, 'events.json')
        if self.enrich_sources and new_source_ids:
            self._save_data(self.sources_data, 'sources.json')
        self.logger.info(f"增量更新事件: {event_title} (sources +{len(new_source_ids)})")

    @property
    def logger(self):
        """获取日志记录器"""
        from scrapy.utils.log import logger
        return logger
