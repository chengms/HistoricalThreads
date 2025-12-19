# 开源爬虫推荐与集成方案

## 一、推荐的开源爬虫

### 1. Crawlee.js (Node.js)
- **GitHub**: https://github.com/apify/crawlee
- **语言**: JavaScript/TypeScript
- **特点**: 
  - 专为Node.js设计，支持Puppeteer/Playwright自动化
  - 内置队列、速率限制、重试机制
  - 支持JS渲染页面
  - 现代API，适合Node.js项目

### 2. EasySpider
- **GitHub**: https://github.com/NaiboWang/EasySpider
- **语言**: Python
- **特点**: 
  - 可视化爬虫工具，无需编程
  - 支持多种数据源
  - 适合快速开发简单爬虫
  - 有中文界面

### 3. Scrapy
- **GitHub**: https://github.com/scrapy/scrapy
- **语言**: Python
- **特点**: 
  - 成熟的Python爬虫框架
  - 高性能，适合大规模爬取
  - 丰富的中间件生态
  - 但需要Python环境

### 4. FireCrawl
- **GitHub**: https://github.com/mendableai/firecrawl
- **语言**: JavaScript/TypeScript
- **特点**: 
  - 专注于将网站内容转化为LLM就绪数据
  - 支持递归爬取整个网站
  - 有API接口

## 二、Crawlee.js 集成方案

### 1. 安装
```bash
npm install crawlee playwright-core
```

### 2. 基本使用示例
```javascript
import { PlaywrightCrawler } from 'crawlee';

const crawler = new PlaywrightCrawler({
    // 爬取配置
    maxRequestsPerCrawl: 10,
    maxConcurrency: 2,
    
    // 处理页面
    async requestHandler({ page, request }) {
        console.log(`正在爬取: ${request.url}`);
        
        // 提取数据
        const title = await page.title();
        const content = await page.textContent('.lemma-summary');
        
        console.log(`标题: ${title}`);
        console.log(`内容: ${content.substring(0, 100)}...`);
    },
    
    // 错误处理
    async failedRequestHandler({ request, error }) {
        console.error(`爬取失败: ${request.url}`, error.message);
    }
});

// 启动爬取
await crawler.run([
    'https://baike.baidu.com/item/孔子',
    'https://baike.baidu.com/item/老子'
]);
```

## 三、与现有项目集成

### 1. 替换现有爬取逻辑
将 `personCrawler.js` 和 `eventCrawler.js` 中的爬取部分替换为 Crawlee.js 实现：

```javascript
// personCrawler.js
import { PlaywrightCrawler } from 'crawlee';
import { CrawlerBase } from '../utils/crawlerBase.js';
import { DataSourceManager } from '../utils/dataSourceManager.js';

class PersonCrawler extends CrawlerBase {
    async crawlFromBaiduBaike(personName) {
        let result = null;
        
        const crawler = new PlaywrightCrawler({
            maxRequestsPerCrawl: 1,
            async requestHandler({ page }) {
                // 等待页面加载完成
                await page.waitForLoadState('networkidle');
                
                // 提取数据
                const title = await page.title();
                const content = await page.textContent('.lemma-summary');
                
                // 提取基本信息
                const basicInfo = {};
                const infoItems = await page.$$('.basicInfo_M3XoO .itemName_hpSfh');
                
                for (const item of infoItems) {
                    const key = await item.textContent();
                    const valueElem = await item.$('.itemValue_xOT6m');
                    const value = await valueElem.textContent();
                    basicInfo[key] = value;
                }
                
                result = {
                    name: personName,
                    description: content,
                    basicInfo: basicInfo
                };
            }
        });
        
        await crawler.run([`https://baike.baidu.com/item/${encodeURIComponent(personName)}`]);
        return result;
    }
    
    // 其他方法...
}
```

### 2. 保持数据源管理机制
继续使用现有的 `DataSourceManager` 来管理配置：

```javascript
// 在crawlPerson方法中
const enabledSources = await dataSourceManager.getPersonSources();

for (const source of enabledSources) {
    try {
        if (source.name === '百度百科') {
            personData = await this.crawlFromBaiduBaikeWithCrawlee(personName);
        } else if (source.name === '维基百科') {
            personData = await this.crawlFromWikipediaWithCrawlee(personName);
        }
        
        if (personData && personData.description) {
            console.log(`✅ 从 ${source.name} 成功获取数据`);
            break;
        }
    } catch (error) {
        console.error(`❌ 从 ${source.name} 爬取失败:`, error.message);
    }
}
```

## 四、优势与注意事项

### 优势
1. **更强大的页面渲染**: 支持JS渲染，能处理动态加载的内容
2. **更好的性能**: 内置队列和并发控制
3. **更完善的错误处理**: 重试机制、错误回调
4. **活跃的社区**: 持续维护和更新

### 注意事项
1. **依赖增加**: 需要安装额外的依赖包
2. **学习成本**: 需要熟悉新的API
3. **资源消耗**: 浏览器自动化会消耗更多资源
4. **兼容性**: 需要检查Node.js版本兼容性

## 五、集成建议

1. **渐进式迁移**: 先在新功能中使用，再逐步替换旧逻辑
2. **保留现有架构**: 保持数据源管理、AI验证等现有机制
3. **测试充分**: 在生产环境前进行充分测试
4. **监控资源**: 注意内存和CPU使用情况

---

如果需要进一步了解或需要帮助集成这些开源爬虫，请随时告知！