/**
 * Twikoo API 测试脚本
 * 
 * 用途：测试 Twikoo API 提交评论功能
 * 
 * 使用方法：
 *   cd frontend
 *   node tests/twikoo/test-api.mjs
 * 
 * 前置条件：
 *   - 在 frontend/.env 文件中配置 VITE_TWIKOO_ENV_ID
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 读取 .env 文件
function loadEnv() {
  const envPath = join(__dirname, '../../.env')
  try {
    const envContent = readFileSync(envPath, 'utf-8')
    const envVars = {}
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        }
      }
    })
    return envVars
  } catch (error) {
    console.error('❌ 无法读取 .env 文件:', error.message)
    return {}
  }
}

const envVars = loadEnv()
const envId = envVars.VITE_TWIKOO_ENV_ID || ''

if (!envId) {
  console.error('❌ VITE_TWIKOO_ENV_ID 未在 .env 文件中找到')
  console.error('   请在 frontend/.env 文件中设置 VITE_TWIKOO_ENV_ID')
  process.exit(1)
}

console.log('🧪 Twikoo API 测试')
console.log('='.repeat(60))
console.log(`✅ 找到 Twikoo Env ID: ${envId}`)

// 确定 API URL
let apiUrl = envId
if (envId.includes('netlify.app')) {
  if (envId.includes('/.netlify/functions/')) {
    apiUrl = envId
  } else {
    apiUrl = envId.replace(/\/$/, '') + '/.netlify/functions/twikoo'
  }
} else if (envId.includes('vercel.app')) {
  if (envId.endsWith('/api')) {
    apiUrl = envId
  } else {
    apiUrl = envId.replace(/\/$/, '') + '/api'
  }
} else {
  apiUrl = envId.replace(/\/$/, '') + '/api'
}

console.log(`📡 API URL: ${apiUrl}\n`)

// 测试数据
const testComment = {
  event: 'COMMENT_SUBMIT',
  comment: '## 测试评论\n\n这是一个测试评论内容。',
  nick: '测试用户',
  mail: 'test@example.com',
  link: '',
  url: '/test',
  ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  ip: '',
  master: false,
}

console.log('📤 发送测试请求...')
console.log('请求数据:', JSON.stringify(testComment, null, 2))
console.log()

// 发送请求
try {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testComment),
  })

  console.log('📥 响应状态:', response.status, response.statusText)
  
  const result = await response.json()
  console.log('📥 响应内容:', JSON.stringify(result, null, 2))
  
  if (response.ok && (result.id && result.accessToken || result.errno === 0 || result.code === 0)) {
    console.log('\n✅ Twikoo API 测试成功！评论已提交。')
    process.exit(0)
  } else {
    console.log('\n❌ Twikoo API 测试失败:')
    console.log('   code:', result.code)
    console.log('   message:', result.message)
    if (result.code === 1001) {
      console.log('\n💡 提示: 需要更新 Twikoo 云函数至最新版本')
    }
    process.exit(1)
  }
} catch (error) {
  console.error('\n❌ 请求失败:', error.message)
  process.exit(1)
}
