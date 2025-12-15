#!/usr/bin/env node
/**
 * 运行所有测试脚本
 * 
 * 使用方法：
 *   node tests/run-all.mjs
 * 
 * 或者：
 *   chmod +x tests/run-all.mjs
 *   ./tests/run-all.mjs
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 测试脚本列表
const testScripts = [
  {
    name: 'Twikoo API 测试',
    path: join(__dirname, 'twikoo', 'test-api.mjs'),
    required: ['VITE_TWIKOO_ENV_ID'],
  },
  {
    name: 'Twikoo 获取评论测试',
    path: join(__dirname, 'twikoo', 'test-get-comments.mjs'),
    required: ['VITE_TWIKOO_ENV_ID'],
  },
  {
    name: '图片上传测试',
    path: join(__dirname, 'image-upload', 'test-upload.mjs'),
    required: ['VITE_IMAGE_UPLOAD_API'],
  },
]

// 检查环境变量
function checkEnvVars(required) {
  const missing = []
  for (const varName of required) {
    // 这里需要读取 .env 文件，简化处理，只提示
    // 实际检查在测试脚本中进行
  }
  return missing
}

// 运行单个测试
async function runTest(test) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🧪 运行测试: ${test.name}`)
  console.log('='.repeat(60))
  
  try {
    const { stdout, stderr } = await execAsync(`node "${test.path}"`, {
      cwd: join(__dirname, '..'),
      encoding: 'utf-8',
    })
    
    if (stdout) {
      console.log(stdout)
    }
    if (stderr) {
      console.error(stderr)
    }
    
    return { success: true, test: test.name }
  } catch (error) {
    console.error(`❌ 测试失败: ${test.name}`)
    console.error(error.message)
    return { success: false, test: test.name, error: error.message }
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始运行所有测试...\n')
  
  const results = []
  
  for (const test of testScripts) {
    const result = await runTest(test)
    results.push(result)
    
    // 测试之间稍作延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // 输出总结
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 测试总结')
  console.log('='.repeat(60))
  
  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌'
    console.log(`${icon} ${result.test}`)
  })
  
  console.log(`\n总计: ${results.length} 个测试`)
  console.log(`成功: ${successCount}`)
  console.log(`失败: ${failCount}`)
  
  if (failCount > 0) {
    console.log('\n⚠️  部分测试失败，请检查环境变量配置和 API 服务状态')
    process.exit(1)
  } else {
    console.log('\n✅ 所有测试通过！')
    process.exit(0)
  }
}

// 执行
runAllTests().catch(error => {
  console.error('运行测试时发生错误:', error)
  process.exit(1)
})

