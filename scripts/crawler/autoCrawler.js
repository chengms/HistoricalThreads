/**
 * 自动爬虫主程序
 * 自动发现、爬取、审核并保存历史数据
 */

import PersonCrawler from './crawlers/personCrawler.js'
import EventCrawler from './crawlers/eventCrawler.js'
import { AutoDiscover } from './utils/autoDiscover.js'
import { ImageDownloader } from './utils/imageDownloader.js'
import { readJSON, saveJSON } from './utils/helpers.js'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class AutoCrawler {
  constructor() {
    this.outputDir = path.resolve(__dirname, '../../frontend/public/data')
    this.imagesDir = path.resolve(__dirname, '../../frontend/public/images/persons')
    this.personCrawler = new PersonCrawler()
    this.eventCrawler = new EventCrawler()
    this.autoDiscover = new AutoDiscover()
    this.imageDownloader = new ImageDownloader(this.imagesDir)
  }

  /**
   * 自动发现并爬取指定朝代的人物
   */
  async crawlDynastyPersons(dynastyName, maxCount = 20) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🏛️  开始处理朝代: ${dynastyName}`)
    console.log('='.repeat(60))

    // 1. 自动发现人物
    console.log(`\n🔍 自动发现 ${dynastyName} 时期的重要人物...`)
    const discoveredPersons = await this.autoDiscover.discoverPersonsByDynasty(
      dynastyName,
      maxCount
    )

    console.log(`✅ 发现 ${discoveredPersons.length} 个人物`)
    discoveredPersons.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (${p.type}, ${p.importance})`)
    })

    // 2. 检查已存在的人物
    const existingPersons = await readJSON(path.join(this.outputDir, 'persons.json'))
    const existingNames = new Set(existingPersons.map(p => p.name))

    // 3. 过滤新人物
    const newPersons = discoveredPersons
      .filter(p => !existingNames.has(p.name))
      .slice(0, maxCount)

    if (newPersons.length === 0) {
      console.log(`\n⏭️  ${dynastyName} 的所有人物都已存在，跳过`)
      return []
    }

    console.log(`\n📥 开始爬取 ${newPersons.length} 个新人物...`)

    // 4. 爬取人物信息
    const results = []
    for (let i = 0; i < newPersons.length; i++) {
      const personInfo = newPersons[i]
      console.log(`\n[${i + 1}/${newPersons.length}] 处理: ${personInfo.name}`)

      try {
        // 爬取基本信息
        const personData = await this.personCrawler.crawlPerson(personInfo.name)

        if (!personData) {
          console.log(`❌ 跳过 ${personInfo.name}`)
          continue
        }

        // 如果没有图片，尝试下载
        if (!personData.avatarUrl) {
          console.log(`📷 尝试下载图片...`)
          const imageUrl = await this.imageDownloader.searchAndDownload(personInfo.name)
          if (imageUrl) {
            personData.avatarUrl = imageUrl
          }
        }

        // 添加类型信息
        personData.personType = [personInfo.type]
        personData.importance = personInfo.importance

        results.push(personData)
        console.log(`✅ ${personInfo.name} 处理完成`)

        // 延迟避免被封
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`❌ 处理 ${personInfo.name} 失败:`, error.message)
      }
    }

    // 5. 保存结果
    if (results.length > 0) {
      const allPersons = [...existingPersons, ...results]
      // 重新分配 ID
      allPersons.forEach((p, i) => {
        p.id = i + 1
      })
      await saveJSON(path.join(this.outputDir, 'persons.json'), allPersons)
      console.log(`\n✅ 成功保存 ${results.length} 个人物信息`)
    }

    return results
  }

  /**
   * 自动发现并爬取指定朝代的事件
   */
  async crawlDynastyEvents(dynastyName, maxCount = 15) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📅 开始处理朝代事件: ${dynastyName}`)
    console.log('='.repeat(60))

    // 1. 自动发现事件
    console.log(`\n🔍 自动发现 ${dynastyName} 时期的重要事件...`)
    const discoveredEvents = await this.autoDiscover.discoverEventsByDynasty(
      dynastyName,
      maxCount
    )

    console.log(`✅ 发现 ${discoveredEvents.length} 个事件`)
    discoveredEvents.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.title} (${e.type}, ${e.estimatedYear || '未知年份'})`)
    })

    // 2. 检查已存在的事件
    const existingEvents = await readJSON(path.join(this.outputDir, 'events.json'))
    const existingTitles = new Set(existingEvents.map(e => e.title))

    // 3. 过滤新事件
    const newEvents = discoveredEvents
      .filter(e => !existingTitles.has(e.title))
      .slice(0, maxCount)

    if (newEvents.length === 0) {
      console.log(`\n⏭️  ${dynastyName} 的所有事件都已存在，跳过`)
      return []
    }

    console.log(`\n📥 开始爬取 ${newEvents.length} 个新事件...`)

    // 4. 爬取事件信息
    const results = []
    for (let i = 0; i < newEvents.length; i++) {
      const eventInfo = newEvents[i]
      console.log(`\n[${i + 1}/${newEvents.length}] 处理: ${eventInfo.title}`)

      try {
        const eventData = await this.eventCrawler.crawlEvent(eventInfo.title)

        if (!eventData) {
          console.log(`❌ 跳过 ${eventInfo.title}`)
          continue
        }

        // 使用 AI 发现的年份（如果爬取失败）
        if (!eventData.year && eventInfo.estimatedYear) {
          eventData.year = eventInfo.estimatedYear
        }

        // 添加类型信息
        eventData.eventType = eventInfo.type

        results.push(eventData)
        console.log(`✅ ${eventInfo.title} 处理完成`)

        // 延迟避免被封
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`❌ 处理 ${eventInfo.title} 失败:`, error.message)
      }
    }

    // 5. 保存结果
    if (results.length > 0) {
      const allEvents = [...existingEvents, ...results]
      // 重新分配 ID
      allEvents.forEach((e, i) => {
        e.id = i + 1
      })
      await saveJSON(path.join(this.outputDir, 'events.json'), allEvents)
      console.log(`\n✅ 成功保存 ${results.length} 个事件信息`)
    }

    return results
  }

  /**
   * 运行完整的自动爬取流程
   */
  async run(dynasties = ['汉朝', '唐朝', '宋朝', '明朝', '清朝']) {
    console.log('🚀 自动历史数据爬虫启动')
    console.log('='.repeat(60))
    console.log(`📋 计划处理朝代: ${dynasties.join(', ')}`)
    console.log('='.repeat(60))

    const allPersonResults = []
    const allEventResults = []

    for (const dynasty of dynasties) {
      try {
        // 爬取人物
        const persons = await this.crawlDynastyPersons(dynasty, 15)
        allPersonResults.push(...persons)

        // 爬取事件
        const events = await this.crawlDynastyEvents(dynasty, 10)
        allEventResults.push(...events)

        console.log(`\n✅ ${dynasty} 处理完成`)
        console.log(`   人物: ${persons.length} 个`)
        console.log(`   事件: ${events.length} 个`)

        // 朝代之间延迟
        await new Promise(resolve => setTimeout(resolve, 5000))
      } catch (error) {
        console.error(`❌ 处理 ${dynasty} 失败:`, error.message)
      }
    }

    // 总结
    console.log('\n' + '='.repeat(60))
    console.log('📊 爬取总结')
    console.log('='.repeat(60))
    console.log(`✅ 总共爬取人物: ${allPersonResults.length} 个`)
    console.log(`✅ 总共爬取事件: ${allEventResults.length} 个`)
    console.log('='.repeat(60))
    console.log('\n🎉 所有任务完成！')
  }
}

// 主程序
async function main() {
  const crawler = new AutoCrawler()

  // 从命令行参数获取朝代，或使用默认值
  const dynasties = process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ['汉朝', '唐朝', '宋朝', '明朝', '清朝']

  await crawler.run(dynasties)
}

// 如果直接运行此文件
const isMainModule = process.argv[1] && (
  process.argv[1].includes('autoCrawler.js') ||
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))
)

if (isMainModule) {
  main().catch(error => {
    console.error('❌ 程序执行失败:', error)
    process.exit(1)
  })
}

export default AutoCrawler

