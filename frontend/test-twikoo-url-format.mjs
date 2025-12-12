// 测试不同的 url 格式
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
console.log('测试不同的 url 格式...\n')

// 测试不同的 url 格式
const urlFormats = [
  { name: '完整 URL', url: 'https://example.com/suggestion' },
  { name: '带协议和域名', url: 'http://localhost:3000/suggestion' },
  { name: '相对路径（带前导斜杠）', url: '/suggestion' },
  { name: '相对路径（不带前导斜杠）', url: 'suggestion' },
  { name: '根路径', url: '/' },
  { name: '空字符串', url: '' },
  { name: 'null', url: null },
  { name: 'undefined（不包含字段）', url: undefined },
]

async function testUrlFormat(name, url) {
  const testData = {
    event: 'COMMENT_SUBMIT',
    comment: {
      nick: '测试用户',
      mail: 'test@example.com',
      link: '',
      comment: `测试 url 格式: ${name}`,
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      pid: '',
      rid: '',
      created: Date.now(),
    }
  }
  
  // 如果 url 不是 undefined，添加到 comment 对象中
  if (url !== undefined) {
    testData.comment.url = url
  }
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    })
    
    const result = await response.json()
    console.log(`📝 ${name}:`)
    console.log(`  url: ${url === undefined ? '(未包含)' : JSON.stringify(url)}`)
    console.log(`  状态: ${response.status}`)
    console.log(`  响应: ${JSON.stringify(result)}`)
    
    if (result.errno === 0 || result.code === 0) {
      console.log(`  ✅ 成功！`)
      return true
    } else if (result.code === 1000 && result.message.includes('url')) {
      console.log(`  ❌ url 格式不正确`)
    } else {
      console.log(`  ⚠️ ${result.message || result.code}`)
    }
    console.log()
    return false
  } catch (error) {
    console.log(`  ❌ 请求失败: ${error.message}\n`)
    return false
  }
}

// 运行所有测试
async function runTests() {
  for (const format of urlFormats) {
    const success = await testUrlFormat(format.name, format.url)
    if (success) {
      console.log(`\n✅ 找到正确的 url 格式: ${format.name} = ${format.url}`)
      break
    }
    // 稍微延迟，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('='.repeat(60))
  console.log('测试完成！')
}

runTests().catch(console.error)

