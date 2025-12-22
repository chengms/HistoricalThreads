/**
 * 为缺少“正史来源”的事件补齐 1 条 official_history（会写入 events.json）：
 * - 如果事件 sources 中没有任何 sourceType=official_history，则按年份/朝代选择合适的正史条目补上
 * - 支持 --dry-run：只输出统计，不写文件
 *
 * 用法（仓库根目录）：
 *   node scripts/data/add_official_history_sources_to_events.js --dry-run
 *   node scripts/data/add_official_history_sources_to_events.js
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

// 这些 id 来自 frontend/public/data/sources.json（项目现有正史条目）
const OFFICIAL_HISTORY_IDS = {
  SHIJI: 1, // 《史记》
  ZUOZHUAN: 2, // 《左传》
  HANSHU: 3, // 《汉书》
  SANGUOZHI: 4, // 《三国志》
  SUISHU: 5, // 《隋书》
  JIUTANGSHU: 6, // 《旧唐书》
  SONGSHI: 7, // 《宋史》
  YUANSHI: 8, // 《元史》
  MINGSHI: 9, // 《明史》
  QINGSHIGAO: 10, // 《清史稿》
}

function pickOfficialHistoryId(eventYear, dynastyId) {
  // dynastyId 基于项目内 dynasties.json 的序号，粗粒度选择即可（宁可不加也不乱加）
  // 1 夏 2 商 3 周 4 春秋 5 战国 6 秦 7 汉 8 三国 9 两晋南北朝 10 隋 11 唐 12 宋 13 元 14 明 15 清 16 近代 17 民国 18 新中国
  if (dynastyId === 4) return OFFICIAL_HISTORY_IDS.ZUOZHUAN
  if (dynastyId >= 1 && dynastyId <= 6) return OFFICIAL_HISTORY_IDS.SHIJI
  if (dynastyId === 7) return OFFICIAL_HISTORY_IDS.HANSHU
  if (dynastyId === 8) return OFFICIAL_HISTORY_IDS.SANGUOZHI
  if (dynastyId === 9) return null // 两晋南北朝：当前 sources.json 未提供《晋书》《魏书》等，先不强加
  if (dynastyId === 10) return OFFICIAL_HISTORY_IDS.SUISHU
  if (dynastyId === 11) return OFFICIAL_HISTORY_IDS.JIUTANGSHU
  if (dynastyId === 12) return OFFICIAL_HISTORY_IDS.SONGSHI
  if (dynastyId === 13) return OFFICIAL_HISTORY_IDS.YUANSHI
  if (dynastyId === 14) return OFFICIAL_HISTORY_IDS.MINGSHI
  if (dynastyId === 15) return OFFICIAL_HISTORY_IDS.QINGSHIGAO

  // 近代/民国/新中国：现有 sources.json 的“正史”不覆盖，跳过
  if (dynastyId >= 16) return null

  // 兜底：按年份粗略判断（仅在 dynastyId 缺失/异常时才会走到这里）
  if (typeof eventYear === 'number') {
    if (eventYear <= -206) return OFFICIAL_HISTORY_IDS.SHIJI
    if (eventYear <= 220) return OFFICIAL_HISTORY_IDS.HANSHU
    if (eventYear <= 280) return OFFICIAL_HISTORY_IDS.SANGUOZHI
  }
  return null
}

function main() {
  const opts = parseArgs()
  const eventsPath = path.join(DATA_DIR, 'events.json')
  const sourcesPath = path.join(DATA_DIR, 'sources.json')

  const events = readJSON(eventsPath)
  const sources = readJSON(sourcesPath)

  const sourcesById = new Map()
  for (const s of sources) {
    if (s && typeof s.id === 'number') sourcesById.set(s.id, s)
  }

  const stats = {
    totalEvents: events.length,
    alreadyHasOfficialHistory: 0,
    skippedNoCandidate: 0,
    changedEvents: 0,
    addedByOfficialId: {},
    changedEventIds: [],
  }

  for (const e of events) {
    const srcIds = uniqNums(Array.isArray(e.sources) ? e.sources : [])
    const hasOfficial = srcIds.some(id => sourcesById.get(id)?.sourceType === 'official_history')
    if (hasOfficial) {
      stats.alreadyHasOfficialHistory += 1
      continue
    }

    const pick = pickOfficialHistoryId(e.eventYear, e.dynastyId)
    if (!pick) {
      stats.skippedNoCandidate += 1
      continue
    }
    if (!sourcesById.has(pick)) {
      stats.skippedNoCandidate += 1
      continue
    }

    const next = uniqNums([pick, ...srcIds])
    // 稳定排序，减少 diff 噪音
    next.sort((a, b) => a - b)

    const same = srcIds.length === next.length && srcIds.every((v, i) => v === next[i])
    if (!same) {
      e.sources = next
      stats.changedEvents += 1
      stats.changedEventIds.push(e.id)
      stats.addedByOfficialId[pick] = (stats.addedByOfficialId[pick] || 0) + 1
    }
  }

  if (!opts.dryRun) {
    saveJSON(eventsPath, events)
  }

  console.log('[add_official_history_sources_to_events] done', {
    dryRun: !!opts.dryRun,
    ...stats,
  })
}

main()


