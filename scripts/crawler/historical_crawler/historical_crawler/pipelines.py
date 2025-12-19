# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html

import json
import os
import pathlib
from itemadapter import ItemAdapter


class HistoricalCrawlerPipeline:
    def __init__(self):
        # 定义输出文件路径
        self.data_dir = "../../../frontend/public/data"
        self.images_dir = "../../../frontend/public/images"
        
        # 确保目录存在
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.images_dir, exist_ok=True)
        
        # 初始化数据列表
        self.persons_data = self._load_existing_data('persons.json')
        self.events_data = self._load_existing_data('events.json')
        
        # 记录已存在的名称，避免重复
        self.existing_persons = {person['name'] for person in self.persons_data}
        self.existing_events = {event['title'] for event in self.events_data}

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
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

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
        
        if person_name in self.existing_persons:
            # 更新已存在的人物数据（主要是avatarUrl）
            for i, person in enumerate(self.persons_data):
                if person['name'] == person_name:
                    # 更新avatarUrl
                    if adapter.get('avatarUrl'):
                        self.persons_data[i]['avatarUrl'] = adapter['avatarUrl']
                    self.logger.info(f"更新人物头像: {person_name} -> {adapter.get('avatarUrl')}")
                    break
            # 不需要重新保存整个文件，只是更新内存中的数据
        else:
            # 添加新人物到数据列表
            self.persons_data.append(dict(item))
            self.existing_persons.add(person_name)
            self.logger.info(f"成功保存人物数据: {person_name}")
        
        # 保存数据
        self._save_data(self.persons_data, 'persons.json')

    def _process_event_item(self, item, adapter):
        """处理事件数据"""
        event_title = adapter['title']
        
        if event_title in self.existing_events:
            self.logger.info(f"事件 {event_title} 已存在，跳过保存")
            return
        
        # 处理图片信息
        images = []
        if adapter.get('images'):
            # 提取所有图片路径
            for image in adapter['images']:
                image_path = image['path']
                # 转换为相对路径 - 保留full子目录
                relative_path = f"/images/{image_path}"
                images.append(relative_path)
            
        # 添加图片字段
        if images:
            adapter['images'] = images
        
        # 移除内部使用的字段
        if 'image_urls' in adapter:
            del adapter['image_urls']
        if 'images' in adapter and not images:  # 只有当没有提取到图片时才删除
            del adapter['images']
        
        # 添加到数据列表
        self.events_data.append(dict(item))
        self.existing_events.add(event_title)
        
        # 保存数据
        self._save_data(self.events_data, 'events.json')
        self.logger.info(f"成功保存事件数据: {event_title}")

    @property
    def logger(self):
        """获取日志记录器"""
        from scrapy.utils.log import logger
        return logger
