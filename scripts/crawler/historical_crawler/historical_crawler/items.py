# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class HistoricalPersonItem(scrapy.Item):
    # 人物基本信息
    name = scrapy.Field()
    nameVariants = scrapy.Field()
    birthYear = scrapy.Field()
    deathYear = scrapy.Field()
    dynasty = scrapy.Field()
    description = scrapy.Field()
    
    # 图片信息
    image_urls = scrapy.Field()  # 图片URL列表
    images = scrapy.Field()      # 下载后的图片信息
    avatarUrl = scrapy.Field()   # 头像相对路径

    # 来源/参考资料（增量补全用）
    pageUrl = scrapy.Field()     # 当前词条页面URL（百度百科/维基百科）
    references = scrapy.Field()  # 参考资料列表：[{title, url}]
    
    # 验证信息
    verification = scrapy.Field()


class HistoricalEventItem(scrapy.Item):
    # 事件基本信息
    title = scrapy.Field()
    year = scrapy.Field()
    location = scrapy.Field()
    description = scrapy.Field()
    eventType = scrapy.Field()
    persons = scrapy.Field()
    
    # 图片信息
    image_urls = scrapy.Field()  # 图片URL列表
    images = scrapy.Field()      # 下载后的图片信息

    # 来源/参考资料（增量补全用）
    pageUrl = scrapy.Field()     # 当前词条页面URL（百度百科/维基百科）
    references = scrapy.Field()  # 参考资料列表：[{title, url}]
