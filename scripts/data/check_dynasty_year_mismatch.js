const fs = require('fs')
const path = require('path')

// 读取数据文件
const dynastiesPath = path.join(__dirname, '../../frontend/public/data/dynasties.json')
const eventsPath = path.join(__dirname, '../../frontend/public/data/events.json')
const personsPath = path.join(__dirname, '../../frontend/public/data/persons.json')

const dynasties = JSON.parse(fs.readFileSync(dynastiesPath, 'utf-8'))
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'))
const persons = JSON.parse(fs.readFileSync(personsPath, 'utf-8'))

// 创建朝代映射
const dynastyMap = new Map()
dynasties.forEach(d => {
  dynastyMap.set(d.id, d)
})

// 检查事件
const eventMismatches = []
events.forEach(event => {
  if (!event.dynastyId || !event.eventYear) return
  
  const dynasty = dynastyMap.get(event.dynastyId)
  if (!dynasty) {
    eventMismatches.push({
      type: 'event',
      id: event.id,
      title: event.title,
      year: event.eventYear,
      dynastyId: event.dynastyId,
      issue: `朝代ID ${event.dynastyId} 不存在`
    })
    return
  }
  
  if (event.eventYear < dynasty.startYear || event.eventYear > dynasty.endYear) {
    eventMismatches.push({
      type: 'event',
      id: event.id,
      title: event.title,
      year: event.eventYear,
      dynastyId: event.dynastyId,
      dynastyName: dynasty.name,
      dynastyRange: `${dynasty.startYear} - ${dynasty.endYear}`,
      issue: `事件年份 ${event.eventYear} 不在朝代 ${dynasty.name} 的时间范围内`
    })
  }
})

// 检查人物
const personMismatches = []
persons.forEach(person => {
  if (!person.dynastyId) return
  
  const dynasty = dynastyMap.get(person.dynastyId)
  if (!dynasty) {
    personMismatches.push({
      type: 'person',
      id: person.id,
      name: person.name,
      dynastyId: person.dynastyId,
      issue: `朝代ID ${person.dynastyId} 不存在`
    })
    return
  }
  
  // 检查出生年份
  if (person.birthYear && (person.birthYear < dynasty.startYear || person.birthYear > dynasty.endYear)) {
    personMismatches.push({
      type: 'person',
      id: person.id,
      name: person.name,
      year: person.birthYear,
      yearType: 'birthYear',
      dynastyId: person.dynastyId,
      dynastyName: dynasty.name,
      dynastyRange: `${dynasty.startYear} - ${dynasty.endYear}`,
      issue: `出生年份 ${person.birthYear} 不在朝代 ${dynasty.name} 的时间范围内`
    })
  }
  
  // 检查死亡年份
  if (person.deathYear && (person.deathYear < dynasty.startYear || person.deathYear > dynasty.endYear)) {
    personMismatches.push({
      type: 'person',
      id: person.id,
      name: person.name,
      year: person.deathYear,
      yearType: 'deathYear',
      dynastyId: person.dynastyId,
      dynastyName: dynasty.name,
      dynastyRange: `${dynasty.startYear} - ${dynasty.endYear}`,
      issue: `死亡年份 ${person.deathYear} 不在朝代 ${dynasty.name} 的时间范围内`
    })
  }
  
  // 检查是否有年份但都不在朝代范围内（可能应该属于其他朝代）
  if (person.birthYear && person.deathYear) {
    const birthInRange = person.birthYear >= dynasty.startYear && person.birthYear <= dynasty.endYear
    const deathInRange = person.deathYear >= dynasty.startYear && person.deathYear <= dynasty.endYear
    
    // 如果出生和死亡都不在范围内，但人物有朝代ID，可能是朝代ID错误
    if (!birthInRange && !deathInRange) {
      // 检查是否应该属于其他朝代
      const correctDynasty = dynasties.find(d => 
        (person.birthYear >= d.startYear && person.birthYear <= d.endYear) ||
        (person.deathYear >= d.startYear && person.deathYear <= d.endYear) ||
        (person.birthYear <= d.startYear && person.deathYear >= d.endYear)
      )
      
      personMismatches.push({
        type: 'person',
        id: person.id,
        name: person.name,
        birthYear: person.birthYear,
        deathYear: person.deathYear,
        dynastyId: person.dynastyId,
        dynastyName: dynasty.name,
        dynastyRange: `${dynasty.startYear} - ${dynasty.endYear}`,
        suggestedDynasty: correctDynasty ? `${correctDynasty.name} (${correctDynasty.startYear}-${correctDynasty.endYear})` : null,
        issue: `出生和死亡年份都不在朝代 ${dynasty.name} 的时间范围内`
      })
    }
  }
})

// 检查朝代时间范围重叠问题
const dynastyOverlaps = []
dynasties.forEach(d1 => {
  dynasties.forEach(d2 => {
    if (d1.id === d2.id) return
    
    // 检查是否有重叠
    const overlap = !(d1.endYear < d2.startYear || d1.startYear > d2.endYear)
    if (overlap) {
      dynastyOverlaps.push({
        dynasty1: { id: d1.id, name: d1.name, range: `${d1.startYear}-${d1.endYear}` },
        dynasty2: { id: d2.id, name: d2.name, range: `${d2.startYear}-${d2.endYear}` },
        overlapRange: `${Math.max(d1.startYear, d2.startYear)}-${Math.min(d1.endYear, d2.endYear)}`
      })
    }
  })
})

// 去重重叠报告
const uniqueOverlaps = []
const seen = new Set()
dynastyOverlaps.forEach(overlap => {
  const key = `${Math.min(overlap.dynasty1.id, overlap.dynasty2.id)}-${Math.max(overlap.dynasty1.id, overlap.dynasty2.id)}`
  if (!seen.has(key)) {
    seen.add(key)
    uniqueOverlaps.push(overlap)
  }
})

// 输出报告
console.log('='.repeat(80))
console.log('年份和朝代对应关系检查报告')
console.log('='.repeat(80))
console.log()

console.log(`总朝代数: ${dynasties.length}`)
console.log(`总事件数: ${events.length}`)
console.log(`总人物数: ${persons.length}`)
console.log()

if (eventMismatches.length > 0) {
  console.log(`\n❌ 发现 ${eventMismatches.length} 个事件的年份与朝代不匹配:`)
  console.log('-'.repeat(80))
  eventMismatches.forEach((m, i) => {
    console.log(`${i + 1}. [事件 #${m.id}] ${m.title}`)
    console.log(`   年份: ${m.year}`)
    console.log(`   朝代ID: ${m.dynastyId}${m.dynastyName ? ` (${m.dynastyName})` : ''}`)
    if (m.dynastyRange) {
      console.log(`   朝代时间范围: ${m.dynastyRange}`)
    }
    console.log(`   问题: ${m.issue}`)
    console.log()
  })
} else {
  console.log('✅ 所有事件的年份与朝代匹配正确')
}

if (personMismatches.length > 0) {
  console.log(`\n❌ 发现 ${personMismatches.length} 个人物的年份与朝代不匹配:`)
  console.log('-'.repeat(80))
  personMismatches.forEach((m, i) => {
    console.log(`${i + 1}. [人物 #${m.id}] ${m.name}`)
    if (m.year) {
      console.log(`   ${m.yearType === 'birthYear' ? '出生' : '死亡'}年份: ${m.year}`)
    } else if (m.birthYear && m.deathYear) {
      console.log(`   出生年份: ${m.birthYear}, 死亡年份: ${m.deathYear}`)
    }
    console.log(`   朝代ID: ${m.dynastyId}${m.dynastyName ? ` (${m.dynastyName})` : ''}`)
    if (m.dynastyRange) {
      console.log(`   朝代时间范围: ${m.dynastyRange}`)
    }
    if (m.suggestedDynasty) {
      console.log(`   建议朝代: ${m.suggestedDynasty}`)
    }
    console.log(`   问题: ${m.issue}`)
    console.log()
  })
} else {
  console.log('✅ 所有人物的年份与朝代匹配正确')
}

if (uniqueOverlaps.length > 0) {
  console.log(`\n⚠️  发现 ${uniqueOverlaps.length} 对朝代时间范围重叠:`)
  console.log('-'.repeat(80))
  uniqueOverlaps.forEach((overlap, i) => {
    console.log(`${i + 1}. ${overlap.dynasty1.name} (${overlap.dynasty1.range}) 与 ${overlap.dynasty2.name} (${overlap.dynasty2.range})`)
    console.log(`   重叠范围: ${overlap.overlapRange}`)
    console.log()
  })
} else {
  console.log('✅ 所有朝代时间范围无重叠（或重叠是预期的，如"周朝"和"西周"）')
}

// 保存详细报告到文件
const report = {
  summary: {
    totalDynasties: dynasties.length,
    totalEvents: events.length,
    totalPersons: persons.length,
    eventMismatches: eventMismatches.length,
    personMismatches: personMismatches.length,
    dynastyOverlaps: uniqueOverlaps.length
  },
  eventMismatches,
  personMismatches,
  dynastyOverlaps: uniqueOverlaps
}

const reportPath = path.join(__dirname, 'dynasty_year_mismatch_report.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
console.log(`\n详细报告已保存到: ${reportPath}`)

