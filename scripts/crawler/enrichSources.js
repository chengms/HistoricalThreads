/**
 * 增量完善现有前端数据的 sources：
 * - 优先添加：百度百科、搜狗百科词条页作为 authoritative_website
 * - 尝试从词条页提取“参考资料/参考文献”（尽量包含书籍信息）
 *
 * 用法：
 *   cd scripts/crawler
 *   node enrichSources.js --type persons   (默认)
 *   node enrichSources.js --type events
 *   node enrichSources.js --type all
 *   node enrichSources.js --type all --only-missing
 *   node enrichSources.js --type all --only-missing-web   (仅补齐百科/网站类来源)
 *   node enrichSources.js --type all --only-missing-web --no-refs (只补链接，不抓参考资料)
 */

import path from 'path'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio'
import dns from 'dns'
import { readJSON, saveJSON } from './utils/helpers.js'
import { CrawlerBase } from './utils/crawlerBase.js'
import { extractBaiduReferences, extractSogouReferences, guessSourceType, stableKey } from './utils/referenceExtractor.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, '../../frontend/public/data')

function parseArgs() {
  const args = new Set(process.argv.slice(2))
  const typeIdx = process.argv.indexOf('--type')
  const type = typeIdx !== -1 ? process.argv[typeIdx + 1] : 'persons'
  return {
    type,
    onlyMissing: args.has('--only-missing'),
    onlyMissingWeb: args.has('--only-missing-web'),
    noSogou: args.has('--no-sogou'),
    noRefs: args.has('--no-refs'),
    includeWiki: !args.has('--no-wiki'),
    includeEnWiki: args.has('--en-wiki'),
    includeBritannica: args.has('--britannica'),
  }
}

function ensureUrlAbsolute(href, base) {
  if (!href) return undefined
  if (href.startsWith('http://') || href.startsWith('https://')) return href
  if (href.startsWith('//')) return `https:${href}`
  try {
    return new URL(href, base).toString()
  } catch {
    return undefined
  }
}

class WebClient extends CrawlerBase {
  constructor() {
    super({ rateLimit: 1200, timeout: 15000, maxRetries: 2, retryDelay: 800 })
  }
}

async function findSogouBaikeUrl(client, term) {
  const searchUrl = `https://baike.sogou.com/Search.e?query=${encodeURIComponent(term)}`
  const html = await client.fetchPage(searchUrl)
  if (!html) return null
  const $ = cheerio.load(html)
  // 选择首个结果链接（尽量保守）
  const a = $('a[href^="https://baike.sogou.com/"]').first()
  const href = a.attr('href')
  return href ? href.trim() : null
}

function upsertSource(allSources, source) {
  const key = stableKey(source)
  const byKey = allSources._byKey || (allSources._byKey = new Map())
  if (byKey.has(key)) return byKey.get(key)

  // url 优先去重
  if (source.url) {
    const existing = allSources.find(s => s.url && s.url === source.url)
    if (existing) {
      byKey.set(key, existing.id)
      return existing.id
    }
  }

  const nextId = allSources.reduce((m, s) => Math.max(m, s.id || 0), 0) + 1
  const item = {
    id: nextId,
    title: source.title,
    author: source.author,
    url: source.url,
    sourceType: source.sourceType,
    publisher: source.publisher,
    publishDate: source.publishDate,
    credibilityLevel: source.credibilityLevel ?? 3,
    verified: source.verified ?? false,
  }
  allSources.push(item)
  byKey.set(key, nextId)
  return nextId
}

async function enrichEntity(client, allSources, entity, kind) {
  const name = kind === 'person' ? entity.name : entity.title
  if (!name) return

  entity.sources = Array.isArray(entity.sources) ? entity.sources : []
  const sourceIds = new Set(entity.sources)

  const hasAnyWebsite = () => {
    for (const sid of sourceIds) {
      const s = allSources.find(x => x && x.id === sid)
      if (s && s.sourceType === 'authoritative_website') return true
    }
    return false
  }

  const hasWebsiteHost = (host) => {
    for (const sid of sourceIds) {
      const s = allSources.find(x => x && x.id === sid)
      const url = (s && s.url) ? String(s.url) : ''
      if (s && s.sourceType === 'authoritative_website' && url.includes(host)) return true
    }
    return false
  }

  // 0) 仅补齐百科/网站来源时：如果已经有 authoritative_website，就直接跳过（避免无谓膨胀）
  if (client.__onlyMissingWeb && hasAnyWebsite()) {
    entity.sources = Array.from(sourceIds)
    return
  }

  // 1) 百度百科词条页（稳定可构造）
  const baiduUrl = `https://baike.baidu.com/item/${encodeURIComponent(name)}`
  if (!hasWebsiteHost('baike.baidu.com')) {
    const baiduId = upsertSource(allSources, {
      title: `百度百科：${name}`,
      url: baiduUrl,
      sourceType: 'authoritative_website',
      credibilityLevel: 3,
      verified: false,
    })
    sourceIds.add(baiduId)
  }

  // 2) 尝试抓取百度参考资料
  if (!client.__noRefs) {
    try {
      const html = await client.fetchPage(baiduUrl)
      if (html) {
        const $ = cheerio.load(html)
        const refs = extractBaiduReferences($)
        for (const r of refs.slice(0, 20)) {
          const absUrl = ensureUrlAbsolute(r.url, baiduUrl)
          const sid = upsertSource(allSources, {
            title: r.title,
            url: absUrl,
            sourceType: guessSourceType({ title: r.title, url: absUrl }),
            credibilityLevel: /《[^》]+》/.test(r.title) ? 4 : 3,
            verified: false,
          })
          sourceIds.add(sid)
        }
      }
    } catch (e) {
      if (process.env.DEBUG) console.warn('[enrichSources] baidu refs failed:', name, e?.message)
    }
  }

  // 3) 搜狗百科：先搜索获取词条链接（可被禁用或自动跳过）
  if (client.__enableSogou) {
    try {
      const sogouUrl = await findSogouBaikeUrl(client, name)
      if (sogouUrl) {
        if (!hasWebsiteHost('baike.sogou.com')) {
          const sogouId = upsertSource(allSources, {
            title: `搜狗百科：${name}`,
            url: sogouUrl,
            sourceType: 'authoritative_website',
            credibilityLevel: 3,
            verified: false,
          })
          sourceIds.add(sogouId)
        }

        if (!client.__noRefs) {
          const html2 = await client.fetchPage(sogouUrl)
          if (html2) {
            const $2 = cheerio.load(html2)
            const refs2 = extractSogouReferences($2)
            for (const r of refs2.slice(0, 20)) {
              const absUrl2 = ensureUrlAbsolute(r.url, sogouUrl)
              const sid2 = upsertSource(allSources, {
                title: r.title,
                url: absUrl2,
                sourceType: guessSourceType({ title: r.title, url: absUrl2 }),
                credibilityLevel: /《[^》]+》/.test(r.title) ? 4 : 3,
                verified: false,
              })
              sourceIds.add(sid2)
            }
          }
        }
      }
    } catch (e) {
      if (process.env.DEBUG) console.warn('[enrichSources] sogou failed:', name, e?.message)
    }
  }

  // 4) 维基百科（默认中文检索链接；可选英文）
  if (client.__includeWiki && !hasWebsiteHost('wikipedia.org')) {
    const zhWiki = `https://zh.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(name)}`
    const wid = upsertSource(allSources, {
      title: `维基百科（检索）：${name}`,
      url: zhWiki,
      sourceType: 'authoritative_website',
      credibilityLevel: 3,
      verified: false,
    })
    sourceIds.add(wid)
    if (client.__includeEnWiki) {
      const enWiki = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(name)}`
      const wid2 = upsertSource(allSources, {
        title: `Wikipedia（Search）：${name}`,
        url: enWiki,
        sourceType: 'authoritative_website',
        credibilityLevel: 3,
        verified: false,
      })
      sourceIds.add(wid2)
    }
  }

  // 5) Britannica（可选）
  if (client.__includeBritannica && !hasWebsiteHost('britannica.com')) {
    const bri = `https://www.britannica.com/search?query=${encodeURIComponent(name)}`
    const bid = upsertSource(allSources, {
      title: `大英百科（检索）：${name}`,
      url: bri,
      sourceType: 'authoritative_website',
      credibilityLevel: 3,
      verified: false,
    })
    sourceIds.add(bid)
  }

  entity.sources = Array.from(sourceIds)
}

async function main() {
  const { type, onlyMissing, onlyMissingWeb, noSogou, noRefs, includeWiki, includeEnWiki, includeBritannica } = parseArgs()
  const client = new WebClient()
  client.__enableSogou = !noSogou
  client.__onlyMissingWeb = !!onlyMissingWeb
  client.__noRefs = !!noRefs
  client.__includeWiki = !!includeWiki
  client.__includeEnWiki = !!includeEnWiki
  client.__includeBritannica = !!includeBritannica

  // 如果 DNS/网络环境不允许访问搜狗百科，提前禁用，避免每条都报错浪费时间
  if (client.__enableSogou) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await dns.promises.lookup('baike.sogou.com')
    } catch (e) {
      client.__enableSogou = false
      console.warn('⚠️ 检测到当前网络无法解析 baike.sogou.com，将跳过搜狗百科来源补全。可用 --no-sogou 关闭此提示。')
    }
  }

  const sources = await readJSON(path.join(DATA_DIR, 'sources.json'))
  const persons = await readJSON(path.join(DATA_DIR, 'persons.json'))
  const events = await readJSON(path.join(DATA_DIR, 'events.json'))

  // 给 sources 数组挂一个内部 map（不会写回文件）
  sources._byKey = new Map()

  const tasks = []
  if (type === 'persons' || type === 'all') {
    for (const p of persons) {
      if (onlyMissing && Array.isArray(p.sources) && p.sources.length > 0) continue
      tasks.push(enrichEntity(client, sources, p, 'person'))
    }
  }
  if (type === 'events' || type === 'all') {
    for (const e of events) {
      if (onlyMissing && Array.isArray(e.sources) && e.sources.length > 0) continue
      tasks.push(enrichEntity(client, sources, e, 'event'))
    }
  }

  console.log(`将处理 ${tasks.length} 条记录（type=${type}${onlyMissing ? ', only-missing' : ''}${onlyMissingWeb ? ', only-missing-web' : ''}${noRefs ? ', no-refs' : ''}）...`)
  for (const t of tasks) {
    // 串行执行，避免被封 + 保持速率限制
    // eslint-disable-next-line no-await-in-loop
    await t
  }

  // 清理内部字段
  delete sources._byKey

  await saveJSON(path.join(DATA_DIR, 'sources.json'), sources)
  await saveJSON(path.join(DATA_DIR, 'persons.json'), persons)
  await saveJSON(path.join(DATA_DIR, 'events.json'), events)
  console.log('✅ sources/persons/events 已更新')
}

main().catch(err => {
  console.error('❌ enrichSources 失败:', err)
  process.exit(1)
})


