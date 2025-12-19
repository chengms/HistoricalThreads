/**
 * 数据源管理工具
 */

import { readJSON } from './helpers.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class DataSourceManager {
  constructor() {
    this.configPath = path.resolve(__dirname, '../config/sources.json')
    this.sources = null
  }

  /**
   * 加载数据源配置
   */
  async loadSources() {
    if (!this.sources) {
      try {
        this.sources = await readJSON(this.configPath)
      } catch (error) {
        console.error('加载数据源配置失败:', error.message)
        this.sources = this.getDefaultSources()
      }
    }
    return this.sources
  }

  /**
   * 获取默认数据源配置
   */
  getDefaultSources() {
    return {
      personSources: [
        {
          name: '百度百科',
          baseUrl: 'https://baike.baidu.com/item',
          enabled: true,
          rateLimit: 2000
        },
        {
          name: '维基百科',
          baseUrl: 'https://zh.wikipedia.org/wiki',
          enabled: true,
          rateLimit: 2000
        }
      ],
      eventSources: [
        {
          name: '百度百科',
          baseUrl: 'https://baike.baidu.com/item',
          enabled: true,
          rateLimit: 2000
        }
      ],
      imageSources: [
        {
          name: '百度百科图片',
          enabled: true
        },
        {
          name: '维基百科图片',
          enabled: true
        }
      ]
    }
  }

  /**
   * 获取启用的人物数据源
   */
  async getPersonSources() {
    const sources = await this.loadSources()
    const enabledSources = sources.personSources.filter(source => source.enabled)
    console.log(`启用的历史人物数据源:`, enabledSources.map(s => s.name))
    return enabledSources
  }

  /**
   * 获取启用的事件数据源
   */
  async getEventSources() {
    const sources = await this.loadSources()
    return sources.eventSources.filter(source => source.enabled)
  }

  /**
   * 获取启用的图片数据源
   */
  async getImageSources() {
    const sources = await this.loadSources()
    return sources.imageSources.filter(source => source.enabled)
  }

  /**
   * 根据名称获取数据源
   */
  async getSourceByName(type, name) {
    const sources = await this.loadSources()
    const sourceList = sources[`${type}Sources`] || []
    return sourceList.find(source => source.name === name)
  }

  /**
   * 更新数据源配置
   */
  async updateSource(type, name, updates) {
    const sources = await this.loadSources()
    const sourceList = sources[`${type}Sources`] || []
    const sourceIndex = sourceList.findIndex(source => source.name === name)

    if (sourceIndex !== -1) {
      sourceList[sourceIndex] = { ...sourceList[sourceIndex], ...updates }
      // 这里可以添加保存到文件的逻辑，如果需要的话
      console.log(`更新数据源: ${name}`, updates)
      return true
    }
    return false
  }
}

export const dataSourceManager = new DataSourceManager()
