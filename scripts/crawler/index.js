/**
 * 历史数据爬虫主程序
 */

import PersonCrawler from './crawlers/personCrawler.js'
import EventCrawler from './crawlers/eventCrawler.js'
import ScrapyCrawler from './scrapyCrawler.js'
import { readJSON } from './utils/helpers.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  console.log('🚀 历史数据爬虫启动...\n')

  // 读取配置
  const configPath = path.join(__dirname, 'config', 'sources.json')
  const config = await readJSON(configPath)

  // 示例：爬取一些著名历史人物
  const personNames = [
    '秦始皇',
    '汉武帝',
    '唐太宗',
    '宋太祖',
    '明太祖',
  ]

  // 示例：爬取一些历史事件
  const eventNames = [
    '秦统一六国',
    '汉朝建立',
    '唐朝建立',
    '宋朝建立',
    '明朝建立',
  ]

  console.log('📋 计划爬取:')
  console.log(`  人物: ${personNames.length} 个`)
  console.log(`  事件: ${eventNames.length} 个\n`)

  // 爬取人物
  if (config.personSources.some(s => s.enabled)) {
    console.log('='.repeat(60))
    console.log('👤 开始爬取人物信息...')
    console.log('='.repeat(60))
    
    const personCrawler = new PersonCrawler()
    await personCrawler.crawlPersons(personNames)
  }

  // 爬取事件
  if (config.eventSources.some(s => s.enabled)) {
    console.log('\n' + '='.repeat(60))
    console.log('📅 开始爬取事件信息...')
    console.log('='.repeat(60))
    
    const eventCrawler = new EventCrawler()
    await eventCrawler.crawlEvents(eventNames)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ 所有任务完成！')
  console.log('='.repeat(60))
}

main().catch(error => {
  console.error('❌ 程序执行失败:', error)
  process.exit(1)
})

