#!/usr/bin/env node

/**
 * 数据更新脚本
 * 用于批量更新或验证 JSON 数据文件
 */

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '../frontend/public/data')

// 读取 JSON 文件
function readJsonFile(filename) {
  const filePath = path.join(DATA_DIR, filename)
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error(`读取文件失败: ${filename}`, error)
    return null
  }
}

// 写入 JSON 文件
function writeJsonFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename)
  try {
    const content = JSON.stringify(data, null, 2)
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`✓ 更新文件: ${filename}`)
    return true
  } catch (error) {
    console.error(`写入文件失败: ${filename}`, error)
    return false
  }
}

// 验证数据完整性
function validateData() {
  console.log('验证数据完整性...\n')
  
  const dynasties = readJsonFile('dynasties.json')
  const events = readJsonFile('events.json')
  const persons = readJsonFile('persons.json')
  const relationships = readJsonFile('relationships.json')
  const sources = readJsonFile('sources.json')
  
  const errors = []
  
  // 验证事件
  if (events) {
    events.forEach((event, index) => {
      if (!event.id) errors.push(`事件 ${index}: 缺少 id`)
      if (!event.title) errors.push(`事件 ${index}: 缺少 title`)
      if (event.dynastyId && !dynasties.find(d => d.id === event.dynastyId)) {
        errors.push(`事件 ${index}: 无效的 dynastyId ${event.dynastyId}`)
      }
      if (event.persons) {
        event.persons.forEach(personId => {
          if (!persons.find(p => p.id === personId)) {
            errors.push(`事件 ${index}: 无效的 personId ${personId}`)
          }
        })
      }
    })
  }
  
  // 验证人物
  if (persons) {
    persons.forEach((person, index) => {
      if (!person.id) errors.push(`人物 ${index}: 缺少 id`)
      if (!person.name) errors.push(`人物 ${index}: 缺少 name`)
      if (person.dynastyId && !dynasties.find(d => d.id === person.dynastyId)) {
        errors.push(`人物 ${index}: 无效的 dynastyId ${person.dynastyId}`)
      }
    })
  }
  
  // 验证关系
  if (relationships) {
    relationships.forEach((rel, index) => {
      if (!rel.fromPersonId || !persons.find(p => p.id === rel.fromPersonId)) {
        errors.push(`关系 ${index}: 无效的 fromPersonId`)
      }
      if (!rel.toPersonId || !persons.find(p => p.id === rel.toPersonId)) {
        errors.push(`关系 ${index}: 无效的 toPersonId`)
      }
    })
  }
  
  if (errors.length > 0) {
    console.error('发现以下错误:')
    errors.forEach(error => console.error(`  ✗ ${error}`))
    return false
  } else {
    console.log('✓ 数据验证通过')
    return true
  }
}

// 生成统计信息
function generateStats() {
  console.log('\n数据统计:\n')
  
  const dynasties = readJsonFile('dynasties.json')
  const events = readJsonFile('events.json')
  const persons = readJsonFile('persons.json')
  const relationships = readJsonFile('relationships.json')
  const sources = readJsonFile('sources.json')
  
  console.log(`朝代数量: ${dynasties?.length || 0}`)
  console.log(`事件数量: ${events?.length || 0}`)
  console.log(`人物数量: ${persons?.length || 0}`)
  console.log(`关系数量: ${relationships?.length || 0}`)
  console.log(`来源数量: ${sources?.length || 0}`)
  
  if (events) {
    const eventTypes = {}
    events.forEach(event => {
      eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1
    })
    console.log('\n事件类型分布:')
    Object.entries(eventTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
  }
}

// 主函数
function main() {
  const command = process.argv[2]
  
  switch (command) {
    case 'validate':
      validateData()
      break
    case 'stats':
      generateStats()
      break
    case 'all':
      validateData()
      generateStats()
      break
    default:
      console.log('用法: node update-data.js [validate|stats|all]')
      console.log('  validate - 验证数据完整性')
      console.log('  stats    - 生成统计信息')
      console.log('  all      - 执行所有操作')
  }
}

main()

