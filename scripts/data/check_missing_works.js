/**
 * 检查哪些人物缺少作品
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../../frontend/public/data')
const personsPath = path.join(dataDir, 'persons.json')
const worksPath = path.join(dataDir, 'works.json')

const persons = JSON.parse(fs.readFileSync(personsPath, 'utf-8'))
const works = JSON.parse(fs.readFileSync(worksPath, 'utf-8'))

// 获取所有有作品的人物ID
const authorsWithWorks = new Set(works.map(w => w.authorId))

// 找出所有是writer或artist的人物
const culturalPersons = persons.filter(p => {
  const types = p.personType || []
  return types.includes('writer') || types.includes('artist')
})

console.log('=== 检查人物作品情况 ===\n')
console.log(`总共有 ${culturalPersons.length} 位文学家/艺术家`)
console.log(`已有作品的人物：${authorsWithWorks.size} 位\n`)

// 找出缺少作品的人物
const missingWorks = culturalPersons.filter(p => !authorsWithWorks.has(p.id))

console.log(`缺少作品的人物（${missingWorks.length} 位）：\n`)

missingWorks.forEach((person, index) => {
  const types = person.personType || []
  const typeLabels = types.map(t => {
    const labels = {
      writer: '文学家',
      artist: '艺术家',
      philosopher: '哲学家',
      politician: '政治家',
      military: '军事家'
    }
    return labels[t] || t
  }).join('、')
  
  const dynasty = person.dynastyId ? `（朝代ID: ${person.dynastyId}）` : ''
  const years = person.birthYear && person.deathYear 
    ? `${person.birthYear}-${person.deathYear}` 
    : person.birthYear 
    ? `${person.birthYear}-?` 
    : person.deathYear 
    ? `?-${person.deathYear}` 
    : '?'
  
  console.log(`${index + 1}. [ID: ${person.id}] ${person.name} ${dynasty}`)
  console.log(`   类型：${typeLabels}`)
  console.log(`   生卒：${years}`)
  console.log(`   别名：${person.nameVariants ? person.nameVariants.join('、') : '无'}`)
  console.log('')
})

console.log('\n=== 已有作品的人物 ===\n')
const withWorks = culturalPersons.filter(p => authorsWithWorks.has(p.id))
withWorks.forEach((person, index) => {
  const personWorks = works.filter(w => w.authorId === person.id)
  console.log(`${index + 1}. ${person.name} - ${personWorks.length} 部作品`)
  personWorks.forEach(w => {
    console.log(`   - ${w.title}`)
  })
})

