// 检查网络图中的人物和关系数据
// 检查：1. 是否有重复人物（相同 id 或相同名字但不同 id）
//      2. 是否有重复关系
//      3. 跨朝代关系是否被正确过滤
//      4. 关系是否完整

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '../frontend/public/data')

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function main() {
  console.log('开始检查网络图数据...\n')
  
  const persons = readJSON(path.join(DATA_DIR, 'persons.json'))
  const relationships = readJSON(path.join(DATA_DIR, 'relationships.json'))
  const dynasties = readJSON(path.join(DATA_DIR, 'dynasties.json'))
  
  // 1. 检查重复的人物 ID
  console.log('=== 1. 检查重复的人物 ID ===')
  const personIds = persons.map(p => p.id).filter(id => typeof id === 'number')
  const duplicateIds = []
  const idCount = new Map()
  personIds.forEach(id => {
    const count = idCount.get(id) || 0
    idCount.set(id, count + 1)
    if (count === 1) duplicateIds.push(id)
  })
  
  if (duplicateIds.length > 0) {
    console.log(`❌ 发现 ${duplicateIds.length} 个重复的人物 ID:`)
    duplicateIds.forEach(id => {
      const duplicates = persons.filter(p => p.id === id)
      console.log(`  - ID ${id}: ${duplicates.map(p => p.name).join(', ')}`)
    })
  } else {
    console.log('✅ 没有重复的人物 ID')
  }
  
  // 2. 检查相同名字但不同 ID 的人物（可能是重复人物）
  console.log('\n=== 2. 检查相同名字但不同 ID 的人物 ===')
  const nameToIds = new Map()
  persons.forEach(p => {
    if (!p.name || typeof p.name !== 'string') return
    const name = p.name.trim()
    if (!nameToIds.has(name)) {
      nameToIds.set(name, [])
    }
    nameToIds.get(name).push(p.id)
  })
  
  const duplicateNames = []
  nameToIds.forEach((ids, name) => {
    if (ids.length > 1) {
      duplicateNames.push({ name, ids })
    }
  })
  
  if (duplicateNames.length > 0) {
    console.log(`⚠️  发现 ${duplicateNames.length} 个相同名字但不同 ID 的人物:`)
    duplicateNames.forEach(({ name, ids }) => {
      const personsWithName = persons.filter(p => p.id === ids[0] || p.id === ids[1])
      console.log(`  - "${name}": ID ${ids.join(', ')}`)
      personsWithName.forEach(p => {
        console.log(`    * ID ${p.id}: 朝代=${p.dynastyId || '未知'}, 生年=${p.birthYear || '未知'}, 卒年=${p.deathYear || '未知'}`)
      })
    })
  } else {
    console.log('✅ 没有相同名字但不同 ID 的人物')
  }
  
  // 3. 检查重复的关系
  console.log('\n=== 3. 检查重复的关系 ===')
  const relationshipKeys = new Map()
  const duplicateRelationships = []
  
  relationships.forEach(rel => {
    const key = `${rel.fromPersonId}-${rel.toPersonId}`
    if (relationshipKeys.has(key)) {
      duplicateRelationships.push({
        key,
        existing: relationshipKeys.get(key),
        duplicate: rel
      })
    } else {
      relationshipKeys.set(key, rel)
    }
  })
  
  if (duplicateRelationships.length > 0) {
    console.log(`⚠️  发现 ${duplicateRelationships.length} 个重复的关系:`)
    duplicateRelationships.forEach(({ key, existing, duplicate }) => {
      const fromPerson = persons.find(p => p.id === existing.fromPersonId)
      const toPerson = persons.find(p => p.id === existing.toPersonId)
      console.log(`  - ${fromPerson?.name || existing.fromPersonId} -> ${toPerson?.name || existing.toPersonId}`)
      console.log(`    已有: ${existing.relationshipType} (ID: ${existing.id})`)
      console.log(`    重复: ${duplicate.relationshipType} (ID: ${duplicate.id})`)
    })
  } else {
    console.log('✅ 没有重复的关系')
  }
  
  // 4. 检查跨朝代的关系
  console.log('\n=== 4. 检查跨朝代的关系 ===')
  const personById = new Map(persons.map(p => [p.id, p]))
  const dynastyById = new Map(dynasties.map(d => [d.id, d]))
  
  const crossDynastyRelationships = []
  relationships.forEach(rel => {
    const fromPerson = personById.get(rel.fromPersonId)
    const toPerson = personById.get(rel.toPersonId)
    
    if (!fromPerson || !toPerson) return
    
    const fromDynasty = fromPerson.dynastyId || 0
    const toDynasty = toPerson.dynastyId || 0
    
    if (fromDynasty !== toDynasty) {
      const fromDynastyName = fromDynasty === 0 ? '未知' : (dynastyById.get(fromDynasty)?.name || fromDynasty)
      const toDynastyName = toDynasty === 0 ? '未知' : (dynastyById.get(toDynasty)?.name || toDynasty)
      crossDynastyRelationships.push({
        rel,
        fromPerson,
        toPerson,
        fromDynasty: fromDynastyName,
        toDynasty: toDynastyName
      })
    }
  })
  
  if (crossDynastyRelationships.length > 0) {
    console.log(`ℹ️  发现 ${crossDynastyRelationships.length} 个跨朝代的关系（这些关系在图中不会显示）:`)
    crossDynastyRelationships.slice(0, 10).forEach(({ rel, fromPerson, toPerson, fromDynasty, toDynasty }) => {
      console.log(`  - ${fromPerson.name} (${fromDynasty}) -> ${toPerson.name} (${toDynasty}): ${rel.relationshipType}`)
    })
    if (crossDynastyRelationships.length > 10) {
      console.log(`  ... 还有 ${crossDynastyRelationships.length - 10} 个跨朝代关系`)
    }
  } else {
    console.log('✅ 没有跨朝代的关系')
  }
  
  // 5. 检查关系完整性：统计每个朝代内的关系数量
  console.log('\n=== 5. 检查各朝代内的关系数量 ===')
  const relationshipsByDynasty = new Map()
  
  relationships.forEach(rel => {
    const fromPerson = personById.get(rel.fromPersonId)
    const toPerson = personById.get(rel.toPersonId)
    
    if (!fromPerson || !toPerson) return
    
    const fromDynasty = fromPerson.dynastyId || 0
    const toDynasty = toPerson.dynastyId || 0
    
    // 只统计同朝代内的关系
    if (fromDynasty === toDynasty) {
      const dynastyKey = fromDynasty
      if (!relationshipsByDynasty.has(dynastyKey)) {
        relationshipsByDynasty.set(dynastyKey, [])
      }
      relationshipsByDynasty.get(dynastyKey).push(rel)
    }
  })
  
  const dynastyPersonCount = new Map()
  persons.forEach(p => {
    const dk = p.dynastyId || 0
    dynastyPersonCount.set(dk, (dynastyPersonCount.get(dk) || 0) + 1)
  })
  
  console.log('各朝代的人物和关系统计:')
  const sortedDynasties = Array.from(relationshipsByDynasty.keys()).sort((a, b) => {
    const da = dynastyById.get(a)
    const db = dynastyById.get(b)
    if (!da) return 1
    if (!db) return -1
    return (da.startYear || 0) - (db.startYear || 0)
  })
  
  sortedDynasties.forEach(dk => {
    const dynasty = dk === 0 ? null : dynastyById.get(dk)
    const dynastyName = dynasty ? dynasty.name : '未知朝代'
    const personCount = dynastyPersonCount.get(dk) || 0
    const relCount = relationshipsByDynasty.get(dk)?.length || 0
    const avgRelPerPerson = personCount > 0 ? (relCount / personCount).toFixed(2) : '0'
    console.log(`  - ${dynastyName}: ${personCount} 人, ${relCount} 个关系, 平均每人 ${avgRelPerPerson} 个关系`)
  })
  
  // 6. 检查是否有孤立的人物（没有任何关系）
  console.log('\n=== 6. 检查孤立的人物（没有任何关系） ===')
  const personWithRelationships = new Set()
  relationships.forEach(rel => {
    personWithRelationships.add(rel.fromPersonId)
    personWithRelationships.add(rel.toPersonId)
  })
  
  const isolatedPersons = persons.filter(p => !personWithRelationships.has(p.id))
  
  if (isolatedPersons.length > 0) {
    console.log(`⚠️  发现 ${isolatedPersons.length} 个孤立的人物（没有任何关系）:`)
    isolatedPersons.slice(0, 20).forEach(p => {
      const dynasty = p.dynastyId ? dynastyById.get(p.dynastyId) : null
      const dynastyName = dynasty ? dynasty.name : '未知'
      console.log(`  - ${p.name} (ID: ${p.id}, 朝代: ${dynastyName})`)
    })
    if (isolatedPersons.length > 20) {
      console.log(`  ... 还有 ${isolatedPersons.length - 20} 个孤立人物`)
    }
  } else {
    console.log('✅ 所有人物都有至少一个关系')
  }
  
  // 7. 检查关系中的无效人物 ID
  console.log('\n=== 7. 检查关系中的无效人物 ID ===')
  const validPersonIds = new Set(persons.map(p => p.id))
  const invalidRelationships = relationships.filter(rel => 
    !validPersonIds.has(rel.fromPersonId) || !validPersonIds.has(rel.toPersonId)
  )
  
  if (invalidRelationships.length > 0) {
    console.log(`❌ 发现 ${invalidRelationships.length} 个关系引用了不存在的人物 ID:`)
    invalidRelationships.forEach(rel => {
      const fromValid = validPersonIds.has(rel.fromPersonId)
      const toValid = validPersonIds.has(rel.toPersonId)
      console.log(`  - 关系 ID ${rel.id}: fromPersonId=${rel.fromPersonId} ${fromValid ? '✓' : '✗'}, toPersonId=${rel.toPersonId} ${toValid ? '✓' : '✗'}`)
    })
  } else {
    console.log('✅ 所有关系都引用了有效的人物 ID')
  }
  
  console.log('\n检查完成！')
}

main()

