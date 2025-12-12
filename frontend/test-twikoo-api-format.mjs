// 测试不同的 Twikoo API 格式
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
console.log('\n' + '='.repeat(60))
console.log('开始测试不同的 API 格式...\n')

// 测试格式 1: 当前使用的格式
async function testFormat1() {
  console.log('📝 测试格式 1: 当前格式 (event: COMMENT, 展开 comment 对象)')
  const testData = {
    event: 'COMMENT',
    nick: '测试用户1',
    mail: 'test1@example.com',
    link: '',
    comment: '## 测试建议\n\n这是格式1的测试内容。',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    url: '/suggestion',
    pid: '',
    rid: '',
    created: Date.now(),
  }
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    })
    const result = await response.json()
    console.log('  状态:', response.status)
    console.log('  响应:', JSON.stringify(result, null, 2))
    console.log(result.errno === 0 || result.code === 0 ? '  ✅ 成功' : '  ❌ 失败')
  } catch (error) {
    console.log('  ❌ 错误:', error.message)
  }
  console.log()
}

// 测试格式 2: 嵌套格式
async function testFormat2() {
  console.log('📝 测试格式 2: 嵌套格式 (comment 作为嵌套对象)')
  const testData = {
    event: 'COMMENT',
    comment: {
      nick: '测试用户2',
      mail: 'test2@example.com',
      link: '',
      comment: '## 测试建议\n\n这是格式2的测试内容。',
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
    console.log('  状态:', response.status)
    console.log('  响应:', JSON.stringify(result, null, 2))
    console.log(result.errno === 0 || result.code === 0 ? '  ✅ 成功' : '  ❌ 失败')
  } catch (error) {
    console.log('  ❌ 错误:', error.message)
  }
  console.log()
}

// 测试格式 3: 简化格式（不包含 event）
async function testFormat3() {
  console.log('📝 测试格式 3: 简化格式 (不包含 event 字段)')
  const testData = {
    nick: '测试用户3',
    mail: 'test3@example.com',
    link: '',
    comment: '## 测试建议\n\n这是格式3的测试内容。',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    url: '/suggestion',
    pid: '',
    rid: '',
    created: Date.now(),
  }
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    })
    const result = await response.json()
    console.log('  状态:', response.status)
    console.log('  响应:', JSON.stringify(result, null, 2))
    console.log(result.errno === 0 || result.code === 0 ? '  ✅ 成功' : '  ❌ 失败')
  } catch (error) {
    console.log('  ❌ 错误:', error.message)
  }
  console.log()
}

// 测试格式 4: 使用 GET 请求查询 API 信息
async function testFormat4() {
  console.log('📝 测试格式 4: GET 请求查询 API 信息')
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    const text = await response.text()
    console.log('  状态:', response.status)
    console.log('  响应:', text.substring(0, 500))
  } catch (error) {
    console.log('  ❌ 错误:', error.message)
  }
  console.log()
}

// 测试格式 5: 检查 API 版本信息
async function testFormat5() {
  console.log('📝 测试格式 5: 查询 API 版本/信息')
  try {
    const response = await fetch(apiUrl + '?action=version', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    const result = await response.json()
    console.log('  状态:', response.status)
    console.log('  响应:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.log('  ❌ 错误:', error.message)
  }
  console.log()
}

// 运行所有测试
async function runAllTests() {
  await testFormat1()
  await testFormat2()
  await testFormat3()
  await testFormat4()
  await testFormat5()
  
  console.log('='.repeat(60))
  console.log('测试完成！')
}

runAllTests().catch(console.error)

