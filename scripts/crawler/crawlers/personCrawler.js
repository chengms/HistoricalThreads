/**
 * 历史人物爬虫
 */

import { CrawlerBase } from '../utils/crawlerBase.js'
import { verifyPerson } from '../utils/aiVerifier.js'
import { saveJSON, readJSON, downloadFile, sanitizeFileName, getFileExtension } from '../utils/helpers.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class PersonCrawler extends CrawlerBase {
  constructor() {
    super({ rateLimit: 2000 })
    this.outputDir = path.resolve(__dirname, '../../../frontend/public/data')
    this.imagesDir = path.resolve(__dirname, '../../../frontend/public/images/persons')
  }

  /**
   * 从百度百科爬取人物信息
   */
  async crawlFromBaiduBaike(personName) {
    const url = `https://baike.baidu.com/item/${encodeURIComponent(personName)}`
    const html = await this.fetchPage(url)
    if (!html) return null

    const $ = this.parseHTML(html)
    const person = {
      name: personName,
      nameVariants: [],
      birthYear: null,
      deathYear: null,
      dynasty: null,
      description: '',
      avatarUrl: null,
    }

    // 提取基本信息
    const basicInfo = {}
    $('.basic-info .name-value').each((i, elem) => {
      const key = $(elem).prev('.name').text().trim()
      const value = $(elem).text().trim()
      basicInfo[key] = value
    })

    // 提取生卒年份
    if (basicInfo['出生日期'] || basicInfo['出生年']) {
      const birth = basicInfo['出生日期'] || basicInfo['出生年']
      const birthMatch = birth.match(/(\d+)/)
      if (birthMatch) {
        person.birthYear = parseInt(birthMatch[1])
        if (birth.includes('前') || birth.includes('BC')) {
          person.birthYear = -person.birthYear
        }
      }
    }

    if (basicInfo['逝世日期'] || basicInfo['逝世年']) {
      const death = basicInfo['逝世日期'] || basicInfo['逝世年']
      const deathMatch = death.match(/(\d+)/)
      if (deathMatch) {
        person.deathYear = parseInt(deathMatch[1])
        if (death.includes('前') || death.includes('BC')) {
          person.deathYear = -person.deathYear
        }
      }
    }

    // 提取朝代
    if (basicInfo['所处时代'] || basicInfo['朝代']) {
      person.dynasty = basicInfo['所处时代'] || basicInfo['朝代']
    }

    // 提取简介
    const summary = $('.lemma-summary').text().trim()
    if (summary) {
      person.description = summary
    }

    // 提取图片
    const imageUrl = $('.summary-pic img').attr('src') || $('.lemma-picture img').attr('src')
    if (imageUrl) {
      const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `https:${imageUrl}`
      const fileName = `${sanitizeFileName(personName)}.${getFileExtension(fullImageUrl)}`
      const imagePath = path.join(this.imagesDir, fileName)
      
      if (await downloadFile(fullImageUrl, imagePath)) {
        person.avatarUrl = `/images/persons/${fileName}`
      }
    }

    return person
  }

  /**
   * 从维基百科爬取人物信息
   */
  async crawlFromWikipedia(personName) {
    const url = `https://zh.wikipedia.org/wiki/${encodeURIComponent(personName)}`
    const html = await this.fetchPage(url)
    if (!html) return null

    const $ = this.parseHTML(html)
    const person = {
      name: personName,
      nameVariants: [],
      birthYear: null,
      deathYear: null,
      dynasty: null,
      description: '',
      avatarUrl: null,
    }

    // 提取简介
    const summary = $('#mw-content-text .mw-parser-output > p').first().text().trim()
    if (summary) {
      person.description = summary
    }

    // 提取信息框
    $('.infobox tr').each((i, elem) => {
      const label = $(elem).find('th').text().trim()
      const value = $(elem).find('td').text().trim()

      if (label.includes('出生') && value) {
        const match = value.match(/(\d+)/)
        if (match) {
          person.birthYear = parseInt(match[1])
        }
      }

      if (label.includes('逝世') && value) {
        const match = value.match(/(\d+)/)
        if (match) {
          person.deathYear = parseInt(match[1])
        }
      }
    })

    // 提取图片
    const imageUrl = $('.infobox img').first().attr('src')
    if (imageUrl) {
      const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `https:${imageUrl}`
      const fileName = `${sanitizeFileName(personName)}.${getFileExtension(fullImageUrl)}`
      const imagePath = path.join(this.imagesDir, fileName)
      
      if (await downloadFile(fullImageUrl, imagePath)) {
        person.avatarUrl = `/images/persons/${fileName}`
      }
    }

    return person
  }

  /**
   * 爬取人物信息
   */
  async crawlPerson(personName, sources = ['baidu', 'wikipedia']) {
    console.log(`\n📥 开始爬取人物: ${personName}`)

    let personData = null

    // 尝试从多个源爬取
    for (const source of sources) {
      try {
        if (source === 'baidu') {
          personData = await this.crawlFromBaiduBaike(personName)
        } else if (source === 'wikipedia') {
          personData = await this.crawlFromWikipedia(personName)
        }

        if (personData && personData.description) {
          console.log(`✅ 从 ${source} 成功获取数据`)
          break
        }
      } catch (error) {
        console.error(`❌ 从 ${source} 爬取失败:`, error.message)
      }
    }

    if (!personData || !personData.description) {
      console.error(`❌ 无法获取 ${personName} 的信息`)
      return null
    }

    // AI 审核
    console.log(`🤖 开始 AI 审核...`)
    const verification = await verifyPerson(personData)
    
    if (!verification.verified) {
      console.warn(`⚠️  AI 审核未通过:`, verification.issues)
      if (verification.confidence < 0.5) {
        console.error(`❌ 置信度过低，跳过此人物`)
        return null
      }
    } else {
      console.log(`✅ AI 审核通过 (置信度: ${verification.confidence})`)
    }

    personData.verification = verification
    return personData
  }

  /**
   * 批量爬取
   */
  async crawlPersons(personNames) {
    const persons = await readJSON(path.join(this.outputDir, 'persons.json'))
    const existingNames = new Set(persons.map(p => p.name))

    const results = []
    for (const name of personNames) {
      if (existingNames.has(name)) {
        console.log(`⏭️  跳过已存在的人物: ${name}`)
        continue
      }

      const person = await this.crawlPerson(name)
      if (person) {
        results.push(person)
      }
    }

    // 合并并保存
    if (results.length > 0) {
      const allPersons = [...persons, ...results]
      // 分配 ID
      allPersons.forEach((p, i) => {
        if (!p.id) p.id = i + 1
      })
      await saveJSON(path.join(this.outputDir, 'persons.json'), allPersons)
      console.log(`\n✅ 成功保存 ${results.length} 个人物信息`)
    }

    return results
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  const crawler = new PersonCrawler()
  const names = process.argv.slice(2)
  
  if (names.length === 0) {
    console.log('使用方法: node personCrawler.js <人物名称1> <人物名称2> ...')
    process.exit(1)
  }

  crawler.crawlPersons(names).then(() => {
    console.log('\n✅ 爬取完成')
    process.exit(0)
  }).catch(error => {
    console.error('❌ 爬取失败:', error)
    process.exit(1)
  })
}

export default PersonCrawler

