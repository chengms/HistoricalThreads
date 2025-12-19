# -*- coding: utf-8 -*-
import scrapy
import re
import os
import hashlib
import json
from historical_crawler.items import HistoricalEventItem
from urllib.parse import urljoin, urlparse


class EventSpider(scrapy.Spider):
    name = "event"
    allowed_domains = ["baike.baidu.com", "zh.wikipedia.org"]
    # 示例起始URL，可以通过命令行参数传入更多
    start_urls = ["https://baike.baidu.com/item/赤壁之战"]

    def __init__(self, *args, **kwargs):
        super(EventSpider, self).__init__(*args, **kwargs)
        # 从命令行获取要爬取的事件列表
        if kwargs.get('names'):
            self.start_urls = [f"https://baike.baidu.com/item/{event}" for event in kwargs.get('names').split(',')]
        elif kwargs.get('names_file'):
            names_file = kwargs.get('names_file')
            names = self._load_names_file(names_file)
            if names:
                self.start_urls = [f"https://baike.baidu.com/item/{event}" for event in names]

    def _load_names_file(self, file_path):
        """从文件读取事件列表：支持 .txt（一行一个）或 .json（数组或含 title 字段对象数组）"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                if file_path.lower().endswith('.json'):
                    data = json.load(f)
                    if isinstance(data, list):
                        titles = []
                        for x in data:
                            if isinstance(x, str):
                                titles.append(x.strip())
                            elif isinstance(x, dict) and x.get('title'):
                                titles.append(str(x.get('title')).strip())
                        return [t for t in titles if t]
                    return []
                else:
                    return [line.strip() for line in f if line.strip()]
        except Exception as e:
            self.logger.warning(f"读取 names_file 失败: {file_path} -> {e}")
            return []

    def parse(self, response):
        item = HistoricalEventItem()
        
        # 初始化字段
        item['title'] = ''
        item['year'] = None
        item['location'] = None
        item['description'] = ''
        item['eventType'] = 'historical'
        item['persons'] = []
        item['image_urls'] = []
        item['pageUrl'] = response.url
        item['references'] = []
        
        if 'baike.baidu.com' in response.url:
            # 从百度百科爬取
            item = self.parse_baidu_baike(response, item)
        elif 'zh.wikipedia.org' in response.url:
            # 从维基百科爬取
            item = self.parse_wikipedia(response, item)
        
        yield item

    def parse_baidu_baike(self, response, item):
        """解析百度百科页面"""
        
        # 提取标题
        item['title'] = response.css('h1::text').get(default='').strip()
        item['pageUrl'] = response.url
        
        # 提取基本信息
        basic_info = {}
        
        # 新的百度百科结构
        for info_item in response.css('.basicInfo_M3XoO .itemName_hpSfh'):
            key = info_item.xpath('string(.)').get().strip() if info_item.xpath('string(.)').get() else ''
            value = info_item.xpath('following-sibling::div[1]').xpath('string(.)').get().strip() if info_item.xpath('following-sibling::div[1]').xpath('string(.)').get() else ''
            if key and value:
                basic_info[key] = value
        
        # 如果新结构没找到，尝试备用选择器
        if not basic_info:
            for info_item in response.css('.basic-info .name'):
                key = info_item.xpath('string(.)').get().strip().replace('\uff1a', '') if info_item.xpath('string(.)').get() else ''
                value = info_item.xpath('following-sibling::div[1]').xpath('string(.)').get().strip() if info_item.xpath('following-sibling::div[1]').xpath('string(.)').get() else ''
                if key and value:
                    basic_info[key] = value
        
        # 提取时间
        if basic_info.get('发生时间') or basic_info.get('时间'):
            time_str = basic_info.get('发生时间') or basic_info.get('时间')
            item['year'] = self.extract_year(time_str)
        
        # 提取地点
        if basic_info.get('发生地点') or basic_info.get('地点'):
            item['location'] = basic_info.get('发生地点') or basic_info.get('地点')
        
        # 提取简介
        summary_elements = response.css('[class*="summary"]')
        summary = ''
        
        if summary_elements:
            # 找到第一个较长的内容作为简介
            for elem in summary_elements:
                text = elem.xpath('string(.)').get().strip()
                if len(text) > 200 and '百度百科' not in text and '免责声明' not in text:
                    summary = text
                    break
        
        # 如果新选择器没找到，尝试原始选择器
        if not summary:
            summary = response.css('.lemma-summary').xpath('string(.)').get(default='').strip()
        
        item['description'] = summary

        # 提取参考资料/参考文献
        item['references'] = self.extract_baidu_references(response)
        
        # 提取相关人物
        # 从基本信息中提取相关人物
        if basic_info.get('相关人物') or basic_info.get('主要人物'):
            persons_str = basic_info.get('相关人物') or basic_info.get('主要人物')
            # 分割人物列表（可能用顿号、逗号或分号分隔）
            persons = re.split(r'[、,;，；]', persons_str)
            item['persons'] = [person.strip() for person in persons if person.strip()]
        
        # 提取图片
        image_urls = []
        
        # 提取内容中的图片
        for img in response.css('.main-content img::attr(src)').getall():
            if img.startswith('http'):
                image_urls.append(img)
            elif img.startswith('//'):
                image_urls.append(f'https:{img}')
        
        # 如果没有找到图片，尝试从其他位置提取
        if not image_urls:
            for img in response.css('.lemma-picture img::attr(src)').getall():
                if img.startswith('http'):
                    image_urls.append(img)
                elif img.startswith('//'):
                    image_urls.append(f'https:{img}')
        
        item['image_urls'] = image_urls
        
        return item

    def parse_wikipedia(self, response, item):
        """解析维基百科页面"""
        
        # 提取标题
        item['title'] = response.css('.firstHeading::text').get(default='').strip()
        item['pageUrl'] = response.url
        
        # 提取简介
        summary = response.css('#mw-content-text .mw-parser-output > p').first().xpath('string(.)').get(default='').strip()
        item['description'] = summary
        
        # 提取信息框
        basic_info = {}
        for row in response.css('.infobox tr'):
            label = row.css('th::text').get(default='').strip()
            value = row.css('td').xpath('string(.)').get(default='').strip()
            if label and value:
                basic_info[label] = value
        
        # 提取时间
        if basic_info.get('日期'):
            item['year'] = self.extract_year(basic_info['日期'])
        elif basic_info.get('时间'):
            item['year'] = self.extract_year(basic_info['时间'])
        
        # 提取地点
        if basic_info.get('地点'):
            item['location'] = basic_info['地点']
        
        # 提取相关人物
        if basic_info.get('参与者') or basic_info.get('人物'):
            persons_str = basic_info.get('参与者') or basic_info.get('人物')
            persons = re.split(r'[、,;，；]', persons_str)
            item['persons'] = [person.strip() for person in persons if person.strip()]
        
        # 提取图片
        image_urls = []
        
        # 提取信息框中的图片
        infobox_img = response.css('.infobox img::attr(src)').first().get()
        if infobox_img:
            full_img_url = infobox_img if infobox_img.startswith('http') else f'https:{infobox_img}'
            image_urls.append(full_img_url)
        
        # 提取内容中的图片
        for img in response.css('.mw-parser-output img::attr(src)').getall():
            if img.startswith('http'):
                image_urls.append(img)
            elif img.startswith('//'):
                image_urls.append(f'https:{img}')
        
        item['image_urls'] = image_urls
        
        return item

    def extract_baidu_references(self, response, limit=30):
        """尽量从百度百科页面底部提取参考资料链接（鲁棒处理不同结构）"""
        refs = []

        bad_url_patterns = [
            re.compile(r'baike\.baidu\.com/(help|usercenter|operation)\b', re.I),
            re.compile(r'beian\.miit\.gov\.cn', re.I),
            re.compile(r'beian\.gov\.cn', re.I),
            re.compile(r'ufosdk\.baidu\.com', re.I),
            re.compile(r'tieba\.baidu\.com', re.I),
            re.compile(r'www\.baidu\.com/duty', re.I),
        ]
        bad_titles = {
            '成长任务', '编辑入门', '编辑规则', '个人编辑', '在线客服', '官方贴吧',
            '举报不良信息', '未通过词条申诉', '投诉侵权信息', '封禁查询与解封',
            '使用百度前必读', '百科协议', '隐私政策', '百度百科合作平台',
            '京ICP证030173号', '京公网安备11000002000001号'
        }

        def add_ref(title, href):
            title = (title or '').strip()
            href = (href or '').strip()
            if not title or not href:
                return
            if title in bad_titles:
                return
            full_url = urljoin(response.url, href)
            if full_url.startswith('javascript:'):
                return
            if full_url.endswith('#'):
                return
            for p in bad_url_patterns:
                if p.search(full_url):
                    return
            host = urlparse(full_url).netloc.lower()
            if host.endswith('baike.baidu.com'):
                return
            key = (title, full_url)
            if key in seen:
                return
            seen.add(key)
            refs.append({'title': title, 'url': full_url})

        seen = set()

        containers = response.xpath('//*[contains(@class,"lemma-reference") or contains(@id,"reference") or contains(@class,"reference")]')
        for c in containers:
            for a in c.xpath('.//a[@href]'):
                title = a.xpath('normalize-space(string(.))').get()
                href = a.attrib.get('href')
                add_ref(title, href)
                if len(refs) >= limit:
                    return refs

        heading_nodes = response.xpath('//*[self::h2 or self::h3 or self::div or self::span][contains(normalize-space(string(.)),"参考资料") or contains(normalize-space(string(.)),"参考文献")]')
        for h in heading_nodes[:3]:
            sibs = h.xpath('following-sibling::*[position()<=8]')
            for s in sibs:
                for a in s.xpath('.//a[@href]'):
                    title = a.xpath('normalize-space(string(.))').get()
                    href = a.attrib.get('href')
                    add_ref(title, href)
                    if len(refs) >= limit:
                        return refs

        for a in response.xpath('//a[@href]'):
            title = a.xpath('normalize-space(string(.))').get()
            href = a.attrib.get('href')
            if title and ('《' in title and '》' in title):
                add_ref(title, href)
                if len(refs) >= limit:
                    return refs

        return refs

    def extract_year(self, year_str):
        """从字符串中提取年份"""
        if not year_str:
            return None
        
        # 匹配数字
        match = re.search(r'(-?\d+)', year_str)
        if not match:
            return None
        
        year = int(match.group(1))
        
        # 检查是否是公元前
        if '前' in year_str or 'BC' in year_str.upper():
            year = -abs(year)
        
        return year

    def closed(self, reason):
        """爬虫关闭时执行"""
        self.logger.info(f'爬虫关闭，原因: {reason}')
