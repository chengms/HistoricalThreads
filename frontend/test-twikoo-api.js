// 测试 Twikoo API
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 读取 .env 文件
try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf-8')
  const envVars = {}
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    }
  })
  
  const envId = envVars.VITE_TWIKOO_ENV_ID || ''
  
  if (!envId) {
    console.error('❌ VITE_TWIKOO_ENV_ID 未在 .env 文件中找到')
    process.exit(1)
  }
  
  console.log('✅ 找到 Twikoo Env ID:', envId)
  
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
  
  console.log('📡 API URL:', apiUrl)
  
  // 测试数据
  const testComment = {
    event: 'COMMENT',
    nick: '测试用户',
    mail: 'test@example.com',
    link: '',
    comment: '## 测试建议\n\n这是一个测试建议内容。',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    url: '/suggestion',
    pid: '',
    rid: '',
    created: Date.now(),
  }
  
  console.log('\n📤 发送测试请求...')
  console.log('请求数据:', JSON.stringify(testComment, null, 2))
  
  // 发送请求
  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testComment),
  })
    .then(async (response) => {
      console.log('\n📥 响应状态:', response.status, response.statusText)
      console.log('响应头:', Object.fromEntries(response.headers.entries()))
      
      const text = await response.text()
      console.log('响应内容 (原始):', text)
      
      try {
        const json = JSON.parse(text)
        console.log('响应内容 (JSON):', JSON.stringify(json, null, 2))
        
        if (response.ok && (json.errno === 0 || json.code === 0)) {
          console.log('\n✅ API 测试成功！')
        } else {
          console.log('\n⚠️ API 返回了错误:')
          console.log('  - errno:', json.errno)
          console.log('  - code:', json.code)
          console.log('  - message:', json.message)
        }
      } catch (e) {
        console.log('\n❌ 响应不是有效的 JSON')
      }
    })
    .catch((error) => {
      console.error('\n❌ 请求失败:', error.message)
      console.error('错误详情:', error)
    })
  
} catch (error) {
  console.error('❌ 读取 .env 文件失败:', error.message)
  process.exit(1)
}

