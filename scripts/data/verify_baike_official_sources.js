/**
 * 检测百度百科条目是否带“权威合作/官方认证”等标识，并（可选）把 sources.json 的 verified 标为 true。
 *
 * 适用范围：
 * - 仅扫描“现代事件”（dynastyId=17/18）使用到的百度百科来源（url 含 baike.baidu.com）
 *
 * 输出：
 * - scripts/reports/baike_official_verification_report.json
 *
 * 用法（仓库根目录）：
 *   node scripts/data/verify_baike_official_sources.js                # dry-run（默认）
 *   node scripts/data/verify_baike_official_sources.js --apply        # 写回 sources.json
 *   node scripts/data/verify_baike_official_sources.js --limit=10     # 限制抓取数量
 *   node scripts/data/verify_baike_official_sources.js --timeout=8000 # 单条超时（ms）
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

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

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { apply: false, limit: Infinity, timeoutMs: 8000 }
  for (const a of args) {
    if (a === '--apply') out.apply = true
    else if (a.startsWith('--limit=')) out.limit = Number(a.slice('--limit='.length)) || Infinity
    else if (a.startsWith('--timeout=')) out.timeoutMs = Number(a.slice('--timeout='.length)) || 8000
  }
  return out
}

function isBaiduBaike(url) {
  const u = String(url || '').toLowerCase()
  return u.includes('baike.baidu.com')
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

function resolveRedirectLocation(location, baseUrl) {
  const loc = String(location || '').trim()
  if (!loc) return null
  try {
    // 绝对 URL
    if (loc.startsWith('http://') || loc.startsWith('https://')) return loc
    // 相对 URL：按 baseUrl 解析
    return new URL(loc, baseUrl).toString()
  } catch {
    return null
  }
}

function fetchHtml(url, timeoutMs, redirectDepth = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      },
      res => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // follow redirect (limited)
          res.resume()
          if (redirectDepth >= 3) return reject(new Error('too many redirects'))
          const nextUrl = resolveRedirectLocation(res.headers.location, url)
          if (!nextUrl) return reject(new Error('invalid redirect location'))
          return resolve(fetchHtml(nextUrl, timeoutMs, redirectDepth + 1))
        }
        if (res.statusCode !== 200) {
          res.resume()
          return reject(new Error(`HTTP ${res.statusCode}`))
        }
        res.setEncoding('utf8')
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => resolve(data))
      }
    )
    req.on('error', reject)
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`timeout ${timeoutMs}ms`))
    })
  })
}

function detectOfficialMarkers(html) {
  const text = String(html || '')
  // 尽量宽松：百度百科页面常见文案（可能会变动）
  const markers = [
    '权威合作',
    '官方认证',
    '权威认证',
    '权威机构',
    '认证机构',
    '权威来源',
  ]
  const hits = markers.filter(m => text.includes(m))
  return { hits, matched: hits.length > 0 }
}

async function main() {
  const opts = parseArgs()

  const eventsPath = path.join(DATA_DIR, 'events.json')
  const sourcesPath = path.join(DATA_DIR, 'sources.json')

  const events = readJSON(eventsPath)
  const sources = readJSON(sourcesPath)

  const sourcesById = new Map()
  for (const s of sources) if (s && typeof s.id === 'number') sourcesById.set(s.id, s)

  const modernEventIds = new Set(
    events
      .filter(e => e && (e.dynastyId === 17 || e.dynastyId === 18))
      .map(e => e.id)
  )

  const candidateSourceIds = new Set()
  for (const e of events) {
    if (!modernEventIds.has(e.id)) continue
    const srcIds = uniqNums(Array.isArray(e.sources) ? e.sources : [])
    for (const sid of srcIds) {
      const s = sourcesById.get(sid)
      if (s && s.sourceType === 'authoritative_website' && isBaiduBaike(s.url)) {
        candidateSourceIds.add(sid)
      }
    }
  }

  const candidates = [...candidateSourceIds]
  const limited = candidates.slice(0, Math.max(0, opts.limit))

  const results = []
  let fetched = 0
  let verifiedCount = 0
  let errors = 0

  for (const sid of limited) {
    const s = sourcesById.get(sid)
    if (!s) continue
    const url = s.url
    try {
      const html = await fetchHtml(url, opts.timeoutMs)
      fetched += 1
      const det = detectOfficialMarkers(html)
      const before = !!s.verified
      if (det.matched && opts.apply) {
        s.verified = true
        const note = `自动检测：页面包含标识 ${det.hits.join('、')}（${new Date().toISOString()}）`
        s.notes = s.notes ? `${s.notes}\n${note}` : note
      }
      const after = !!s.verified
      if (!before && after) verifiedCount += 1

      results.push({
        sourceId: sid,
        title: s.title,
        url,
        markers: det.hits,
        matched: det.matched,
        verifiedBefore: before,
        verifiedAfter: after,
      })
    } catch (e) {
      errors += 1
      results.push({
        sourceId: sid,
        title: s.title,
        url,
        error: String(e && e.message ? e.message : e),
      })
    }
  }

  // 输出报告
  ensureDir(REPORT_DIR)
  const reportPath = path.join(REPORT_DIR, 'baike_official_verification_report.json')
  saveJSON(reportPath, {
    generatedAt: new Date().toISOString(),
    apply: !!opts.apply,
    timeoutMs: opts.timeoutMs,
    limit: opts.limit === Infinity ? null : opts.limit,
    modernEvents: [...modernEventIds].sort((a, b) => a - b),
    candidateSourceIds: candidates.sort((a, b) => a - b),
    fetched,
    errors,
    verifiedCount,
    results,
  })

  if (opts.apply) {
    saveJSON(sourcesPath, sources)
  }

  console.log('[verify_baike_official_sources] done', {
    apply: !!opts.apply,
    candidates: candidates.length,
    fetched,
    errors,
    verifiedCount,
    report: reportPath,
  })
}

main().catch(err => {
  console.error('[verify_baike_official_sources] fatal', err)
  process.exit(1)
})


