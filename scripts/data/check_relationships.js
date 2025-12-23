/**
 * 检查人物关系数据是否有问题
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../../frontend/public/data')
const relationshipsPath = path.join(dataDir, 'relationships.json')
const personsPath = path.join(dataDir, 'persons.json')

const relationships = JSON.parse(fs.readFileSync(relationshipsPath, 'utf-8'))
const persons = JSON.parse(fs.readFileSync(personsPath, 'utf-8'))

// 有效的关系类型
const validRelationshipTypes = [
  'teacher_student',
  'colleague',
  'enemy',
  'family',
  'friend',
  'mentor',
  'influence',
  'cooperation',
  'other'
]

// 创建人物ID映射
const personIds = new Set(persons.map(p => p.id))
const personById = new Map(persons.map(p => [p.id, p]))

const issues = []

console.log('=== 检查人物关系数据 ===\n')

// 1. 检查fromPersonId和toPersonId是否存在
relationships.forEach(rel => {
  if (!personIds.has(rel.fromPersonId)) {
    issues.push({
      type: 'missing_person',
      relationshipId: rel.id,
      message: `fromPersonId ${rel.fromPersonId} 不存在`,
      relationship: rel
    })
  }
  
  if (!personIds.has(rel.toPersonId)) {
    issues.push({
      type: 'missing_person',
      relationshipId: rel.id,
      message: `toPersonId ${rel.toPersonId} 不存在`,
      relationship: rel
    })
  }
})

// 2. 检查自引用
relationships.forEach(rel => {
  if (rel.fromPersonId === rel.toPersonId) {
    issues.push({
      type: 'self_reference',
      relationshipId: rel.id,
      message: `关系 ${rel.id} 存在自引用（fromPersonId === toPersonId === ${rel.fromPersonId}）`,
      relationship: rel
    })
  }
})

// 3. 检查关系类型是否有效
relationships.forEach(rel => {
  if (!validRelationshipTypes.includes(rel.relationshipType)) {
    issues.push({
      type: 'invalid_type',
      relationshipId: rel.id,
      message: `关系类型 "${rel.relationshipType}" 无效，有效类型：${validRelationshipTypes.join(', ')}`,
      relationship: rel
    })
  }
})

// 4. 检查strength范围
relationships.forEach(rel => {
  if (rel.strength !== undefined) {
    if (rel.strength < 1 || rel.strength > 5) {
      issues.push({
        type: 'invalid_strength',
        relationshipId: rel.id,
        message: `关系强度 ${rel.strength} 超出范围（应为1-5）`,
        relationship: rel
      })
    }
  }
})

// 5. 检查时间合理性
relationships.forEach(rel => {
  const fromPerson = personById.get(rel.fromPersonId)
  const toPerson = personById.get(rel.toPersonId)
  
  if (fromPerson && toPerson && rel.startYear) {
    // 检查startYear是否在两个人的生卒年范围内
    if (fromPerson.deathYear && rel.startYear > fromPerson.deathYear) {
      issues.push({
        type: 'invalid_time',
        relationshipId: rel.id,
        message: `startYear ${rel.startYear} 晚于 fromPerson (${fromPerson.name}) 的死亡年份 ${fromPerson.deathYear}`,
        relationship: rel
      })
    }
    if (toPerson.deathYear && rel.startYear > toPerson.deathYear) {
      issues.push({
        type: 'invalid_time',
        relationshipId: rel.id,
        message: `startYear ${rel.startYear} 晚于 toPerson (${toPerson.name}) 的死亡年份 ${toPerson.deathYear}`,
        relationship: rel
      })
    }
    if (fromPerson.birthYear && rel.startYear < fromPerson.birthYear) {
      issues.push({
        type: 'invalid_time',
        relationshipId: rel.id,
        message: `startYear ${rel.startYear} 早于 fromPerson (${fromPerson.name}) 的出生年份 ${fromPerson.birthYear}`,
        relationship: rel
      })
    }
    if (toPerson.birthYear && rel.startYear < toPerson.birthYear) {
      issues.push({
        type: 'invalid_time',
        relationshipId: rel.id,
        message: `startYear ${rel.startYear} 早于 toPerson (${toPerson.name}) 的出生年份 ${toPerson.birthYear}`,
        relationship: rel
      })
    }
  }
  
  if (rel.endYear && rel.startYear && rel.endYear < rel.startYear) {
    issues.push({
      type: 'invalid_time',
      relationshipId: rel.id,
      message: `endYear ${rel.endYear} 早于 startYear ${rel.startYear}`,
      relationship: rel
    })
  }
})

// 6. 检查重复关系
const relationshipKeys = new Map()
relationships.forEach(rel => {
  const key1 = `${rel.fromPersonId}-${rel.toPersonId}-${rel.relationshipType}`
  const key2 = `${rel.toPersonId}-${rel.fromPersonId}-${rel.relationshipType}`
  
  // 检查是否有完全相同的（包括反向）
  if (relationshipKeys.has(key1)) {
    issues.push({
      type: 'duplicate',
      relationshipId: rel.id,
      message: `关系 ${rel.id} 与关系 ${relationshipKeys.get(key1)} 重复（相同的人物对和关系类型）`,
      relationship: rel
    })
  } else {
    relationshipKeys.set(key1, rel.id)
  }
  
  // 对于某些关系类型，检查反向是否合理
  if (rel.relationshipType === 'enemy' || rel.relationshipType === 'cooperation' || rel.relationshipType === 'colleague') {
    if (relationshipKeys.has(key2) && relationshipKeys.get(key2) !== rel.id) {
      // 这是反向关系，可能是合理的，但需要检查
      const existingRel = relationships.find(r => r.id === relationshipKeys.get(key2))
      if (existingRel && existingRel.relationshipType !== rel.relationshipType) {
        issues.push({
          type: 'conflicting_relationship',
          relationshipId: rel.id,
          message: `关系 ${rel.id} 与关系 ${relationshipKeys.get(key2)} 存在矛盾（相同人物对但关系类型不同：${rel.relationshipType} vs ${existingRel.relationshipType}）`,
          relationship: rel
        })
      }
    }
  }
})

// 7. 检查描述是否太短
relationships.forEach(rel => {
  if (!rel.description || rel.description.trim().length < 10) {
    issues.push({
      type: 'short_description',
      relationshipId: rel.id,
      message: `关系描述太短（${rel.description ? rel.description.length : 0}字，建议至少10字）`,
      relationship: rel
    })
  }
})

// 8. 检查关系类型是否合理
relationships.forEach(rel => {
  const fromPerson = personById.get(rel.fromPersonId)
  const toPerson = personById.get(rel.toPersonId)
  
  if (!fromPerson || !toPerson) return
  
  // 检查某些关系类型是否合理
  if (rel.relationshipType === 'colleague') {
    // colleague通常指同僚关系，但有些描述说是君臣关系，应该用mentor或其他
    if (rel.description && (rel.description.includes('君臣') || rel.description.includes('皇帝') || rel.description.includes('君主'))) {
      issues.push({
        type: 'type_mismatch',
        relationshipId: rel.id,
        message: `关系类型为colleague但描述提到君臣关系，建议改为mentor或其他类型`,
        relationship: rel
      })
    }
  }
})

// 按类型分组问题
const issuesByType = {}
issues.forEach(issue => {
  if (!issuesByType[issue.type]) {
    issuesByType[issue.type] = []
  }
  issuesByType[issue.type].push(issue)
})

// 输出结果
if (issues.length === 0) {
  console.log('✓ 未发现任何问题！\n')
} else {
  console.log(`发现 ${issues.length} 个问题：\n`)
  
  Object.keys(issuesByType).forEach(type => {
    console.log(`\n[${type}] ${issuesByType[type].length} 个问题：`)
    issuesByType[type].forEach(issue => {
      const fromPerson = personById.get(issue.relationship.fromPersonId)
      const toPerson = personById.get(issue.relationship.toPersonId)
      const fromName = fromPerson ? fromPerson.name : `ID:${issue.relationship.fromPersonId}`
      const toName = toPerson ? toPerson.name : `ID:${issue.relationship.toPersonId}`
      
      console.log(`  关系 ${issue.relationshipId}: ${fromName} -> ${toName} (${issue.relationship.relationshipType})`)
      console.log(`    ${issue.message}`)
    })
  })
}

// 生成报告
const report = {
  total: relationships.length,
  issues: issues.length,
  issuesByType: Object.keys(issuesByType).reduce((acc, type) => {
    acc[type] = issuesByType[type].length
    return acc
  }, {}),
  details: issues
}

const reportPath = path.join(__dirname, 'relationships_check_report.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
console.log(`\n详细报告已保存到: ${reportPath}`)

