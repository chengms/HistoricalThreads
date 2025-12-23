/**
 * 为确实有文学作品的历史人物添加作品
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../../frontend/public/data')
const worksPath = path.join(dataDir, 'works.json')
const personsPath = path.join(dataDir, 'persons.json')

const works = JSON.parse(fs.readFileSync(worksPath, 'utf-8'))
const persons = JSON.parse(fs.readFileSync(personsPath, 'utf-8'))

// 获取下一个可用的ID
const getNextWorkId = () => {
  return Math.max(...works.map(w => w.id), 0) + 1
}

// 查找人物ID
const findPersonId = (name) => {
  const person = persons.find(p => p.name === name)
  return person ? person.id : null
}

console.log('=== 添加确实有文学作品的人物作品 ===\n')

// 要添加的作品（只添加确实有文学作品的人物）
const newWorks = [
  // 周恩来
  {
    title: "大江歌罢掉头东",
    authorId: findPersonId("周恩来"),
    workType: "poem",
    content: "大江歌罢掉头东，\n邃密群科济世穷。\n面壁十年图破壁，\n难酬蹈海亦英雄。",
    excerpt: "大江歌罢掉头东，\n邃密群科济世穷。\n面壁十年图破壁，\n难酬蹈海亦英雄。",
    year: 1917,
    dynastyId: 17,
  },
]

// 过滤掉找不到作者ID的作品
const validWorks = newWorks.filter(w => w.authorId !== null && w.authorId !== undefined)

let worksAdded = 0

validWorks.forEach(workData => {
  // 检查是否已存在
  const exists = works.find(w => w.title === workData.title && w.authorId === workData.authorId)
  if (exists) {
    console.log(`[跳过] ${workData.title} (作者ID: ${workData.authorId}) 已存在`)
    return
  }
  
  const newWork = {
    id: getNextWorkId() + worksAdded,
    ...workData
  }
  
  works.push(newWork)
  worksAdded++
  
  const author = persons.find(p => p.id === workData.authorId)
  console.log(`[${newWork.id}] 添加 ${workData.title} (作者: ${author ? author.name : '?'}, ID: ${workData.authorId})`)
})

// 检查是否有其他遗漏的著名作品
console.log('\n=== 检查其他可能遗漏的作品 ===\n')

// 检查一些著名人物是否在系统中
const checkPersons = [
  '曹丕', '岳飞', '朱德', '陈毅', '鲁迅', '郭沫若', '茅盾', '巴金', 
  '老舍', '冰心', '徐志摩', '闻一多', '朱自清', '郁达夫', '沈从文'
]

checkPersons.forEach(name => {
  const person = persons.find(p => p.name === name)
  if (person) {
    const hasWorks = works.some(w => w.authorId === person.id)
    const status = hasWorks ? '✓' : '✗'
    console.log(`${status} ${name} (ID: ${person.id}) - ${hasWorks ? '已有作品' : '缺少作品'}`)
  } else {
    console.log(`? ${name} - 未在系统中`)
  }
})

// 备份原文件
if (worksAdded > 0) {
  const worksBackup = worksPath + '.backup.' + Date.now()
  fs.copyFileSync(worksPath, worksBackup)
  console.log(`\n已备份原文件：${worksBackup}`)
  
  // 保存更新后的数据
  fs.writeFileSync(worksPath, JSON.stringify(works, null, 2), 'utf-8')
  
  console.log(`\n添加完成：`)
  console.log(`- 添加了 ${worksAdded} 部作品`)
  console.log(`- 总作品数：${works.length}`)
} else {
  console.log('\n没有需要添加的作品')
}

