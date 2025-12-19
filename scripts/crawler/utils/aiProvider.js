/**
 * AI 提供商统一接口
 * 支持 OpenAI 和 Kimi (Moonshot AI)
 */

import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

// AI 提供商类型
const AI_PROVIDER = {
  OPENAI: 'openai',
  KIMI: 'kimi', // Moonshot AI
}

// 获取当前使用的 AI 提供商
function getAIProvider() {
  if (process.env.KIMI_API_KEY) {
    return AI_PROVIDER.KIMI
  } else if (process.env.OPENAI_API_KEY) {
    return AI_PROVIDER.OPENAI
  }
  return null
}

// 初始化 AI 客户端
function initAIClient() {
  const provider = getAIProvider()
  
  if (!provider) {
    return null
  }

  if (provider === AI_PROVIDER.KIMI) {
    // Kimi (Moonshot AI) 使用 OpenAI 兼容接口
    // API 端点: https://api.moonshot.cn/v1
    return new OpenAI({
      apiKey: process.env.KIMI_API_KEY,
      baseURL: 'https://api.moonshot.cn/v1',
    })
  } else if (provider === AI_PROVIDER.OPENAI) {
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return null
}

// 获取模型名称
function getModel(provider) {
  if (provider === AI_PROVIDER.KIMI) {
    // Kimi 支持的模型：moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k
    // 图像功能需要使用支持视觉的模型，例如：moonshot-v1-8k-vision-preview
    const model = process.env.KIMI_MODEL || 'moonshot-v1-8k'
    // 如果不是图像模型且没有指定vision后缀，自动添加
    if (!model.includes('vision') && !model.includes('thinking')) {
      return `${model}-vision-preview`
    }
    return model
  } else if (provider === AI_PROVIDER.OPENAI) {
    // 对于OpenAI，使用GPT-4V模型（如果配置了的话）
    const model = process.env.OPENAI_MODEL || 'gpt-4-vision-preview'
    return model
  }
  return 'gpt-4-vision-preview'
}

// 创建 AI 客户端实例
let aiClient = null
let currentProvider = null

export function getAIClient() {
  if (!aiClient) {
    aiClient = initAIClient()
    currentProvider = getAIProvider()
  }
  return aiClient
}

export function getCurrentProvider() {
  if (!currentProvider) {
    currentProvider = getAIProvider()
  }
  return currentProvider
}

export function hasAIConfigured() {
  return !!getAIClient()
}

export function getModelName() {
  const provider = getCurrentProvider()
  return getModel(provider)
}

export function getProviderName() {
  const provider = getCurrentProvider()
  if (provider === AI_PROVIDER.KIMI) {
    return 'Kimi (Moonshot AI)'
  } else if (provider === AI_PROVIDER.OPENAI) {
    return 'OpenAI'
  }
  return '未配置'
}

// 统一的 API 调用方法
export async function callAI(messages, options = {}) {
  const client = getAIClient()
  if (!client) {
    throw new Error('AI 客户端未初始化，请配置 API Key')
  }

  const provider = getCurrentProvider()
  const model = getModelName()

  const defaultOptions = {
    model: model,
    temperature: options.temperature || 0.3,
    response_format: options.response_format || { type: 'json_object' },
  }

  const maxRetries = 3
  const retryDelay = 1000
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Kimi 和 OpenAI 都使用相同的接口
      const response = await client.chat.completions.create({
        messages: messages,
        ...defaultOptions,
        ...options,
      })
      
      return response
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt) // 指数退避
        console.warn(`AI API 调用失败 (尝试 ${attempt + 1}/${maxRetries}):`, error.message)
        console.warn(`将在 ${delay}ms 后重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        // 根据不同的错误类型提供友好的提示
        if (error.response?.status === 401) {
          console.error('AI API 认证失败: 请检查您的 API Key 是否正确配置')
          console.error('请在 .env 文件中设置 KIMI_API_KEY 或 OPENAI_API_KEY')
        } else if (error.response?.status === 429) {
          console.error('AI API 调用频率过高: 请稍后再试或考虑增加请求间隔')
        } else if (error.response?.status === 404) {
          console.error('AI API 模型不存在: 请检查您的模型配置是否正确')
        } else {
          console.error('AI API 调用失败:', error.message)
        }
        throw error
      }
    }
  }
}

export default {
  getAIClient,
  getCurrentProvider,
  hasAIConfigured,
  getModelName,
  getProviderName,
  callAI,
  AI_PROVIDER,
}

