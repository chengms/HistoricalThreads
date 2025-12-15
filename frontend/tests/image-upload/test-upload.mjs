/**
 * 图片上传功能测试脚本
 * 
 * 用途：测试图片上传到图床服务
 * 
 * 使用方法：
 *   cd frontend
 *   node tests/image-upload/test-upload.mjs
 * 
 * 前置条件：
 *   - 在 frontend/.env 文件中配置 VITE_IMAGE_UPLOAD_API
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
const uploadApi = envVars.VITE_IMAGE_UPLOAD_API || ''

if (!uploadApi) {
  console.error('❌ VITE_IMAGE_UPLOAD_API 未在 .env 文件中找到')
  console.error('   请在 frontend/.env 文件中设置 VITE_IMAGE_UPLOAD_API')
  process.exit(1)
}

console.log('🧪 图片上传功能测试')
console.log('='.repeat(60))
console.log(`✅ 找到图床 API: ${uploadApi}\n`)

// 创建一个测试用的 base64 图片（1x1 像素的透明 PNG）
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const timestamp = Date.now()
const filename = `comments/test-${timestamp}.png`

console.log('📤 上传信息:')
console.log(`  API URL: ${uploadApi}`)
console.log(`  文件名: ${filename}`)
console.log(`  图片大小: ${testImageBase64.length} bytes (base64)\n`)

async function testUpload() {
  try {
    console.log('📤 发送上传请求...')
    
    const response = await fetch(uploadApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: filename,
        content: testImageBase64,
      }),
    })
    
    console.log(`📥 响应状态: ${response.status} ${response.statusText}`)
    
    if (response.ok) {
      const result = await response.json()
      console.log('📥 响应内容:', JSON.stringify(result, null, 2))
      
      if (result.url) {
        console.log('\n✅ 图片上传成功！')
        console.log(`   图片 URL: ${result.url}`)
        console.log(`\n💡 可以在浏览器中访问该 URL 查看图片`)
        process.exit(0)
      } else {
        console.log('\n⚠️ 响应中没有 URL 字段')
        process.exit(1)
      }
    } else {
      const errorText = await response.text()
      console.log('\n❌ 上传失败:')
      console.log(`   状态码: ${response.status}`)
      console.log(`   错误信息: ${errorText}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ 请求失败:', error.message)
    console.error('   错误详情:', error)
    process.exit(1)
  }
}

testUpload()
