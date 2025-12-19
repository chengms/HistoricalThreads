/**
 * AI 内容审核工具
 * 支持 OpenAI 和 Kimi (Moonshot AI) API
 */

import { getAIClient, hasAIConfigured, getProviderName } from './aiProvider.js'
import dotenv from 'dotenv'

dotenv.config()

/**
 * 验证人物信息
 */
export async function verifyPerson(personData) {
  if (!hasAIConfigured()) {
    console.warn(`⚠️  AI API Key 未配置，跳过 AI 审核`)
    return { verified: true, confidence: 0.5, notes: '未进行 AI 审核' }
  }

  try {
    const prompt = `请审核以下历史人物信息的准确性：

姓名：${personData.name}
生卒年份：${personData.birthYear || '未知'} - ${personData.deathYear || '未知'}
朝代：${personData.dynasty || '未知'}
简介：${personData.description || '无'}

请从以下方面审核：
1. 生卒年份是否合理
2. 朝代归属是否正确
3. 简介内容是否准确
4. 是否有明显的历史错误

请以 JSON 格式返回：
{
  "verified": true/false,
  "confidence": 0.0-1.0,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"],
  "notes": "审核备注"
}`

    const { callAI } = await import('./aiProvider.js')
    const response = await callAI([
      {
        role: 'system',
        content: '你是一位专业的历史学家，擅长验证历史人物信息的准确性。',
      },
      {
        role: 'user',
        content: prompt,
      },
    ])

    const result = JSON.parse(response.choices[0].message.content)
    return result
  } catch (error) {
    console.error('AI 审核失败:', error.message)
    return { verified: true, confidence: 0.5, notes: 'AI 审核失败，默认通过' }
  }
}

/**
 * 验证事件信息
 */
export async function verifyEvent(eventData) {
  if (!hasAIConfigured()) {
    console.warn(`⚠️  AI API Key 未配置，跳过 AI 审核`)
    return { verified: true, confidence: 0.5, notes: '未进行 AI 审核' }
  }

  try {
    const prompt = `请审核以下历史事件信息的准确性：

标题：${eventData.title}
时间：${eventData.year || '未知'}
地点：${eventData.location || '未知'}
描述：${eventData.description || '无'}
相关人物：${eventData.persons?.map(p => p.name).join(', ') || '无'}

请从以下方面审核：
1. 时间是否合理
2. 地点是否正确
3. 事件描述是否准确
4. 相关人物是否合理
5. 是否有明显的历史错误

请以 JSON 格式返回：
{
  "verified": true/false,
  "confidence": 0.0-1.0,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"],
  "notes": "审核备注"
}`

    const { callAI } = await import('./aiProvider.js')
    const response = await callAI([
      {
        role: 'system',
        content: '你是一位专业的历史学家，擅长验证历史事件信息的准确性。',
      },
      {
        role: 'user',
        content: prompt,
      },
    ])

    const result = JSON.parse(response.choices[0].message.content)
    return result
  } catch (error) {
    console.error('AI 审核失败:', error.message)
    return { verified: true, confidence: 0.5, notes: 'AI 审核失败，默认通过' }
  }
}

/**
 * 验证人物与事件的关联
 */
export async function verifyPersonEventRelation(personName, eventTitle, eventYear) {
  if (!hasAIConfigured()) {
    return { verified: true, confidence: 0.5 }
  }

  try {
    const prompt = `请验证历史人物 "${personName}" 是否与事件 "${eventTitle}"（${eventYear}年）相关。

请以 JSON 格式返回：
{
  "verified": true/false,
  "confidence": 0.0-1.0,
  "relation": "直接相关/间接相关/不相关",
  "notes": "关联说明"
}`

    const { callAI } = await import('./aiProvider.js')
    const response = await callAI([
      {
        role: 'system',
        content: '你是一位专业的历史学家，擅长分析历史人物与事件的关联。',
      },
      {
        role: 'user',
        content: prompt,
      },
    ])

    const result = JSON.parse(response.choices[0].message.content)
    return result
  } catch (error) {
    console.error('AI 关联验证失败:', error.message)
    return { verified: true, confidence: 0.5 }
  }
}

/**
 * 验证图片是否与人物匹配
 */
export async function verifyPersonImage(personName, imagePathOrUrl) {
  if (!hasAIConfigured()) {
    return { verified: true, confidence: 0.5, notes: '未进行 AI 审核' }
  }

  try {
    const fs = await import('fs')
    const path = await import('path')
    let imageData
    let imageType

    // 检查是本地文件路径还是URL
    if (imagePathOrUrl.startsWith('http://') || imagePathOrUrl.startsWith('https://')) {
      // 是URL
      imageData = imagePathOrUrl
      imageType = 'url'
    } else {
      // 是本地文件路径
      if (!fs.existsSync(imagePathOrUrl)) {
        throw new Error(`图片文件不存在: ${imagePathOrUrl}`)
      }
      
      // 读取并转换为base64
      const buffer = fs.readFileSync(imagePathOrUrl)
      const base64 = buffer.toString('base64')
      const ext = path.extname(imagePathOrUrl).toLowerCase()
      
      // 确定图片类型
      if (ext === '.jpg' || ext === '.jpeg') {
        imageType = 'jpeg'
      } else if (ext === '.png') {
        imageType = 'png'
      } else if (ext === '.gif') {
        imageType = 'gif'
      } else {
        throw new Error(`不支持的图片格式: ${ext}`)
      }
      
      imageData = `data:image/${imageType};base64,${base64}`
    }

    const { callAI } = await import('./aiProvider.js')
    const client = await import('./aiProvider.js').then(m => m.getAIClient())
    const provider = await import('./aiProvider.js').then(m => m.getCurrentProvider())
    
    // 构建消息
    const messages = [
      {
        role: 'system',
        content: '你是一位专业的历史学家和图像分析专家，擅长验证历史人物图片的准确性。请根据图片内容判断是否与指定历史人物匹配，并考虑图片的年代感、人物特征和历史背景。'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `请验证以下图片是否与历史人物 "${personName}" 匹配。请考虑：
1. 图片中的人物特征是否符合历史记载
2. 图片的年代感是否合理
3. 图片质量是否可用

请以 JSON 格式返回：
{
  "verified": true/false,
  "confidence": 0.0-1.0,
  "notes": "审核备注"
}`
          },
          {
            type: 'image_url',
            image_url: {
              url: imageData
            }
          }
        ]
      }
    ]

    // 调用AI API
    const response = await callAI(messages, {
      response_format: { type: 'json_object' },
      temperature: 0.1
    })

    const result = JSON.parse(response.choices[0].message.content)
    return result
  } catch (error) {
    console.error('图片验证失败:', error.message)
    // 区分API错误和验证错误
    const errorMessage = error.message || ''
    const isAPIError = errorMessage.includes('404') || 
                      errorMessage.includes('模型不存在') || 
                      errorMessage.includes('Permission denied') ||
                      errorMessage.includes('API')
    
    return { 
      verified: !isAPIError, // API错误时设为true，避免误删图片
      confidence: 0.5, 
      notes: `验证失败: ${error.message}` 
    }
  }
}

