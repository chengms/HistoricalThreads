#!/usr/bin/env node
/**
 * 使用 AI 检查头像图片与人物的相关性
 * 功能：
 * 1. 读取 persons.json 文件中的人物数据
 * 2. 提取每个人物的头像图片路径
 * 3. 使用 AI 接口验证图片是否与人物相关
 * 4. 记录验证结果
 * 5. 删除不相关的头像图片
 */

import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'
import { verifyPersonImage } from './crawler/utils/aiVerifier.js'

// 配置环境变量 - 明确指定.env文件路径
const dotenvConfigPath = path.resolve('./scripts/crawler/.env')
dotenv.config({ path: dotenvConfigPath })
console.log(`🔧 加载环境变量文件: ${dotenvConfigPath}`)
console.log(`🔑 KIMI_API_KEY 配置状态: ${process.env.KIMI_API_KEY ? '已配置' : '未配置'}`)
console.log(`🔑 OPENAI_API_KEY 配置状态: ${process.env.OPENAI_API_KEY ? '已配置' : '未配置'}`)

// 常量定义
const PERSONS_JSON_PATH = path.resolve('./frontend/public/data/persons.json')
const IMAGES_DIR = path.resolve('./frontend/public/images')
const REPORT_FILE_PATH = path.resolve('./scripts/avatar-verification-report.json')

/**
 * 主函数
 */
async function main() {
  console.log('🔍 开始检查头像与人物的相关性...')
  console.log('='.repeat(50))

  try {
    // 1. 读取并解析 persons.json 文件
    const personsData = await fs.readFile(PERSONS_JSON_PATH, 'utf8')
    const persons = JSON.parse(personsData)
    console.log(`📊 读取到 ${persons.length} 个人物数据`)

    // 2. 收集所有头像图片信息
    const avatarInfoList = []
    for (const person of persons) {
      if (person.avatarUrl) {
        // 从 avatarUrl 中提取文件名
        const fileName = path.basename(person.avatarUrl)
        const fullPath = path.join(IMAGES_DIR, 'full', fileName)
        const thumbPath = path.join(IMAGES_DIR, 'thumbs/medium', fileName)
        const smallPath = path.join(IMAGES_DIR, 'thumbs/small', fileName)

        avatarInfoList.push({
          personId: person.id,
          personName: person.name,
          avatarUrl: person.avatarUrl,
          fileName,
          fullPath,
          thumbPath,
          smallPath
        })
      }
    }
    console.log(`🖼️  发现 ${avatarInfoList.length} 个头像图片`)

    // 3. 使用 AI 验证图片与人物的相关性
    const verificationResults = []
    const failedVerifications = []
    const totalImages = avatarInfoList.length
    let processedCount = 0

    for (const avatarInfo of avatarInfoList) {
      processedCount++
      console.log(`\n📋 处理第 ${processedCount}/${totalImages} 个图片:`)
      console.log(`   人物: ${avatarInfo.personName} (ID: ${avatarInfo.personId})`)
      console.log(`   图片: ${avatarInfo.fileName}`)

      try {
        // 检查图片文件是否存在
        await fs.access(avatarInfo.fullPath)
        
        // 这里需要将本地图片转换为 AI 可访问的形式
        // 由于 AI 接口需要图片的 URL 或 Base64，这里我们使用本地文件路径
        // 实际使用时可能需要将图片上传到临时服务器或转换为 Base64
        // 注意：目前的 verifyPersonImage 函数还需要改进以支持本地图片
        const result = await verifyPersonImage(
          avatarInfo.personName,
          avatarInfo.fullPath
        )
        
        // 增加请求间隔，避免API调用频率过高
        await new Promise(resolve => setTimeout(resolve, 3000)) // 3秒间隔

        console.log(`   ✅ 验证结果: ${result.verified ? '匹配' : '不匹配'}`)
        console.log(`   📈 置信度: ${(result.confidence * 100).toFixed(1)}%`)
        console.log(`   📝 备注: ${result.notes}`)

        verificationResults.push({
          ...avatarInfo,
          ...result
        })

        if (!result.verified) {
          failedVerifications.push(avatarInfo)
        }
      } catch (error) {
        console.error(`   ❌ 验证失败: ${error.message}`)
        // 当验证过程中发生错误时，将verified设为false，让用户知道这些图片需要手动检查
        verificationResults.push({
          ...avatarInfo,
          verified: false,
          confidence: 0,
          notes: `验证过程中发生错误: ${error.message}`
        })
        // 增加错误计数
        failedVerifications.push(avatarInfo)
      }
    }

    // 4. 保存验证报告
    await fs.writeFile(
      REPORT_FILE_PATH,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        totalImages,
        verifiedImages: verificationResults.filter(r => r.verified).length,
        unverifiedImages: verificationResults.filter(r => !r.verified).length,
        results: verificationResults
      }),
      'utf8'
    )
    console.log(`\n📄 验证报告已保存到: ${REPORT_FILE_PATH}`)

    // 5. 根据验证结果处理图片
    // 识别API错误（404错误、模型不存在、API相关错误）
    const apiErrorResults = verificationResults.filter(r => 
      r.notes.includes('404') || 
      r.notes.includes('模型不存在') || 
      r.notes.includes('Permission denied') ||
      r.notes.includes('API') ||
      r.notes.includes('模型') ||
      r.notes.includes('API 调用失败') ||
      r.notes.includes('404 Not found')
    )
    
    // 实际不匹配的验证结果
    const actualUnverifiedResults = verificationResults.filter(r => 
      !r.verified && 
      !r.notes.includes('404') && 
      !r.notes.includes('模型不存在') && 
      !r.notes.includes('Permission denied') &&
      !r.notes.includes('API') &&
      !r.notes.includes('模型') &&
      !r.notes.includes('API 调用失败') &&
      !r.notes.includes('404 Not found')
    )
    
    console.log(`
🗑️  发现 ${apiErrorResults.length} 个图片由于API错误无法验证:`)
    console.log(`   建议: 请检查API密钥权限和模型配置，或尝试使用OpenAI API替代`)
    
    if (actualUnverifiedResults.length > 0) {
      console.log(`
🗑️  发现 ${actualUnverifiedResults.length} 个不相关的头像图片，准备删除:`)
      console.log('='.repeat(50))

      for (const failedAvatar of actualUnverifiedResults) {
        console.log(`\n   ⏳ 删除 ${failedAvatar.personName} 的头像: ${failedAvatar.fileName}`)

        try {
          // 删除不同尺寸的图片
          await fs.unlink(failedAvatar.fullPath)
          await fs.unlink(failedAvatar.thumbPath)
          await fs.unlink(failedAvatar.smallPath)

          // 更新 persons.json 文件，移除该人物的 avatarUrl
          await updatePersonsJson(persons, failedAvatar.personId)

          console.log(`   ✅ 成功删除图片并更新数据`)
        } catch (error) {
          console.error(`   ❌ 删除失败: ${error.message}`)
        }
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('🎉 头像检查完成！')
    console.log(`📊 统计信息:`)
    console.log(`   - 总图片数: ${totalImages}`)
    console.log(`   - 匹配图片: ${verificationResults.filter(r => r.verified).length}`)
    console.log(`   - 不匹配图片: ${verificationResults.filter(r => !r.verified).length}`)
    console.log(`   - API错误图片: ${apiErrorResults.length}`)
    console.log(`   - 实际不匹配图片: ${actualUnverifiedResults.length}`)
    console.log(`   - 已删除图片: ${actualUnverifiedResults.length}`)
  } catch (error) {
    console.error('💥 程序执行失败:', error.message)
    process.exit(1)
  }
}

/**
 * 更新 persons.json 文件，移除指定人物的 avatarUrl
 */
async function updatePersonsJson(persons, personId) {
  // 找到并更新指定人物的数据
  const updatedPersons = persons.map(person => {
    if (person.id === personId) {
      const { avatarUrl, ...rest } = person
      return rest
    }
    return person
  })

  // 写回文件
  await fs.writeFile(
    PERSONS_JSON_PATH,
    JSON.stringify(updatedPersons, null, 2),
    'utf8'
  )
}

// 执行主函数
main().catch(error => {
  console.error('💥 程序执行失败:', error.message)
  process.exit(1)
})
