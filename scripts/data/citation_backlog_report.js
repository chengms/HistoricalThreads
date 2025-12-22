/**
 * 生成“教材 citations 待补章节/页码”工作清单（不改数据）：
 * - 从 events.json / persons.json 读取 citations
 * - 仅关注 sourceType=textbook 的 citation
 * - 输出：scripts/reports/citation_backlog_report.json + .csv
 *
 * 字段：
 * - entityType/eventId/personId/name
 * - sourceId/sourceTitle
 * - chapter/page/line/note（当前值）
 * - suggestedChapter（按年份/朝代给一个粗分段建议，便于 Excel 先填）
 *
 * 用法（仓库根目录）：
 *   node scripts/data/citation_backlog_report.js
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
  for (const r of rows) lines.push(headers.map(h => csvEscape(r[h])).join(','))
  return lines.join('\n') + '\n'
}

function suggestEra(hintYear, hintDynasty) {
  const y = typeof hintYear === 'number' ? hintYear : null
  const d = String(hintDynasty || '').trim()

  if (y !== null) {
    if (y < -1046) return '上古（夏商周以前）'
    if (-1046 <= y && y < -770) return '西周'
    if (-770 <= y && y < -475) return '春秋'
    if (-475 <= y && y < -221) return '战国'
    if (-221 <= y && y < 220) return '秦汉'
    if (220 <= y && y < 589) return '魏晋南北朝'
    if (589 <= y && y < 960) return '隋唐'
    if (960 <= y && y < 1279) return '宋'
    if (1279 <= y && y < 1368) return '元'
    if (1368 <= y && y < 1644) return '明'
    if (1644 <= y && y < 1840) return '清前期'
    if (1840 <= y && y < 1949) return '近代（1840-1949）'
    if (1949 <= y) return '现代（1949-）'
  }

  if (d) {
    if (d.includes('夏') || d.includes('商')) return '上古（夏商）'
    if (d.includes('周')) return '西周/东周'
    if (d.includes('春秋')) return '春秋'
    if (d.includes('战国')) return '战国'
    if (d.includes('秦')) return '秦'
    if (d.includes('汉')) return '汉'
    if (d.includes('三国') || d.includes('晋') || d.includes('南北朝')) return '魏晋南北朝'
    if (d.includes('隋') || d.includes('唐')) return '隋唐'
    if (d.includes('宋')) return '宋'
    if (d.includes('元')) return '元'
    if (d.includes('明')) return '明'
    if (d.includes('清')) return '清'
    return d
  }
  return ''
}

function isBlank(s) {
  return !String(s || '').trim()
}

function main() {
  const events = readJSON(path.join(DATA_DIR, 'events.json'))
  const persons = readJSON(path.join(DATA_DIR, 'persons.json'))
  const sources = readJSON(path.join(DATA_DIR, 'sources.json'))
  const dynasties = readJSON(path.join(DATA_DIR, 'dynasties.json'))

  const sourcesById = new Map()
  for (const s of sources) if (s && typeof s.id === 'number') sourcesById.set(s.id, s)

  const dynById = new Map()
  for (const d of dynasties) if (d && typeof d.id === 'number') dynById.set(d.id, d)

  const backlog = []

  const collect = (entityType, entity, hintYear, hintDynasty) => {
    const citations = Array.isArray(entity.citations) ? entity.citations : []
    for (const c of citations) {
      if (!c || typeof c !== 'object') continue
      const sourceId = c.sourceId
      if (typeof sourceId !== 'number') continue
      const s = sourcesById.get(sourceId)
      if (!s || s.sourceType !== 'textbook') continue

      const missing = {
        missingChapter: isBlank(c.chapter),
        missingPage: isBlank(c.page),
      }
      if (!missing.missingChapter && !missing.missingPage) continue

      backlog.push({
        entityType,
        entityId: entity.id,
        entityName: entityType === 'event' ? entity.title : entity.name,
        hintYear: hintYear ?? '',
        hintDynasty: hintDynasty ?? '',
        suggestedChapter: suggestEra(hintYear, hintDynasty),
        sourceId,
        sourceTitle: s.title,
        chapter: c.chapter ?? '',
        page: c.page ?? '',
        line: c.line ?? '',
        note: c.note ?? '',
        missingChapter: missing.missingChapter ? 1 : 0,
        missingPage: missing.missingPage ? 1 : 0,
      })
    }
  }

  for (const e of events) {
    const dy = dynById.get(e.dynastyId)
    collect('event', e, e.eventYear, dy?.name)
  }
  for (const p of persons) {
    const dy = typeof p.dynastyId === 'number' ? dynById.get(p.dynastyId) : undefined
    const y = typeof p.birthYear === 'number' ? p.birthYear : (typeof p.deathYear === 'number' ? p.deathYear : null)
    collect('person', p, y, dy?.name)
  }

  // 排序：先缺 page，再缺 chapter；再按时代粗分段和 entityId 稳定排序
  backlog.sort((a, b) => {
    const aScore = a.missingPage * 2 + a.missingChapter
    const bScore = b.missingPage * 2 + b.missingChapter
    if (bScore !== aScore) return bScore - aScore
    return (a.entityId || 0) - (b.entityId || 0)
  })

  const summary = {
    total: backlog.length,
    missingPage: backlog.filter(x => x.missingPage === 1).length,
    missingChapter: backlog.filter(x => x.missingChapter === 1).length,
    bySourceTitle: {},
  }
  for (const it of backlog) {
    summary.bySourceTitle[it.sourceTitle] = (summary.bySourceTitle[it.sourceTitle] || 0) + 1
  }

  ensureDir(REPORT_DIR)
  const outJson = path.join(REPORT_DIR, 'citation_backlog_report.json')
  const outCsv = path.join(REPORT_DIR, 'citation_backlog_report.csv')

  saveJSON(outJson, { generatedAt: new Date().toISOString(), summary, items: backlog })
  fs.writeFileSync(outCsv, toCsv(backlog), 'utf8')

  console.log('[citation_backlog_report] done', {
    outJson,
    outCsv,
    ...summary,
  })
}

main()


