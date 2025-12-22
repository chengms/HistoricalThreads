/**
 * 按教材（sourceTitle）导出“待补章节/页码”的 citations 清单到 CSV（Excel 友好）。
 *
 * 输入：
 * - scripts/reports/citation_backlog_report.json
 *
 * 输出（默认）：
 * - C:\Temp\textbook-mappings\backlog_<sanitized>.csv
 *
 * 用法（仓库根目录）：
 *   node scripts/textbooks/export_citation_backlog_csv.js --list
 *   node scripts/textbooks/export_citation_backlog_csv.js --source-title "普通高中教科书·历史 必修·中外历史纲要（上）（统编版）"
 *   node scripts/textbooks/export_citation_backlog_csv.js --source-title "..." --out "C:\\Temp\\textbook-mappings\\my.csv"
 */

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const REPORT_JSON = path.join(ROOT, 'scripts', 'reports', 'citation_backlog_report.json')

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
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

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { list: false, all: false, sourceTitle: '', sourceId: null, sourceIds: [], outPath: '', outDir: '' }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--list') out.list = true
    else if (a === '--all') out.all = true
    else if (a === '--source-title') out.sourceTitle = args[i + 1] || ''
    else if (a.startsWith('--source-title=')) out.sourceTitle = a.slice('--source-title='.length)
    else if (a === '--source-id') out.sourceId = Number(args[i + 1])
    else if (a.startsWith('--source-id=')) out.sourceId = Number(a.slice('--source-id='.length))
    else if (a === '--source-ids') out.sourceIds = String(args[i + 1] || '').split(',').map(x => Number(String(x).trim())).filter(x => Number.isFinite(x))
    else if (a.startsWith('--source-ids=')) out.sourceIds = a.slice('--source-ids='.length).split(',').map(x => Number(String(x).trim())).filter(x => Number.isFinite(x))
    else if (a === '--out') out.outPath = args[i + 1] || ''
    else if (a.startsWith('--out=')) out.outPath = a.slice('--out='.length)
    else if (a === '--out-dir') out.outDir = args[i + 1] || ''
    else if (a.startsWith('--out-dir=')) out.outDir = a.slice('--out-dir='.length)
  }
  return out
}

function sanitizeFilename(name) {
  return String(name || '')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

function main() {
  const opts = parseArgs()
  const report = readJSON(REPORT_JSON)
  const items = Array.isArray(report.items) ? report.items : []

  const byTitle = new Map()
  const bySourceId = new Map()
  for (const it of items) {
    const t = String(it.sourceTitle || '').trim()
    if (!t) continue
    byTitle.set(t, (byTitle.get(t) || 0) + 1)
    const sid = Number(it.sourceId)
    if (Number.isFinite(sid)) bySourceId.set(sid, (bySourceId.get(sid) || 0) + 1)
  }

  if (opts.list) {
    const list = [...byTitle.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([sourceTitle, count]) => ({ sourceTitle, count }))
    const listById = [...bySourceId.entries()].sort((a, b) => b[1] - a[1]).map(([sourceId, count]) => ({ sourceId, count }))
    console.log(JSON.stringify({ totalTitles: list.length, titles: list, sourceIds: listById }, null, 2))
    return
  }

  const sourceTitle = String(opts.sourceTitle || '').trim()
  const sourceId = typeof opts.sourceId === 'number' && Number.isFinite(opts.sourceId) ? opts.sourceId : null
  const sourceIds = Array.isArray(opts.sourceIds) ? opts.sourceIds.filter(x => Number.isFinite(x)) : []

  const outDir = opts.outDir ? opts.outDir : 'C:\\Temp\\textbook-mappings'

  if (!opts.all && !sourceTitle && sourceId === null && sourceIds.length === 0) {
    console.error('缺少参数：--all 或 --source-ids 64,65,70 或 --source-id 70（推荐）或 --source-title "xxx"（或先用 --list）')
    process.exit(2)
  }

  const exportOne = (pickedTitle, sid, filtered) => {
    const rows = filtered.map(it => ({
      entityType: it.entityType,
      entityId: it.entityId,
      entityName: it.entityName,
      hintYear: it.hintYear,
      hintDynasty: it.hintDynasty,
      suggestedChapter: it.suggestedChapter,
      sourceId: it.sourceId,
      sourceTitle: it.sourceTitle,
      chapter: it.chapter,
      page: it.page,
      line: it.line,
      note: it.note,
      missingChapter: it.missingChapter,
      missingPage: it.missingPage,
    }))

    const defaultOut = path.join(outDir, `backlog_${sanitizeFilename(pickedTitle)}.csv`)
    const outPath = opts.outPath && !opts.all ? opts.outPath : defaultOut
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, toCsv(rows), 'utf8')
    return { sourceTitle: pickedTitle, sourceId: sid ?? undefined, rows: rows.length, out: outPath }
  }

  const outputs = []

  if (opts.all || sourceIds.length) {
    const ids = opts.all ? [...bySourceId.keys()].sort((a, b) => a - b) : [...new Set(sourceIds)].sort((a, b) => a - b)
    for (const sid of ids) {
      const filtered = items.filter(it => Number(it.sourceId) === sid)
      if (!filtered.length) continue
      const pickedTitle = String(filtered[0]?.sourceTitle || `sourceId_${sid}`)
      outputs.push(exportOne(pickedTitle, sid, filtered))
    }
    console.log('[export_citation_backlog_csv] done', { mode: opts.all ? 'all' : 'source-ids', outDir, files: outputs.length, outputs })
    return
  }

  const filtered = items.filter(it => {
    if (sourceId !== null) return Number(it.sourceId) === sourceId
    return String(it.sourceTitle || '').trim() === sourceTitle
  })
  if (!filtered.length) {
    console.error('未找到该教材的待补项：', sourceId !== null ? `sourceId=${sourceId}` : sourceTitle)
    process.exit(1)
  }
  const pickedTitle = sourceTitle || String(filtered[0]?.sourceTitle || `sourceId_${sourceId}`)
  const one = exportOne(pickedTitle, sourceId, filtered)
  console.log('[export_citation_backlog_csv] done', one)
}

main()


