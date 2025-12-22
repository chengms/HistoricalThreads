/**
 * 合并重复人物（会写入数据文件）：
 * - 通过配置映射，把 sourceId 合并进 targetId，并更新 events/relationships 引用
 * - 合并规则尽量保守：不随意覆盖已有字段；nameVariants/类型/来源做并集
 *
 * 用法（仓库根目录）：
 *   node scripts/data/merge_duplicate_persons.js
 */

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'frontend', 'public', 'data')

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function uniqStrings(arr) {
  const out = []
  const seen = new Set()
  for (const v of arr || []) {
    const s = String(v || '').trim()
    if (!s) continue
    if (seen.has(s)) continue
    seen.add(s)
    out.push(s)
  }
  return out
}

function uniqNums(arr) {
  const out = []
  const seen = new Set()
  for (const v of arr || []) {
    if (typeof v !== 'number') continue
    if (seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v)
}

function mergePerson(target, source) {
  // nameVariants：并集 + 把 source.name 也纳入 variants
  const targetName = String(target.name || '').trim()
  const sourceName = String(source.name || '').trim()
  const variants = uniqStrings([
    ...(Array.isArray(target.nameVariants) ? target.nameVariants : []),
    ...(sourceName ? [sourceName] : []),
    ...(Array.isArray(source.nameVariants) ? source.nameVariants : []),
  ]).filter(v => v !== targetName)
  if (variants.length) target.nameVariants = variants

  // biography：取更长的（默认更完整）
  const tb = String(target.biography || '').trim()
  const sb = String(source.biography || '').trim()
  if (!tb && sb) target.biography = sb
  else if (sb && sb.length > tb.length + 80) target.biography = sb

  // birth/death：只在 target 缺失时补齐
  if (!isNum(target.birthYear) && isNum(source.birthYear)) target.birthYear = source.birthYear
  if (!isNum(target.deathYear) && isNum(source.deathYear)) target.deathYear = source.deathYear

  // dynastyId：只在 target 缺失时补齐
  if (!isNum(target.dynastyId) && isNum(source.dynastyId)) target.dynastyId = source.dynastyId

  // personType：并集
  const types = uniqStrings([
    ...(Array.isArray(target.personType) ? target.personType : []),
    ...(Array.isArray(source.personType) ? source.personType : []),
  ])
  if (types.length) target.personType = types

  // sources：并集（数字 id）
  const srcIds = uniqNums([
    ...(Array.isArray(target.sources) ? target.sources : []),
    ...(Array.isArray(source.sources) ? source.sources : []),
  ])
  if (srcIds.length) target.sources = srcIds

  // avatarUrl：target 缺失才补
  if (!String(target.avatarUrl || '').trim() && String(source.avatarUrl || '').trim()) {
    target.avatarUrl = source.avatarUrl
  }

  // 可选的来源字段（内部字段）保留更完整的
  if (!target._bioSource && source._bioSource) target._bioSource = source._bioSource
}

function replaceIdInEvents(events, fromId, toId) {
  let changed = 0
  for (const e of events) {
    const arr = Array.isArray(e.persons) ? e.persons : []
    if (!arr.includes(fromId)) continue
    const next = uniqNums(arr.map(x => (x === fromId ? toId : x))).sort((a, b) => a - b)
    const same = arr.length === next.length && arr.every((v, i) => v === next[i])
    if (!same) {
      e.persons = next
      changed += 1
    }
  }
  return changed
}

function replaceIdInRelationships(rels, fromId, toId) {
  let changed = 0
  for (const r of rels) {
    let touched = false
    if (r.fromPersonId === fromId) {
      r.fromPersonId = toId
      touched = true
    }
    if (r.toPersonId === fromId) {
      r.toPersonId = toId
      touched = true
    }
    if (touched) changed += 1
  }
  return changed
}

function main() {
  const personsPath = path.join(DATA_DIR, 'persons.json')
  const eventsPath = path.join(DATA_DIR, 'events.json')
  const relsPath = path.join(DATA_DIR, 'relationships.json')

  const persons = readJSON(personsPath)
  const events = readJSON(eventsPath)
  const rels = readJSON(relsPath)

  const byId = new Map()
  for (const p of persons) if (p && typeof p.id === 'number') byId.set(p.id, p)

  // sourceId -> targetId（把 source 合并进 target）
  const mergeMap = new Map([
    // 汉武帝/刘彻：保留“汉武帝”(13)，合并“刘彻”(35)
    [35, 13],
    // 成吉思汗/孛儿只斤·铁木真：保留“成吉思汗”(27)，合并“孛儿只斤·铁木真”(37)
    [37, 27],
    // 唐太宗/李世民：保留“唐太宗”(22)，合并“李世民”(36)
    [36, 22],
  ])

  let changedEvents = 0
  let changedRels = 0
  const removedIds = []

  for (const [fromId, toId] of mergeMap.entries()) {
    const from = byId.get(fromId)
    const to = byId.get(toId)
    if (!from || !to) continue

    // 更新引用
    changedEvents += replaceIdInEvents(events, fromId, toId)
    changedRels += replaceIdInRelationships(rels, fromId, toId)

    // 合并人物本体
    mergePerson(to, from)
    removedIds.push(fromId)
    byId.delete(fromId)
  }

  const nextPersons = persons.filter(p => p && typeof p.id === 'number' && !removedIds.includes(p.id))
  // 保持 id 升序稳定
  nextPersons.sort((a, b) => (a.id || 0) - (b.id || 0))

  saveJSON(personsPath, nextPersons)
  saveJSON(eventsPath, events)
  saveJSON(relsPath, rels)

  console.log('[merge_duplicate_persons] done', {
    removedIds,
    changedEvents,
    changedRelationships: changedRels,
    personsBefore: persons.length,
    personsAfter: nextPersons.length,
  })
}

main()


