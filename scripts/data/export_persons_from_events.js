/**
 * 以“事件”为中心整理人物：
 * - 读取 frontend/public/data/events.json + persons.json
 * - 清理 events.json 里 persons 字段：去重、只保留存在的 personId
 * - 导出人物清单（仅统计“在事件中出现过的人物”）：
 *   - scripts/reports/persons_in_events.json
 *   - scripts/reports/persons_in_events.csv
 *
 * 用法（仓库根目录）：
 *   node scripts/data/export_persons_from_events.js
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

function csvEscape(v) {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function toCsv(rows) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = []
  lines.push(headers.map(csvEscape).join(','))
  for (const r of rows) {
    lines.push(headers.map(h => csvEscape(r[h])).join(','))
  }
  return lines.join('\n') + '\n'
}

function main() {
  const eventsPath = path.join(DATA_DIR, 'events.json')
  const personsPath = path.join(DATA_DIR, 'persons.json')

  const events = readJSON(eventsPath)
  const persons = readJSON(personsPath)

  const personsById = new Map()
  for (const p of persons) {
    if (p && typeof p.id === 'number') personsById.set(p.id, p)
  }

  const personToEvents = new Map() // id -> {count, events:[{id,title,year}]}
  let removedDangling = 0
  let changedEvents = 0

  for (const e of events) {
    const raw = Array.isArray(e.persons) ? e.persons : []
    const uniq = uniqNums(raw)
    const valid = uniq.filter(id => personsById.has(id))
    removedDangling += (uniq.length - valid.length)
    const same = raw.length === valid.length && raw.every((v, i) => v === valid[i])
    if (!same) {
      e.persons = valid
      changedEvents += 1
    }
    for (const pid of valid) {
      const cur = personToEvents.get(pid) || { count: 0, events: [] }
      cur.count += 1
      cur.events.push({ id: e.id, title: e.title, year: e.eventYear })
      personToEvents.set(pid, cur)
    }
  }

  // 按出现次数排序导出
  const list = []
  for (const [pid, info] of personToEvents.entries()) {
    const p = personsById.get(pid)
    const eventsSorted = info.events.sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
    list.push({
      personId: pid,
      name: p?.name || '',
      dynastyId: p?.dynastyId ?? '',
      eventCount: info.count,
      firstEventYear: eventsSorted[0]?.year ?? '',
      lastEventYear: eventsSorted[eventsSorted.length - 1]?.year ?? '',
      sampleEvents: eventsSorted.slice(0, 8).map(x => `${x.year} ${x.title}`).join(' | '),
      allEventIds: eventsSorted.map(x => x.id),
    })
  }

  list.sort((a, b) => {
    if (b.eventCount !== a.eventCount) return b.eventCount - a.eventCount
    return String(a.name).localeCompare(String(b.name), 'zh-Hans-CN')
  })

  ensureDir(REPORT_DIR)
  saveJSON(path.join(REPORT_DIR, 'persons_in_events.json'), {
    generatedAt: new Date().toISOString(),
    totalEvents: events.length,
    totalPersons: persons.length,
    personsInEvents: list.length,
    changedEvents,
    removedDanglingPersonIds: removedDangling,
    items: list,
  })

  const csvRows = list.map(x => ({
    personId: x.personId,
    name: x.name,
    dynastyId: x.dynastyId,
    eventCount: x.eventCount,
    firstEventYear: x.firstEventYear,
    lastEventYear: x.lastEventYear,
    sampleEvents: x.sampleEvents,
  }))
  fs.writeFileSync(path.join(REPORT_DIR, 'persons_in_events.csv'), toCsv(csvRows), 'utf8')

  // 保存清理后的 events.json（只影响 persons 字段排序/去重/去悬空）
  saveJSON(eventsPath, events)

  console.log('[export_persons_from_events] done', {
    personsInEvents: list.length,
    changedEvents,
    removedDanglingPersonIds: removedDangling,
    reportDir: REPORT_DIR,
  })
}

main()


