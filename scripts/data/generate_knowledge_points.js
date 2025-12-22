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
      title: '近代化探索：甲午、戊戌到辛亥（变革与革命）',
      stage: '初中',
      category: '中国近代史/改革与革命',
      period: '1890s-1910s',
      summary: '把握“救亡图存”背景下的改革与革命路径差异，理解制度变革的多种方案与历史结果。',
      keyPoints: [
        '甲午战争后的震动：国家危机与改革呼声',
        '维新与革命：路径、组织与社会基础差异',
      ],
      relatedEventTitles: ['甲午中日战争', '戊戌变法', '辛亥革命', '中华民国成立', '中华民国成立'],
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

  const knowledgePoints = templates.map((t, idx) => {
    const relatedEventIds = resolveEventIdsByTitle(events, t.relatedEventTitles || [])
    const relatedPersonIds = resolvePersonIdsByName(persons, t.relatedPersonNames || [])
    return {
      id: idx + 1,
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


