// 朝代类型
export interface Dynasty {
  id: number
  name: string
  startYear: number
  endYear: number
  description?: string
}

// 事件类型
export interface Event {
  id: number
  title: string
  description: string
  eventDate?: string
  eventYear: number
  eventType: 'political' | 'economic' | 'cultural' | 'military' | 'reform' | 'other'
  dynastyId: number
  dynasty?: Dynasty
  location?: string
  persons?: Person[]
  sources?: Source[]
  citations?: Citation[]
}

// 人物类型
export interface Person {
  id: number
  name: string
  nameVariants?: string[]
  birthYear?: number
  deathYear?: number
  birthDate?: string
  deathDate?: string
  biography?: string
  personType: ('politician' | 'economist' | 'writer' | 'artist' | 'philosopher' | 'scientist' | 'military' | 'other')[]
  dynastyId?: number
  dynasty?: Dynasty
  avatarUrl?: string
  birthplace?: string
  deathplace?: string
  relationships?: Relationship[]
  events?: Event[]
  sources?: Source[]
  citations?: Citation[]
}

// 扩展的人物类型（用于详情页，包含完整的关系和事件信息）
export interface PersonWithDetails extends Person {
  relationships: Relationship[]
  events: Event[]
}

// 关系类型
export interface Relationship {
  id: number
  fromPersonId: number
  toPersonId: number
  fromPerson?: Person
  toPerson?: Person
  relationshipType: 'teacher_student' | 'colleague' | 'enemy' | 'family' | 'friend' | 'mentor' | 'influence' | 'cooperation' | 'other'
  description?: string
  startYear?: number
  endYear?: number
  strength?: number
}

// 来源类型
export interface Source {
  id: number
  title: string
  author?: string
  url?: string
  sourceType: 'academic_book' | 'textbook' | 'official_history' | 'museum' | 'authoritative_website' | 'research_paper' | 'archive'
  publisher?: string
  publishDate?: string
  // 教材/书籍增强字段（可选，便于把"国内教材体系"做成可追溯信息源）
  isbn?: string
  edition?: string
  // 学段/年级/册别（建议：小学/初中/高中）
  stage?: '小学' | '初中' | '高中'
  grade?: string
  term?: '上册' | '下册' | '全一册' | '必修' | '选择性必修' | '选修' | '其他'
  subject?: string
  volume?: string
  notes?: string
  // 额外的验证链接（用于书籍类来源，方便验证）
  verificationUrls?: Array<{ label: string; url: string }>
  credibilityLevel: number
  verified: boolean
}

// 引用（用于“教材条目级”溯源：页码/章节等）
export interface Citation {
  sourceId: number
  source?: Source
  page?: string
  line?: string
  chapter?: string
  note?: string
}

export interface KnowledgePointReference {
  title: string
  url: string
}

export interface KnowledgePoint {
  id: number
  title: string
  stage: '小学' | '初中' | '高中'
  category?: string
  period?: string
  summary: string
  keyPoints?: string[]
  relatedEventIds?: number[]
  relatedPersonIds?: number[]
  references?: KnowledgePointReference[]
}

// 建议类型
export interface Suggestion {
  id: number
  suggestionType: 'add_event' | 'add_person' | 'add_relationship' | 'add_source' | 'correct_event' | 'correct_person' | 'correct_relationship' | 'other'
  targetType?: 'event' | 'person' | 'relationship' | 'source'
  targetId?: number
  content: Record<string, any>
  submitterName: string
  submitterEmail: string
  status: 'pending' | 'approved' | 'rejected'
  adminComment?: string
  createdAt: string
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

