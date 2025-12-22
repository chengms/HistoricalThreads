// 静态数据加载服务
import type { 
  Event, 
  Person, 
  Relationship, 
  Dynasty, 
  Source,
  Citation
} from '@/types'

// 数据缓存（每次修改后重置为null以清除缓存）
let dynastiesCache: Dynasty[] | null = null
let eventsCache: Event[] | null = null
let personsCache: Person[] | null = null
let relationshipsCache: Relationship[] | null = null
let sourcesCache: Source[] | null = null

// 获取 base path（用于 GitHub Pages）
const getBasePath = () => {
  // 统一使用 Vite 的 BASE_URL（当前配置为 '/'，因此 basePath 为空字符串）
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  
  // 调试信息
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    console.log('[dataLoader] Base path:', {
      basePath,
      hostname: window.location.hostname,
      baseUrl: import.meta.env.BASE_URL,
      prod: import.meta.env.PROD
    })
  }
  
  return basePath
}

// 加载JSON数据
async function loadJson<T>(path: string): Promise<T> {
  try {
    const basePath = getBasePath()
    const fullPath = `${basePath}${path}`
    const response = await fetch(fullPath)
    if (!response.ok) {
      throw new Error(`Failed to load ${fullPath}: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error loading ${path}:`, error)
    throw error
  }
}

// 加载并关联数据
export async function loadDynasties(): Promise<Dynasty[]> {
  if (dynastiesCache) return dynastiesCache
  dynastiesCache = await loadJson<Dynasty[]>('/data/dynasties.json')
  return dynastiesCache
}

type EventType = Event['eventType']

// 兼容旧/脏数据的原始事件结构（历史遗留：year/eventType=historical 等）
type RawEventJson = Record<string, any>

function normalizeEventType(raw: unknown): EventType {
  const v = typeof raw === 'string' ? raw : ''
  const allowed: EventType[] = ['political', 'economic', 'cultural', 'military', 'reform', 'other']
  return (allowed as string[]).includes(v) ? (v as EventType) : 'other'
}

function extractYearFromText(text: string): number | null {
  // 支持：公元前260年 / 公元383年 / 383年 / 前260年（尽量保守）
  const t = text.replace(/\s+/g, '')
  const m1 = t.match(/公元前(\d{1,4})年/)
  if (m1) return -Number(m1[1])
  const m2 = t.match(/公元(\d{1,4})年/)
  if (m2) return Number(m2[1])
  const m3 = t.match(/前(\d{1,4})年/)
  if (m3) return -Number(m3[1])
  const m4 = t.match(/(^|[^\d])(\d{1,4})年/)
  if (m4) return Number(m4[2])
  return null
}

function normalizeEventYear(raw: RawEventJson): number | null {
  // 优先使用规范字段
  if (typeof raw.eventYear === 'number' && Number.isFinite(raw.eventYear)) return raw.eventYear
  // 兼容旧字段 year
  if (typeof raw.year === 'number' && Number.isFinite(raw.year)) return raw.year
  // 尝试从 eventDate/description/title 中提取
  const candidates = [raw.eventDate, raw.description, raw.title].filter((x): x is string => typeof x === 'string' && x.trim() !== '')
  for (const c of candidates) {
    const y = extractYearFromText(c)
    if (typeof y === 'number' && Number.isFinite(y)) return y
  }
  return null
}

function normalizeCitations(raw: any, sources: Source[]): Citation[] | undefined {
  const arr = Array.isArray(raw) ? raw : []
  const out: Citation[] = []
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue
    const sourceId = item.sourceId
    if (typeof sourceId !== 'number' || !Number.isFinite(sourceId)) continue
    const source = sources.find(s => s.id === sourceId)
    out.push({
      sourceId,
      source,
      page: typeof item.page === 'string' ? item.page : undefined,
      line: typeof item.line === 'string' ? item.line : undefined,
      chapter: typeof item.chapter === 'string' ? item.chapter : undefined,
      note: typeof item.note === 'string' ? item.note : undefined,
    })
  }
  return out.length ? out : undefined
}

export async function loadEvents(): Promise<Event[]> {
  if (eventsCache) return eventsCache
  const events = await loadJson<RawEventJson[]>('/data/events.json')
  const dynasties = await loadDynasties()
  const persons = await loadPersons()
  const sources = await loadSources()
  
  // 关联数据
  const normalized: Event[] = []
  for (const raw of events) {
    const year = normalizeEventYear(raw)
    if (year === null) {
      // 无法确定年份的记录会导致 UI 出现 “undefined 年”，直接跳过
      if (import.meta.env.DEV) {
        console.warn('[dataLoader] 跳过无年份事件:', { title: raw?.title, id: raw?.id })
      }
      continue
    }

    // id 缺失的脏数据无法进入详情页，跳过（避免后续路由/查找异常）
    if (typeof raw.id !== 'number' || !Number.isFinite(raw.id)) {
      if (import.meta.env.DEV) {
        console.warn('[dataLoader] 跳过无 id 事件:', { title: raw?.title, year })
      }
      continue
    }

    // 推断朝代：优先 dynastyId，否则按年份匹配
    const inferredDynasty =
      typeof raw.dynastyId === 'number'
        ? dynasties.find(d => d.id === raw.dynastyId)
        : dynasties.find(d => year >= d.startYear && year <= d.endYear)

    if (!inferredDynasty) {
      if (import.meta.env.DEV) {
        console.warn('[dataLoader] 跳过无法匹配朝代的事件:', { id: raw.id, title: raw.title, year })
      }
      continue
    }

    const personIds = Array.isArray(raw.persons) ? raw.persons.filter((x: any) => typeof x === 'number') : []
    const sourceIds = Array.isArray(raw.sources) ? raw.sources.filter((x: any) => typeof x === 'number') : []
    const citations = normalizeCitations(raw.citations, sources)

    normalized.push({
      id: raw.id,
      title: typeof raw.title === 'string' ? raw.title : '',
      description: typeof raw.description === 'string' ? raw.description : '',
      eventDate: typeof raw.eventDate === 'string' ? raw.eventDate : undefined,
      eventYear: year,
      eventType: normalizeEventType(raw.eventType),
      dynastyId: inferredDynasty.id,
      dynasty: inferredDynasty,
      location: typeof raw.location === 'string' ? raw.location : undefined,
      persons: personIds.map(id => persons.find(p => p.id === id)).filter((p): p is Person => p !== undefined),
      sources: sourceIds.map(id => sources.find(s => s.id === id)).filter((s): s is Source => s !== undefined),
      citations,
    })
  }

  eventsCache = normalized
  
  return eventsCache
}

type PersonType = Person['personType'][number]
type RawPersonJson = Record<string, any>

function normalizePersonType(raw: unknown): PersonType[] {
  const allowed: PersonType[] = ['politician', 'economist', 'writer', 'artist', 'philosopher', 'scientist', 'military', 'other']
  if (Array.isArray(raw)) {
    const filtered = raw.filter(v => typeof v === 'string' && (allowed as string[]).includes(v)) as PersonType[]
    return filtered.length ? filtered : ['other']
  }
  if (typeof raw === 'string' && (allowed as string[]).includes(raw)) return [raw as PersonType]
  return ['other']
}

function normalizeDynastyIdForPerson(raw: RawPersonJson, dynasties: Dynasty[]): number | undefined {
  if (typeof raw.dynastyId === 'number' && Number.isFinite(raw.dynastyId)) return raw.dynastyId
  // 兼容 dynasty 字符串（如：春秋末期/战国时期/汉朝 等）
  const dynastyText = typeof raw.dynasty === 'string' ? raw.dynasty : ''
  if (dynastyText) {
    const found = dynasties.find(d => dynastyText.includes(d.name))
    if (found) return found.id
    if (dynastyText.includes('春秋')) return dynasties.find(d => d.name === '春秋')?.id
    if (dynastyText.includes('战国')) return dynasties.find(d => d.name === '战国')?.id
    if (dynastyText.includes('秦')) return dynasties.find(d => d.name === '秦朝')?.id
    if (dynastyText.includes('汉')) return dynasties.find(d => d.name === '汉朝')?.id
    if (dynastyText.includes('唐')) return dynasties.find(d => d.name === '唐朝')?.id
    if (dynastyText.includes('宋')) return dynasties.find(d => d.name === '宋朝')?.id
    if (dynastyText.includes('元')) return dynasties.find(d => d.name === '元朝')?.id
    if (dynastyText.includes('明')) return dynasties.find(d => d.name === '明朝')?.id
    if (dynastyText.includes('清')) return dynasties.find(d => d.name === '清朝')?.id
  }
  // 兜底：按年份匹配（优先 birthYear，其次 deathYear）
  const year = typeof raw.birthYear === 'number' ? raw.birthYear : (typeof raw.deathYear === 'number' ? raw.deathYear : undefined)
  if (typeof year === 'number' && Number.isFinite(year)) {
    return dynasties.find(d => year >= d.startYear && year <= d.endYear)?.id
  }
  return undefined
}

export async function loadPersons(): Promise<Person[]> {
  if (personsCache) return personsCache
  const persons = await loadJson<RawPersonJson[]>('/data/persons.json')
  const dynasties = await loadDynasties()
  const sources = await loadSources()
  
  // 关联数据
  const normalized: Person[] = []
  for (const raw of persons) {
    if (typeof raw.id !== 'number' || !Number.isFinite(raw.id)) continue
    const dynastyId = normalizeDynastyIdForPerson(raw, dynasties)
    const srcIds = Array.isArray(raw.sources) ? raw.sources.filter((x: any) => typeof x === 'number') : []
    const citations = normalizeCitations(raw.citations, sources)
    const biography = typeof raw.biography === 'string'
      ? raw.biography
      : (typeof raw.description === 'string' ? raw.description : undefined)

    normalized.push({
      id: raw.id,
      name: typeof raw.name === 'string' ? raw.name : '',
      nameVariants: Array.isArray(raw.nameVariants) ? raw.nameVariants.filter((v: any) => typeof v === 'string') : undefined,
      birthYear: typeof raw.birthYear === 'number' ? raw.birthYear : undefined,
      deathYear: typeof raw.deathYear === 'number' ? raw.deathYear : undefined,
      birthDate: typeof raw.birthDate === 'string' ? raw.birthDate : undefined,
      deathDate: typeof raw.deathDate === 'string' ? raw.deathDate : undefined,
      biography,
      personType: normalizePersonType(raw.personType),
      dynastyId,
      dynasty: dynastyId ? dynasties.find(d => d.id === dynastyId) : undefined,
      avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : undefined,
      birthplace: typeof raw.birthplace === 'string' ? raw.birthplace : undefined,
      deathplace: typeof raw.deathplace === 'string' ? raw.deathplace : undefined,
      sources: srcIds.map(id => sources.find(s => s.id === id)).filter((s): s is Source => s !== undefined),
      citations,
    })
  }

  personsCache = normalized
  
  return personsCache
}

export async function loadRelationships(): Promise<Relationship[]> {
  if (relationshipsCache) return relationshipsCache
  const relationships = await loadJson<Relationship[]>('/data/relationships.json')
  const persons = await loadPersons()
  
  // 关联数据
  relationshipsCache = relationships.map(rel => ({
    ...rel,
    fromPerson: persons.find(p => p.id === rel.fromPersonId),
    toPerson: persons.find(p => p.id === rel.toPersonId),
  }))
  
  return relationshipsCache
}

export async function loadSources(): Promise<Source[]> {
  if (sourcesCache) return sourcesCache
  sourcesCache = await loadJson<Source[]>('/data/sources.json')
  return sourcesCache
}

// 清除缓存（用于开发时重新加载数据）
export function clearCache() {
  dynastiesCache = null
  eventsCache = null
  personsCache = null
  relationshipsCache = null
  sourcesCache = null
}

// 搜索功能
export async function searchEvents(query: string): Promise<Event[]> {
  try {
    const events = await loadEvents()
    const lowerQuery = query.toLowerCase().trim()
    if (!lowerQuery) return []
    
    return events.filter(event => 
      event.title.toLowerCase().includes(lowerQuery) ||
      event.description?.toLowerCase()?.includes(lowerQuery) ||
      event.dynasty?.name?.toLowerCase()?.includes(lowerQuery)
    )
  } catch (error) {
    console.error('搜索事件失败:', error)
    return []
  }
}

export async function searchPersons(query: string): Promise<Person[]> {
  try {
    const persons = await loadPersons()
    const lowerQuery = query.toLowerCase().trim()
    if (!lowerQuery) return []
    
    return persons.filter(person => 
      person.name.toLowerCase().includes(lowerQuery) ||
      person.biography?.toLowerCase()?.includes(lowerQuery) ||
      person.nameVariants?.some(v => v.toLowerCase().includes(lowerQuery)) ||
      person.dynasty?.name?.toLowerCase()?.includes(lowerQuery)
    )
  } catch (error) {
    console.error('搜索人物失败:', error)
    return []
  }
}

