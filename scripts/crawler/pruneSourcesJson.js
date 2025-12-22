/**
 * 清理 sources.json：移除未被任何事件/人物引用的来源，避免百科检索链接无限膨胀。
 * - 永久保留：textbook / official_history（即使暂时未引用也保留）
 * - 其余类型：仅保留被引用的 sourceId
 *
 * 用法（在仓库根目录）：
 *   node scripts/crawler/pruneSourcesJson.js
 */

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'frontend', 'public', 'data')

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function uniqNums(arr) {
  const out = new Set()
  for (const v of arr) if (typeof v === 'number') out.add(v)
  return out
}

function collectUsedSourceIds(entities) {
  const used = new Set()
  for (const it of entities) {
    const ids = Array.isArray(it.sources) ? it.sources : []
    for (const id of ids) if (typeof id === 'number') used.add(id)
  }
  return used
}

function main() {
  const sourcesPath = path.join(DATA_DIR, 'sources.json')
  const personsPath = path.join(DATA_DIR, 'persons.json')
  const eventsPath = path.join(DATA_DIR, 'events.json')

  const sources = readJSON(sourcesPath)
  const persons = readJSON(personsPath)
  const events = readJSON(eventsPath)

  const used = new Set([
    ...collectUsedSourceIds(persons),
    ...collectUsedSourceIds(events),
  ])

  const alwaysKeepTypes = new Set(['textbook', 'official_history'])

  const before = sources.length
  const kept = []
  const removedIds = []

  for (const s of sources) {
    if (!s || typeof s.id !== 'number') continue
    const t = s.sourceType
    if (alwaysKeepTypes.has(t)) {
      kept.push(s)
      continue
    }
    if (used.has(s.id)) {
      kept.push(s)
    } else {
      removedIds.push(s.id)
    }
  }

  saveJSON(sourcesPath, kept)

  console.log('[pruneSourcesJson] done', {
    sourcesBefore: before,
    sourcesAfter: kept.length,
    removed: removedIds.length,
    usedIds: used.size,
  })
}

main()


