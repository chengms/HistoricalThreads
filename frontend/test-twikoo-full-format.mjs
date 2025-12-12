// 测试完整的 Twikoo API 格式（参考官方文档）
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

// 测试：可能 url 需要是当前页面的完整路径，或者需要其他参数
async function testFullFormat() {
  console.log('📝 测试完整格式（包含所有可能的参数）\n')
  
  // 尝试不同的组合
  const testCases = [
    {
      name: '格式 A: 标准格式（url 在顶层）',
      data: {
        event: 'COMMENT_SUBMIT',
        url: '/suggestion',
        comment: {
          nick: '测试用户',
          mail: 'test@example.com',
          comment: '测试评论内容',
        }
      }
    },
    {
      name: '格式 B: url 在 comment 内（当前使用）',
      data: {
        event: 'COMMENT_SUBMIT',
        comment: {
          url: '/suggestion',
          nick: '测试用户',
          mail: 'test@example.com',
          comment: '测试评论内容',
        }
      }
    },
    {
      name: '格式 C: 不包含 url',
      data: {
        event: 'COMMENT_SUBMIT',
        comment: {
          nick: '测试用户',
          mail: 'test@example.com',
          comment: '测试评论内容',
        }
      }
    },
    {
      name: '格式 D: 使用 path 而不是 url',
      data: {
        event: 'COMMENT_SUBMIT',
        comment: {
          path: '/suggestion',
          nick: '测试用户',
          mail: 'test@example.com',
          comment: '测试评论内容',
        }
      }
    },
    {
      name: '格式 E: 最小必需参数',
      data: {
        event: 'COMMENT_SUBMIT',
        comment: {
          nick: '测试用户',
          comment: '测试评论内容',
        }
      }
    },
  ]
  
  for (const testCase of testCases) {
    console.log(`\n${testCase.name}:`)
    console.log('请求数据:', JSON.stringify(testCase.data, null, 2))
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data),
      })
      
      const result = await response.json()
      console.log('响应:', JSON.stringify(result, null, 2))
      
      if (result.errno === 0 || result.code === 0) {
        console.log('✅ 成功！这是正确的格式！')
        return testCase
      } else if (result.code === 1001) {
        console.log('⚠️ 需要更新版本')
      } else if (result.code === 1000) {
        console.log(`❌ 参数错误: ${result.message}`)
      } else {
        console.log(`⚠️ ${result.message || result.code}`)
      }
    } catch (error) {
      console.log(`❌ 请求失败: ${error.message}`)
    }
    
    // 延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  return null
}

// 运行测试
testFullFormat()
  .then(result => {
    console.log('\n' + '='.repeat(60))
    if (result) {
      console.log('✅ 找到正确的格式！')
      console.log('格式名称:', result.name)
      console.log('格式数据:', JSON.stringify(result.data, null, 2))
    } else {
      console.log('❌ 未找到正确的格式，可能需要查看 Twikoo 官方文档或源代码')
    }
  })
  .catch(console.error)

