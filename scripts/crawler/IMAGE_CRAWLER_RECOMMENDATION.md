# 支持图片下载的开源爬虫推荐

## 一、最佳推荐爬虫

### 1. Scrapy (Python) - 功能最强大
- **GitHub**: https://github.com/scrapy/scrapy
- **特点**: 
  - ✅ 完美支持文本数据和图片同时爬取
  - ✅ 内置 `ImagesPipeline` 专门处理图片下载
  - ✅ 支持自动重命名、去重、缩略图
  - ✅ 支持自定义图片存储路径
  - ✅ 高性能，适合大规模爬取
  - ✅ 丰富的文档和社区支持

### 2. EasySpider (Python) - 最易用
- **GitHub**: https://github.com/NaiboWang/EasySpider
- **特点**: 
  - ✅ 可视化操作，无需编程
  - ✅ 支持同时提取文本和图片
  - ✅ 中文界面，操作友好
  - ✅ 适合快速开发简单爬虫
  - ✅ 支持自定义存储

## 二、Scrapy 详细使用指南

### 1. 安装
```bash
pip install scrapy pillow
```

### 2. 创建爬虫项目
```bash
scrapy startproject historical_crawler
cd historical_crawler
```

### 3. 配置图片下载
修改 `settings.py`:
```python
# 启用图片管道
ITEM_PIPELINES = {
    'scrapy.pipelines.images.ImagesPipeline': 1,
}

# 图片存储路径
IMAGES_STORE = './images'

# 图片下载超时
IMAGES_STORE_TIMEOUT = 15

# 支持的图片格式
IMAGES_EXPIRES = 90  # 90天过期
```

### 4. 定义数据模型
创建 `items.py`:
```python
import scrapy

class HistoricalPersonItem(scrapy.Item):
    name = scrapy.Field()
    birth_year = scrapy.Field()
    death_year = scrapy.Field()
    dynasty = scrapy.Field()
    description = scrapy.Field()
    image_urls = scrapy.Field()  # 图片URL列表
    images = scrapy.Field()      # 下载后的图片信息

class HistoricalEventItem(scrapy.Item):
    name = scrapy.Field()
    start_year = scrapy.Field()
    end_year = scrapy.Field()
    dynasty = scrapy.Field()
    description = scrapy.Field()
    image_urls = scrapy.Field()
    images = scrapy.Field()
```

### 5. 创建人物爬虫
创建 `spiders/person_spider.py`:
```python
import scrapy
from historical_crawler.items import HistoricalPersonItem

class PersonSpider(scrapy.Spider):
    name = "person"
    allowed_domains = ["baike.baidu.com"]
    start_urls = ["https://baike.baidu.com/item/孔子"]

    def parse(self, response):
        item = HistoricalPersonItem()
        
        # 提取文本信息
        item['name'] = response.css('.lemmaWgt-lemmaTitle-title h1::text').get()
        item['description'] = response.css('.lemma-summary').xpath('string(.)').get().strip()
        
        # 提取基本信息
        basic_info = {}
        for info_item in response.css('.basicInfo_M3XoO .itemName_hpSfh'):
            key = info_item.xpath('string(.)').get().strip()
            value = info_item.xpath('following-sibling::div[1]').xpath('string(.)').get().strip()
            basic_info[key] = value
        
        # 提取图片URL
        item['image_urls'] = []
        # 人物头像
        avatar = response.css('.summary-pic img::attr(src)').get()
        if avatar:
            item['image_urls'].append(avatar)
        # 内容中的图片
        for img in response.css('.main-content img::attr(src)').getall():
            if img.startswith('http'):
                item['image_urls'].append(img)
        
        yield item
```

### 6. 运行爬虫
```bash
scrapy crawl person
```

### 7. 图片存储结构
```
images/
├── full/          # 完整图片
│   ├── abc123.jpg  # 自动重命名的图片
│   └── def456.jpg
└── thumbs/        # 缩略图(可选)
    └── small/
```

## 三、EasySpider 使用指南

### 1. 安装
```bash
# 下载最新版本
git clone https://github.com/NaiboWang/EasySpider.git
cd EasySpider

# 安装依赖
pip install -r requirements.txt

# 启动服务
python -m flask run
```

### 2. 可视化操作
1. 打开浏览器访问 `http://localhost:5000`
2. 点击"新建爬虫"
3. 设置爬取地址（如百度百科人物页面）
4. 使用可视化工具选择需要提取的字段：
   - 人物名称
   - 出生年份
   - 朝代
   - 简介
   - 图片URL（选择图片元素的src属性）
5. 在"下载设置"中启用图片下载
6. 设置图片存储路径
7. 启动爬取

## 四、Crawlee.js (Node.js) 图片下载方案

如果坚持使用Node.js，Crawlee.js也支持图片下载：

```javascript
import { PlaywrightCrawler } from 'crawlee';
import fs from 'fs';
import path from 'path';
import https from 'https';

const crawler = new PlaywrightCrawler({
    async requestHandler({ page, request }) {
        // 提取人物信息
        const name = await page.textContent('.lemmaWgt-lemmaTitle-title h1');
        const description = await page.textContent('.lemma-summary');
        
        // 提取图片
        const imgUrls = await page.$$eval('img', imgs => 
            imgs.map(img => img.src).filter(src => src.startsWith('http'))
        );
        
        // 创建存储目录
        const dirPath = `./images/${name}`;
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // 下载图片
        for (let i = 0; i < imgUrls.length; i++) {
            const imgUrl = imgUrls[i];
            const ext = path.extname(new URL(imgUrl).pathname) || '.jpg';
            const imgPath = path.join(dirPath, `${i}${ext}`);
            
            await downloadImage(imgUrl, imgPath);
            console.log(`下载图片: ${imgPath}`);
        }
        
        // 保存人物信息
        const data = { name, description, imgUrls };
        fs.writeFileSync(`${dirPath}/info.json`, JSON.stringify(data, null, 2));
    }
});

// 图片下载函数
function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', err => {
            fs.unlink(dest);
            reject(err);
        });
    });
}

// 启动爬取
await crawler.run(['https://baike.baidu.com/item/孔子']);
```

## 五、选择建议

### 🎯 推荐选择 Scrapy
- **优势**: 功能最全面，图片处理能力最强
- **适合**: 需要高质量、大规模爬取的场景
- **注意**: 需要Python基础

### 🎯 备选选择 EasySpider
- **优势**: 无需编程，快速上手
- **适合**: 简单爬取任务，或非技术人员使用
- **注意**: 复杂需求可能受限制

## 六、集成到现有项目

### Scrapy 与 Node.js 项目集成
```bash
# 1. 创建Python虚拟环境
python -m venv venv
venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows

# 2. 安装依赖
pip install scrapy pillow

# 3. 运行爬虫
scrapy crawl person

# 4. Node.js 读取爬取结果
# 在Node.js代码中:
const fs = require('fs');
const persons = JSON.parse(fs.readFileSync('./data/persons.json', 'utf8'));
```

## 七、实际应用示例

### 爬取孔子信息和图片的完整流程
1. **安装Scrapy** → 2. **创建爬虫项目** → 3. **配置图片下载** → 4. **编写爬虫代码** → 5. **运行爬虫**

**结果输出**:
```
# 文本数据 (items.json)
{
  "name": "孔子",
  "birth_year": "-551",
  "dynasty": "春秋末期",
  "description": "孔子（公元前551年9月28日—前479年4月11日）...",
  "image_urls": ["https://example.com/confucius.jpg"]
}

# 图片文件 (images/full/abc123.jpg)
# 自动下载并存储的孔子图片
```

## 八、总结

| 爬虫 | 语言 | 图片支持 | 易用性 | 性能 | 推荐指数 |
|------|------|----------|--------|------|----------|
| Scrapy | Python | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| EasySpider | Python | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Crawlee.js | JS/TS | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**最终推荐**: **Scrapy** 是最适合您需求的开源爬虫，它完美支持同时爬取人物/事件信息和对应图片，提供专业的图片处理能力，适合长期稳定使用。