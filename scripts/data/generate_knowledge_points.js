/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

function parseArgs(argv) {
  const out = {
    dryRun: false,
    outFile: 'frontend/public/data/knowledge_points.json',
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') out.dryRun = true
    else if (a === '--out' && argv[i + 1]) out.outFile = argv[++i]
  }
  return out
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function resolveEventIdsByTitle(events, titles) {
  const map = new Map(events.map(e => [e.title, e.id]))
  const ids = []
  for (const t of titles || []) {
    const id = map.get(t)
    if (!id) console.warn('[knowledge_points] missing event title:', t)
    else ids.push(id)
  }
  return Array.from(new Set(ids))
}

function resolvePersonIdsByName(persons, names) {
  const map = new Map(persons.map(p => [p.name, p.id]))
  const ids = []
  for (const n of names || []) {
    const id = map.get(n)
    if (!id) console.warn('[knowledge_points] missing person name:', n)
    else ids.push(id)
  }
  return Array.from(new Set(ids))
}

function stableIdFromTitle(title) {
  // djb2 -> unsigned 32-bit
  let h = 5381
  const s = String(title || '')
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  }
  // keep it smaller but stable
  return (h % 1000000000) + 1
}

function main() {
  const args = parseArgs(process.argv)
  const eventsFile = path.resolve('frontend/public/data/events.json')
  const personsFile = path.resolve('frontend/public/data/persons.json')
  const outFile = path.resolve(args.outFile)

  const events = readJson(eventsFile)
  const persons = readJson(personsFile)

  // 说明：
  // - 这份“知识点”不依赖教材页码/章节（用户明确不需要）。
  // - references 只放公开网页链接，便于溯源与进一步阅读。
  // - relatedEventIds/relatedPersonIds 用现有数据 id 关联，便于前端跳转详情页。
  const templates = [
    // 小学（更偏“故事/地理/文化符号”，避免过细的制度与争议）
    {
      title: '中华文明的早期印象：传说人物与文明起源（启蒙版）',
      stage: '小学',
      category: '中国古代史/启蒙',
      period: '上古-夏商周',
      summary: '认识黄河流域、治水传说与早期王朝更替的基本脉络，建立“时间很长、文明很早”的直观印象。',
      keyPoints: [
        '传说与历史：知道它们不同，但都影响文化记忆',
        '黄河与农业：地理环境对文明形成的重要性',
      ],
      relatedEventTitles: ['大禹治水'],
      relatedPersonNames: ['大禹'],
      references: [
        { title: '维基百科：黄河文明', url: 'https://zh.wikipedia.org/wiki/%E9%BB%84%E6%B2%B3%E6%96%87%E6%98%8E' },
        { title: '维基百科：大禹', url: 'https://zh.wikipedia.org/wiki/%E5%A4%A7%E7%A6%B9' },
      ],
    },
    {
      title: '伟大的工程：长城与大运河（地理与国家）',
      stage: '小学',
      category: '中国古代史/工程与地理',
      period: '秦-隋唐',
      summary: '认识长城与大运河作为大型工程在交通、防御、粮运与国家治理中的意义。',
      keyPoints: [
        '大型工程与组织能力：谁来修、怎么修、为什么修',
        '工程影响社会：交通、贸易与区域联系',
      ],
      relatedEventTitles: ['隋炀帝开凿大运河'],
      references: [
        { title: '维基百科：长城', url: 'https://zh.wikipedia.org/wiki/%E9%95%BF%E5%9F%8E' },
        { title: '维基百科：京杭大运河', url: 'https://zh.wikipedia.org/wiki/%E4%BA%AC%E6%9D%AD%E5%A4%A7%E8%BF%90%E6%B2%B3' },
      ],
    },
    {
      title: '中国古代科技与文化符号：四大发明',
      stage: '小学',
      category: '中国古代史/科技文化',
      period: '隋唐-宋元明',
      summary: '通过造纸术、印刷术、火药、指南针认识科技改变生活与交流的方式。',
      keyPoints: [
        '技术如何传播：贸易、战争、交流网络',
        '发明与生活：读写传播、航海、军事与社会变化',
      ],
      references: [
        { title: '维基百科：四大发明', url: 'https://zh.wikipedia.org/wiki/%E5%9B%9B%E5%A4%A7%E5%8F%91%E6%98%8E' },
        { title: '维基百科：造纸术', url: 'https://zh.wikipedia.org/wiki/%E9%80%A0%E7%BA%B8%E6%9C%AF' },
      ],
    },
    {
      title: '上古传说与早期国家：治水与王朝起源',
      stage: '初中',
      category: '中国古代史',
      period: '夏商周之前-夏',
      summary: '通过“大禹治水”等传说理解早期国家形成与公共工程治理的历史想象与文化记忆。',
      keyPoints: [
        '传说叙事与考古/历史研究的区别：理解“史料”与“传说”的边界',
        '治水、农业与聚落组织：早期国家形成的关键背景',
      ],
      relatedEventTitles: ['大禹治水'],
      relatedPersonNames: ['大禹'],
      references: [
        { title: '维基百科：大禹', url: 'https://zh.wikipedia.org/wiki/%E5%A4%A7%E7%A6%B9' },
        { title: '维基百科：治水', url: 'https://zh.wikipedia.org/wiki/%E6%B2%BB%E6%B0%B4' },
      ],
    },
    {
      title: '王朝更替与商周政治：从“革命”到礼制秩序',
      stage: '初中',
      category: '中国古代史/政治制度',
      period: '商-西周',
      summary: '理解商周更替、周初政治整合与礼制秩序的形成，为后续的分封与宗法理解打基础。',
      keyPoints: [
        '王朝更替的正当性叙事：天命观与“革命”概念',
        '政治整合的路径：宗族、礼制、封建分封与地域治理',
      ],
      relatedEventTitles: ['商汤灭夏', '武王伐纣'],
      relatedPersonNames: ['商汤'],
      references: [
        { title: '维基百科：商汤', url: 'https://zh.wikipedia.org/wiki/%E5%95%86%E6%B1%A4' },
        { title: '维基百科：周武王', url: 'https://zh.wikipedia.org/wiki/%E5%91%A8%E6%AD%A6%E7%8E%8B' },
      ],
    },
    {
      title: '西周政治基础：分封制与宗法制',
      stage: '初中',
      category: '中国古代史/政治制度',
      period: '西周-春秋',
      summary: '理解分封与宗法如何组织权力与社会秩序，并认识其在后期面临的结构性压力。',
      keyPoints: [
        '分封制：地方治理与宗族政治的结合',
        '宗法制：血缘与政治权力的绑定方式',
      ],
      references: [
        { title: '维基百科：分封制', url: 'https://zh.wikipedia.org/wiki/%E5%88%86%E5%B0%81%E5%88%B6' },
        { title: '维基百科：宗法', url: 'https://zh.wikipedia.org/wiki/%E5%AE%97%E6%B3%95' },
      ],
    },
    {
      title: '春秋争霸与诸侯政治：从礼崩乐坏到新秩序探索',
      stage: '初中',
      category: '中国古代史/政治',
      period: '春秋',
      summary: '以“春秋五霸”为线索把握诸侯争霸、盟会与礼制瓦解，理解“分封体系的转型压力”。',
      keyPoints: [
        '诸侯争霸与霸主政治：盟会、尊王攘夷等政治话语',
        '从宗法礼制到兼并战争：社会结构与权力重组',
      ],
      relatedEventTitles: ['春秋五霸'],
      references: [
        { title: '维基百科：春秋五霸', url: 'https://zh.wikipedia.org/wiki/%E6%98%A5%E7%A7%8B%E4%BA%94%E9%9C%B8' },
        { title: '维基百科：春秋时代', url: 'https://zh.wikipedia.org/wiki/%E6%98%A5%E7%A7%8B%E6%97%B6%E4%BB%A3' },
      ],
    },
    {
      title: '思想的时代：百家争鸣与思想传统',
      stage: '初中',
      category: '中国古代史/思想文化',
      period: '春秋战国',
      summary: '了解诸子百家在社会变动背景下的思想回应，并理解其对后世政治与文化的影响。',
      keyPoints: [
        '儒、道、法等思想关注点差异',
        '思想与现实：为什么在乱世产生多种方案',
      ],
      references: [
        { title: '维基百科：诸子百家', url: 'https://zh.wikipedia.org/wiki/%E8%AF%B8%E5%AD%90%E7%99%BE%E5%AE%B6' },
        { title: '维基百科：百家争鸣', url: 'https://zh.wikipedia.org/wiki/%E7%99%BE%E5%AE%B6%E4%BA%89%E9%B8%A3' },
      ],
    },
    {
      title: '战国变法与国家能力：以商鞅变法为例',
      stage: '初中',
      category: '中国古代史/改革',
      period: '战国',
      summary: '理解战国变法如何提升国家动员能力，进而推动兼并与统一的历史进程。',
      keyPoints: [
        '法家思想与制度化治理：法、术、势与奖惩机制',
        '户籍、军功与土地制度：国家动员能力增强的路径',
      ],
      relatedEventTitles: ['商鞅变法'],
      relatedPersonNames: ['商鞅'],
      references: [
        { title: '维基百科：商鞅变法', url: 'https://zh.wikipedia.org/wiki/%E5%95%86%E9%9E%85%E5%8F%98%E6%B3%95' },
        { title: '维基百科：法家', url: 'https://zh.wikipedia.org/wiki/%E6%B3%95%E5%AE%B6' },
      ],
    },
    {
      title: '战国兼并与统一趋势：从合纵连横到最终一统',
      stage: '初中',
      category: '中国古代史/政治与战争',
      period: '战国末期',
      summary: '理解战国后期的外交与战争格局，以及统一趋势背后的制度与资源因素。',
      keyPoints: [
        '合纵连横：外交策略与利益同盟',
        '兼并战争：资源动员、制度与地缘',
      ],
      references: [
        { title: '维基百科：合纵连横', url: 'https://zh.wikipedia.org/wiki/%E5%90%88%E7%BA%B5%E8%BF%9E%E6%A8%AA' },
        { title: '维基百科：战国时代', url: 'https://zh.wikipedia.org/wiki/%E6%88%98%E5%9B%BD%E6%97%B6%E4%BB%A3' },
      ],
    },
    {
      title: '秦的统一与中央集权：制度建设与思想控制',
      stage: '初中',
      category: '中国古代史/政治制度',
      period: '秦',
      summary: '把握秦统一后在政治、经济、文化层面的整合措施，以及统一与控制之间的张力。',
      keyPoints: [
        '统一度量衡、书同文等整合举措：国家一体化的技术路径',
        '焚书坑儒等事件：思想控制与文化代价的讨论',
      ],
      relatedEventTitles: ['秦始皇统一六国', '焚书坑儒'],
      relatedPersonNames: ['秦始皇'],
      references: [
        { title: '维基百科：秦始皇', url: 'https://zh.wikipedia.org/wiki/%E7%A7%A6%E5%A7%8B%E7%9A%87' },
        { title: '维基百科：焚书坑儒', url: 'https://zh.wikipedia.org/wiki/%E7%84%9A%E4%B9%A6%E5%9D%91%E5%84%92' },
      ],
    },
    {
      title: '中央集权的关键机制：郡县制与官僚体系（入门）',
      stage: '初中',
      category: '中国古代史/政治制度',
      period: '秦-汉',
      summary: '理解郡县制与官僚体系如何将地方纳入统一治理，以及其与分封制的差别。',
      keyPoints: [
        '郡县制：任命官员治理地方，强调中央控制',
        '官僚治理：制度、文书与行政层级',
      ],
      references: [
        { title: '维基百科：郡县制', url: 'https://zh.wikipedia.org/wiki/%E9%83%A1%E5%8E%BF%E5%88%B6' },
        { title: '维基百科：中央集权', url: 'https://zh.wikipedia.org/wiki/%E4%B8%AD%E5%A4%AE%E9%9B%86%E6%9D%83' },
      ],
    },
    {
      title: '秦末民变与帝国崩溃：陈胜吴广与楚汉之争',
      stage: '初中',
      category: '中国古代史/社会与政治',
      period: '秦末-西汉前',
      summary: '理解秦朝崩溃的社会原因与政治后果，并以楚汉之争认识政权更替的复杂性。',
      keyPoints: [
        '民变的爆发机制：徭役、刑法与基层治理压力',
        '楚汉对抗与政权合法性：军事、联盟与政治整合',
      ],
      relatedEventTitles: ['陈胜吴广起义', '楚汉之争'],
      references: [
        { title: '维基百科：陈胜吴广起义', url: 'https://zh.wikipedia.org/wiki/%E9%99%88%E8%83%9C%E5%90%B4%E5%B9%BF%E8%B5%B7%E4%B9%89' },
        { title: '维基百科：楚汉战争', url: 'https://zh.wikipedia.org/wiki/%E6%A5%9A%E6%B1%89%E6%88%98%E4%BA%89' },
      ],
    },
    {
      title: '汉代“大一统”的巩固：文景之治与休养生息（概念）',
      stage: '初中',
      category: '中国古代史/政治与经济',
      period: '西汉',
      summary: '理解西汉初期的恢复政策如何为后续对外扩张与制度建设奠定基础。',
      keyPoints: [
        '休养生息：减轻负担、恢复生产',
        '稳定与发展：财政、人口与国家能力',
      ],
      references: [
        { title: '维基百科：文景之治', url: 'https://zh.wikipedia.org/wiki/%E6%96%87%E6%99%AF%E4%B9%8B%E6%B2%BB' },
        { title: '维基百科：西汉', url: 'https://zh.wikipedia.org/wiki/%E8%A5%BF%E6%B1%89' },
      ],
    },
    {
      title: '汉武帝与“大一统”：开疆拓土与对外交流（丝绸之路）',
      stage: '初中',
      category: '中国古代史/对外关系',
      period: '西汉',
      summary: '把握汉武帝时期的国家扩张、边疆治理与对外交流，并理解“丝绸之路”的历史意义。',
      keyPoints: [
        '边疆治理与多民族互动：帝国扩张与治理成本',
        '张骞出使西域与丝绸之路：交流网络与文化传播',
      ],
      relatedEventTitles: ['汉武帝开疆拓土', '张骞出使西域'],
      relatedPersonNames: ['汉武帝', '张骞'],
      references: [
        { title: '维基百科：汉武帝', url: 'https://zh.wikipedia.org/wiki/%E6%B1%89%E6%AD%A6%E5%B8%9D' },
        { title: '维基百科：张骞', url: 'https://zh.wikipedia.org/wiki/%E5%BC%A0%E9%AA%9E' },
        { title: '维基百科：丝绸之路', url: 'https://zh.wikipedia.org/wiki/%E4%B8%9D%E7%BB%B8%E4%B9%8B%E8%B7%AF' },
      ],
    },
    {
      title: '选官制度的演变：察举制到科举制（概念线索）',
      stage: '高中',
      category: '中国古代史/政治制度',
      period: '汉-隋唐-宋',
      summary: '把握选官制度从门第到考试的变化方向，以及其对社会流动与官僚结构的影响。',
      keyPoints: [
        '察举制：地方举荐与社会评价机制',
        '科举制：考试选官与文化教育的扩张',
      ],
      references: [
        { title: '维基百科：察举制', url: 'https://zh.wikipedia.org/wiki/%E5%AF%9F%E4%B8%BE%E5%88%B6' },
        { title: '维基百科：科举', url: 'https://zh.wikipedia.org/wiki/%E7%A7%91%E4%B8%BE' },
      ],
    },
    {
      title: '典型战役与战略：从长平到赤壁（战争与政治）',
      stage: '初中',
      category: '中国古代史/军事',
      period: '战国-东晋',
      summary: '通过若干典型战役理解“战争—政治—资源动员”的关系，训练从多因素解释历史结果。',
      keyPoints: [
        '资源、地理与组织：决定胜负的不仅是“将才”',
        '战争结果如何重塑权力结构与统一进程',
      ],
      relatedEventTitles: ['巨鹿之战', '长平之战', '官渡之战', '赤壁之战', '淝水之战'],
      references: [
        { title: '维基百科：长平之战', url: 'https://zh.wikipedia.org/wiki/%E9%95%BF%E5%B9%B3%E4%B9%8B%E6%88%98' },
        { title: '维基百科：赤壁之战', url: 'https://zh.wikipedia.org/wiki/%E8%B5%A4%E5%A3%81%E4%B9%8B%E6%88%98' },
        { title: '维基百科：淝水之战', url: 'https://zh.wikipedia.org/wiki/%E6%B7%9D%E6%B0%B4%E4%B9%8B%E6%88%98' },
      ],
    },
    {
      title: '魏晋南北朝：分裂对峙与民族交往交融（概念）',
      stage: '初中',
      category: '中国古代史/社会',
      period: '魏晋南北朝',
      summary: '理解长期分裂背景下的政权更替、人口迁徙与民族融合趋势。',
      keyPoints: [
        '分裂格局：政权并立与区域差异',
        '交往交融：迁徙、通婚、文化互鉴',
      ],
      references: [
        { title: '维基百科：魏晋南北朝', url: 'https://zh.wikipedia.org/wiki/%E9%AD%8F%E6%99%8B%E5%8D%97%E5%8C%97%E6%9C%9D' },
        { title: '维基百科：民族融合', url: 'https://zh.wikipedia.org/wiki/%E6%B0%91%E6%97%8F%E8%9E%8D%E5%90%88' },
      ],
    },
    {
      title: '隋唐统一与繁荣：大运河、贞观之治与安史之乱',
      stage: '初中',
      category: '中国古代史/政治与经济',
      period: '隋唐',
      summary: '理解隋唐统一、经济重心与交通工程的关系，以及盛世与动荡并存的历史结构。',
      keyPoints: [
        '大运河与国家整合：交通、粮运与财政',
        '安史之乱的影响：藩镇、财政与社会结构变化',
      ],
      relatedEventTitles: ['隋炀帝开凿大运河', '唐太宗贞观之治', '安史之乱'],
      references: [
        { title: '维基百科：京杭大运河', url: 'https://zh.wikipedia.org/wiki/%E4%BA%AC%E6%9D%AD%E5%A4%A7%E8%BF%90%E6%B2%B3' },
        { title: '维基百科：贞观之治', url: 'https://zh.wikipedia.org/wiki/%E8%B4%9E%E8%A7%82%E4%B9%8B%E6%B2%BB' },
        { title: '维基百科：安史之乱', url: 'https://zh.wikipedia.org/wiki/%E5%AE%89%E5%8F%B2%E4%B9%8B%E4%B9%B1' },
      ],
    },
    {
      title: '隋唐制度框架：三省六部与科举制（概念）',
      stage: '高中',
      category: '中国古代史/政治制度',
      period: '隋唐',
      summary: '理解隋唐时期的中央官制与选官制度如何提高行政效率并塑造士大夫群体。',
      keyPoints: [
        '三省六部：决策、审议与执行的分工',
        '科举扩张：教育、文化与政治参与路径',
      ],
      references: [
        { title: '维基百科：三省六部', url: 'https://zh.wikipedia.org/wiki/%E4%B8%89%E7%9C%81%E5%85%AD%E9%83%A8' },
        { title: '维基百科：科举', url: 'https://zh.wikipedia.org/wiki/%E7%A7%91%E4%B8%BE' },
      ],
    },
    {
      title: '宋代国家与改革：赵宋建立与王安石变法',
      stage: '初中',
      category: '中国古代史/改革与治理',
      period: '北宋',
      summary: '理解宋代“重文轻武”的政治结构与财政军政压力，以及变法在治理上的尝试与争议。',
      keyPoints: [
        '财政与军事压力：改革动因',
        '制度改革的收益与副作用：政策设计与执行环境',
      ],
      relatedEventTitles: ['宋太祖建立宋朝', '王安石变法'],
      references: [
        { title: '维基百科：宋太祖', url: 'https://zh.wikipedia.org/wiki/%E5%AE%8B%E5%A4%AA%E7%A5%96' },
        { title: '维基百科：王安石变法', url: 'https://zh.wikipedia.org/wiki/%E7%8E%8B%E5%AE%89%E7%9F%B3%E5%8F%98%E6%B3%95' },
      ],
    },
    {
      title: '宋代经济与城市：商业、手工业与社会生活（概念）',
      stage: '高中',
      category: '中国古代史/经济与社会',
      period: '宋',
      summary: '理解宋代商品经济、城市生活与文化繁荣的特征，以及其与制度、技术、交通的关系。',
      keyPoints: [
        '商业与城市：市场、货币、人口流动',
        '技术与文化：印刷、教育与士人文化',
      ],
      references: [
        { title: '维基百科：宋朝', url: 'https://zh.wikipedia.org/wiki/%E5%AE%8B%E6%9C%9D' },
        { title: '维基百科：交子', url: 'https://zh.wikipedia.org/wiki/%E4%BA%A4%E5%AD%90' },
      ],
    },
    {
      title: '元明对外交流与海洋活动：从蒙古统一到郑和下西洋',
      stage: '初中',
      category: '中国古代史/对外关系',
      period: '元-明',
      summary: '理解统一帝国与海洋交流的历史背景，认识中国与世界互动的多样路径。',
      keyPoints: [
        '蒙古统一与欧亚交通：交流网络与制度治理',
        '郑和下西洋的性质与影响：朝贡、贸易与外交',
      ],
      relatedEventTitles: ['成吉思汗统一蒙古', '郑和下西洋'],
      relatedPersonNames: ['成吉思汗', '郑和'],
      references: [
        { title: '维基百科：成吉思汗', url: 'https://zh.wikipedia.org/wiki/%E6%88%90%E5%90%89%E6%80%9D%E6%B1%97' },
        { title: '维基百科：郑和下西洋', url: 'https://zh.wikipedia.org/wiki/%E9%83%91%E5%92%8C%E4%B8%8B%E8%A5%BF%E6%B4%8B' },
      ],
    },
    {
      title: '元代治理创新：行省制度与多民族帝国（概念）',
      stage: '高中',
      category: '中国古代史/政治制度',
      period: '元',
      summary: '理解元代的行省制度及其对后世地方行政区划与治理框架的影响。',
      keyPoints: [
        '行省制度：中央—地方关系的新形态',
        '多民族帝国治理：法律、文化与区域差异',
      ],
      references: [
        { title: '维基百科：行省', url: 'https://zh.wikipedia.org/wiki/%E8%A1%8C%E7%9C%81' },
        { title: '维基百科：元朝', url: 'https://zh.wikipedia.org/wiki/%E5%85%83%E6%9C%9D' },
      ],
    },
    {
      title: '明清君主专制的强化：内阁、军机处与厂卫（概念）',
      stage: '高中',
      category: '中国古代史/政治制度',
      period: '明清',
      summary: '理解明清时期中央权力集中化的制度机制及其对政治生态的影响。',
      keyPoints: [
        '内阁与军机处：决策机制的演化',
        '监察与情报：厂卫等机构在政治控制中的作用',
      ],
      references: [
        { title: '维基百科：内阁 (中国)', url: 'https://zh.wikipedia.org/wiki/%E5%86%85%E9%98%81_(%E4%B8%AD%E5%9B%BD)' },
        { title: '维基百科：军机处', url: 'https://zh.wikipedia.org/wiki/%E5%86%9B%E6%9C%BA%E5%A4%84' },
      ],
    },
    {
      title: '清代盛世与对外政策：康乾盛世与闭关（概念）',
      stage: '初中',
      category: '中国古代史/政治与对外关系',
      period: '清前期',
      summary: '理解清前期社会经济发展与人口增长的特征，并认识对外贸易政策与世界变局的张力。',
      keyPoints: [
        '人口与农业扩张：社会结构变化',
        '对外贸易与政策：广州口岸与贸易管理',
      ],
      references: [
        { title: '维基百科：康乾盛世', url: 'https://zh.wikipedia.org/wiki/%E5%BA%B7%E4%B9%BE%E7%9B%9B%E4%B8%96' },
        { title: '维基百科：闭关锁国', url: 'https://zh.wikipedia.org/wiki/%E9%97%AD%E5%85%B3%E9%94%81%E5%9B%BD' },
      ],
    },
    {
      title: '近代中国的开端：鸦片战争与近代国际秩序冲击',
      stage: '初中',
      category: '中国近代史',
      period: '1840年代',
      summary: '理解鸦片战争在中国近代史叙事中的位置：主权、贸易、制度冲击与社会转型起点。',
      keyPoints: [
        '战争背景：工业化、贸易结构与鸦片问题',
        '不平等条约与主权冲击：近代化压力的来源之一',
      ],
      relatedEventTitles: ['鸦片战争'],
      references: [
        { title: '维基百科：鸦片战争', url: 'https://zh.wikipedia.org/wiki/%E9%B8%A6%E7%89%87%E6%88%98%E4%BA%89' },
        { title: '维基百科：南京条约', url: 'https://zh.wikipedia.org/wiki/%E5%8D%97%E4%BA%AC%E6%9D%A1%E7%BA%A6' },
      ],
    },
    {
      title: '近代化自强探索：洋务运动（概念）',
      stage: '初中',
      category: '中国近代史/改革与工业化',
      period: '1860s-1890s',
      summary: '理解洋务运动“自强”“求富”的主张、主要实践与局限，并认识近代工业化的起步困难。',
      keyPoints: [
        '近代企业与军工：技术引进与制度环境',
        '局限性：政治结构与社会动员能力',
      ],
      references: [
        { title: '维基百科：洋务运动', url: 'https://zh.wikipedia.org/wiki/%E6%B4%8B%E5%8A%A1%E8%BF%90%E5%8A%A8' },
        { title: '维基百科：自强运动', url: 'https://zh.wikipedia.org/wiki/%E8%87%AA%E5%BC%BA%E8%BF%90%E5%8A%A8' },
      ],
    },
    {
      title: '近代化探索：甲午、戊戌到辛亥（变革与革命）',
      stage: '初中',
      category: '中国近代史/改革与革命',
      period: '1890s-1910s',
      summary: '把握“救亡图存”背景下的改革与革命路径差异，理解制度变革的多种方案与历史结果。',
      keyPoints: [
        '甲午战争后的震动：国家危机与改革呼声',
        '维新与革命：路径、组织与社会基础差异',
      ],
      relatedEventTitles: ['甲午中日战争', '戊戌变法', '辛亥革命', '中华民国成立'],
      references: [
        { title: '维基百科：甲午战争', url: 'https://zh.wikipedia.org/wiki/%E7%94%B2%E5%8D%88%E6%88%98%E4%BA%89' },
        { title: '维基百科：戊戌变法', url: 'https://zh.wikipedia.org/wiki/%E6%88%8A%E6%88%8C%E5%8F%98%E6%B3%95' },
        { title: '维基百科：辛亥革命', url: 'https://zh.wikipedia.org/wiki/%E8%BE%9B%E4%BA%A5%E9%9D%A9%E5%91%BD' },
      ],
    },
    {
      title: '思想解放与民族觉醒：五四运动与新文化',
      stage: '高中',
      category: '中国近现代史/思想文化',
      period: '1910s-1920s',
      summary: '理解五四运动的爱国、启蒙与社会动员特征，并认识其对思想文化与政治运动的影响。',
      keyPoints: [
        '思想变革与社会运动的互动：舆论、学生与城市公共空间',
        '“现代”观念的形成：科学、民主、个体与国家',
      ],
      relatedEventTitles: ['五四运动'],
      references: [
        { title: '维基百科：五四运动', url: 'https://zh.wikipedia.org/wiki/%E4%BA%94%E5%9B%9B%E8%BF%90%E5%8A%A8' },
        { title: '维基百科：新文化运动', url: 'https://zh.wikipedia.org/wiki/%E6%96%B0%E6%96%87%E5%8C%96%E8%BF%90%E5%8A%A8' },
      ],
    },
    {
      title: '共和与国家重建：民国初期的政治探索（概念）',
      stage: '高中',
      category: '中国近现代史/政治',
      period: '1912-1920s',
      summary: '理解共和制度建立后的政治整合难题与社会转型压力，为理解后续革命与战争提供背景。',
      keyPoints: [
        '制度更替后的权力整合：地方、军队与财政',
        '社会转型：城市化、教育与舆论空间',
      ],
      references: [
        { title: '维基百科：中华民国（大陆时期）', url: 'https://zh.wikipedia.org/wiki/%E4%B8%AD%E5%8D%8E%E6%B0%91%E5%9B%BD_(%E5%A4%A7%E9%99%86%E6%97%B6%E6%9C%9F)' },
        { title: '维基百科：北洋政府', url: 'https://zh.wikipedia.org/wiki/%E5%8C%97%E6%B4%8B%E6%94%BF%E5%BA%9C' },
      ],
    },
    {
      title: '全民族抗战：全面抗战爆发与抗战胜利',
      stage: '初中',
      category: '中国近现代史/战争与国家',
      period: '1937-1945',
      summary: '把握全面抗战的时间线与社会动员，理解战争对国家与社会结构的深远影响。',
      keyPoints: [
        '全面抗战与持久战：战略与资源动员',
        '战后国际秩序与中国地位变化的背景',
      ],
      relatedEventTitles: ['全面抗战爆发', '抗日战争胜利'],
      references: [
        { title: '维基百科：抗日战争', url: 'https://zh.wikipedia.org/wiki/%E6%8A%97%E6%97%A5%E6%88%98%E4%BA%89' },
        { title: '维基百科：七七事变', url: 'https://zh.wikipedia.org/wiki/%E4%B8%83%E4%B8%83%E4%BA%8B%E5%8F%98' },
      ],
    },
    {
      title: '新中国成立与早期国家建设：建国与抗美援朝',
      stage: '初中',
      category: '中国现代史/国家建设',
      period: '1949-1950s',
      summary: '理解建国初期的政治与社会重建、国际环境与安全压力，并认识抗美援朝的背景与影响。',
      keyPoints: [
        '国家重建：政权巩固与社会动员',
        '冷战格局中的安全选择：地区冲突与国际关系',
      ],
      relatedEventTitles: ['中华人民共和国成立', '抗美援朝'],
      references: [
        { title: '维基百科：中华人民共和国成立', url: 'https://zh.wikipedia.org/wiki/%E4%B8%AD%E5%8D%8E%E4%BA%BA%E6%B0%91%E5%85%B1%E5%92%8C%E5%9B%BD%E6%88%90%E7%AB%8B' },
        { title: '维基百科：抗美援朝', url: 'https://zh.wikipedia.org/wiki/%E6%8A%97%E7%BE%8E%E6%8F%B4%E6%9C%9D' },
      ],
    },
    {
      title: '新中国的社会经济变革：土地改革与“三大改造”（概念）',
      stage: '高中',
      category: '中国现代史/经济与社会',
      period: '1950s',
      summary: '理解建国初期的土地制度变革与所有制改造在社会结构与经济组织上的影响。',
      keyPoints: [
        '土地改革：农村社会结构变化与生产关系调整',
        '三大改造：公私关系与经济体制变迁',
      ],
      references: [
        { title: '维基百科：土地改革', url: 'https://zh.wikipedia.org/wiki/%E5%9C%9F%E5%9C%B0%E6%94%B9%E9%9D%A9' },
        { title: '维基百科：三大改造', url: 'https://zh.wikipedia.org/wiki/%E4%B8%89%E5%A4%A7%E6%94%B9%E9%80%A0' },
      ],
    },
    {
      title: '当代中国的转型：改革开放的关键政策与路径（概念）',
      stage: '高中',
      category: '中国当代史/经济与制度',
      period: '1978-',
      summary: '在不陷入细碎事件的前提下，理解改革开放的核心方向：放活要素、扩大开放、形成市场机制。',
      keyPoints: [
        '农村改革与家庭联产承包责任制（概念）',
        '经济特区与对外开放：制度试验与扩散',
      ],
      relatedEventTitles: ['改革开放'],
      references: [
        { title: '维基百科：家庭联产承包责任制', url: 'https://zh.wikipedia.org/wiki/%E5%AE%B6%E5%BA%AD%E8%81%94%E4%BA%A7%E6%89%BF%E5%8C%85%E8%B4%A3%E4%BB%BB%E5%88%B6' },
        { title: '维基百科：经济特区', url: 'https://zh.wikipedia.org/wiki/%E7%BB%8F%E6%B5%8E%E7%89%B9%E5%8C%BA' },
      ],
    },
    {
      title: '改革开放与全球化：从制度改革到加入WTO',
      stage: '高中',
      category: '中国当代史/经济与开放',
      period: '1978-2001',
      summary: '理解改革开放的政策动因、制度调整与社会影响，并认识加入WTO在全球化中的含义。',
      keyPoints: [
        '改革开放：经济体制转型与社会结构变化',
        '加入WTO：融入全球规则体系与产业竞争',
      ],
      relatedEventTitles: ['改革开放', '中国加入世界贸易组织'],
      references: [
        { title: '维基百科：改革开放', url: 'https://zh.wikipedia.org/wiki/%E6%94%B9%E9%9D%A9%E5%BC%80%E6%94%BE' },
        { title: '维基百科：中国加入世界贸易组织', url: 'https://zh.wikipedia.org/wiki/%E4%B8%AD%E5%9B%BD%E5%8A%A0%E5%85%A5%E4%B8%96%E7%95%8C%E8%B4%B8%E6%98%93%E7%BB%84%E7%BB%87' },
        { title: 'WTO：China and the WTO', url: 'https://www.wto.org/english/thewto_e/countries_e/china_e.htm' },
      ],
    },
  ]

  const usedIds = new Set()
  const knowledgePoints = templates.map((t) => {
    const relatedEventIds = resolveEventIdsByTitle(events, t.relatedEventTitles || [])
    const relatedPersonIds = resolvePersonIdsByName(persons, t.relatedPersonNames || [])
    let id = stableIdFromTitle(t.title)
    while (usedIds.has(id)) id++
    usedIds.add(id)
    return {
      id,
      title: t.title,
      stage: t.stage,
      category: t.category,
      period: t.period,
      summary: t.summary,
      keyPoints: t.keyPoints,
      relatedEventIds: relatedEventIds.length ? relatedEventIds : undefined,
      relatedPersonIds: relatedPersonIds.length ? relatedPersonIds : undefined,
      references: t.references,
    }
  })

  console.log('[knowledge_points] generated:', {
    count: knowledgePoints.length,
    outFile,
    dryRun: !!args.dryRun,
  })

  if (!args.dryRun) {
    writeJson(outFile, knowledgePoints)
  }
}

main()


