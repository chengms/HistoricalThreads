/**
 * 以“事件”为中心补全人物信息（增量、保守）：
 * - 仅处理：出现在 events.json 的 persons 列表中的人物
 * - 补全：biography（若缺失或过短）
 * - 来源：不新增大量 sources；仅确保已有的百科确认链接可用（数据已由 prune 流程保障）
 *
 * 用法：
 *   cd scripts/crawler
 *   node enrichPersonsInEvents.js
 *   node enrichPersonsInEvents.js --limit 10
 */

import path from 'path'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio'
import { readJSON, saveJSON } from './utils/helpers.js'
import { CrawlerBase } from './utils/crawlerBase.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, '../../frontend/public/data')

function parseArgs() {
  const idx = process.argv.indexOf('--limit')
  const limit = idx !== -1 ? Number(process.argv[idx + 1]) : null
  const idsIdx = process.argv.indexOf('--ids')
  const idsRaw = idsIdx !== -1 ? String(process.argv[idsIdx + 1] || '') : ''
  const ids = idsRaw
    ? idsRaw.split(',').map(x => Number(String(x).trim())).filter(x => Number.isFinite(x))
    : null
  const onlyMissing = process.argv.includes('--only-missing')
  return {
    limit: Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : null,
    ids,
    onlyMissing,
  }
}

function extractBaiduSummary(html) {
  const $ = cheerio.load(html)
  // 1) 经典结构
  const s1 = $('.lemma-summary').text().trim()
  if (s1 && s1.length >= 60) return s1

  // 2) 新结构：找 summary 类里较长的一段
  let best = ''
  const summaryElements = $('[class*="summary"]')
  if (summaryElements.length > 0) {
    for (const elem of summaryElements.toArray()) {
      const text = $(elem).text().trim()
      if (text.length > best.length && text.length >= 60 && !text.includes('免责声明')) {
        best = text
      }
    }
  }
  if (best) return best

  // 3) 兜底：取正文前几段文本拼接（非常保守）
  const paras = []
  $('.para').each((_, el) => {
    const t = $(el).text().trim()
    if (t && t.length >= 30 && !t.includes('免责声明')) paras.push(t)
  })
  const joined = paras.slice(0, 2).join('\n')
  return joined.length >= 60 ? joined : ''
}

class WebClient extends CrawlerBase {
  constructor() {
    super({ rateLimit: 1200, timeout: 15000, maxRetries: 2, retryDelay: 800 })
  }
}

async function fetchBaiduSummaryByName(client, name) {
  const baiduUrl = `https://baike.baidu.com/item/${encodeURIComponent(name)}`
  const html = await client.fetchPage(baiduUrl)
  const summary = html ? extractBaiduSummary(html) : ''
  return { summary, url: baiduUrl }
}

async function main() {
  const { limit, ids, onlyMissing } = parseArgs()
  const client = new WebClient()

  const events = await readJSON(path.join(DATA_DIR, 'events.json'))
  const persons = await readJSON(path.join(DATA_DIR, 'persons.json'))

  const personById = new Map()
  for (const p of persons) {
    if (p && typeof p.id === 'number') personById.set(p.id, p)
  }

  const idsInEvents = []
  const seen = new Set()
  for (const e of events) {
    const ids = Array.isArray(e.persons) ? e.persons : []
    for (const id of ids) {
      if (typeof id !== 'number') continue
      if (seen.has(id)) continue
      if (!personById.has(id)) continue
      seen.add(id)
      idsInEvents.push(id)
    }
  }

  const targetIds = limit ? idsInEvents.slice(0, limit) : idsInEvents
  const finalIds = ids && ids.length ? targetIds.filter(x => ids.includes(x)) : targetIds
  let updated = 0
  let skipped = 0
  let failed = 0
  const failedList = []

  for (const pid of finalIds) {
    const p = personById.get(pid)
    if (!p) continue

    const currentBio = String(p.biography || p.description || '').trim()
    if (onlyMissing && currentBio && currentBio.length >= 60) {
      skipped += 1
      continue
    }

    const name = p.name
    if (!name) {
      skipped += 1
      continue
    }

    try {
      const candidates = [
        name,
        ...(Array.isArray(p.nameVariants) ? p.nameVariants.filter(v => typeof v === 'string' && v.trim()) : []),
      ]

      let best = { summary: '', url: '' }
      for (const cand of candidates) {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetchBaiduSummaryByName(client, cand)
        if (res.summary && res.summary.length > best.summary.length) best = res
        if (best.summary.length >= 120) break // 足够长就不再尝试更多别名
      }

      if (best.summary && best.summary.length >= 60) {
        p.biography = best.summary
        // 记录用于人工追踪（不影响 UI）
        p._bioSource = best.url
        updated += 1
      } else {
        failed += 1
        failedList.push({ id: pid, name, tried: candidates })
      }
    } catch {
      failed += 1
      failedList.push({ id: pid, name, tried: [name] })
    }
  }

  await saveJSON(path.join(DATA_DIR, 'persons.json'), persons)

  console.log('[enrichPersonsInEvents] done', {
    personsInEvents: idsInEvents.length,
    processed: finalIds.length,
    updated,
    skipped,
    failed,
  })
  if (failedList.length) {
    console.log('[enrichPersonsInEvents] failed:', failedList)
  }
}

main().catch(err => {
  console.error('❌ enrichPersonsInEvents failed:', err)
  process.exit(1)
})


