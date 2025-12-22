/**
 * 将 scripts/textbooks/mappings_*.json 中的“章/页/行/备注”写回到 events/persons 的 citations。
 *
 * 设计目标：
 * - 当前 mappings 文件多为“待补空白”，因此通常 dry-run 会显示 0 变更
 * - 当你后续逐步把 mappings 的 chapter/page 填起来后，重新运行本脚本即可批量落盘到数据
 *
 * 行为：
 * - 仅处理 sourceType=textbook 的引用
 * - 通过 mapping 的 sourceTitle 与 sources.json 中 Source.title 精确匹配拿到 sourceId
 * - 对匹配到的 entity (event/person)：
 *   - 若已有该 sourceId 的 citation：补齐 chapter/page/line/note（仅在 mapping 非空时写入）
 *   - 若没有该 citation：创建 citation（包含 sourceId + mapping 字段；若字段全空则不创建）
 *
 * 用法（仓库根目录）：
 *   node scripts/data/apply_textbook_mappings_to_citations.js --dry-run
 *   node scripts/data/apply_textbook_mappings_to_citations.js
 */

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'frontend', 'public', 'data')
const TEXTBOOK_DIR = path.join(ROOT, 'scripts', 'textbooks')

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

function strOrUndef(v) {
  const s = String(v || '').trim()
  return s ? s : undefined
}

function hasAnyMappingFields(m) {
  return !!(strOrUndef(m.chapter) || strOrUndef(m.page) || strOrUndef(m.line) || strOrUndef(m.note))
}

function upsertCitation(entity, sourceId, mapping) {
  const citations = Array.isArray(entity.citations) ? entity.citations : []
  const idx = citations.findIndex(c => c && typeof c === 'object' && c.sourceId === sourceId)

  const patch = {
    chapter: strOrUndef(mapping.chapter),
    page: strOrUndef(mapping.page),
    line: strOrUndef(mapping.line),
    note: strOrUndef(mapping.note),
  }

  const applyPatch = (c) => {
    let changed = false
    for (const k of ['chapter', 'page', 'line', 'note']) {
      const v = patch[k]
      if (!v) continue
      if (typeof c[k] !== 'string' || !String(c[k]).trim()) {
        c[k] = v
        changed = true
      }
    }
    return changed
  }

  if (idx >= 0) {
    return applyPatch(citations[idx])
  }

  // 新建 citation：若 mapping 全空则不建，避免制造噪音
  if (!hasAnyMappingFields(mapping)) return false

  const c = { sourceId }
  for (const k of ['chapter', 'page', 'line', 'note']) {
    if (patch[k]) c[k] = patch[k]
  }
  citations.push(c)
  entity.citations = citations
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

  const sourcesByTitle = new Map()
  const sourcesById = new Map()
  for (const s of sources) {
    if (!s || typeof s.id !== 'number') continue
    sourcesById.set(s.id, s)
    if (typeof s.title === 'string') sourcesByTitle.set(s.title.trim(), s)
  }

  const eventsById = new Map(events.map(e => [e.id, e]))
  const personsById = new Map(persons.map(p => [p.id, p]))

  // 收集 mappings 文件（固定名单，避免误读其他 json）
  const mappingFiles = [
    'mappings_grade7_down.json',
    'mappings_grade7_up.json',
    'mappings_grade8_down.json',
    'mappings_grade8_up.json',
    'mappings_grade9_down.json',
    'mappings_grade9_up.json',
    'mappings_hs_outline_down.json',
    'mappings_hs_outline_up.json',
  ].map(f => path.join(TEXTBOOK_DIR, f))

  const stats = {
    dryRun: !!opts.dryRun,
    mappingFiles: mappingFiles.length,
    mappingsTotal: 0,
    mappingsWithFields: 0,
    skippedNoSourceMatch: 0,
    skippedNonTextbook: 0,
    skippedMissingEntity: 0,
    changedEvents: 0,
    changedPersons: 0,
    citationsUpdated: 0,
  }

  for (const fp of mappingFiles) {
    if (!fs.existsSync(fp)) continue
    const arr = readJSON(fp)
    if (!Array.isArray(arr)) continue

    for (const m of arr) {
      stats.mappingsTotal += 1
      if (!m || typeof m !== 'object') continue
      if (!hasAnyMappingFields(m)) continue
      stats.mappingsWithFields += 1

      const st = String(m.sourceTitle || '').trim()
      const s = sourcesByTitle.get(st)
      if (!s) {
        stats.skippedNoSourceMatch += 1
        continue
      }
      if (s.sourceType !== 'textbook') {
        stats.skippedNonTextbook += 1
        continue
      }

      const entityType = String(m.entityType || '').trim()
      const entityId = m.entityId
      if (typeof entityId !== 'number') {
        stats.skippedMissingEntity += 1
        continue
      }

      const entity =
        entityType === 'event' ? eventsById.get(entityId) :
        entityType === 'person' ? personsById.get(entityId) :
        null
      if (!entity) {
        stats.skippedMissingEntity += 1
        continue
      }

      const changed = upsertCitation(entity, s.id, m)
      if (changed) {
        stats.citationsUpdated += 1
        if (entityType === 'event') stats.changedEvents += 1
        if (entityType === 'person') stats.changedPersons += 1
      }
    }
  }

  if (!opts.dryRun) {
    saveJSON(eventsPath, events)
    saveJSON(personsPath, persons)
  }

  console.log('[apply_textbook_mappings_to_citations] done', stats)
}

main()


