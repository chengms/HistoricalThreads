// 测试官方文档中的格式
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
console.log('测试官方文档格式（comment 为字符串，参数在顶层）\n')

// 测试格式：comment 为字符串，其他参数在顶层
const testData = {
  event: 'COMMENT_SUBMIT',
  comment: '## 测试建议\n\n这是测试评论内容。',
  nick: '测试用户',
  mail: 'test@example.com',
  link: '',
  url: '/suggestion',
  ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  ip: '127.0.0.1',
  master: false,
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
    console.log('\n✅ API 测试成功！这是正确的格式！')
    console.log('\n正确的格式是:')
    console.log('- event: "COMMENT_SUBMIT"')
    console.log('- comment: 字符串（不是对象）')
    console.log('- 其他参数（nick, mail, url, ua 等）在顶层')
  } else {
    console.log('\n⚠️ API 返回了错误:')
    console.log('  - code:', result.code)
    console.log('  - message:', result.message)
    
    if (result.code === 1001) {
      console.log('\n💡 提示: 需要更新 Twikoo 云函数至最新版本')
    } else if (result.code === 1000) {
      console.log('\n💡 提示: 参数格式可能还需要调整')
    }
  }
} catch (error) {
  console.log('\n❌ 请求失败:', error.message)
}

