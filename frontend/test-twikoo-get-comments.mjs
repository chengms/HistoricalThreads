// 测试获取 Twikoo 评论列表
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 读取 .env 文件
const envPath = join(__dirname, '.env')
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

const envId = envVars.VITE_TWIKOO_ENV_ID || ''
const apiUrl = envId

console.log('📡 API URL:', apiUrl)
console.log('='.repeat(60))
console.log('测试获取评论列表...\n')

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
    name: 'GET_COMMENTS',
    data: {
      event: 'GET_COMMENTS',
      url: '/suggestion',
      pageSize: 10,
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
        console.log(`   获取到 ${Array.isArray(result.data) ? result.data.length : 'N/A'} 条评论`)
      }
      return true
    } else {
      console.log(`❌ ${name} 失败: ${result.message || result.code}`)
    }
    console.log()
    return false
  } catch (error) {
    console.log(`❌ ${name} 请求失败: ${error.message}\n`)
    return false
  }
}

// 运行所有测试
async function runTests() {
  for (const testCase of testCases) {
    await testGetComments(testCase.name, testCase.data)
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('='.repeat(60))
  console.log('测试完成！')
}

runTests().catch(console.error)

