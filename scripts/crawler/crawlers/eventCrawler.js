/**
 * 历史事件爬虫
 */

import { CrawlerBase } from '../utils/crawlerBase.js'
import { verifyEvent } from '../utils/aiVerifier.js'
import { saveJSON, readJSON } from '../utils/helpers.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class EventCrawler extends CrawlerBase {
  constructor() {
    super({ rateLimit: 2000 })
    this.outputDir = path.resolve(__dirname, '../../../frontend/public/data')
  }

  /**
   * 从百度百科爬取事件信息
   */
  async crawlFromBaiduBaike(eventName) {
    const url = `https://baike.baidu.com/item/${encodeURIComponent(eventName)}`
    const html = await this.fetchPage(url)
    if (!html) return null

    const $ = this.parseHTML(html)
    const event = {
      title: eventName,
      year: null,
      location: null,
      description: '',
      eventType: 'historical',
      persons: [],
    }

    // 提取基本信息
    const basicInfo = {}
    $('.basic-info .name-value').each((i, elem) => {
      const key = $(elem).prev('.name').text().trim()
      const value = $(elem).text().trim()
      basicInfo[key] = value
    })

    // 提取时间
    if (basicInfo['发生时间'] || basicInfo['时间']) {
      const time = basicInfo['发生时间'] || basicInfo['时间']
      const match = time.match(/(\d+)/)
      if (match) {
        event.year = parseInt(match[1])
        if (time.includes('前') || time.includes('BC')) {
          event.year = -event.year
        }
      }
    }

    // 提取地点
    if (basicInfo['发生地点'] || basicInfo['地点']) {
      event.location = basicInfo['发生地点'] || basicInfo['地点']
    }

    // 提取描述
    const summary = $('.lemma-summary').text().trim()
    if (summary) {
      event.description = summary
    }

    return event
  }

  /**
   * 爬取事件信息
   */
  async crawlEvent(eventName) {
    console.log(`\n📥 开始爬取事件: ${eventName}`)

    const eventData = await this.crawlFromBaiduBaike(eventName)

    if (!eventData || !eventData.description) {
      console.error(`❌ 无法获取 ${eventName} 的信息`)
      return null
    }

    // AI 审核
    console.log(`🤖 开始 AI 审核...`)
    const verification = await verifyEvent(eventData)
    
    if (!verification.verified) {
      console.warn(`⚠️  AI 审核未通过:`, verification.issues)
      if (verification.confidence < 0.5) {
        console.error(`❌ 置信度过低，跳过此事件`)
        return null
      }
    } else {
      console.log(`✅ AI 审核通过 (置信度: ${verification.confidence})`)
    }

    eventData.verification = verification
    return eventData
  }

  /**
   * 批量爬取
   */
  async crawlEvents(eventNames) {
    const events = await readJSON(path.join(this.outputDir, 'events.json'))
    const existingTitles = new Set(events.map(e => e.title))

    const results = []
    for (const name of eventNames) {
      if (existingTitles.has(name)) {
        console.log(`⏭️  跳过已存在的事件: ${name}`)
        continue
      }

      const event = await this.crawlEvent(name)
      if (event) {
        results.push(event)
      }
    }

    // 合并并保存
    if (results.length > 0) {
      const allEvents = [...events, ...results]
      // 分配 ID
      allEvents.forEach((e, i) => {
        if (!e.id) e.id = i + 1
      })
      await saveJSON(path.join(this.outputDir, 'events.json'), allEvents)
      console.log(`\n✅ 成功保存 ${results.length} 个事件信息`)
    }

    return results
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  const crawler = new EventCrawler()
  const names = process.argv.slice(2)
  
  if (names.length === 0) {
    console.log('使用方法: node eventCrawler.js <事件名称1> <事件名称2> ...')
    process.exit(1)
  }

  crawler.crawlEvents(names).then(() => {
    console.log('\n✅ 爬取完成')
    process.exit(0)
  }).catch(error => {
    console.error('❌ 爬取失败:', error)
    process.exit(1)
  })
}

export default EventCrawler

