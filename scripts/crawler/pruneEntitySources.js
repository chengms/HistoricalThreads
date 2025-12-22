/**
 * 将 entities 的 sources 数组做“去噪/瘦身”：
 * - 保留：所有教材（sourceType=textbook）
 * - 保留：1 条最佳百科/网站确认链接（sourceType=authoritative_website，优先百度百科）
 * - 可选：保留 1 条史书（sourceType=official_history）
 *
 * 用法（在仓库根目录）：
 *   node scripts/crawler/pruneEntitySources.js
 *   node scripts/crawler/pruneEntitySources.js --keep-official-history
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

function parseArgs() {
  const args = new Set(process.argv.slice(2))
  return {
    keepOfficialHistory: args.has('--keep-official-history'),
  }
}

function scoreWebsite(url) {
  const u = (url || '').toLowerCase()
  if (u.includes('baike.baidu.com')) return 1000
  if (u.includes('baike.sogou.com')) return 950
  if (u.includes('baike.so.com')) return 930
  if (u.includes('zh.wikipedia.org')) return 900
  if (u.includes('wikipedia.org')) return 880
  if (u.includes('britannica.com')) return 860
  if (u.includes('wikidata.org')) return 840
  return 800
}

function pickBestWebsiteSourceId(sourceObjs) {
  const websites = sourceObjs.filter(s => s && s.sourceType === 'authoritative_website')
  if (!websites.length) return null
  let best = websites[0]
  let bestScore = scoreWebsite(best.url)
  for (const s of websites.slice(1)) {
    const sc = scoreWebsite(s.url)
    if (sc > bestScore) {
      best = s
      bestScore = sc
    }
  }
  return typeof best.id === 'number' ? best.id : null
}

function uniqInts(arr) {
  const out = []
  const seen = new Set()
  for (const v of arr) {
    if (typeof v !== 'number') continue
    if (seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

function pruneEntitySources(entities, byId, opts) {
  let changed = 0
  for (const e of entities) {
    const ids = Array.isArray(e.sources) ? e.sources.filter(x => typeof x === 'number') : []
    const objs = ids.map(id => byId.get(id)).filter(Boolean)

    const keep = []
    // 教材：全保留
    for (const s of objs) {
      if (s.sourceType === 'textbook' && typeof s.id === 'number') keep.push(s.id)
    }

    // 1 条百科确认链接
    const bestWeb = pickBestWebsiteSourceId(objs)
    if (bestWeb) keep.push(bestWeb)

    // 可选：保留 1 条史书（用最早出现的那条）
    if (opts.keepOfficialHistory) {
      const oh = objs.find(s => s.sourceType === 'official_history' && typeof s.id === 'number')
      if (oh) keep.push(oh.id)
    }

    const next = uniqInts(keep)
    const prev = uniqInts(ids)
    const same = prev.length === next.length && prev.every((v, i) => v === next[i])
    if (!same) {
      e.sources = next
      changed += 1
    }
  }
  return changed
}

function main() {
  const opts = parseArgs()

  const sourcesPath = path.join(DATA_DIR, 'sources.json')
  const personsPath = path.join(DATA_DIR, 'persons.json')
  const eventsPath = path.join(DATA_DIR, 'events.json')

  const sources = readJSON(sourcesPath)
  const persons = readJSON(personsPath)
  const events = readJSON(eventsPath)

  const byId = new Map()
  for (const s of sources) {
    if (s && typeof s.id === 'number') byId.set(s.id, s)
  }

  const changedPersons = pruneEntitySources(persons, byId, opts)
  const changedEvents = pruneEntitySources(events, byId, opts)

  saveJSON(personsPath, persons)
  saveJSON(eventsPath, events)

  console.log('[pruneEntitySources] done', {
    keepOfficialHistory: !!opts.keepOfficialHistory,
    changedPersons,
    changedEvents,
    persons: persons.length,
    events: events.length,
  })
}

main()


