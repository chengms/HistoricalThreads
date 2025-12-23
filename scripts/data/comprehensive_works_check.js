/**
 * 全面检查所有人物，查找可能遗漏的作品
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

console.log('=== 全面检查遗漏的作品 ===\n')
console.log(`总人物数：${persons.length}`)
console.log(`已有作品的人物：${authorsWithWorks.size}\n`)

// 检查所有人物
const potentialAuthors = []

persons.forEach(person => {
  const biography = (person.biography || '').toLowerCase()
  const name = person.name
  
  // 检查传记中是否提到文学作品
  const literaryKeywords = [
    '诗', '词', '文', '赋', '文学', '著作', '作品', '诗集', '文集',
    '写', '创作', '吟', '咏', '作', '著', '撰'
  ]
  
  const hasLiteraryMention = literaryKeywords.some(keyword => biography.includes(keyword))
  
  // 检查是否是历史上著名的有文学作品的人物
  const famousLiteraryFigures = [
    '刘邦', '项羽', '曹操', '曹丕', '曹植', '诸葛亮', '汉武帝', '唐太宗', '李世民',
    '隋炀帝', '杨广', '朱元璋', '康熙', '乾隆', '林则徐', '曾国藩', '毛泽东',
    '周恩来', '朱德', '陈毅', '叶剑英', '鲁迅', '郭沫若', '茅盾', '巴金',
    '老舍', '冰心', '徐志摩', '闻一多', '朱自清', '郁达夫', '沈从文',
    '文天祥', '岳飞', '辛弃疾', '陆游', '范仲淹', '欧阳修', '王安石',
    '苏轼', '柳永', '晏殊', '秦观', '李清照', '李煜', '李商隐', '杜牧',
    '白居易', '韩愈', '柳宗元', '刘禹锡', '王维', '孟浩然', '李白', '杜甫',
    '陶渊明', '屈原', '孔子', '孟子', '老子', '庄子', '荀子', '韩非子',
    '司马迁', '班固', '司马光', '朱熹', '王阳明', '顾炎武', '黄宗羲'
  ]
  
  const isFamousLiterary = famousLiteraryFigures.some(fig => name.includes(fig) || fig.includes(name))
  
  // 如果传记中提到文学相关，或者是著名文学人物，但还没有作品
  if ((hasLiteraryMention || isFamousLiterary) && !authorsWithWorks.has(person.id)) {
    potentialAuthors.push({
      id: person.id,
      name: person.name,
      types: person.personType || [],
      biography: person.biography || '',
      dynastyId: person.dynastyId,
      birthYear: person.birthYear,
      deathYear: person.deathYear
    })
  }
})

console.log(`找到 ${potentialAuthors.length} 位可能有作品但尚未添加的人物：\n`)

potentialAuthors.forEach((person, index) => {
  const typeLabels = person.types.map(t => {
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
  
  const years = person.birthYear && person.deathYear 
    ? `${person.birthYear}-${person.deathYear}` 
    : person.birthYear 
    ? `${person.birthYear}-?` 
    : person.deathYear 
    ? `?-${person.deathYear}` 
    : '?'
  
  console.log(`${index + 1}. [ID: ${person.id}] ${person.name}`)
  console.log(`   类型：${typeLabels}`)
  console.log(`   生卒：${years}`)
  
  // 提取传记中的文学相关片段
  const bio = person.biography
  const literaryMatches = bio.match(/(.{0,80}(?:诗|词|文|赋|文学|著作|作品|诗集|文集|写|创作|吟|咏|作|著|撰).{0,80})/g)
  if (literaryMatches && literaryMatches.length > 0) {
    console.log(`   文学相关：${literaryMatches[0].substring(0, 150)}...`)
  }
  console.log('')
})

// 检查一些特别著名的人物
console.log('\n=== 检查特别著名的人物 ===\n')

const specialChecks = [
  { name: '曹丕', works: ['燕歌行', '典论·论文'] },
  { name: '岳飞', works: ['满江红', '小重山'] },
  { name: '文天祥', works: ['正气歌', '过零丁洋'], note: '已有作品' },
  { name: '鲁迅', works: ['狂人日记', '阿Q正传', '呐喊'] },
  { name: '郭沫若', works: ['女神', '天狗'] },
  { name: '茅盾', works: ['子夜', '林家铺子'] },
  { name: '巴金', works: ['家', '春', '秋'] },
  { name: '老舍', works: ['骆驼祥子', '茶馆'] },
  { name: '冰心', works: ['繁星', '春水'] },
  { name: '徐志摩', works: ['再别康桥', '翡冷翠的一夜'] },
  { name: '闻一多', works: ['死水', '红烛'] },
  { name: '朱自清', works: ['背影', '荷塘月色'] },
  { name: '郁达夫', works: ['沉沦', '春风沉醉的晚上'] },
  { name: '沈从文', works: ['边城', '长河'] },
  { name: '周恩来', works: ['大江歌罢掉头东'] },
  { name: '朱德', works: ['太行春感', '出太行'] },
  { name: '陈毅', works: ['梅岭三章', '青松'] },
]

specialChecks.forEach(check => {
  const person = persons.find(p => p.name === check.name)
  if (person) {
    const hasWorks = authorsWithWorks.has(person.id)
    const status = hasWorks ? '✓' : '✗'
    console.log(`${status} ${check.name} (ID: ${person.id}) - ${check.works.join('、')} ${check.note || ''}`)
  } else {
    console.log(`? ${check.name} - ${check.works.join('、')} (未找到)`)
  }
})

// 统计
console.log('\n=== 统计 ===\n')
console.log(`总人物数：${persons.length}`)
console.log(`已有作品的人物：${authorsWithWorks.size}`)
console.log(`可能有作品但未添加：${potentialAuthors.length}`)
console.log(`作品总数：${works.length}`)

