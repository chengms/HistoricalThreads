/**
 * 爬虫基础工具类
 */

import axios from 'axios'
import * as cheerio from 'cheerio'
import { sleep } from './helpers.js'

export class CrawlerBase {
  constructor(config = {}) {
    this.rateLimit = config.rateLimit || 2000 // 默认2秒间隔
    this.timeout = config.timeout || 10000
    this.headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    }
  }

  /**
   * 获取网页内容
   */
  async fetchPage(url) {
    try {
      await sleep(this.rateLimit)
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: this.timeout,
      })
      return response.data
    } catch (error) {
      console.error(`获取页面失败: ${url}`, error.message)
      return null
    }
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

