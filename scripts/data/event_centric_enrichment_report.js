/**
 * 以“事件”为线索生成数据完善报告（不写入原始数据）：
 * - 事件维度：缺 description/location/sources、sources 类型覆盖、事件文本中提到但未挂载的人物建议
 * - 人物维度：按事件出现次数排序（可视作“重要人物”优先级），标出缺 biography/生卒年/朝代/头像/来源
 *
 * 输出：
 * - scripts/reports/event_centric_enrichment_report.json
 *
 * 用法（仓库根目录）：
 *   node scripts/data/event_centric_enrichment_report.js
 */

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'frontend', 'public', 'data')
const REPORT_DIR = path.join(ROOT, 'scripts', 'reports')

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

function isGoodToken(t) {
  const s = String(t || '').trim()
  if (s.length < 2) return false
  // 常见噪音词（避免误报）
  const bad = ['中国', '历史', '时期', '年代', '改革', '战争', '之', '年', '月', '日', '人民', '国家', '朝廷', '皇帝']
  if (bad.includes(s)) return false
  return true
}

function uniqNums(arr) {
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

function buildTokens(persons) {
  const tokens = []
  const tokenToPersonIds = new Map()

  for (const p of persons) {
    if (!p || typeof p.id !== 'number') continue
    const names = [p.name, ...(Array.isArray(p.nameVariants) ? p.nameVariants : [])]
    for (const n of names) {
      if (!isGoodToken(n)) continue
      const token = String(n).trim()
      tokens.push({ token, personId: p.id, name: p.name })
      const set = tokenToPersonIds.get(token) || new Set()
      set.add(p.id)
      tokenToPersonIds.set(token, set)
    }
  }

  // 长词优先匹配，减少短词误报
  tokens.sort((a, b) => b.token.length - a.token.length)
  return { tokens, tokenToPersonIds }
}

function suggestMissingPersonsForEvent(event, tokens, tokenToPersonIds) {
  const text = `${event.title || ''}\n${event.description || ''}`
  if (!text.trim()) return []

  const linked = new Set(Array.isArray(event.persons) ? event.persons.filter(x => typeof x === 'number') : [])
  const matched = new Map() // pid -> {name, token}

  for (const t of tokens) {
    if (linked.has(t.personId)) continue
    if (matched.has(t.personId)) continue
    if (text.includes(t.token)) {
      matched.set(t.personId, { name: t.name, token: t.token })
    }
  }

  const items = [...matched.entries()].map(([personId, v]) => {
    const tokenOwners = tokenToPersonIds.get(v.token)
    const ambiguous = tokenOwners ? tokenOwners.size > 1 : false
    const confidence =
      !ambiguous && v.token === v.name ? 'high' :
      !ambiguous && v.token.length >= 3 ? 'medium' :
      'low'
    return {
      personId,
      name: v.name,
      matchedToken: v.token,
      confidence,
      ambiguousToken: ambiguous,
    }
  })

  // 高置信度优先
  items.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 }
    return (rank[a.confidence] - rank[b.confidence]) || (b.matchedToken.length - a.matchedToken.length)
  })

  return items
}

function summarizeSourceTypes(sourceIds, sourcesById) {
  const counts = new Map()
  for (const sid of sourceIds) {
    const s = sourcesById.get(sid)
    const t = s ? String(s.sourceType || 'unknown') : 'missing_source'
    counts.set(t, (counts.get(t) || 0) + 1)
  }
  return Object.fromEntries([...counts.entries()].sort((a, b) => b[1] - a[1]))
}

function hasSourceType(sourceIds, sourcesById, type) {
  for (const sid of sourceIds) {
    const s = sourcesById.get(sid)
    if (s && s.sourceType === type) return true
  }
  return false
}

function main() {
  const events = readJSON(path.join(DATA_DIR, 'events.json'))
  const persons = readJSON(path.join(DATA_DIR, 'persons.json'))
  const sources = readJSON(path.join(DATA_DIR, 'sources.json'))

  const personsById = new Map()
  for (const p of persons) if (p && typeof p.id === 'number') personsById.set(p.id, p)

  const sourcesById = new Map()
  for (const s of sources) if (s && typeof s.id === 'number') sourcesById.set(s.id, s)

  const { tokens, tokenToPersonIds } = buildTokens(persons)

  // 人物 -> 事件统计
  const personToEvents = new Map() // id -> {count, events:[{id,title,year}]}

  const eventItems = []
  for (const e of events) {
    const personIds = uniqNums(Array.isArray(e.persons) ? e.persons : [])
    const danglingPersonIds = personIds.filter(pid => !personsById.has(pid))

    for (const pid of personIds) {
      if (!personsById.has(pid)) continue
      const cur = personToEvents.get(pid) || { count: 0, events: [] }
      cur.count += 1
      cur.events.push({ id: e.id, title: e.title, year: e.eventYear })
      personToEvents.set(pid, cur)
    }

    const sourceIds = uniqNums(Array.isArray(e.sources) ? e.sources : [])
    const missingCoreFields = {
      missingDescription: !String(e.description || '').trim(),
      missingLocation: !String(e.location || '').trim(),
      missingPersons: personIds.length === 0,
      missingSources: sourceIds.length === 0,
    }

    const suggestions = suggestMissingPersonsForEvent(e, tokens, tokenToPersonIds)
    const hasWeb = hasSourceType(sourceIds, sourcesById, 'authoritative_website')
    const hasTextbook = hasSourceType(sourceIds, sourcesById, 'textbook')
    const hasOfficialHistory = hasSourceType(sourceIds, sourcesById, 'official_history')

    eventItems.push({
      eventId: e.id,
      title: e.title,
      eventYear: e.eventYear,
      dynastyId: e.dynastyId,
      personsCount: personIds.length,
      sourcesCount: sourceIds.length,
      sourcesByType: summarizeSourceTypes(sourceIds, sourcesById),
      coverage: { hasWeb, hasTextbook, hasOfficialHistory },
      danglingPersonIds,
      missingCoreFields,
      suggestedPersons: suggestions.slice(0, 30),
      suggestionsCount: suggestions.length,
    })
  }

  // 事件优先级：缺字段/建议多的排前
  eventItems.sort((a, b) => {
    const score = (x) => {
      let s = 0
      if (x.missingCoreFields.missingDescription) s += 3
      if (x.missingCoreFields.missingLocation) s += 2
      if (x.missingCoreFields.missingSources) s += 3
      if (x.missingCoreFields.missingPersons) s += 3
      s += Math.min(6, x.suggestionsCount) // 最多加 6
      return s
    }
    const ds = score(b) - score(a)
    if (ds !== 0) return ds
    return (a.eventYear ?? 0) - (b.eventYear ?? 0)
  })

  const personItems = []
  for (const [pid, info] of personToEvents.entries()) {
    const p = personsById.get(pid)
    const eventsSorted = info.events.sort((a, b) => (a.year ?? 0) - (b.year ?? 0))

    const srcIds = uniqNums(Array.isArray(p.sources) ? p.sources : [])
    const missing = {
      missingBiography: !String(p.biography || '').trim(),
      missingBirthYear: typeof p.birthYear !== 'number',
      missingDeathYear: typeof p.deathYear !== 'number',
      missingDynastyId: typeof p.dynastyId !== 'number',
      missingAvatarUrl: !String(p.avatarUrl || '').trim(),
      missingSources: srcIds.length === 0,
    }

    personItems.push({
      personId: pid,
      name: p?.name || '',
      dynastyId: p?.dynastyId ?? '',
      eventCount: info.count,
      firstEventYear: eventsSorted[0]?.year ?? '',
      lastEventYear: eventsSorted[eventsSorted.length - 1]?.year ?? '',
      sampleEvents: eventsSorted.slice(0, 8).map(x => `${x.year} ${x.title}`).join(' | '),
      missing,
      sourcesCount: srcIds.length,
      sourcesByType: summarizeSourceTypes(srcIds, sourcesById),
    })
  }

  personItems.sort((a, b) => {
    if (b.eventCount !== a.eventCount) return b.eventCount - a.eventCount
    return String(a.name).localeCompare(String(b.name), 'zh-Hans-CN')
  })

  // 汇总统计
  const eventSummary = {
    total: events.length,
    missingDescription: eventItems.filter(e => e.missingCoreFields.missingDescription).length,
    missingLocation: eventItems.filter(e => e.missingCoreFields.missingLocation).length,
    missingPersons: eventItems.filter(e => e.missingCoreFields.missingPersons).length,
    missingSources: eventItems.filter(e => e.missingCoreFields.missingSources).length,
    eventsWithSuggestions: eventItems.filter(e => e.suggestionsCount > 0).length,
    eventsWithHighConfidenceSuggestions: eventItems.filter(e => e.suggestedPersons.some(x => x.confidence === 'high')).length,
  }

  const personSummary = {
    personsTotal: persons.length,
    personsInEvents: personItems.length,
    topImportant: personItems.slice(0, 15).map(p => ({ personId: p.personId, name: p.name, eventCount: p.eventCount })),
    missingBiography: personItems.filter(p => p.missing.missingBiography).length,
    missingDynastyId: personItems.filter(p => p.missing.missingDynastyId).length,
    missingBirthYear: personItems.filter(p => p.missing.missingBirthYear).length,
    missingDeathYear: personItems.filter(p => p.missing.missingDeathYear).length,
  }

  const out = {
    generatedAt: new Date().toISOString(),
    dataDir: DATA_DIR,
    summary: { events: eventSummary, persons: personSummary },
    events: eventItems,
    persons: personItems,
  }

  ensureDir(REPORT_DIR)
  const outPath = path.join(REPORT_DIR, 'event_centric_enrichment_report.json')
  saveJSON(outPath, out)

  console.log('[event_centric_enrichment_report] done', {
    report: outPath,
    events: eventSummary,
    persons: personSummary,
  })
}

main()


