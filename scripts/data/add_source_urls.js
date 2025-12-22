/**
 * 为缺少URL的来源添加网页链接
 * 特别是为书籍、教材等添加可访问的链接
 */

const fs = require('fs')
const path = require('path')

// 书籍和教材的URL映射
const bookUrls = {
  // 史书类 - 国学网
  '《史记》': 'https://www.guoxue.com/shibu/shiji/',
  '《左传》': 'https://www.guoxue.com/shibu/zuozhuan/',
  '《汉书》': 'https://www.guoxue.com/shibu/hanshu/',
  '《三国志》': 'https://www.guoxue.com/shibu/sanguozhi/',
  '《隋书》': 'https://www.guoxue.com/shibu/suishu/',
  '《旧唐书》': 'https://www.guoxue.com/shibu/jiutangshu/',
  '《宋史》': 'https://www.guoxue.com/shibu/songshi/',
  '《元史》': 'https://www.guoxue.com/shibu/yuanshi/',
  '《明史》': 'https://www.guoxue.com/shibu/mingshi/',
  '《清史稿》': 'https://www.guoxue.com/shibu/qingshigao/',
  
  // 教材类 - 人教社官网
  '义务教育教科书·历史 七年级 上册（统编版）': 'https://www.pep.com.cn/lsysh/jszx/tbjxzy/dzkb/qs/',
  '义务教育教科书·历史 七年级 下册（统编版）': 'https://www.pep.com.cn/lsysh/jszx/tbjxzy/dzkb/qx/',
  '义务教育教科书·历史 八年级 上册（统编版）': 'https://www.pep.com.cn/lsysh/jszx/tbjxzy/dzkb/bs/',
  '义务教育教科书·历史 八年级 下册（统编版）': 'https://www.pep.com.cn/lsysh/jszx/tbjxzy/dzkb/bx/',
  '义务教育教科书·历史 九年级 上册（统编版）': 'https://www.pep.com.cn/lsysh/jszx/tbjxzy/dzkb/js/',
  '义务教育教科书·历史 九年级 下册（统编版）': 'https://www.pep.com.cn/lsysh/jszx/tbjxzy/dzkb/jx/',
  '普通高中教科书·历史 必修·中外历史纲要（上）（统编版）': 'https://www.pep.com.cn/lsysh/jszx/tbjxzy/gzkb/bx/',
  '普通高中教科书·历史 必修·中外历史纲要（下）（统编版）': 'https://www.pep.com.cn/lsysh/jszx/tbjxzy/gzkb/bx/',
}

// 书籍的额外验证链接（用于验证书籍信息）
const bookVerificationUrls = {
  // 史书类 - 国家图书馆古籍资源
  '《史记》': [
    { label: '国家图书馆古籍', url: 'https://www.nlc.cn/dsb_zyyfw/gj/gjzy/' }
  ],
  '《汉书》': [
    { label: '国家图书馆古籍', url: 'https://www.nlc.cn/dsb_zyyfw/gj/gjzy/' }
  ],
  '《三国志》': [
    { label: '国家图书馆古籍', url: 'https://www.nlc.cn/dsb_zyyfw/gj/gjzy/' }
  ],
  // 教材类 - 可以添加更多验证链接
  '义务教育教科书·历史 七年级 上册（统编版）': [
    { label: '国家图书馆', url: 'https://www.nlc.cn/' }
  ],
  '义务教育教科书·历史 七年级 下册（统编版）': [
    { label: '国家图书馆', url: 'https://www.nlc.cn/' }
  ],
  '义务教育教科书·历史 八年级 上册（统编版）': [
    { label: '国家图书馆', url: 'https://www.nlc.cn/' }
  ],
  '义务教育教科书·历史 八年级 下册（统编版）': [
    { label: '国家图书馆', url: 'https://www.nlc.cn/' }
  ],
  '义务教育教科书·历史 九年级 上册（统编版）': [
    { label: '国家图书馆', url: 'https://www.nlc.cn/' }
  ],
  '义务教育教科书·历史 九年级 下册（统编版）': [
    { label: '国家图书馆', url: 'https://www.nlc.cn/' }
  ],
  '普通高中教科书·历史 必修·中外历史纲要（上）（统编版）': [
    { label: '国家图书馆', url: 'https://www.nlc.cn/' }
  ],
  '普通高中教科书·历史 必修·中外历史纲要（下）（统编版）': [
    { label: '国家图书馆', url: 'https://www.nlc.cn/' }
  ],
}

// 根据来源信息生成URL
function generateUrl(source) {
  const title = source.title || ''
  
  // 如果已有URL，直接返回
  if (source.url && source.url.trim()) {
    return source.url
  }
  
  // 检查映射表
  if (bookUrls[title]) {
    return bookUrls[title]
  }
  
  // 根据来源类型生成URL
  if (source.sourceType === 'textbook') {
    // 教材 - 人教社官网
    if (title.includes('义务教育教科书') || title.includes('普通高中教科书')) {
      return 'https://www.pep.com.cn/lsysh/jszx/tbjxzy/'
    }
  }
  
  if (source.sourceType === 'official_history') {
    // 史书 - 国学网
    const historyMatch = title.match(/《(.+?)》/)
    if (historyMatch) {
      const bookName = historyMatch[1]
      // 尝试生成国学网URL
      const pinyinMap = {
        '史记': 'shiji',
        '左传': 'zuozhuan',
        '汉书': 'hanshu',
        '三国志': 'sanguozhi',
        '隋书': 'suishu',
        '旧唐书': 'jiutangshu',
        '宋史': 'songshi',
        '元史': 'yuanshi',
        '明史': 'mingshi',
        '清史稿': 'qingshigao',
      }
      const pinyin = pinyinMap[bookName]
      if (pinyin) {
        return `https://www.guoxue.com/shibu/${pinyin}/`
      }
    }
  }
  
  if (source.sourceType === 'academic_book') {
    // 学术著作 - 尝试在豆瓣、国家图书馆等查找
    if (source.isbn) {
      return `https://book.douban.com/isbn/${source.isbn}/`
    }
    // 如果没有ISBN，可以链接到国家图书馆
    return 'https://www.nlc.cn/'
  }
  
  return null
}

// 根据来源信息生成额外的验证链接
function generateVerificationUrls(source) {
  const title = source.title || ''
  const verificationUrls = []
  
  // 检查映射表
  if (bookVerificationUrls[title]) {
    verificationUrls.push(...bookVerificationUrls[title])
  }
  
  // 对于有ISBN的书籍，添加豆瓣链接
  if (source.isbn && (source.sourceType === 'academic_book' || source.sourceType === 'textbook')) {
    verificationUrls.push({
      label: '豆瓣读书',
      url: `https://book.douban.com/isbn/${source.isbn}/`
    })
  }
  
  // 对于出版社是"中华书局"的书籍，添加中华书局官网
  if (source.publisher === '中华书局' && (source.sourceType === 'official_history' || source.sourceType === 'academic_book')) {
    verificationUrls.push({
      label: '中华书局官网',
      url: 'https://www.zhbc.com.cn/'
    })
  }
  
  // 对于出版社是"人民教育出版社"的书籍，添加人教社官网
  if (source.publisher === '人民教育出版社' && source.sourceType === 'textbook') {
    verificationUrls.push({
      label: '人教社官网',
      url: 'https://www.pep.com.cn/'
    })
  }
  
  // 对于史书和学术书籍，添加国家图书馆链接
  if ((source.sourceType === 'official_history' || source.sourceType === 'academic_book') && 
      !verificationUrls.some(v => v.url.includes('nlc.cn'))) {
    verificationUrls.push({
      label: '国家图书馆',
      url: 'https://www.nlc.cn/'
    })
  }
  
  return verificationUrls.length > 0 ? verificationUrls : null
}

function main() {
  const dataDir = path.join(__dirname, '../../frontend/public/data')
  const sourcesPath = path.join(dataDir, 'sources.json')
  
  const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'))
  
  let updatedCount = 0
  let verificationCount = 0
  
  for (const source of sources) {
    const oldUrl = source.url
    const newUrl = generateUrl(source)
    
    if (newUrl && newUrl !== oldUrl) {
      source.url = newUrl
      updatedCount++
      console.log(`为 "${source.title}" (id: ${source.id}) 添加URL: ${newUrl}`)
    }
    
    // 为书籍类来源添加额外验证链接
    if (source.sourceType === 'official_history' || source.sourceType === 'textbook' || source.sourceType === 'academic_book') {
      const verificationUrls = generateVerificationUrls(source)
      if (verificationUrls && verificationUrls.length > 0) {
        // 将验证链接存储到verificationUrls字段
        if (!source.verificationUrls || JSON.stringify(source.verificationUrls) !== JSON.stringify(verificationUrls)) {
          source.verificationUrls = verificationUrls
          verificationCount++
          console.log(`为 "${source.title}" (id: ${source.id}) 添加 ${verificationUrls.length} 个验证链接`)
        }
      }
    }
  }
  
  if (updatedCount > 0) {
    // 备份原文件
    const backupPath = sourcesPath + '.backup'
    fs.copyFileSync(sourcesPath, backupPath)
    console.log(`\n已备份原文件到: ${backupPath}`)
    
    // 保存更新后的数据
    fs.writeFileSync(sourcesPath, JSON.stringify(sources, null, 2), 'utf-8')
    console.log(`已为 ${updatedCount} 个来源添加URL`)
    if (verificationCount > 0) {
      console.log(`已为 ${verificationCount} 个书籍类来源添加验证链接`)
    }
  } else {
    console.log('所有来源都已包含URL')
    if (verificationCount > 0) {
      // 即使没有添加新URL，也可能添加了验证链接
      fs.writeFileSync(sourcesPath, JSON.stringify(sources, null, 2), 'utf-8')
      console.log(`已为 ${verificationCount} 个书籍类来源添加验证链接`)
    }
  }
}

if (require.main === module) {
  main()
}

module.exports = { generateUrl, main }

