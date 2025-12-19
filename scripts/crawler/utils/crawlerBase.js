/**
 * 爬虫基础工具类
 */

import axios from 'axios'
import * as cheerio from 'cheerio'
import { sleep } from './helpers.js'
import dotenv from 'dotenv'

dotenv.config()

export class CrawlerBase {
  constructor(config = {}) {
    this.rateLimit = config.rateLimit || 2000 // 默认2秒间隔
    this.timeout = config.timeout || 10000
    this.maxRetries = config.maxRetries || 3 // 默认重试3次
    this.retryDelay = config.retryDelay || 1000 // 默认重试间隔1秒
    this.headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    }
    
    // 从环境变量获取代理配置
    this.proxyConfig = this.initProxyConfig()
  }

  /**
   * 初始化代理配置
   */
  initProxyConfig() {
    const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY
    if (proxyUrl) {
      console.log(`使用代理: ${proxyUrl}`)
      try {
        const url = new URL(proxyUrl)
        return {
          host: url.hostname,
          port: parseInt(url.port),
          protocol: url.protocol
        }
      } catch (error) {
        console.error('代理URL格式错误:', proxyUrl)
        return null
      }
    }
    return null
  }

  /**
   * 获取网页内容，支持重试和代理
   */
  async fetchPage(url) {
    let lastError = null
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await sleep(this.rateLimit)
        
        const axiosConfig = {
          headers: this.headers,
          timeout: this.timeout,
        }
        
        // 添加代理配置
        if (this.proxyConfig) {
          axiosConfig.proxy = this.proxyConfig
        }
        
        const response = await axios.get(url, axiosConfig)
        return response.data
      } catch (error) {
        lastError = error
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt) // 指数退避
          console.warn(`获取页面失败 (尝试 ${attempt + 1}/${this.maxRetries}): ${url}`, error.message)
          console.warn(`将在 ${delay}ms 后重试...`)
          await sleep(delay)
        } else {
          console.error(`获取页面失败 (已尝试 ${this.maxRetries} 次): ${url}`, error.message)
          if (error.response) {
            console.error(`响应状态码: ${error.response.status}`)
          }
        }
      }
    }
    
    return null
  }

  /**
   * 解析 HTML
   */
  parseHTML(html) {
    return cheerio.load(html)
  }

  /**
   * 提取文本内容
   */
  extractText($, selector) {
    return $(selector).text().trim()
  }

  /**
   * 提取属性
   */
  extractAttr($, selector, attr) {
    return $(selector).attr(attr) || ''
  }

  /**
   * 提取多个元素
   */
  extractList($, selector, extractor) {
    const items = []
    $(selector).each((i, elem) => {
      const item = extractor($(elem))
      if (item) items.push(item)
    })
    return items
  }
}

