/**
 * 自动发现历史人物和事件
 * 使用 AI 和关键词搜索来自动发现需要爬取的内容
 * 支持 OpenAI 和 Kimi (Moonshot AI)
 */

import { hasAIConfigured, callAI, getProviderName } from './aiProvider.js'
import { CrawlerBase } from './crawlerBase.js'
import { sleep } from './helpers.js'
import dotenv from 'dotenv'

dotenv.config()

export class AutoDiscover extends CrawlerBase {
  constructor() {
    super({ rateLimit: 2000 })
  }

  /**
   * 使用 AI 生成历史人物列表
   */
  async discoverPersonsByDynasty(dynastyName, count = 10) {
    if (!hasAIConfigured()) {
      console.warn(`⚠️  AI API Key 未配置，使用默认人物列表`)
      return this.getDefaultPersons(dynastyName)
    }

    try {
      const prompt = `请列出 ${dynastyName} 时期最重要的 ${count} 位历史人物，包括：
1. 政治人物（皇帝、大臣等）
2. 军事人物（将领、统帅等）
3. 文化人物（文学家、思想家等）
4. 其他重要人物

请以 JSON 对象格式返回，包含一个 "persons" 数组，每个对象包含：
{
  "name": "人物姓名",
  "type": "politician/military/cultural/other",
  "importance": "high/medium/low"
}

只返回 JSON 对象，不要其他文字。`

      const response = await callAI([
        {
          role: 'system',
          content: '你是一位专业的历史学家，擅长整理历史人物信息。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ])

      const content = response.choices[0].message.content
      try {
        const result = typeof content === 'string' ? JSON.parse(content) : content
        // 处理不同的响应格式
        if (Array.isArray(result)) {
          return result
        } else if (result.persons) {
          return result.persons
        } else if (result.list) {
          return result.list
        } else if (result.data) {
          return result.data
        }
        console.warn('AI 返回的数据格式不符合预期，使用默认列表')
        return this.getDefaultPersons(dynastyName)
      } catch (jsonError) {
        console.error('解析 AI 返回的 JSON 数据失败:', jsonError.message)
        console.error('AI 返回的原始内容:', content.substring(0, 200) + '...') // 只显示前200个字符
        console.warn('使用默认人物列表')
        return this.getDefaultPersons(dynastyName)
      }
    } catch (error) {
      console.error('AI 发现人物失败:', error.message)
      return this.getDefaultPersons(dynastyName)
    }
  }

  /**
   * 使用 AI 生成历史事件列表
   */
  async discoverEventsByDynasty(dynastyName, count = 10) {
    if (!hasAIConfigured()) {
      console.warn(`⚠️  AI API Key 未配置，使用默认事件列表`)
      return this.getDefaultEvents(dynastyName)
    }

    try {
      const prompt = `请列出 ${dynastyName} 时期最重要的 ${count} 个历史事件，包括：
1. 政治事件（建立、改革、政变等）
2. 军事事件（战争、战役等）
3. 文化事件（文化交流、重要著作等）
4. 经济事件（贸易、建设等）

请以 JSON 对象格式返回，包含一个 "events" 数组，每个对象包含：
{
  "title": "事件标题",
  "type": "political/military/cultural/economic",
  "importance": "high/medium/low",
  "estimatedYear": 年份（数字）
}

只返回 JSON 对象，不要其他文字。`

      const response = await callAI([
        {
          role: 'system',
          content: '你是一位专业的历史学家，擅长整理历史事件信息。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ])

      const content = response.choices[0].message.content
      try {
        const result = typeof content === 'string' ? JSON.parse(content) : content
        // 处理不同的响应格式
        if (Array.isArray(result)) {
          return result
        } else if (result.events) {
          return result.events
        } else if (result.list) {
          return result.list
        } else if (result.data) {
          return result.data
        }
        console.warn('AI 返回的数据格式不符合预期，使用默认列表')
        return this.getDefaultEvents(dynastyName)
      } catch (jsonError) {
        console.error('解析 AI 返回的 JSON 数据失败:', jsonError.message)
        console.error('AI 返回的原始内容:', content.substring(0, 200) + '...') // 只显示前200个字符
        console.warn('使用默认事件列表')
        return this.getDefaultEvents(dynastyName)
      }
    } catch (error) {
      console.error('AI 发现事件失败:', error.message)
      return this.getDefaultEvents(dynastyName)
    }
  }

  /**
   * 从百度百科搜索页面发现相关人物
   */
  async discoverPersonsFromSearch(keyword) {
    const url = `https://baike.baidu.com/search?word=${encodeURIComponent(keyword)}`
    const html = await this.fetchPage(url)
    if (!html) return []

    const $ = this.parseHTML(html)
    const persons = []

    // 提取搜索结果中的人物链接
    $('.search-result a').each((i, elem) => {
      const text = $(elem).text().trim()
      const href = $(elem).attr('href')
      if (href && href.includes('/item/')) {
        const name = text.split('_')[0] // 移除后缀
        if (name && name.length > 1 && name.length < 10) {
          persons.push(name)
        }
      }
    })

    return [...new Set(persons)].slice(0, 20) // 去重并限制数量
  }

  /**
   * 从百度百科分类页面发现人物
   */
  async discoverPersonsFromCategory(categoryUrl) {
    const html = await this.fetchPage(categoryUrl)
    if (!html) return []

    const $ = this.parseHTML(html)
    const persons = []

    // 提取分类页面中的人物链接
    $('.category-item a, .polysemant-list a').each((i, elem) => {
      const text = $(elem).text().trim()
      const href = $(elem).attr('href')
      if (href && href.includes('/item/')) {
        persons.push(text)
      }
    })

    return [...new Set(persons)].slice(0, 50)
  }

  /**
   * 默认人物列表（当 AI 不可用时）
   */
  getDefaultPersons(dynastyName) {
    const defaultPersons = {
      汉朝: ['汉武帝', '汉高祖', '张骞', '司马迁', '霍去病', '卫青', '班固', '蔡伦'],
      唐朝: ['唐太宗', '唐玄宗', '李白', '杜甫', '白居易', '武则天', '玄奘', '鉴真'],
      宋朝: ['宋太祖', '宋太宗', '苏轼', '王安石', '岳飞', '文天祥', '司马光', '朱熹'],
      明朝: ['明太祖', '明成祖', '郑和', '王阳明', '徐光启', '李时珍', '戚继光', '张居正'],
      清朝: ['康熙', '雍正', '乾隆', '林则徐', '曾国藩', '李鸿章', '康有为', '梁启超'],
    }

    return (defaultPersons[dynastyName] || []).map(name => ({
      name,
      type: 'politician',
      importance: 'high',
    }))
  }

  /**
   * 默认事件列表（当 AI 不可用时）
   */
  getDefaultEvents(dynastyName) {
    const defaultEvents = {
      汉朝: [
        { title: '汉朝建立', type: 'political', estimatedYear: -202 },
        { title: '张骞出使西域', type: 'cultural', estimatedYear: -138 },
        { title: '汉武帝北伐匈奴', type: 'military', estimatedYear: -133 },
      ],
      唐朝: [
        { title: '唐朝建立', type: 'political', estimatedYear: 618 },
        { title: '贞观之治', type: 'political', estimatedYear: 627 },
        { title: '安史之乱', type: 'military', estimatedYear: 755 },
      ],
      宋朝: [
        { title: '宋朝建立', type: 'political', estimatedYear: 960 },
        { title: '王安石变法', type: 'political', estimatedYear: 1069 },
        { title: '靖康之耻', type: 'military', estimatedYear: 1127 },
      ],
    }

    return defaultEvents[dynastyName] || []
  }
}

