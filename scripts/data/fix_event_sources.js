/**
 * 修复事件中的人物来源关联错误
 * 移除事件sources中明显是人物相关的来源（如"百度百科：XXX"格式，且XXX不在事件标题中）
 */

const fs = require('fs')
const path = require('path')

function main() {
  const dataDir = path.join(__dirname, '../../frontend/public/data')
  const eventsPath = path.join(dataDir, 'events.json')
  const sourcesPath = path.join(dataDir, 'sources.json')
  const personsPath = path.join(dataDir, 'persons.json')
  
  const events = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'))
  const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'))
  const persons = JSON.parse(fs.readFileSync(personsPath, 'utf-8'))
  
  const sourceById = new Map(sources.map(s => [s.id, s]))
  const personById = new Map(persons.map(p => [p.id, p]))
  
  // 构建人物名称集合（包括别名）
  const personNames = new Set()
  for (const person of persons) {
    if (person.name) personNames.add(person.name)
    if (person.nameVariants && Array.isArray(person.nameVariants)) {
      person.nameVariants.forEach(v => personNames.add(v))
    }
  }
  
  let fixedCount = 0
  let totalRemoved = 0
  
  for (const event of events) {
    if (!event.sources || !Array.isArray(event.sources)) continue
    
    const eventTitle = event.title || ''
    const eventPersons = (event.persons || []).map(id => personById.get(id)).filter(Boolean)
    const eventPersonNames = new Set()
    eventPersons.forEach(p => {
      if (p.name) eventPersonNames.add(p.name)
      if (p.nameVariants) p.nameVariants.forEach(v => eventPersonNames.add(v))
    })
    
    const validSources = []
    const removedSources = []
    
    for (const sourceId of event.sources) {
      const source = sourceById.get(sourceId)
      if (!source) {
        // 来源不存在，移除
        removedSources.push({ id: sourceId, reason: '来源不存在' })
        continue
      }
      
      const sourceTitle = source.title || ''
      
      // 检查是否是人物相关的来源被错误关联到事件
      const baikeMatch = sourceTitle.match(/^(百度百科|维基百科|搜狗百科|360百科)[：:]\s*(.+)$/)
      if (baikeMatch) {
        const entityName = baikeMatch[2]
        
        // 如果实体名称是人物名称，且不在事件标题中，且不是事件相关人物，则移除
        if (personNames.has(entityName)) {
          // 检查是否是事件相关的人物
          const isEventPerson = eventPersonNames.has(entityName) || 
                                eventTitle.includes(entityName) ||
                                eventPersons.some(p => p.name === entityName || (p.nameVariants || []).includes(entityName))
          
          if (!isEventPerson) {
            removedSources.push({ id: sourceId, reason: `人物来源"${sourceTitle}"不匹配事件"${eventTitle}"` })
            continue
          }
        }
      }
      
      validSources.push(sourceId)
    }
    
    if (removedSources.length > 0) {
      event.sources = validSources
      fixedCount++
      totalRemoved += removedSources.length
      console.log(`事件 "${eventTitle}" (id: ${event.id}): 移除了 ${removedSources.length} 个不匹配的来源`)
      removedSources.forEach(r => console.log(`  - sourceId ${r.id}: ${r.reason}`))
    }
  }
  
  if (fixedCount > 0) {
    // 备份原文件
    const backupPath = eventsPath + '.backup'
    fs.copyFileSync(eventsPath, backupPath)
    console.log(`\n已备份原文件到: ${backupPath}`)
    
    // 保存修复后的数据
    fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf-8')
    console.log(`已修复 ${fixedCount} 个事件，共移除 ${totalRemoved} 个不匹配的来源`)
  } else {
    console.log('未发现需要修复的来源关联')
  }
}

if (require.main === module) {
  main()
}

module.exports = { main }

