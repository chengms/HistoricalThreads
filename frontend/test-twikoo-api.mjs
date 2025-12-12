// 测试 Twikoo API (ES Module)
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 读取 .env 文件
try {
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
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testComment),
  })
  
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
      
      if (json.code === 1001) {
        console.log('\n💡 提示: 需要更新 Twikoo 云函数至最新版本')
      }
    }
  } catch (e) {
    console.log('\n❌ 响应不是有效的 JSON')
    console.log('解析错误:', e.message)
  }
  
} catch (error) {
  console.error('❌ 错误:', error.message)
  if (error.code === 'ENOENT') {
    console.error('   .env 文件不存在，请确认文件路径')
  }
  process.exit(1)
}

