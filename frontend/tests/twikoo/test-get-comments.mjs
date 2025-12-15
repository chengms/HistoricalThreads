/**
 * Twikoo 获取评论列表测试脚本
 * 
 * 用途：测试 Twikoo API 获取评论列表功能
 * 
 * 使用方法：
 *   cd frontend
 *   node tests/twikoo/test-get-comments.mjs
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

console.log('🧪 Twikoo 获取评论列表测试')
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

// 测试不同的获取评论方式
const testCases = [
  {
    name: 'GET_RECENT_COMMENTS',
    data: {
      event: 'GET_RECENT_COMMENTS',
      pageSize: 10,
      includeReply: false,
    }
  },
  {
    name: 'GET_COMMENTS_COUNT',
    data: {
      event: 'GET_COMMENTS_COUNT',
      urls: ['/suggestion'],
    }
  },
]

async function testGetComments(name, data) {
  console.log(`📝 测试: ${name}`)
  console.log('请求数据:', JSON.stringify(data, null, 2))
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    const result = await response.json()
    console.log('响应状态:', response.status)
    console.log('响应内容:', JSON.stringify(result, null, 2))
    
    if (result.errno === 0 || result.code === 0 || result.data) {
      console.log(`✅ ${name} 成功！`)
      if (result.data) {
        const count = Array.isArray(result.data) ? result.data.length : 'N/A'
        console.log(`   获取到 ${count} 条数据`)
      }
      return true
    } else {
      console.log(`❌ ${name} 失败: ${result.message || result.code}`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${name} 请求失败: ${error.message}`)
    return false
  }
}

// 运行所有测试
async function runTests() {
  let successCount = 0
  for (const testCase of testCases) {
    const success = await testGetComments(testCase.name, testCase.data)
    if (success) successCount++
    console.log()
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('='.repeat(60))
  if (successCount === testCases.length) {
    console.log('✅ 所有测试通过！')
    process.exit(0)
  } else {
    console.log(`⚠️  ${successCount}/${testCases.length} 个测试通过`)
    process.exit(1)
  }
}

runTests().catch(error => {
  console.error('运行测试时发生错误:', error)
  process.exit(1)
})
