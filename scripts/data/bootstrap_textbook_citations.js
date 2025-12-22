/**
 * 从 events/persons 的 sources 自动生成“教材 citations”（不含页码，留待后续补齐）：
 * - 仅把 sourceType=textbook 的 sources 转为 citations
 * - citation 结构：{ sourceId, note: '待补页码' }
 * - 若已存在 citations，则只补齐缺失的 sourceId
 *
 * 用法（仓库根目录）：
 *   node scripts/data/bootstrap_textbook_citations.js --dry-run
 *   node scripts/data/bootstrap_textbook_citations.js
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

function parseArgs() {
  const args = new Set(process.argv.slice(2))
  return { dryRun: args.has('--dry-run') }
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

function existingCitationIds(citations) {
  const set = new Set()
  for (const c of Array.isArray(citations) ? citations : []) {
    if (c && typeof c === 'object' && typeof c.sourceId === 'number') set.add(c.sourceId)
  }
  return set
}

function main() {
  const opts = parseArgs()

  const eventsPath = path.join(DATA_DIR, 'events.json')
  const personsPath = path.join(DATA_DIR, 'persons.json')
  const sourcesPath = path.join(DATA_DIR, 'sources.json')

  const events = readJSON(eventsPath)
  const persons = readJSON(personsPath)
  const sources = readJSON(sourcesPath)

  const sourcesById = new Map()
  for (const s of sources) if (s && typeof s.id === 'number') sourcesById.set(s.id, s)

  const stats = {
    dryRun: !!opts.dryRun,
    eventsChanged: 0,
    personsChanged: 0,
    eventCitationsAdded: 0,
    personCitationsAdded: 0,
    textbookSourceIdsUsed: 0,
  }

  const addCitationsForEntity = (entity, kind) => {
    const srcIds = uniqNums(Array.isArray(entity.sources) ? entity.sources : [])
    const textbookIds = srcIds.filter(id => sourcesById.get(id)?.sourceType === 'textbook')
    if (!textbookIds.length) return 0

    const existing = existingCitationIds(entity.citations)
    const toAdd = textbookIds.filter(id => !existing.has(id))
    if (!toAdd.length) return 0

    const next = Array.isArray(entity.citations) ? [...entity.citations] : []
    for (const id of toAdd) {
      next.push({ sourceId: id, note: '待补页码' })
    }
    entity.citations = next

    if (kind === 'event') stats.eventCitationsAdded += toAdd.length
    else stats.personCitationsAdded += toAdd.length

    return 1
  }

  for (const e of events) {
    stats.eventsChanged += addCitationsForEntity(e, 'event')
  }
  for (const p of persons) {
    stats.personsChanged += addCitationsForEntity(p, 'person')
  }

  // 统计被引用到的教材 sourceId（便于后续补页码时聚焦）
  const usedTextbookIds = new Set()
  for (const e of events) {
    for (const c of Array.isArray(e.citations) ? e.citations : []) {
      if (c && typeof c.sourceId === 'number' && sourcesById.get(c.sourceId)?.sourceType === 'textbook') usedTextbookIds.add(c.sourceId)
    }
  }
  for (const p of persons) {
    for (const c of Array.isArray(p.citations) ? p.citations : []) {
      if (c && typeof c.sourceId === 'number' && sourcesById.get(c.sourceId)?.sourceType === 'textbook') usedTextbookIds.add(c.sourceId)
    }
  }
  stats.textbookSourceIdsUsed = usedTextbookIds.size

  if (!opts.dryRun) {
    saveJSON(eventsPath, events)
    saveJSON(personsPath, persons)
  }

  console.log('[bootstrap_textbook_citations] done', stats)
}

main()


