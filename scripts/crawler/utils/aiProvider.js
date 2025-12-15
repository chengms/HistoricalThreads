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
    return process.env.KIMI_MODEL || 'moonshot-v1-8k'
  } else if (provider === AI_PROVIDER.OPENAI) {
    return process.env.OPENAI_MODEL || 'gpt-4'
  }
  return 'gpt-4'
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

  // Kimi 和 OpenAI 都使用相同的接口
  const response = await client.chat.completions.create({
    messages: messages,
    ...defaultOptions,
    ...options,
  })

  return response
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

