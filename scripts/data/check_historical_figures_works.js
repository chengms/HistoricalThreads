/**
 * 检查哪些历史人物（非文学家/艺术家类型）也有文学作品
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

// 找出所有不是writer或artist，但历史上可能有文学作品的人物
// 比如政治家、军事家、哲学家等
const historicalFigures = persons.filter(p => {
  const types = p.personType || []
  const hasWriterOrArtist = types.includes('writer') || types.includes('artist')
  // 排除已经是文学家/艺术家的
  if (hasWriterOrArtist) return false
  
  // 检查是否有其他文化相关类型
  const hasCulturalType = types.includes('philosopher')
  
  // 或者检查传记中是否提到文学创作
  const biography = (p.biography || '').toLowerCase()
  const hasLiteraryMention = biography.includes('诗') || 
                            biography.includes('词') || 
                            biography.includes('文') ||
                            biography.includes('赋') ||
                            biography.includes('文学') ||
                            biography.includes('著作')
  
  return hasCulturalType || hasLiteraryMention
})

console.log('=== 检查历史人物的文学作品 ===\n')
console.log(`找到 ${historicalFigures.length} 位可能有文学作品的历史人物：\n`)

historicalFigures.forEach((person, index) => {
  const types = person.personType || []
  const typeLabels = types.map(t => {
    const labels = {
      politician: '政治家',
      military: '军事家',
      philosopher: '哲学家',
      economist: '经济学家',
      scientist: '科学家',
      writer: '文学家',
      artist: '艺术家',
      other: '其他'
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
  
  const hasWorks = authorsWithWorks.has(person.id)
  const status = hasWorks ? '[已有作品]' : '[缺少作品]'
  
  console.log(`${index + 1}. ${status} [ID: ${person.id}] ${person.name} ${dynasty}`)
  console.log(`   类型：${typeLabels}`)
  console.log(`   生卒：${years}`)
  
  // 检查传记中的文学相关描述
  const biography = person.biography || ''
  if (biography.includes('诗') || biography.includes('词') || biography.includes('文') || biography.includes('赋')) {
    const matches = biography.match(/(.{0,50}(?:诗|词|文|赋|文学|著作).{0,50})/g)
    if (matches && matches.length > 0) {
      console.log(`   文学相关：${matches[0].substring(0, 100)}...`)
    }
  }
  console.log('')
})

// 列出一些历史上著名的有文学作品的政治家/军事家
console.log('\n=== 历史上著名的有文学作品的人物（可能需要添加）===\n')
const famousLiteraryFigures = [
  { name: '刘邦', id: null, works: ['大风歌'] },
  { name: '项羽', id: null, works: ['垓下歌'] },
  { name: '曹操', id: 17, works: ['观沧海', '短歌行'], note: '已有作品' },
  { name: '李世民', id: null, works: ['赐萧瑀'] },
  { name: '朱元璋', id: null, works: ['咏菊'] },
  { name: '毛泽东', id: null, works: ['沁园春·雪', '沁园春·长沙'] },
]

famousLiteraryFigures.forEach(fig => {
  const person = persons.find(p => p.name === fig.name)
  if (person) {
    const hasWorks = authorsWithWorks.has(person.id)
    const status = hasWorks ? '✓' : '✗'
    console.log(`${status} ${fig.name} (ID: ${person.id}) - ${fig.works.join('、')}`)
  } else {
    console.log(`? ${fig.name} - ${fig.works.join('、')} (未找到)`)
  }
})

