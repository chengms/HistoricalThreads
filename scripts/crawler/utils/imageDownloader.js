/**
 * 图片下载工具
 * 支持从多个来源下载人物照片
 */

import axios from 'axios'
import fs from 'fs-extra'
import path from 'path'
import { ensureDir, sanitizeFileName, getFileExtension, sleep } from './helpers.js'

export class ImageDownloader {
  constructor(imagesDir) {
    this.imagesDir = imagesDir
    this.headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: 'https://www.baidu.com/',
    }
  }

  /**
   * 从百度百科下载图片
   */
  async downloadFromBaiduBaike(personName, imageUrl) {
    if (!imageUrl) return null

    try {
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : `https:${imageUrl}`
      const ext = getFileExtension(fullUrl)
      const fileName = `${sanitizeFileName(personName)}.${ext}`
      const filePath = path.join(this.imagesDir, fileName)

      // 检查文件是否已存在
      if (await fs.pathExists(filePath)) {
        console.log(`⏭️  图片已存在: ${fileName}`)
        return `/images/persons/${fileName}`
      }

      await ensureDir(this.imagesDir)
      const response = await axios({
        url: fullUrl,
        method: 'GET',
        responseType: 'stream',
        headers: this.headers,
        timeout: 30000,
      })

      const writer = fs.createWriteStream(filePath)
      response.data.pipe(writer)

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      console.log(`✅ 图片下载成功: ${fileName}`)
      return `/images/persons/${fileName}`
    } catch (error) {
      console.error(`❌ 图片下载失败: ${personName}`, error.message)
      return null
    }
  }

  /**
   * 从维基百科下载图片
   */
  async downloadFromWikipedia(personName, imageUrl) {
    if (!imageUrl) return null

    try {
      let fullUrl = imageUrl
      if (!imageUrl.startsWith('http')) {
        fullUrl = `https:${imageUrl}`
      }

      const ext = getFileExtension(fullUrl)
      const fileName = `${sanitizeFileName(personName)}.${ext}`
      const filePath = path.join(this.imagesDir, fileName)

      if (await fs.pathExists(filePath)) {
        console.log(`⏭️  图片已存在: ${fileName}`)
        return `/images/persons/${fileName}`
      }

      await ensureDir(this.imagesDir)
      const response = await axios({
        url: fullUrl,
        method: 'GET',
        responseType: 'stream',
        headers: this.headers,
        timeout: 30000,
      })

      const writer = fs.createWriteStream(filePath)
      response.data.pipe(writer)

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      console.log(`✅ 图片下载成功: ${fileName}`)
      return `/images/persons/${fileName}`
    } catch (error) {
      console.error(`❌ 图片下载失败: ${personName}`, error.message)
      return null
    }
  }

  /**
   * 智能搜索并下载图片
   */
  async searchAndDownload(personName, sources = ['baidu', 'wikipedia']) {
    for (const source of sources) {
      try {
        let imageUrl = null

        if (source === 'baidu') {
          imageUrl = await this.searchBaiduImage(personName)
        } else if (source === 'wikipedia') {
          imageUrl = await this.searchWikipediaImage(personName)
        }

        if (imageUrl) {
          const result = source === 'baidu'
            ? await this.downloadFromBaiduBaike(personName, imageUrl)
            : await this.downloadFromWikipedia(personName, imageUrl)

          if (result) {
            return result
          }
        }

        await sleep(1000) // 请求间隔
      } catch (error) {
        console.error(`从 ${source} 搜索图片失败:`, error.message)
      }
    }

    return null
  }

  /**
   * 从百度百科搜索图片
   */
  async searchBaiduImage(personName) {
    try {
      const url = `https://baike.baidu.com/item/${encodeURIComponent(personName)}`
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 10000,
      })

      const html = response.data
      const cheerio = (await import('cheerio')).default
      const $ = cheerio.load(html)

      // 尝试多个选择器
      const selectors = [
        '.summary-pic img',
        '.lemma-picture img',
        '.pic-item img',
        '.main-pic img',
      ]

      for (const selector of selectors) {
        const img = $(selector).first()
        const src = img.attr('src') || img.attr('data-src')
        if (src) {
          return src
        }
      }

      return null
    } catch (error) {
      console.error('搜索百度图片失败:', error.message)
      return null
    }
  }

  /**
   * 从维基百科搜索图片
   */
  async searchWikipediaImage(personName) {
    try {
      const url = `https://zh.wikipedia.org/wiki/${encodeURIComponent(personName)}`
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 10000,
      })

      const html = response.data
      const cheerio = (await import('cheerio')).default
      const $ = cheerio.load(html)

      const img = $('.infobox img, .thumbimage').first()
      const src = img.attr('src') || img.attr('data-src')
      if (src) {
        return src.startsWith('http') ? src : `https:${src}`
      }

      return null
    } catch (error) {
      console.error('搜索维基图片失败:', error.message)
      return null
    }
  }
}

