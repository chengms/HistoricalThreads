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

// 根据年份查找正确的朝代
function findDynastyByYear(year) {
  if (!year || typeof year !== 'number') return null
  
  // 优先匹配更具体的朝代（子朝代）
  const specificDynasties = dynasties.filter(d => 
    d.name.includes('西晋') || d.name.includes('东晋') || 
    d.name.includes('西汉') || d.name.includes('东汉') ||
    d.name.includes('北宋') || d.name.includes('南宋') ||
    d.name.includes('初唐') || d.name.includes('盛唐') || d.name.includes('中唐') || d.name.includes('晚唐') ||
    d.name.includes('清前期') || d.name.includes('清中期') || d.name.includes('清后期') ||
    d.name.includes('民国初期') || d.name.includes('民国中期') || d.name.includes('抗战时期') || d.name.includes('解放战争')
  )
  
  // 先尝试匹配具体朝代
  for (const d of specificDynasties) {
    if (year >= d.startYear && year <= d.endYear) {
      return d
    }
  }
  
  // 再尝试匹配一般朝代
  for (const d of dynasties) {
    if (year >= d.startYear && year <= d.endYear) {
      return d
    }
  }
  
  return null
}

// 修复事件
const eventFixes = []
events.forEach(event => {
  if (!event.eventYear || !event.dynastyId) return
  
  const currentDynasty = dynastyMap.get(event.dynastyId)
  if (!currentDynasty) return
  
  // 检查年份是否在朝代范围内
  if (event.eventYear < currentDynasty.startYear || event.eventYear > currentDynasty.endYear) {
    const correctDynasty = findDynastyByYear(event.eventYear)
    if (correctDynasty && correctDynasty.id !== event.dynastyId) {
      eventFixes.push({
        id: event.id,
        title: event.title,
        year: event.eventYear,
        oldDynastyId: event.dynastyId,
        oldDynastyName: currentDynasty.name,
        newDynastyId: correctDynasty.id,
        newDynastyName: correctDynasty.name
      })
      event.dynastyId = correctDynasty.id
    }
  }
})

// 修复人物（只修复明显错误的，出生年份不在朝代范围内是正常的）
const personFixes = []
persons.forEach(person => {
  if (!person.dynastyId) return
  
  const currentDynasty = dynastyMap.get(person.dynastyId)
  if (!currentDynasty) return
  
  // 如果人物有出生和死亡年份，且都不在朝代范围内，则修复
  if (person.birthYear && person.deathYear) {
    const birthInRange = person.birthYear >= currentDynasty.startYear && person.birthYear <= currentDynasty.endYear
    const deathInRange = person.deathYear >= currentDynasty.startYear && person.deathYear <= currentDynasty.endYear
    
    if (!birthInRange && !deathInRange) {
      // 尝试根据出生年份或死亡年份找到正确的朝代
      const birthDynasty = findDynastyByYear(person.birthYear)
      const deathDynasty = findDynastyByYear(person.deathYear)
      
      // 优先使用覆盖时间范围更长的朝代
      let correctDynasty = null
      if (birthDynasty && deathDynasty) {
        // 如果两个朝代都能匹配，选择覆盖范围更大的
        const birthRange = birthDynasty.endYear - birthDynasty.startYear
        const deathRange = deathDynasty.endYear - deathDynasty.startYear
        correctDynasty = birthRange > deathRange ? birthDynasty : deathDynasty
      } else if (birthDynasty) {
        correctDynasty = birthDynasty
      } else if (deathDynasty) {
        correctDynasty = deathDynasty
      }
      
      if (correctDynasty && correctDynasty.id !== person.dynastyId) {
        personFixes.push({
          id: person.id,
          name: person.name,
          birthYear: person.birthYear,
          deathYear: person.deathYear,
          oldDynastyId: person.dynastyId,
          oldDynastyName: currentDynasty.name,
          newDynastyId: correctDynasty.id,
          newDynastyName: correctDynasty.name
        })
        person.dynastyId = correctDynasty.id
      }
    }
  }
})

// 输出修复报告
console.log('='.repeat(80))
console.log('年份和朝代对应关系修复报告')
console.log('='.repeat(80))
console.log()

if (eventFixes.length > 0) {
  console.log(`修复了 ${eventFixes.length} 个事件的朝代ID:`)
  console.log('-'.repeat(80))
  eventFixes.forEach((fix, i) => {
    console.log(`${i + 1}. [事件 #${fix.id}] ${fix.title}`)
    console.log(`   年份: ${fix.year}`)
    console.log(`   原朝代: ${fix.oldDynastyName} (ID: ${fix.oldDynastyId})`)
    console.log(`   新朝代: ${fix.newDynastyName} (ID: ${fix.newDynastyId})`)
    console.log()
  })
} else {
  console.log('✅ 没有需要修复的事件')
}

if (personFixes.length > 0) {
  console.log(`\n修复了 ${personFixes.length} 个人物的朝代ID:`)
  console.log('-'.repeat(80))
  personFixes.forEach((fix, i) => {
    console.log(`${i + 1}. [人物 #${fix.id}] ${fix.name}`)
    console.log(`   出生年份: ${fix.birthYear}, 死亡年份: ${fix.deathYear}`)
    console.log(`   原朝代: ${fix.oldDynastyName} (ID: ${fix.oldDynastyId})`)
    console.log(`   新朝代: ${fix.newDynastyName} (ID: ${fix.newDynastyId})`)
    console.log()
  })
} else {
  console.log('✅ 没有需要修复的人物')
}

// 保存修复后的数据
if (eventFixes.length > 0 || personFixes.length > 0) {
  // 备份原文件
  const timestamp = Date.now()
  fs.writeFileSync(
    eventsPath + `.backup.${timestamp}`,
    JSON.stringify(JSON.parse(fs.readFileSync(eventsPath, 'utf-8')), null, 2),
    'utf-8'
  )
  fs.writeFileSync(
    personsPath + `.backup.${timestamp}`,
    JSON.stringify(JSON.parse(fs.readFileSync(personsPath, 'utf-8')), null, 2),
    'utf-8'
  )
  
  // 保存修复后的数据
  fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf-8')
  fs.writeFileSync(personsPath, JSON.stringify(persons, null, 2), 'utf-8')
  
  console.log(`\n✅ 已保存修复后的数据`)
  console.log(`   备份文件: events.json.backup.${timestamp}`)
  console.log(`   备份文件: persons.json.backup.${timestamp}`)
} else {
  console.log('\n✅ 无需修复，数据已正确')
}

