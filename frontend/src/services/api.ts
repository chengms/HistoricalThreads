import axios from 'axios'
import type { 
  Event, 
  Person, 
  Relationship, 
  Dynasty, 
  Suggestion,
  ApiResponse,
  PaginatedResponse 
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 事件相关API
export const eventApi = {
  getList: (params?: {
    page?: number
    pageSize?: number
    dynastyId?: number
    eventType?: string
    startYear?: number
    endYear?: number
    search?: string
  }) => api.get<PaginatedResponse<Event>>('/events', { params }),

  getById: (id: number) => api.get<ApiResponse<Event>>(`/events/${id}`),

  getTimeline: (params?: {
    startYear?: number
    endYear?: number
    dynastyId?: number
    eventType?: string
  }) => api.get<ApiResponse<Event[]>>('/events/timeline', { params }),
}

// 人物相关API
export const personApi = {
  getList: (params?: {
    page?: number
    pageSize?: number
    dynastyId?: number
    personType?: string
    search?: string
  }) => api.get<PaginatedResponse<Person>>('/persons', { params }),

  getById: (id: number) => api.get<ApiResponse<Person>>(`/persons/${id}`),

  getEvents: (id: number) => api.get<ApiResponse<Event[]>>(`/persons/${id}/events`),

  getRelationships: (id: number) => api.get<ApiResponse<Relationship[]>>(`/persons/${id}/relationships`),
}

// 关系相关API
export const relationshipApi = {
  getList: (params?: {
    page?: number
    pageSize?: number
    personId?: number
    relationshipType?: string
  }) => api.get<PaginatedResponse<Relationship>>('/relationships', { params }),

  getNetwork: (params?: {
    personId?: number
    dynastyId?: number
    depth?: number
  }) => api.get<ApiResponse<{ nodes: Person[], edges: Relationship[] }>>('/relationships/network', { params }),
}

// 朝代相关API
export const dynastyApi = {
  getList: () => api.get<ApiResponse<Dynasty[]>>('/dynasties'),
}

// 建议相关API
export const suggestionApi = {
  create: (data: Partial<Suggestion>) => api.post<ApiResponse<Suggestion>>('/suggestions', data),

  getList: (params?: {
    page?: number
    pageSize?: number
    status?: string
  }) => api.get<PaginatedResponse<Suggestion>>('/suggestions', { params }),

  getById: (id: number) => api.get<ApiResponse<Suggestion>>(`/suggestions/${id}`),
}

// 搜索API
export const searchApi = {
  search: (params: {
    q: string
    type?: 'event' | 'person' | 'all'
    page?: number
    pageSize?: number
  }) => api.get<PaginatedResponse<Event | Person>>('/search', { params }),
}

export default api

