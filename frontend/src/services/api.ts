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

// 获取 API 基础 URL
// 优先使用环境变量，否则根据当前环境自动判断
const getApiBaseURL = () => {
  // 如果设置了环境变量，直接使用
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // 开发环境使用代理
  if (import.meta.env.DEV) {
    return '/api'
  }
  
  // 生产环境：如果设置了自定义域名，使用相对路径
  // 否则可能需要配置完整的 API 地址
  return import.meta.env.VITE_USE_CUSTOM_DOMAIN === 'true' ? '/api' : '/api'
}

const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 添加请求拦截器，用于错误处理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 统一错误处理
    if (error.response) {
      // 服务器返回了错误状态码
      console.error('API 错误:', error.response.status, error.response.data)
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('API 请求失败:', error.request)
    } else {
      // 其他错误
      console.error('API 错误:', error.message)
    }
    return Promise.reject(error)
  }
)

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

