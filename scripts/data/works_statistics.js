/**
 * 作品统计
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../../frontend/public/data')
const worksPath = path.join(dataDir, 'works.json')
const personsPath = path.join(dataDir, 'persons.json')

const works = JSON.parse(fs.readFileSync(worksPath, 'utf-8'))
const persons = JSON.parse(fs.readFileSync(personsPath, 'utf-8'))

console.log('=== 作品统计 ===\n')
console.log(`总作品数: ${works.length}`)

const authors = [...new Set(works.map(x => x.authorId))]
console.log(`总作者数: ${authors.length}`)

// 按作者统计
const byAuthor = {}
works.forEach(work => {
  if (!byAuthor[work.authorId]) byAuthor[work.authorId] = []
  byAuthor[work.authorId].push(work.title)
})

console.log('\n按作者统计（前15位）:')
Object.keys(byAuthor)
  .sort((a, b) => byAuthor[b].length - byAuthor[a].length)
  .slice(0, 15)
  .forEach(aid => {
    const person = persons.find(p => p.id === parseInt(aid))
    const name = person ? person.name : `ID:${aid}`
    console.log(`${name}: ${byAuthor[aid].length} 部作品`)
  })

// 按作品类型统计
const byType = {}
works.forEach(work => {
  if (!byType[work.workType]) byType[work.workType] = 0
  byType[work.workType]++
})

console.log('\n按作品类型统计:')
Object.keys(byType).forEach(type => {
  const labels = {
    poem: '诗',
    ci: '词',
    prose: '散文',
    essay: '文章',
    novel: '小说',
    play: '戏剧',
    other: '其他'
  }
  console.log(`${labels[type] || type}: ${byType[type]} 部`)
})

