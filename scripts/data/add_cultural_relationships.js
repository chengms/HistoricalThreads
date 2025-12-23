/**
 * 添加文化人物之间的关系
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../../frontend/public/data')
const relationshipsPath = path.join(dataDir, 'relationships.json')
const personsPath = path.join(dataDir, 'persons.json')

const relationships = JSON.parse(fs.readFileSync(relationshipsPath, 'utf-8'))
const persons = JSON.parse(fs.readFileSync(personsPath, 'utf-8'))

// 获取下一个可用的ID
const getNextRelationshipId = () => {
  return Math.max(...relationships.map(r => r.id), 0) + 1
}

// 查找人物ID
const findPersonId = (name) => {
  const person = persons.find(p => p.name === name)
  return person ? person.id : null
}

console.log('=== 添加文化人物关系 ===\n')

// 要添加的关系
const newRelationships = [
  {
    fromPersonId: findPersonId("李白"),
    toPersonId: findPersonId("杜甫"),
    relationshipType: "friend",
    description: "李白和杜甫是唐代最伟大的两位诗人，被称为\"李杜\"。两人曾有过交往，杜甫对李白非常敬仰，写过多首诗赞美李白。",
    startYear: 744,
    strength: 5
  },
  {
    fromPersonId: findPersonId("杜甫"),
    toPersonId: findPersonId("李白"),
    relationshipType: "influence",
    description: "杜甫深受李白诗歌的影响，对李白的才华和风格非常推崇。",
    startYear: 744,
    strength: 4
  },
  {
    fromPersonId: findPersonId("白居易"),
    toPersonId: findPersonId("元稹"),
    relationshipType: "friend",
    description: "白居易和元稹是好友，共同倡导新乐府运动，世称\"元白\"。",
    startYear: 800,
    strength: 5
  },
  {
    fromPersonId: findPersonId("韩愈"),
    toPersonId: findPersonId("柳宗元"),
    relationshipType: "colleague",
    description: "韩愈和柳宗元共同倡导古文运动，反对骈文，提倡古文，世称\"韩柳\"。",
    startYear: 800,
    strength: 5
  },
  {
    fromPersonId: findPersonId("苏轼"),
    toPersonId: findPersonId("辛弃疾"),
    relationshipType: "influence",
    description: "苏轼和辛弃疾都是豪放派词人，合称\"苏辛\"。辛弃疾继承了苏轼的豪放词风并有所发展。",
    startYear: 1140,
    strength: 4
  },
  {
    fromPersonId: findPersonId("王维"),
    toPersonId: findPersonId("孟浩然"),
    relationshipType: "friend",
    description: "王维和孟浩然都是盛唐山水田园诗派的代表，合称\"王孟\"，两人是好友。",
    startYear: 720,
    strength: 4
  },
  {
    fromPersonId: findPersonId("欧阳修"),
    toPersonId: findPersonId("苏轼"),
    relationshipType: "mentor",
    description: "欧阳修是苏轼的老师，对苏轼的文学创作产生了重要影响。",
    startYear: 1057,
    strength: 5
  },
  {
    fromPersonId: findPersonId("陶渊明"),
    toPersonId: findPersonId("王维"),
    relationshipType: "influence",
    description: "王维的山水田园诗深受陶渊明的影响，继承了陶渊明的田园诗传统。",
    startYear: 701,
    strength: 4
  },
  {
    fromPersonId: findPersonId("屈原"),
    toPersonId: findPersonId("李白"),
    relationshipType: "influence",
    description: "李白的诗歌创作深受屈原的影响，继承了屈原的浪漫主义传统。",
    startYear: 701,
    strength: 4
  },
  {
    fromPersonId: findPersonId("曹植"),
    toPersonId: findPersonId("李白"),
    relationshipType: "influence",
    description: "李白的诗歌创作也受到曹植的影响，继承了建安文学的传统。",
    startYear: 701,
    strength: 3
  },
]

let relationshipsAdded = 0

newRelationships.forEach(relData => {
  if (!relData.fromPersonId || !relData.toPersonId) {
    console.log(`[跳过] 关系无效：${relData.description}（人物ID缺失）`)
    return
  }
  
  // 检查是否已存在相同的关系
  const exists = relationships.find(r => 
    r.fromPersonId === relData.fromPersonId && 
    r.toPersonId === relData.toPersonId &&
    r.relationshipType === relData.relationshipType
  )
  
  if (exists) {
    console.log(`[跳过] 关系已存在：${relData.description}`)
    return
  }
  
  const newRelationship = {
    id: getNextRelationshipId() + relationshipsAdded,
    ...relData
  }
  
  relationships.push(newRelationship)
  relationshipsAdded++
  
  const fromPerson = persons.find(p => p.id === relData.fromPersonId)
  const toPerson = persons.find(p => p.id === relData.toPersonId)
  console.log(`[${newRelationship.id}] 添加关系：${fromPerson ? fromPerson.name : '?'} -> ${toPerson ? toPerson.name : '?'} (${relData.relationshipType})`)
})

// 备份原文件
const relationshipsBackup = relationshipsPath + '.backup.' + Date.now()
fs.copyFileSync(relationshipsPath, relationshipsBackup)
console.log(`\n已备份原文件：${relationshipsBackup}`)

// 保存更新后的数据
fs.writeFileSync(relationshipsPath, JSON.stringify(relationships, null, 2), 'utf-8')

console.log(`\n添加完成：`)
console.log(`- 添加了 ${relationshipsAdded} 个文化人物关系`)

