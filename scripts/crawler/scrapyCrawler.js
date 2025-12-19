/**
 * Scrapy爬虫Node.js包装器
 * 用于集成Scrapy爬虫与现有Node.js项目
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'
import { readJSON, writeJSON, ensureDir } from './utils/helpers.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const execAsync = promisify(exec)

class ScrapyCrawler {
  constructor() {
    this.scrapyProjectPath = path.resolve(__dirname, 'historical_crawler')
    this.dataDir = path.resolve(__dirname, '../../../frontend/public/data')
    this.imagesDir = path.resolve(__dirname, '../../../frontend/public/images')
  }

  /**
   * 运行Scrapy人物爬虫
   * @param {string[]} personNames - 要爬取的人物名称数组
   * @returns {Promise<Object[]>} 爬取到的人物数据
   */
  async crawlPersons(personNames) {
    if (!personNames || personNames.length === 0) {
      console.log('❌ 没有提供要爬取的人物名称')
      return []
    }

    try {
      console.log(`\n🔍 使用Scrapy爬取 ${personNames.length} 个人物信息...`)
      
      // 构建Scrapy命令
      const namesParam = personNames.join(',')
      const command = `cd "${this.scrapyProjectPath}"; scrapy crawl person -a names="${namesParam}"`
      
      console.log(`📦 执行命令: ${command}`)
      const { stdout, stderr } = await execAsync(command)
      
      if (stderr) {
        console.error('⚠️ Scrapy执行警告:', stderr)
      }
      
      console.log('✅ Scrapy人物爬虫执行完成')
      
      // 读取爬取结果
      const personsPath = path.join(this.dataDir, 'persons.json')
      const persons = await readJSON(personsPath)
      
      console.log(`📊 成功爬取 ${persons.length} 个人物数据`)
      return persons
      
    } catch (error) {
      console.error('❌ Scrapy人物爬虫执行失败:', error.message)
      return []
    }
  }

  /**
   * 运行Scrapy事件爬虫
   * @param {string[]} eventNames - 要爬取的事件名称数组
   * @returns {Promise<Object[]>} 爬取到的事件数据
   */
  async crawlEvents(eventNames) {
    if (!eventNames || eventNames.length === 0) {
      console.log('❌ 没有提供要爬取的事件名称')
      return []
    }

    try {
      console.log(`\n🔍 使用Scrapy爬取 ${eventNames.length} 个事件信息...`)
      
      // 构建Scrapy命令
      const namesParam = eventNames.join(',')
      const command = `cd "${this.scrapyProjectPath}"; scrapy crawl event -a events="${namesParam}"`
      
      console.log(`📦 执行命令: ${command}`)
      const { stdout, stderr } = await execAsync(command)
      
      if (stderr) {
        console.error('⚠️ Scrapy执行警告:', stderr)
      }
      
      console.log('✅ Scrapy事件爬虫执行完成')
      
      // 读取爬取结果
      const eventsPath = path.join(this.dataDir, 'events.json')
      const events = await readJSON(eventsPath)
      
      console.log(`📊 成功爬取 ${events.length} 个事件数据`)
      return events
      
    } catch (error) {
      console.error('❌ Scrapy事件爬虫执行失败:', error.message)
      return []
    }
  }

  /**
   * 批量爬取人物和事件
   * @param {Object} options - 爬取选项
   * @param {string[]} options.persons - 要爬取的人物名称
   * @param {string[]} options.events - 要爬取的事件名称
   * @returns {Promise<Object>} 爬取结果
   */
  async crawlAll(options) {
    const { persons = [], events = [] } = options
    
    console.log('📋 开始批量爬取...')
    console.log(`👤 准备爬取 ${persons.length} 个人物`)
    console.log(`📅 准备爬取 ${events.length} 个事件`)
    
    const results = {
      persons: [],
      events: []
    }
    
    if (persons.length > 0) {
      results.persons = await this.crawlPersons(persons)
    }
    
    if (events.length > 0) {
      results.events = await this.crawlEvents(events)
    }
    
    console.log('\n🎉 批量爬取完成！')
    console.log(`📊 总结果：${results.persons.length} 个人物，${results.events.length} 个事件`)
    
    return results
  }
}

export default ScrapyCrawler
