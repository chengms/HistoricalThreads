/**
 * 参考资料/参考文献提取（百度百科/搜狗百科）
 * 目标：尽可能提取“书籍/论文/网站”等引用条目，供写入 frontend/public/data/sources.json
 */
import crypto from 'crypto'

function normText(s) {
  return (s || '').replace(/\s+/g, ' ').trim()
}

export function guessSourceType({ title, url }) {
  const t = title || ''
  const u = url || ''
  if (u.includes('baike.baidu.com') || u.includes('baike.sogou.com')) return 'authoritative_website'
  if (/(ISBN|出版社|出版|第\d+版)/.test(t) || /《[^》]+》/.test(t)) return 'academic_book'
  if (/《(史记|汉书|三国志|资治通鉴|旧唐书|新唐书|宋史|元史|明史|清史稿)》/.test(t)) return 'official_history'
  return 'authoritative_website'
}

export function stableKey({ title, url, author, publisher }) {
  const raw = [title, url, author, publisher].map(normText).join('|')
  return crypto.createHash('sha1').update(raw).digest('hex')
}

/**
 * 通用：在页面中找到包含“参考资料/参考文献”的标题节点，然后抓取其后面的列表项。
 * @param $ cheerio root
 */
export function extractReferencesGeneric($) {
  const results = []

  const headingCandidates = $('*:contains("参考资料"), *:contains("参考文献")').toArray()
  for (const h of headingCandidates) {
    const ht = normText($(h).text())
    if (!/参考资料|参考文献/.test(ht)) continue

    // 找“标题”后面最近的 ul/ol 或者 div 里的 li
    const container = $(h).nextAll('ul,ol,div').first()
    if (!container || container.length === 0) continue

    container.find('li').each((_, li) => {
      const liText = normText($(li).text())
      if (!liText || liText.length < 4) return
      const a = $(li).find('a[href]').first()
      const href = a.attr('href')
      results.push({
        title: liText,
        url: href ? href.trim() : undefined,
      })
    })

    if (results.length) break
  }

  return results
}

export function extractBaiduReferences($) {
  const results = []

  // 常见结构 1：#reference 或 .reference / .lemma-reference
  const blocks = $('#reference, .reference, .lemma-reference, [id*="reference"], [class*="reference"]').toArray()
  for (const b of blocks) {
    const $b = $(b)
    $b.find('li').each((_, li) => {
      const t = normText($(li).text())
      if (!t || t.length < 4) return
      const a = $(li).find('a[href]').first()
      const href = a.attr('href')
      results.push({ title: t, url: href ? href.trim() : undefined })
    })
    if (results.length) break
  }

  if (results.length) return results
  return extractReferencesGeneric($)
}

export function extractSogouReferences($) {
  // 搜狗百科结构不稳定，先走通用逻辑，再尝试 reference-like 容器
  const generic = extractReferencesGeneric($)
  if (generic.length) return generic

  const results = []
  const blocks = $('#reference, .reference, [id*="reference"], [class*="reference"]').toArray()
  for (const b of blocks) {
    const $b = $(b)
    $b.find('li').each((_, li) => {
      const t = normText($(li).text())
      if (!t || t.length < 4) return
      const a = $(li).find('a[href]').first()
      const href = a.attr('href')
      results.push({ title: t, url: href ? href.trim() : undefined })
    })
    if (results.length) break
  }
  return results
}


