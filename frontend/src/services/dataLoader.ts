// 静态数据加载服务
import type { 
  Event, 
  Person, 
  Relationship, 
  Dynasty, 
  Source 
} from '@/types'

// 数据缓存
let dynastiesCache: Dynasty[] | null = null
let eventsCache: Event[] | null = null
let personsCache: Person[] | null = null
let relationshipsCache: Relationship[] | null = null
let sourcesCache: Source[] | null = null

// 获取 base path（用于 GitHub Pages）
const getBasePath = () => {
  // 在生产环境中，base path 是 /HistoricalThreads/
  // 在开发环境中，base path 是 /
  if (import.meta.env.MODE === 'production') {
    return '/HistoricalThreads'
  }
  return ''
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

export async function loadEvents(): Promise<Event[]> {
  if (eventsCache) return eventsCache
  const events = await loadJson<any[]>('/data/events.json')
  const dynasties = await loadDynasties()
  const persons = await loadPersons()
  const sources = await loadSources()
  
  // 关联数据
  eventsCache = events.map(event => ({
    ...event,
    dynasty: dynasties.find(d => d.id === event.dynastyId),
    persons: (event.persons as number[] | undefined)?.map(id => persons.find(p => p.id === id)).filter((p): p is Person => p !== undefined) || [],
    sources: (event.sources as number[] | undefined)?.map(id => sources.find(s => s.id === id)).filter((s): s is Source => s !== undefined) || [],
  }))
  
  return eventsCache
}

export async function loadPersons(): Promise<Person[]> {
  if (personsCache) return personsCache
  const persons = await loadJson<any[]>('/data/persons.json')
  const dynasties = await loadDynasties()
  const sources = await loadSources()
  
  // 关联数据
  personsCache = persons.map(person => ({
    ...person,
    dynasty: dynasties.find(d => d.id === person.dynastyId),
    sources: (person.sources as number[] | undefined)?.map(id => sources.find(s => s.id === id)).filter((s): s is Source => s !== undefined) || [],
  }))
  
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
      event.description?.toLowerCase().includes(lowerQuery) ||
      event.dynasty?.name.toLowerCase().includes(lowerQuery)
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
      person.biography?.toLowerCase().includes(lowerQuery) ||
      person.nameVariants?.some(v => v.toLowerCase().includes(lowerQuery)) ||
      person.dynasty?.name.toLowerCase().includes(lowerQuery)
    )
  } catch (error) {
    console.error('搜索人物失败:', error)
    return []
  }
}

