# -*- coding: utf-8 -*-
import scrapy
import re
import os
import hashlib
import json
from historical_crawler.items import HistoricalPersonItem
from urllib.parse import urljoin, urlparse


class PersonSpider(scrapy.Spider):
    name = "person"
    allowed_domains = ["baike.baidu.com", "zh.wikipedia.org", "bkimg.cdn.bcebos.com", "baikebcs.bdimg.com"]
    # 示例起始URL，可以通过命令行参数传入更多
    start_urls = ["https://baike.baidu.com/item/孔子"]

    def __init__(self, *args, **kwargs):
        super(PersonSpider, self).__init__(*args, **kwargs)
        # 从命令行获取要爬取的人物列表
        if kwargs.get('names'):
            self.start_urls = [f"https://baike.baidu.com/item/{person}" for person in kwargs.get('names').split(',')]
        elif kwargs.get('names_file'):
            names_file = kwargs.get('names_file')
            names = self._load_names_file(names_file)
            if names:
                self.start_urls = [f"https://baike.baidu.com/item/{person}" for person in names]

    def _load_names_file(self, file_path):
        """从文件读取人物列表：支持 .txt（一行一个）或 .json（数组或含 name 字段对象数组）"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                if file_path.lower().endswith('.json'):
                    data = json.load(f)
                    if isinstance(data, list):
                        names = []
                        for x in data:
                            if isinstance(x, str):
                                names.append(x.strip())
                            elif isinstance(x, dict) and x.get('name'):
                                names.append(str(x.get('name')).strip())
                        return [n for n in names if n]
                    return []
                else:
                    return [line.strip() for line in f if line.strip()]
        except Exception as e:
            self.logger.warning(f"读取 names_file 失败: {file_path} -> {e}")
            return []

    def parse(self, response):
        item = HistoricalPersonItem()
        
        # 初始化字段
        item['name'] = ''
        item['nameVariants'] = []
        item['birthYear'] = None
        item['deathYear'] = None
        item['dynasty'] = None
        item['description'] = ''
        item['image_urls'] = []
        item['avatarUrl'] = None
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
        
        # 提取名称
        item['name'] = response.css('h1::text').get(default='').strip()
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
        
        # 提取生卒年份
        if basic_info.get('出生日期') or basic_info.get('出生年'):
            birth_info = basic_info.get('出生日期') or basic_info.get('出生年')
            item['birthYear'] = self.extract_year(birth_info)
            
        if basic_info.get('逝世日期') or basic_info.get('逝世年'):
            death_info = basic_info.get('逝世日期') or basic_info.get('逝世年')
            item['deathYear'] = self.extract_year(death_info)
        
        # 提取朝代
        if basic_info.get('所处时代') or basic_info.get('朝代'):
            item['dynasty'] = basic_info.get('所处时代') or basic_info.get('朝代')
        else:
            # 如果没有明确的朝代信息，尝试从简介中提取
            intro_text = response.css('.lemma-summary').xpath('string(.)').get(default='').strip()
            dynasty_match = re.search(r'([\u4e00-\u9fa5]+)[朝代国]', intro_text)
            if dynasty_match:
                item['dynasty'] = dynasty_match.group(1) + '朝'
        
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
        
        # 提取图片
        image_urls = []
        valid_image_domains = ['baike.baidu.com', 'bkimg.cdn.bcebos.com', 'baikebcs.bdimg.com']
        invalid_url_patterns = ['new.png', 'edit.png', 'star.png', 'lock.png', 'flag.png', 'icon', 'logo']
        
        # 辅助函数：提取图片URL，支持懒加载
        def extract_img_urls(selector):
            urls = []
            # 先尝试提取src属性
            src_urls = selector.css('::attr(src)').getall()
            # 再尝试提取data-src属性（懒加载图片）
            data_src_urls = selector.css('::attr(data-src)').getall()
            # 再尝试提取data-original属性（另一种懒加载方式）
            data_original_urls = selector.css('::attr(data-original)').getall()
            # 合并URL列表
            all_urls = src_urls + data_src_urls + data_original_urls
            
            for img in all_urls:
                if img and (img.startswith('http') or img.startswith('//')):
                    full_url = img if img.startswith('http') else f'https:{img}'
                    # 检查是否是有效图片
                    # 优化：检查URL是否包含图片扩展名，不要求必须在结尾
                    has_valid_extension = any(f'.{ext}' in full_url.lower() for ext in ['jpg', 'png', 'jpeg', 'gif'])
                    is_not_svg = '.svg' not in full_url.lower()
                    has_valid_domain = any(domain in full_url for domain in valid_image_domains)
                    is_not_invalid_pattern = not any(pattern in full_url.lower() for pattern in invalid_url_patterns)
                    
                    if has_valid_domain and (has_valid_extension or '.bcebos.com' in full_url) and is_not_svg and is_not_invalid_pattern:
                        urls.append(full_url)
            return urls
        
        # 尝试提取主要图片容器，优先级从高到低
        # 1. 信息框中的图片（最可能是人物肖像）
        # 2. 主要图片区域
        # 3. 通用图片选择器
        image_containers = [
            # 信息框中的图片（最可能是人物肖像）
            response.css('.basicInfo_M3XoO img'),
            response.css('.lemmaInfoCite_A8V2k img'),
            # 主要图片区域
            response.css('.lemmaPicture_A8U_G img'),
            response.css('.J-lemma-content-single-image img'),
            response.css('.summary-pic img'),
            response.css('.lemma-picture img'),
            # 通用图片选择器
            response.css('[class*="picture"] img'),
            response.css('[class*="image"] img'),
            response.css('[class*="summary"] img')
            # 不再尝试所有div中的图片，避免获取无关图片
        ]
        
        # 提取所有容器中的图片
        for container in image_containers:
            container_images = extract_img_urls(container)
            image_urls.extend(container_images)
        
        # 只保留前3张图片
        image_urls = image_urls[:3]
        item['image_urls'] = image_urls
        
        return item

    def parse_wikipedia(self, response, item):
        """解析维基百科页面"""
        
        # 提取名称
        item['name'] = response.css('.firstHeading::text').get(default='').strip()
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
        
        # 提取生卒年份
        if basic_info.get('出生'):
            item['birthYear'] = self.extract_year(basic_info['出生'])
        if basic_info.get('逝世'):
            item['deathYear'] = self.extract_year(basic_info['逝世'])
        
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
            # 过滤明显无效链接
            if full_url.startswith('javascript:'):
                return
            if full_url.endswith('#'):
                return
            # 过滤站内非参考链接（帮助/用户中心/备案等）
            for p in bad_url_patterns:
                if p.search(full_url):
                    return
            host = urlparse(full_url).netloc.lower()
            # 参考资料通常为外链或书籍信息；避免抓到百科站内页脚/导航
            if host.endswith('baike.baidu.com'):
                return
            key = (title, full_url)
            if key in seen:
                return
            seen.add(key)
            refs.append({'title': title, 'url': full_url})

        seen = set()

        # 1) 常见 reference 容器
        containers = response.xpath('//*[contains(@class,"lemma-reference") or contains(@id,"reference") or contains(@class,"reference")]')
        for c in containers:
            for a in c.xpath('.//a[@href]'):
                title = a.xpath('normalize-space(string(.))').get()
                href = a.attrib.get('href')
                add_ref(title, href)
                if len(refs) >= limit:
                    return refs

        # 2) 找到标题“参考资料/参考文献”附近的内容块
        heading_nodes = response.xpath('//*[self::h2 or self::h3 or self::div or self::span][contains(normalize-space(string(.)),"参考资料") or contains(normalize-space(string(.)),"参考文献")]')
        for h in heading_nodes[:3]:
            # 向后取一段兄弟节点
            sibs = h.xpath('following-sibling::*[position()<=8]')
            for s in sibs:
                for a in s.xpath('.//a[@href]'):
                    title = a.xpath('normalize-space(string(.))').get()
                    href = a.attrib.get('href')
                    add_ref(title, href)
                    if len(refs) >= limit:
                        return refs

        # 3) 兜底：全页扫描“像书籍”的链接（标题包含《》或较长外链标题）
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
