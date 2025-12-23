/**
 * 检查事件和人物数据，找出描述太简单或缺少关键信息的条目
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../../frontend/public/data')
const eventsPath = path.join(dataDir, 'events.json')
const personsPath = path.join(dataDir, 'persons.json')

const events = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'))
const persons = JSON.parse(fs.readFileSync(personsPath, 'utf-8'))

// 检查标准
const MIN_DESCRIPTION_LENGTH = 50 // 最小描述长度
const MIN_BIOGRAPHY_LENGTH = 100 // 最小传记长度

console.log('=== 检查事件数据 ===\n')
const incompleteEvents = []

events.forEach(event => {
  const issues = []
  
  // 检查描述
  if (!event.description || event.description.trim().length === 0) {
    issues.push('缺少描述')
  } else if (event.description.trim().length < MIN_DESCRIPTION_LENGTH) {
    issues.push(`描述太短（${event.description.trim().length}字，建议至少${MIN_DESCRIPTION_LENGTH}字）`)
  }
  
  // 检查关键字段
  if (!event.location) {
    issues.push('缺少地点')
  }
  
  if (!event.persons || event.persons.length === 0) {
    issues.push('缺少相关人物')
  }
  
  if (!event.sources || event.sources.length === 0) {
    issues.push('缺少来源')
  }
  
  if (issues.length > 0) {
    incompleteEvents.push({
      id: event.id,
      title: event.title,
      issues: issues,
      currentDescription: event.description || '(无)',
      descriptionLength: event.description ? event.description.trim().length : 0
    })
  }
})

console.log(`发现 ${incompleteEvents.length} 个需要补全的事件：\n`)
incompleteEvents.forEach(e => {
  console.log(`[${e.id}] ${e.title}`)
  console.log(`  问题：${e.issues.join('、')}`)
  console.log(`  当前描述（${e.descriptionLength}字）：${e.currentDescription.substring(0, 100)}${e.currentDescription.length > 100 ? '...' : ''}`)
  console.log('')
})

console.log('\n=== 检查人物数据 ===\n')
const incompletePersons = []

persons.forEach(person => {
  const issues = []
  
  // 检查传记
  if (!person.biography || person.biography.trim().length === 0) {
    issues.push('缺少传记')
  } else if (person.biography.trim().length < MIN_BIOGRAPHY_LENGTH) {
    issues.push(`传记太短（${person.biography.trim().length}字，建议至少${MIN_BIOGRAPHY_LENGTH}字）`)
  }
  
  // 检查关键字段
  if (!person.birthYear && !person.deathYear) {
    issues.push('缺少生卒年份')
  }
  
  if (!person.personType || person.personType.length === 0) {
    issues.push('缺少人物类型')
  }
  
  if (!person.sources || person.sources.length === 0) {
    issues.push('缺少来源')
  }
  
  if (issues.length > 0) {
    incompletePersons.push({
      id: person.id,
      name: person.name,
      issues: issues,
      currentBiography: person.biography || '(无)',
      biographyLength: person.biography ? person.biography.trim().length : 0
    })
  }
})

console.log(`发现 ${incompletePersons.length} 个需要补全的人物：\n`)
incompletePersons.forEach(p => {
  console.log(`[${p.id}] ${p.name}`)
  console.log(`  问题：${p.issues.join('、')}`)
  console.log(`  当前传记（${p.biographyLength}字）：${p.currentBiography.substring(0, 100)}${p.currentBiography.length > 100 ? '...' : ''}`)
  console.log('')
})

// 生成报告
const report = {
  events: {
    total: events.length,
    incomplete: incompleteEvents.length,
    incompleteList: incompleteEvents
  },
  persons: {
    total: persons.length,
    incomplete: incompletePersons.length,
    incompleteList: incompletePersons
  }
}

const reportPath = path.join(__dirname, 'incomplete_data_report.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
console.log(`\n详细报告已保存到: ${reportPath}`)

