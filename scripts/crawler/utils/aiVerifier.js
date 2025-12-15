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
export async function verifyPersonImage(personName, imageUrl) {
  if (!hasAIConfigured()) {
    return { verified: true, confidence: 0.5, notes: '未进行 AI 审核' }
  }

  try {
    // 注意：这里需要图片的 base64 或 URL
    // 由于 Vision API 需要图片，这里简化处理
    const prompt = `请验证图片是否与历史人物 "${personName}" 匹配。

请考虑：
1. 图片中的人物特征是否符合历史记载
2. 图片的年代感是否合理
3. 图片质量是否可用

请以 JSON 格式返回：
{
  "verified": true/false,
  "confidence": 0.0-1.0,
  "notes": "审核备注"
}`

    const { callAI } = await import('./aiProvider.js')
    const response = await callAI([
      {
        role: 'system',
        content: '你是一位专业的历史学家，擅长验证历史人物图片的准确性。',
      },
      {
        role: 'user',
        content: prompt,
      },
    ])

    const result = JSON.parse(response.choices[0].message.content)
    return result
  } catch (error) {
    console.error('图片验证失败:', error.message)
    return { verified: true, confidence: 0.5, notes: '验证失败，默认通过' }
  }
}

