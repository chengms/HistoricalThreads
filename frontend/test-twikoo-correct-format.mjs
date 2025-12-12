// 测试正确的 Twikoo API 格式
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
console.log('📋 Twikoo 版本: 1.6.44\n')
console.log('='.repeat(60))

// 测试正确的格式：event: COMMENT_SUBMIT, comment 作为嵌套对象
async function testCorrectFormat() {
  console.log('📝 测试正确格式: event: COMMENT_SUBMIT, comment 嵌套')
  const testData = {
    event: 'COMMENT_SUBMIT',
    comment: {
      nick: '测试用户',
      mail: 'test@example.com',
      link: '',
      comment: '## 测试建议\n\n这是正确格式的测试内容。',
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      url: '/suggestion',
      pid: '',
      rid: '',
      created: Date.now(),
    }
  }
  
  console.log('请求数据:', JSON.stringify(testData, null, 2))
  console.log()
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    })
    
    const result = await response.json()
    console.log('📥 响应状态:', response.status, response.statusText)
    console.log('📥 响应内容:', JSON.stringify(result, null, 2))
    
    if (result.errno === 0 || result.code === 0) {
      console.log('\n✅ API 测试成功！评论已提交。')
      return true
    } else {
      console.log('\n⚠️ API 返回了错误:')
      console.log('  - code:', result.code)
      console.log('  - message:', result.message)
      if (result.code === 1001) {
        console.log('\n💡 提示: 需要更新 Twikoo 云函数至最新版本')
      }
      return false
    }
  } catch (error) {
    console.log('\n❌ 请求失败:', error.message)
    return false
  }
}

// 测试其他可能的 event 名称
async function testOtherEvents() {
  const events = ['COMMENT', 'COMMENT_SUBMIT', 'SUBMIT', 'POST_COMMENT']
  
  for (const event of events) {
    console.log(`\n📝 测试 event: ${event}`)
    const testData = {
      event: event,
      comment: {
        nick: '测试用户',
        mail: 'test@example.com',
        link: '',
        comment: `测试 ${event} 事件`,
        ua: 'Mozilla/5.0',
        url: '/suggestion',
        pid: '',
        rid: '',
        created: Date.now(),
      }
    }
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      })
      
      const result = await response.json()
      console.log(`  状态: ${response.status}`)
      console.log(`  响应: ${JSON.stringify(result)}`)
      
      if (result.errno === 0 || result.code === 0) {
        console.log(`  ✅ ${event} 格式正确！`)
        break
      } else if (result.code === 1001) {
        console.log(`  ⚠️ ${event} 返回 code 1001 (需要更新版本)`)
      } else {
        console.log(`  ❌ ${event} 返回错误: ${result.message || result.code}`)
      }
    } catch (error) {
      console.log(`  ❌ ${event} 请求失败: ${error.message}`)
    }
  }
}

// 运行测试
async function runTests() {
  console.log('开始测试正确的 API 格式...\n')
  
  const success = await testCorrectFormat()
  
  if (!success) {
    console.log('\n' + '='.repeat(60))
    console.log('测试其他可能的 event 名称...')
    await testOtherEvents()
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('测试完成！')
}

runTests().catch(console.error)

