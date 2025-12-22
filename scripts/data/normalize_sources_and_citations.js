/**
 * 统一整理 events/persons 的 sources 与 citations（可选写回）：
 * - sources：去重、仅保留存在于 sources.json 的 number id、排序
 * - citations：按 sourceId 去重（合并字段）、仅保留存在于 sources.json 的 number sourceId、排序
 *
 * 说明：
 * - 不做“删减来源类型”的激进操作，只做一致性与稳定性整理
 *
 * 用法（仓库根目录）：
 *   node scripts/data/normalize_sources_and_citations.js --dry-run
 *   node scripts/data/normalize_sources_and_citations.js
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

function uniqNumsFiltered(arr, exists) {
  const out = []
  const seen = new Set()
  for (const v of Array.isArray(arr) ? arr : []) {
    if (typeof v !== 'number' || !Number.isFinite(v)) continue
    if (!exists(v)) continue
    if (seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  out.sort((a, b) => a - b)
  return out
}

function mergeCitations(citations, exists) {
  const byId = new Map() // sourceId -> citation
  for (const c of Array.isArray(citations) ? citations : []) {
    if (!c || typeof c !== 'object') continue
    const sourceId = c.sourceId
    if (typeof sourceId !== 'number' || !Number.isFinite(sourceId)) continue
    if (!exists(sourceId)) continue

    const cur = byId.get(sourceId) || { sourceId }
    // 合并字段：保留已有非空，其余用新的补
    for (const k of ['page', 'line', 'chapter', 'note']) {
      const curV = typeof cur[k] === 'string' ? cur[k].trim() : ''
      const nxtV = typeof c[k] === 'string' ? c[k].trim() : ''
      if (!curV && nxtV) cur[k] = nxtV
    }
    byId.set(sourceId, cur)
  }

  const out = [...byId.values()]
  out.sort((a, b) => a.sourceId - b.sourceId)
  return out.length ? out : undefined
}

function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

function main() {
  const opts = parseArgs()

  const eventsPath = path.join(DATA_DIR, 'events.json')
  const personsPath = path.join(DATA_DIR, 'persons.json')
  const sourcesPath = path.join(DATA_DIR, 'sources.json')

  const events = readJSON(eventsPath)
  const persons = readJSON(personsPath)
  const sources = readJSON(sourcesPath)

  const sourceIdSet = new Set()
  for (const s of sources) if (s && typeof s.id === 'number') sourceIdSet.add(s.id)
  const exists = (id) => sourceIdSet.has(id)

  const stats = {
    dryRun: !!opts.dryRun,
    eventsChanged: 0,
    personsChanged: 0,
    eventsSourcesChanged: 0,
    personsSourcesChanged: 0,
    eventsCitationsChanged: 0,
    personsCitationsChanged: 0,
  }

  for (const e of events) {
    let changed = false
    const nextSources = uniqNumsFiltered(e.sources, exists)
    if (!arraysEqual(uniqNumsFiltered(e.sources, exists), nextSources)) {
      // (上面两次计算一致，但写得更直观；真实对比用原数组长度/顺序)
    }
    const prevSources = Array.isArray(e.sources) ? e.sources.filter(x => typeof x === 'number' && exists(x)) : []
    const prevNorm = uniqNumsFiltered(prevSources, exists)
    if (!arraysEqual(prevNorm, nextSources)) {
      e.sources = nextSources
      stats.eventsSourcesChanged += 1
      changed = true
    }

    const prevCits = Array.isArray(e.citations) ? e.citations : undefined
    const nextCits = mergeCitations(prevCits, exists)
    const prevKey = JSON.stringify(prevCits || [])
    const nextKey = JSON.stringify(nextCits || [])
    if (prevKey !== nextKey) {
      if (nextCits) e.citations = nextCits
      else delete e.citations
      stats.eventsCitationsChanged += 1
      changed = true
    }

    if (changed) stats.eventsChanged += 1
  }

  for (const p of persons) {
    let changed = false
    const prevSources = Array.isArray(p.sources) ? p.sources.filter(x => typeof x === 'number' && exists(x)) : []
    const nextSources = uniqNumsFiltered(prevSources, exists)
    const prevNorm = uniqNumsFiltered(prevSources, exists)
    if (!arraysEqual(prevNorm, nextSources)) {
      p.sources = nextSources
      stats.personsSourcesChanged += 1
      changed = true
    }

    const prevCits = Array.isArray(p.citations) ? p.citations : undefined
    const nextCits = mergeCitations(prevCits, exists)
    const prevKey = JSON.stringify(prevCits || [])
    const nextKey = JSON.stringify(nextCits || [])
    if (prevKey !== nextKey) {
      if (nextCits) p.citations = nextCits
      else delete p.citations
      stats.personsCitationsChanged += 1
      changed = true
    }

    if (changed) stats.personsChanged += 1
  }

  if (!opts.dryRun) {
    saveJSON(eventsPath, events)
    saveJSON(personsPath, persons)
  }

  console.log('[normalize_sources_and_citations] done', stats)
}

main()


