# -*- coding: utf-8 -*-
import scrapy
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from historical_crawler.spiders.person_spider import PersonSpider
import logging
import json

# 设置日志级别
logging.basicConfig(level=logging.DEBUG)

class ImageExtractionDebugSpider(scrapy.Spider):
    name = "image_debug"
    allowed_domains = ["baike.baidu.com", "bkimg.cdn.bcebos.com", "baikebcs.bdimg.com"]
    start_urls = ["https://baike.baidu.com/item/孔子"]

    def parse(self, response):
        self.logger.info(f'\n=== 开始分析百度百科页面图片结构 ===')
        self.logger.info(f'页面URL: {response.url}')
        
        # 1. 测试各种图片提取选择器
        self.test_image_selectors(response)
        
        # 2. 测试当前爬虫的图片提取逻辑
        self.test_current_extraction_logic(response)
        
        # 3. 分析页面结构
        self.analyze_page_structure(response)

    def test_image_selectors(self, response):
        self.logger.info('\n=== 测试各种图片选择器 ===')
        
        # 测试选择器列表
        selectors_to_test = [
            ('summary-pic img', '.summary-pic img'),
            ('lemma-picture img', '.lemma-picture img'),
            ('lemma-summary img', '.lemma-summary img'),
            ('div[class*="summary"] img', 'div[class*="summary"] img'),
            ('div[class*="picture"] img', 'div[class*="picture"] img'),
            ('div img', 'div img'),
            ('img', 'img'),
            ('div[class*="basic"] img', 'div[class*="basic"] img'),
            ('div[class*="infobox"] img', 'div[class*="infobox"] img'),
            ('img[src*="bkimg.cdn.bcebos.com"]', 'img[src*="bkimg.cdn.bcebos.com"]'),
            ('img[data-src*="bkimg.cdn.bcebos.com"]', 'img[data-src*="bkimg.cdn.bcebos.com"]'),
            ('img[src*="baikebcs.bdimg.com"]', 'img[src*="baikebcs.bdimg.com"]'),
            ('img[data-src*="baikebcs.bdimg.com"]', 'img[data-src*="baikebcs.bdimg.com"]'),
        ]
        
        for selector_name, selector in selectors_to_test:
            imgs = response.css(selector)
            count = len(imgs)
            self.logger.info(f'{selector_name}: 找到 {count} 张图片')
            
            # 打印前3张图片的信息
            if count > 0:
                for i, img in enumerate(imgs[:3]):
                    src = img.css('::attr(src)').get()
                    data_src = img.css('::attr(data-src)').get()
                    data_original = img.css('::attr(data-original)').get()
                    width = img.css('::attr(width)').get()
                    height = img.css('::attr(height)').get()
                    
                    self.logger.info(f'  图片 {i+1}:')
                    self.logger.info(f'    src: {src}')
                    self.logger.info(f'    data-src: {data_src}')
                    self.logger.info(f'    data-original: {data_original}')
                    self.logger.info(f'    尺寸: {width}x{height}')

    def test_current_extraction_logic(self, response):
        self.logger.info('\n=== 测试当前爬虫的图片提取逻辑 ===')
        
        # 复制当前爬虫的图片提取逻辑
        image_urls = []
        valid_image_domains = ['baike.baidu.com', 'bkimg.cdn.bcebos.com', 'baikebcs.bdimg.com']
        invalid_url_patterns = ['new.png', 'edit.png', 'star.png', 'lock.png', 'flag.png', 'icon', 'logo']
        
        def extract_img_urls(selector):
            urls = []
            src_urls = selector.css('::attr(src)').getall()
            data_src_urls = selector.css('::attr(data-src)').getall()
            all_urls = src_urls + data_src_urls
            
            for img in all_urls:
                if img and (img.startswith('http') or img.startswith('//')):
                    full_url = img if img.startswith('http') else f'https:{img}'
                    
                    # 检查是否是有效图片
                    if any(domain in full_url for domain in valid_image_domains) and \
                       any(ext in full_url.lower() for ext in ['.jpg', '.png', '.jpeg', '.gif']) and \
                       '.svg' not in full_url.lower() and \
                       not any(pattern in full_url.lower() for pattern in invalid_url_patterns) and \
                       len(full_url) > 50:
                        urls.append(full_url)
            return urls
        
        # 执行当前逻辑
        image_containers = [
            response.css('.summary-pic img'),
            response.css('.lemma-picture img'),
            response.css('[class*="summary"] img'),
            response.css('[class*="picture"] img'),
            response.css('[class*="image"] img'),
            response.css('[id*="summary"] img'),
            response.css('[id*="picture"] img'),
            response.css('[id*="image"] img'),
            response.css('.basic-info img'),
            response.css('.infobox img'),
            response.css('div img')
        ]
        
        extracted_urls = []
        for i, container in enumerate(image_containers):
            container_urls = extract_img_urls(container)
            extracted_urls.extend(container_urls)
            self.logger.info(f'容器 {i+1} 提取到 {len(container_urls)} 张图片')
        
        # 去重
        unique_urls = list(set(extracted_urls))
        self.logger.info(f'\n总共提取到 {len(unique_urls)} 张独特图片')
        
        for i, url in enumerate(unique_urls[:10]):
            self.logger.info(f'  {i+1}. {url}')
        
        # 分析过滤条件
        self.logger.info('\n=== 分析过滤条件 ===')
        
        # 重新执行提取，但记录被过滤的图片
        all_potential_urls = []
        filtered_urls = []
        accepted_urls = []
        
        for container in image_containers:
            src_urls = container.css('::attr(src)').getall()
            data_src_urls = container.css('::attr(data-src)').getall()
            all_urls = src_urls + data_src_urls
            
            for img in all_urls:
                if img and (img.startswith('http') or img.startswith('//')):
                    full_url = img if img.startswith('http') else f'https:{img}'
                    all_potential_urls.append(full_url)
                    
                    # 检查过滤条件
                    if not any(domain in full_url for domain in valid_image_domains):
                        filtered_urls.append((full_url, '无效域名'))
                    elif not any(ext in full_url.lower() for ext in ['.jpg', '.png', '.jpeg', '.gif']):
                        filtered_urls.append((full_url, '无效扩展名'))
                    elif '.svg' in full_url.lower():
                        filtered_urls.append((full_url, 'SVG图片'))
                    elif any(pattern in full_url.lower() for pattern in invalid_url_patterns):
                        filtered_urls.append((full_url, '包含无效模式'))
                    elif len(full_url) <= 50:
                        filtered_urls.append((full_url, 'URL太短'))
                    else:
                        accepted_urls.append(full_url)
        
        self.logger.info(f'潜在图片URL总数: {len(all_potential_urls)}')
        self.logger.info(f'被过滤的图片URL: {len(filtered_urls)}')
        self.logger.info(f'被接受的图片URL: {len(accepted_urls)}')
        
        # 打印被过滤的图片示例
        self.logger.info('\n被过滤的图片URL示例:')
        for url, reason in filtered_urls[:10]:
            self.logger.info(f'  {url} (原因: {reason})')

    def analyze_page_structure(self, response):
        self.logger.info('\n=== 分析页面结构 ===')
        
        # 查找所有div标签及其类名
        div_tags = response.css('div')
        self.logger.info(f'页面中共有 {len(div_tags)} 个div标签')
        
        # 提取所有div的类名
        div_classes = []
        for div in div_tags:
            classes = div.css('::attr(class)').get()
            if classes:
                div_classes.extend(classes.split())
        
        # 统计类名出现频率
        class_counts = {}
        for cls in div_classes:
            class_counts[cls] = class_counts.get(cls, 0) + 1
        
        # 打印出现频率最高的20个类名
        sorted_classes = sorted(class_counts.items(), key=lambda x: x[1], reverse=True)[:20]
        self.logger.info('\n页面中最常见的div类名:')
        for cls, count in sorted_classes:
            self.logger.info(f'  {cls}: {count} 次')

# 运行爬虫
if __name__ == "__main__":
    settings = get_project_settings()
    process = CrawlerProcess(settings)
    process.crawl(ImageExtractionDebugSpider)
    process.start()
