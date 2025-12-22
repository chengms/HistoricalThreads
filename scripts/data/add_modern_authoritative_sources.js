/**
 * 为民国/新中国等“现代事件”补充更权威/多样的来源（写入 sources.json + events.json）：
 * - 目标：在保留教材+百科的基础上，补 1 条非百度百科的权威链接（如 Wikipedia / WTO 官网）
 * - 支持 --dry-run：只输出统计，不写文件
 *
 * 用法（仓库根目录）：
 *   node scripts/data/add_modern_authoritative_sources.js --dry-run
 *   node scripts/data/add_modern_authoritative_sources.js
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

function maxId(list) {
  let m = 0
  for (const x of list) {
    const id = x && typeof x.id === 'number' ? x.id : 0
    if (id > m) m = id
  }
  return m
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

function isBaiduBaike(url) {
  const u = String(url || '').toLowerCase()
  return u.includes('baike.baidu.com')
}

function main() {
  const opts = parseArgs()
  const eventsPath = path.join(DATA_DIR, 'events.json')
  const sourcesPath = path.join(DATA_DIR, 'sources.json')

  const events = readJSON(eventsPath)
  const sources = readJSON(sourcesPath)

  const sourcesById = new Map()
  const sourcesByUrl = new Map()
  for (const s of sources) {
    if (!s || typeof s.id !== 'number') continue
    sourcesById.set(s.id, s)
    const url = typeof s.url === 'string' ? s.url.trim() : ''
    if (url) sourcesByUrl.set(url, s)
  }

  let nextSourceId = maxId(sources) + 1

  const upsertSourceByUrl = (spec) => {
    const url = String(spec.url || '').trim()
    if (!url) return null
    const existed = sourcesByUrl.get(url)
    if (existed) return existed.id
    const entry = {
      id: nextSourceId++,
      title: String(spec.title || url),
      url,
      sourceType: spec.sourceType || 'authoritative_website',
      credibilityLevel: typeof spec.credibilityLevel === 'number' ? spec.credibilityLevel : 3,
      verified: false,
    }
    sources.push(entry)
    sourcesByUrl.set(url, entry)
    sourcesById.set(entry.id, entry)
    return entry.id
  }

  // 仅覆盖目前仍缺“非百度百科链接”的现代事件（id 28-35）
  const plan = new Map([
    [28, { title: '维基百科：中华民国', url: 'https://zh.wikipedia.org/wiki/中华民国', sourceType: 'authoritative_website', credibilityLevel: 3 }],
    [29, { title: '维基百科：五四运动', url: 'https://zh.wikipedia.org/wiki/五四运动', sourceType: 'authoritative_website', credibilityLevel: 3 }],
    [30, { title: '维基百科：七七事变（全面抗战爆发）', url: 'https://zh.wikipedia.org/wiki/七七事变', sourceType: 'authoritative_website', credibilityLevel: 3 }],
    [31, { title: '维基百科：中国抗日战争', url: 'https://zh.wikipedia.org/wiki/中国抗日战争', sourceType: 'authoritative_website', credibilityLevel: 3 }],
    [32, { title: '维基百科：开国大典', url: 'https://zh.wikipedia.org/wiki/开国大典', sourceType: 'authoritative_website', credibilityLevel: 3 }],
    [33, { title: '维基百科：朝鲜战争（抗美援朝）', url: 'https://zh.wikipedia.org/wiki/朝鲜战争', sourceType: 'authoritative_website', credibilityLevel: 3 }],
    [34, { title: '维基百科：改革开放', url: 'https://zh.wikipedia.org/wiki/改革开放', sourceType: 'authoritative_website', credibilityLevel: 3 }],
    [35, { title: 'WTO：China and the WTO', url: 'https://www.wto.org/english/thewto_e/countries_e/china_e.htm', sourceType: 'authoritative_website', credibilityLevel: 4 }],
  ])

  const byEventId = new Map(events.map(e => [e.id, e]))

  const stats = {
    dryRun: !!opts.dryRun,
    totalPlanned: plan.size,
    changedEvents: 0,
    addedSources: 0,
    skippedAlreadyHasNonBaikeLink: 0,
    skippedMissingEvent: 0,
    changedEventIds: [],
  }

  const sourcesBefore = sources.length

  for (const [eventId, spec] of plan.entries()) {
    const e = byEventId.get(eventId)
    if (!e) {
      stats.skippedMissingEvent += 1
      continue
    }
    const srcIds = uniqNums(Array.isArray(e.sources) ? e.sources : [])
    const srcObjs = srcIds.map(id => sourcesById.get(id)).filter(Boolean)
    const hasNonBaikeLink = srcObjs.some(s => s.url && !isBaiduBaike(s.url))
    if (hasNonBaikeLink) {
      stats.skippedAlreadyHasNonBaikeLink += 1
      continue
    }

    const sid = upsertSourceByUrl(spec)
    if (typeof sid !== 'number') continue

    const next = uniqNums([...srcIds, sid]).sort((a, b) => a - b)
    const same = srcIds.length === next.length && srcIds.every((v, i) => v === next[i])
    if (!same) {
      e.sources = next
      stats.changedEvents += 1
      stats.changedEventIds.push(eventId)
    }
  }

  stats.addedSources = sources.length - sourcesBefore

  if (!opts.dryRun) {
    saveJSON(sourcesPath, sources)
    saveJSON(eventsPath, events)
  }

  console.log('[add_modern_authoritative_sources] done', stats)
}

main()


