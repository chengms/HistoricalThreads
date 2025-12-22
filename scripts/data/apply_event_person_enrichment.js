/**
 * 按“事件为线索”批量补齐关键人物（会写入数据文件）：
 * - 若人物不存在：新增到 persons.json（含基础信息 + 1 条百度百科来源）
 * - 若来源不存在：新增到 sources.json
 * - 为指定事件补齐 event.persons（去重）
 *
 * 用法（仓库根目录）：
 *   node scripts/data/apply_event_person_enrichment.js
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

function uniqNums(arr) {
  const out = []
  const seen = new Set()
  for (const v of arr) {
    if (typeof v !== 'number') continue
    if (seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

function maxId(list) {
  let m = 0
  for (const x of list) {
    const id = x && typeof x.id === 'number' ? x.id : 0
    if (id > m) m = id
  }
  return m
}

function main() {
  const personsPath = path.join(DATA_DIR, 'persons.json')
  const eventsPath = path.join(DATA_DIR, 'events.json')
  const sourcesPath = path.join(DATA_DIR, 'sources.json')

  const persons = readJSON(personsPath)
  const events = readJSON(eventsPath)
  const sources = readJSON(sourcesPath)

  const personsByName = new Map()
  const personsById = new Map()
  for (const p of persons) {
    if (!p || typeof p.id !== 'number') continue
    if (typeof p.name === 'string' && p.name.trim()) personsByName.set(p.name.trim(), p)
    personsById.set(p.id, p)
  }

  const sourcesByUrl = new Map()
  for (const s of sources) {
    if (!s || typeof s.id !== 'number') continue
    const url = typeof s.url === 'string' ? s.url.trim() : ''
    if (url) sourcesByUrl.set(url, s)
  }

  let nextPersonId = maxId(persons) + 1
  let nextSourceId = maxId(sources) + 1

  const upsertBaiduBaikeSource = (name, url) => {
    const u = String(url || '').trim()
    if (!u) return null
    const existed = sourcesByUrl.get(u)
    if (existed) return existed.id
    const entry = {
      id: nextSourceId++,
      title: `百度百科：${name}`,
      url: u,
      sourceType: 'authoritative_website',
      credibilityLevel: 3,
      verified: false,
    }
    sources.push(entry)
    sourcesByUrl.set(u, entry)
    return entry.id
  }

  const upsertPerson = (spec) => {
    const name = String(spec.name || '').trim()
    if (!name) throw new Error('invalid person spec: missing name')
    const existed = personsByName.get(name)
    if (existed) return existed.id

    const sourceIds = []
    const baikeId = upsertBaiduBaikeSource(name, spec.baikeUrl)
    if (typeof baikeId === 'number') sourceIds.push(baikeId)

    const entry = {
      id: nextPersonId++,
      name,
      nameVariants: Array.isArray(spec.nameVariants) ? spec.nameVariants : [],
      ...(typeof spec.birthYear === 'number' ? { birthYear: spec.birthYear } : {}),
      ...(typeof spec.deathYear === 'number' ? { deathYear: spec.deathYear } : {}),
      biography: String(spec.biography || '').trim(),
      personType: Array.isArray(spec.personType) && spec.personType.length ? spec.personType : ['other'],
      dynastyId: typeof spec.dynastyId === 'number' ? spec.dynastyId : undefined,
      sources: sourceIds,
    }

    persons.push(entry)
    personsByName.set(name, entry)
    personsById.set(entry.id, entry)
    return entry.id
  }

  // 以事件为线索补齐“关键人物”（可以按需要继续扩充）
  const enrichmentPlan = [
    {
      eventId: 21,
      persons: [
        {
          name: '章邯',
          nameVariants: [],
          deathYear: -205,
          biography: '秦末将领，镇压陈胜吴广起义并与反秦诸侯作战，巨鹿之战后势衰，后归降并被封王。',
          personType: ['military'],
          dynastyId: 6,
          baikeUrl: 'https://baike.baidu.com/item/章邯',
        },
        {
          name: '王离',
          nameVariants: [],
          biography: '秦将，在秦末战争中与章邯等率军作战，巨鹿之战相关人物之一。',
          personType: ['military'],
          dynastyId: 6,
          baikeUrl: 'https://baike.baidu.com/item/王离',
        },
      ],
    },
    {
      eventId: 23,
      persons: [
        {
          name: '袁绍',
          nameVariants: ['本初'],
          birthYear: 154,
          deathYear: 202,
          biography: '东汉末军阀，割据河北并与曹操争雄，官渡之战中败于曹操，此后势力转衰。',
          personType: ['politician', 'military'],
          dynastyId: 7,
          baikeUrl: 'https://baike.baidu.com/item/袁绍',
        },
      ],
    },
    {
      eventId: 22,
      persons: [
        {
          name: '白起',
          nameVariants: ['武安君'],
          birthYear: -332,
          deathYear: -257,
          biography: '战国秦国名将，长平之战中秦军主将之一，秦国扩张的重要军事人物。',
          personType: ['military'],
          dynastyId: 5,
          baikeUrl: 'https://baike.baidu.com/item/白起',
        },
        {
          name: '廉颇',
          nameVariants: [],
          birthYear: -327,
          deathYear: -243,
          biography: '战国赵国名将，长平之战前期赵军主将之一，赵国重要军事人物。',
          personType: ['military'],
          dynastyId: 5,
          baikeUrl: 'https://baike.baidu.com/item/廉颇',
        },
        {
          name: '赵括',
          nameVariants: [],
          deathYear: -260,
          biography: '战国赵国将领，长平之战中接替廉颇为主将，战败阵亡。',
          personType: ['military'],
          dynastyId: 5,
          baikeUrl: 'https://baike.baidu.com/item/赵括',
        },
      ],
    },
    {
      eventId: 24,
      persons: [
        {
          name: '苻坚',
          nameVariants: [],
          birthYear: 338,
          deathYear: 385,
          biography: '十六国时期前秦君主，统一北方后南下伐晋，淝水之战失败导致前秦迅速衰落。',
          personType: ['politician', 'military'],
          dynastyId: 9,
          baikeUrl: 'https://baike.baidu.com/item/苻坚',
        },
        {
          name: '谢安',
          nameVariants: [],
          birthYear: 320,
          deathYear: 385,
          biography: '东晋政治家，淝水之战时主持朝政并推动战守决策，是东晋稳定的重要人物。',
          personType: ['politician'],
          dynastyId: 9,
          baikeUrl: 'https://baike.baidu.com/item/谢安',
        },
        {
          name: '谢玄',
          nameVariants: [],
          birthYear: 343,
          deathYear: 388,
          biography: '东晋将领，统率北府兵，在淝水之战中发挥关键作用。',
          personType: ['military'],
          dynastyId: 9,
          baikeUrl: 'https://baike.baidu.com/item/谢玄',
        },
      ],
    },
    {
      eventId: 26,
      persons: [
        {
          name: '康有为',
          nameVariants: [],
          birthYear: 1858,
          deathYear: 1927,
          biography: '清末思想家、政治家，维新派代表人物之一，参与推动戊戌变法。',
          personType: ['politician', 'writer'],
          dynastyId: 16,
          baikeUrl: 'https://baike.baidu.com/item/康有为',
        },
        {
          name: '梁启超',
          nameVariants: [],
          birthYear: 1873,
          deathYear: 1929,
          biography: '清末民初思想家、学者、政论家，维新派重要人物，参与并宣传戊戌变法主张。',
          personType: ['writer', 'politician'],
          dynastyId: 16,
          baikeUrl: 'https://baike.baidu.com/item/梁启超',
        },
        {
          name: '谭嗣同',
          nameVariants: [],
          birthYear: 1865,
          deathYear: 1898,
          biography: '维新派人士，“戊戌六君子”之一，因变法失败被杀。',
          personType: ['writer', 'politician'],
          dynastyId: 16,
          baikeUrl: 'https://baike.baidu.com/item/谭嗣同',
        },
        {
          name: '光绪帝',
          nameVariants: ['载湉'],
          birthYear: 1871,
          deathYear: 1908,
          biography: '清朝皇帝，在戊戌变法中支持维新改革，后变法失败被幽禁。',
          personType: ['politician'],
          dynastyId: 16,
          baikeUrl: 'https://baike.baidu.com/item/光绪帝',
        },
        {
          name: '慈禧太后',
          nameVariants: ['叶赫那拉氏'],
          birthYear: 1835,
          deathYear: 1908,
          biography: '清末重要政治人物，戊戌变法中发动政变，导致变法失败。',
          personType: ['politician'],
          dynastyId: 16,
          baikeUrl: 'https://baike.baidu.com/item/慈禧太后',
        },
      ],
    },
    {
      eventId: 35,
      persons: [
        {
          name: '江泽民',
          nameVariants: [],
          birthYear: 1926,
          deathYear: 2022,
          biography: '中国重要政治人物，20世纪末至21世纪初中国对外开放与改革进程的重要参与者之一。',
          personType: ['politician'],
          dynastyId: 18,
          baikeUrl: 'https://baike.baidu.com/item/江泽民',
        },
        {
          name: '朱镕基',
          nameVariants: [],
          birthYear: 1928,
          deathYear: 2020,
          biography: '中国重要政治人物，参与并推动经济体制改革与对外开放相关工作。',
          personType: ['politician'],
          dynastyId: 18,
          baikeUrl: 'https://baike.baidu.com/item/朱镕基',
        },
      ],
    },
  ]

  const eventsById = new Map()
  for (const e of events) if (e && typeof e.id === 'number') eventsById.set(e.id, e)

  let addedPersons = 0
  let addedSources = 0
  const sourcesBefore = sources.length
  const personsBefore = persons.length

  let changedEvents = 0

  for (const task of enrichmentPlan) {
    const e = eventsById.get(task.eventId)
    if (!e) continue
    const existing = uniqNums(Array.isArray(e.persons) ? e.persons : [])
    const next = [...existing]

    for (const ps of task.persons) {
      const beforePersonCount = persons.length
      const beforeSourceCount = sources.length
      const pid = upsertPerson(ps)
      if (!next.includes(pid)) next.push(pid)
      if (persons.length > beforePersonCount) addedPersons += 1
      if (sources.length > beforeSourceCount) addedSources += (sources.length - beforeSourceCount)
    }

    // 稳定排序：按 id 升序，减少 diff 噪音
    next.sort((a, b) => a - b)
    const same = existing.length === next.length && existing.every((v, i) => v === next[i])
    if (!same) {
      e.persons = next
      changedEvents += 1
    }
  }

  // 写回数据
  if (sources.length !== sourcesBefore) {
    // 统计新增 sources 条数
    addedSources = sources.length - sourcesBefore
  }
  if (persons.length !== personsBefore) {
    addedPersons = persons.length - personsBefore
  }

  saveJSON(personsPath, persons)
  saveJSON(sourcesPath, sources)
  saveJSON(eventsPath, events)

  console.log('[apply_event_person_enrichment] done', {
    changedEvents,
    addedPersons,
    addedSources,
    nextPersonId,
    nextSourceId,
  })
}

main()


