# Scrapy历史数据爬虫使用指南

## 一、爬虫概述

本项目采用Scrapy作为主要爬虫框架，用于爬取历史人物介绍、事件介绍及其对应的图片。Scrapy是一个成熟的Python爬虫框架，具有以下优势：

- 强大的图片处理能力（通过内置的ImagesPipeline）
- 高性能，支持并发爬取
- 丰富的中间件生态
- 灵活的配置和扩展能力
- 良好的文档和社区支持

## 二、环境要求

- Python 3.8+
- Scrapy 2.0+
- Node.js 14+（用于与现有项目集成）
- npm 6+（用于与现有项目集成）

## 三、安装说明

### 1. 安装Python和Scrapy

```bash
# 安装Scrapy
pip install scrapy

# 验证安装
scrapy --version
```

### 2. 项目依赖

```bash
# 进入Scrapy项目目录
cd scripts/crawler/historical_crawler

# 安装项目依赖
pip install -r requirements.txt
```

## 四、配置指南

### 1. 核心配置文件

Scrapy项目的核心配置文件位于：`scripts/crawler/historical_crawler/historical_crawler/settings.py`

#### 关键配置项：

```python
# 启用图片下载管道
ITEM_PIPELINES = {
    "scrapy.pipelines.images.ImagesPipeline": 1,
    "historical_crawler.pipelines.HistoricalCrawlerPipeline": 300,
}

# 图片存储路径
IMAGES_STORE = "../../../frontend/public/images"

# 图片下载超时时间
IMAGES_STORE_TIMEOUT = 15

# 图片过期时间（天）
IMAGES_EXPIRES = 90

# 缩略图生成配置
IMAGES_THUMBS = {
    'small': (50, 50),
    'medium': (100, 100),
}

# 图片URL字段配置
IMAGES_URLS_FIELD = "image_urls"
IMAGES_RESULT_FIELD = "images"
```

### 2. 数据结构配置

数据结构定义位于：`scripts/crawler/historical_crawler/historical_crawler/items.py`

## 五、使用方法

### 1. 直接使用Scrapy命令

#### 爬取人物信息

```bash
# 进入Scrapy项目目录
cd scripts/crawler/historical_crawler

# 爬取单个人物
scrapy crawl person -a names="秦始皇"

# 爬取多个人物
scrapy crawl person -a names="秦始皇,汉武帝,唐太宗"
```

#### 爬取事件信息

```bash
# 爬取单个事件
scrapy crawl event -a events="秦统一六国"

# 爬取多个事件
scrapy crawl event -a events="秦统一六国,汉朝建立,唐朝建立"
```

### 2. 通过Node.js包装器使用

#### 集成到现有Node.js项目

```javascript
import ScrapyCrawler from './scrapyCrawler.js'

const scrapyCrawler = new ScrapyCrawler()

// 爬取人物
const persons = await scrapyCrawler.crawlPersons(['秦始皇', '汉武帝'])

// 爬取事件
const events = await scrapyCrawler.crawlEvents(['秦统一六国', '汉朝建立'])

// 批量爬取
const results = await scrapyCrawler.crawlAll({
  persons: ['秦始皇', '汉武帝'],
  events: ['秦统一六国', '汉朝建立']
})
```

## 六、数据结构

### 1. 人物数据结构

```json
{
  "name": "秦始皇",
  "nameVariants": ["嬴政", "赵政"],
  "birthYear": -259,
  "deathYear": -210,
  "dynasty": "秦朝",
  "description": "秦始皇是中国历史上第一个统一王朝秦朝的开国皇帝...",
  "avatarUrl": "/images/秦始皇_avatar.jpg",
  "images": [
    "/images/秦始皇_1.jpg",
    "/images/秦始皇_2.jpg"
  ]
}
```

### 2. 事件数据结构

```json
{
  "title": "秦统一六国",
  "year": -221,
  "location": "中国",
  "description": "公元前221年，秦始皇统一六国，建立秦朝...",
  "eventType": "historical",
  "persons": ["秦始皇"],
  "images": [
    "/images/秦统一六国_1.jpg",
    "/images/秦统一六国_2.jpg"
  ]
}
```

## 七、图片处理

### 1. 图片存储位置

爬取的图片会自动保存到：`frontend/public/images/` 目录下

### 2. 图片访问方式

- 前端可以直接通过相对路径访问图片，如：`/images/秦始皇_avatar.jpg`
- 图片URL会自动添加到JSON数据中

### 3. 图片处理特性

- 自动下载网页中的所有相关图片
- 支持相对路径和绝对路径的图片URL
- 自动处理协议相对URL（如：`//example.com/image.jpg`）
- 支持图片缩略图生成
- 图片去重功能

## 八、与现有Node.js项目的集成

### 1. 集成架构

```
HistoricalThreads/
├── frontend/
│   └── public/
│       ├── data/         # 爬取的JSON数据
│       └── images/       # 爬取的图片
└── scripts/
    └── crawler/
        ├── crawlers/     # 原有Node.js爬虫
        ├── historical_crawler/  # Scrapy爬虫项目
        ├── scrapyCrawler.js     # Node.js包装器
        └── index.js      # 主入口文件
```

### 2. 使用Node.js包装器

```javascript
// 在现有的index.js中添加Scrapy爬虫选项
import ScrapyCrawler from './scrapyCrawler.js'

// 创建Scrapy爬虫实例
const scrapyCrawler = new ScrapyCrawler()

// 使用Scrapy爬虫爬取数据
await scrapyCrawler.crawlPersons(['秦始皇', '汉武帝'])
await scrapyCrawler.crawlEvents(['秦统一六国', '汉朝建立'])
```

### 3. 数据同步

Scrapy爬虫会将数据直接保存到`frontend/public/data/`目录下的`persons.json`和`events.json`文件中，与原有爬虫使用相同的数据结构，确保与前端无缝集成。

## 九、常见问题

### 1. 图片下载失败

**问题**：爬取时图片下载失败

**解决方案**：
- 检查网络连接
- 检查图片URL是否正确
- 调整`IMAGES_STORE_TIMEOUT`配置（增加超时时间）

### 2. 数据重复

**问题**：爬取的数据与现有数据重复

**解决方案**：
- 爬虫内置了去重机制，会自动跳过已存在的数据
- 可以手动删除`persons.json`或`events.json`文件，重新爬取

### 3. 爬取速度慢

**问题**：爬取速度较慢

**解决方案**：
- 调整Scrapy的并发配置（在`settings.py`中）
- 增加`CONCURRENT_REQUESTS`值
- 减少`DOWNLOAD_DELAY`值

### 4. Windows PowerShell兼容性

**问题**：在Windows PowerShell中执行命令失败

**解决方案**：
- 使用`;`代替`&&`进行命令连接
- 如：`cd scripts/crawler; scrapy crawl person -a names="秦始皇"`

## 十、扩展指南

### 1. 添加新的爬虫

```bash
# 生成新的爬虫
cd scripts/crawler/historical_crawler
scrapy genspider new_spider example.com
```

### 2. 自定义图片处理

可以在`pipelines.py`中扩展`HistoricalCrawlerPipeline`类，自定义图片处理逻辑。

### 3. 添加新的数据源

修改spiders目录下的爬虫文件，添加新的数据源解析逻辑。

## 十一、联系方式

如有任何问题或建议，请联系项目维护人员。

---

**版本**：v1.0.0  
**日期**：2025-12-15  
**作者**：历史数据爬虫项目组
