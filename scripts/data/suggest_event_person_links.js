/**
 * 事件 → 人物关联建议（不写入数据）：
 * - 通过匹配 persons.name / persons.nameVariants 在事件 title/description 中出现的情况
 * - 输出：哪些事件文本里提到了某人物，但 event.persons 没有挂上
 *
 * 输出：
 * - scripts/reports/suggest_event_person_links.json
 *
 * 用法：
 *   node scripts/data/suggest_event_person_links.js
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
  // 过滤常见噪音
  const bad = ['中国', '历史', '时期', '年代', '改革', '战争', '之', '年', '月', '日']
  if (bad.includes(s)) return false
  return true
}

function main() {
  const events = readJSON(path.join(DATA_DIR, 'events.json'))
  const persons = readJSON(path.join(DATA_DIR, 'persons.json'))

  const tokens = []
  for (const p of persons) {
    if (!p || typeof p.id !== 'number') continue
    const names = [p.name, ...(Array.isArray(p.nameVariants) ? p.nameVariants : [])]
    for (const n of names) {
      if (!isGoodToken(n)) continue
      tokens.push({ token: String(n).trim(), personId: p.id, name: p.name })
    }
  }

  // 长词优先匹配，减少短词误报
  tokens.sort((a, b) => b.token.length - a.token.length)

  const suggestions = []
  let scanned = 0

  for (const e of events) {
    const text = `${e.title || ''}\n${e.description || ''}`
    if (!text.trim()) continue
    scanned += 1

    const linked = new Set(Array.isArray(e.persons) ? e.persons.filter(x => typeof x === 'number') : [])
    const matched = new Map() // pid -> {name, token}

    for (const t of tokens) {
      if (linked.has(t.personId)) continue
      if (matched.has(t.personId)) continue
      if (text.includes(t.token)) {
        matched.set(t.personId, { name: t.name, token: t.token })
      }
    }

    if (matched.size) {
      const items = [...matched.entries()].map(([personId, v]) => ({
        personId,
        name: v.name,
        matchedToken: v.token,
      }))
      suggestions.push({
        eventId: e.id,
        title: e.title,
        eventYear: e.eventYear,
        suggestedPersons: items.slice(0, 20),
        total: items.length,
      })
    }
  }

  // 按建议数量排序
  suggestions.sort((a, b) => (b.total || 0) - (a.total || 0))

  ensureDir(REPORT_DIR)
  saveJSON(path.join(REPORT_DIR, 'suggest_event_person_links.json'), {
    generatedAt: new Date().toISOString(),
    totalEvents: events.length,
    scannedEvents: scanned,
    eventsWithSuggestions: suggestions.length,
    items: suggestions,
  })

  console.log('[suggest_event_person_links] done', {
    scannedEvents: scanned,
    eventsWithSuggestions: suggestions.length,
    report: path.join(REPORT_DIR, 'suggest_event_person_links.json'),
  })
}

main()


