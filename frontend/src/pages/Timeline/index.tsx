import { useState, useEffect, useRef } from 'react'
import { Card, Select, Input, Space, Typography, Spin, Tag, Button, Avatar } from 'antd'
import { SearchOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { loadEvents, loadDynasties, searchEvents } from '@/services/dataLoader'
import type { Event, Dynasty, Person } from '@/types'
import '@/styles/timeline.css'

const { Title } = Typography

// 事件类型标签颜色
const eventTypeColors: Record<string, string> = {
  political: 'blue',
  economic: 'green',
  cultural: 'orange',
  military: 'red',
  reform: 'purple',
  other: 'default',
}

const eventTypeLabels: Record<string, string> = {
  political: '政治',
  economic: '经济',
  cultural: '文化',
  military: '军事',
  reform: '改革',
  other: '其他',
}

// 朝代背景渐变色配置（体现各朝代特征）
const dynastyGradients: Record<string, { start: string; end: string; name: string }> = {
  '夏朝': { start: '#8B6F47', end: '#A0826D', name: '古朴土黄' }, // 古朴的土黄色，体现原始古老
  '商朝': { start: '#4A5D23', end: '#6B7F3A', name: '青铜深绿' }, // 青铜色，体现青铜器文明
  '周朝': { start: '#D4AF37', end: '#F4D03F', name: '礼制金黄' }, // 金色，体现礼制正统
  '春秋': { start: '#E67E22', end: '#D35400', name: '争霸橙红' }, // 橙红色，体现争霸激烈
  '战国': { start: '#8B0000', end: '#A52A2A', name: '战火深红' }, // 深红色，体现战争混乱
  '秦朝': { start: '#2C2C2C', end: '#4A4A4A', name: '统一玄黑' }, // 黑色，体现统一威严
  '汉朝': { start: '#C0392B', end: '#E74C3C', name: '强盛朱红' }, // 朱红色，体现强盛繁荣
  '三国': { start: '#6C3483', end: '#8E44AD', name: '英雄深紫' }, // 深紫色，体现英雄传奇
  '晋朝': { start: '#7D3C98', end: '#9B59B6', name: '短暂淡紫' }, // 淡紫色，体现短暂分裂
  '南北朝': { start: '#5D6D7E', end: '#7F8C8D', name: '对峙灰蓝' }, // 灰蓝色，体现分裂对峙
  '隋朝': { start: '#1B4F72', end: '#2874A6', name: '统一深蓝' }, // 深蓝色，体现统一短暂
  '唐朝': { start: '#F39C12', end: '#F7DC6F', name: '盛世金黄' }, // 金黄色，体现盛世辉煌
  '宋朝': { start: '#1ABC9C', end: '#48C9B0', name: '文化青绿' }, // 青绿色，体现文化雅致
  '元朝': { start: '#27AE60', end: '#52BE80', name: '辽阔草原' }, // 草原绿，体现辽阔游牧
  '明朝': { start: '#C0392B', end: '#E74C3C', name: '汉族朱红' }, // 朱红色，体现汉族强盛
  '清朝': { start: '#1B4F72', end: '#34495E', name: '传统深蓝' }, // 深蓝色，体现传统满族
}

// 默认背景色
const defaultGradient = { start: '#667eea', end: '#764ba2', name: '默认紫蓝' }

export default function TimelinePage() {
  const navigate = useNavigate()
  const timelineContainerRef = useRef<HTMLDivElement>(null)
  const [dynasty, setDynasty] = useState<string>('all')
  const [eventType, setEventType] = useState<string>('all')
  const [searchText, setSearchText] = useState<string>('')
  const [events, setEvents] = useState<Event[]>([])
  const [dynasties, setDynasties] = useState<Dynasty[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  // 设置背景的函数
  const setBackgroundGradient = (gradient: typeof defaultGradient) => {
    const gradientStyle = `linear-gradient(135deg, ${gradient.start} 0%, ${gradient.end} 100%)`
    const body = document.body
    const html = document.documentElement
    const layout = document.querySelector('.ant-layout')
    const content = document.querySelector('.ant-layout-content')
    const contentWrapper = document.querySelector('.ant-layout-content > div')
    const root = document.getElementById('root')
    
    if (body && html) {
      // 使用 setProperty 强制设置背景，覆盖所有样式
      body.style.setProperty('background', gradientStyle, 'important')
      body.style.setProperty('background-attachment', 'fixed', 'important')
      body.style.setProperty('transition', 'background 1.5s ease-in-out', 'important')
      body.style.setProperty('min-height', '100vh', 'important')
      body.classList.add('timeline-page-active')
      
      html.style.setProperty('background', gradientStyle, 'important')
      html.style.setProperty('background-attachment', 'fixed', 'important')
      html.style.setProperty('transition', 'background 1.5s ease-in-out', 'important')
      html.style.setProperty('min-height', '100vh', 'important')
      html.classList.add('timeline-page-active')
      
      // 确保根元素也设置背景
      if (root) {
        root.style.setProperty('background', gradientStyle, 'important')
        root.style.setProperty('min-height', '100vh', 'important')
      }
      
      // 确保 Layout 组件背景透明
      if (layout) {
        ;(layout as HTMLElement).style.setProperty('background', 'transparent', 'important')
        layout.classList.add('timeline-page')
      }
      if (content) {
        ;(content as HTMLElement).style.setProperty('background', 'transparent', 'important')
        content.classList.add('timeline-page')
      }
      if (contentWrapper) {
        ;(contentWrapper as HTMLElement).style.setProperty('background', 'transparent', 'important')
      }
      
      console.log('背景已设置为:', gradient.name, gradientStyle)
    }
  }

  // 加载数据
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [eventsData, dynastiesData] = await Promise.all([
          loadEvents(),
          loadDynasties(),
        ])
        setEvents(eventsData)
        setDynasties(dynastiesData)
        
        // 设置初始背景
        if (eventsData.length > 0 && dynastiesData.length > 0) {
          const firstYear = Math.min(...eventsData.map(e => e.eventYear))
          const dynasty = dynastiesData.find(d => firstYear >= d.startYear && firstYear <= d.endYear)
          const gradient = dynasty && dynastyGradients[dynasty.name] 
            ? dynastyGradients[dynasty.name] 
            : defaultGradient
          
          // 使用 setTimeout 确保 DOM 已渲染
          setTimeout(() => {
            setBackgroundGradient(gradient)
          }, 300)
        }
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    
    // 组件卸载时清理背景
    return () => {
      const body = document.body
      const html = document.documentElement
      const layout = document.querySelector('.ant-layout')
      const content = document.querySelector('.ant-layout-content')
      
      if (body && html) {
        body.style.background = ''
        body.style.backgroundAttachment = ''
        body.style.transition = ''
        body.style.minHeight = ''
        body.classList.remove('timeline-page-active')
        
        html.style.background = ''
        html.style.backgroundAttachment = ''
        html.style.transition = ''
        html.style.minHeight = ''
        html.classList.remove('timeline-page-active')
      }
      
      if (layout) {
        ;(layout as HTMLElement).style.background = ''
        layout.classList.remove('timeline-page')
      }
      if (content) {
        ;(content as HTMLElement).style.background = ''
        content.classList.remove('timeline-page')
      }
    }
  }, [])

  // 筛选和搜索
  useEffect(() => {
    async function filterEvents() {
      let filtered = await loadEvents()
      
      if (dynasty !== 'all') {
        filtered = filtered.filter(e => e.dynastyId === Number(dynasty))
      }
      
      if (eventType !== 'all') {
        filtered = filtered.filter(e => e.eventType === eventType)
      }
      
      if (searchText) {
        const searched = await searchEvents(searchText)
        filtered = searched.filter(e => 
          (dynasty === 'all' || e.dynastyId === Number(dynasty)) &&
          (eventType === 'all' || e.eventType === eventType)
        )
      }
      
      // 按年份排序
      filtered.sort((a, b) => a.eventYear - b.eventYear)
      setEvents(filtered)
    }
    filterEvents()
  }, [dynasty, eventType, searchText])

  // 按年份分组事件
  const groupEventsByYear = () => {
    const grouped: Record<number, Event[]> = {}
    events.forEach(event => {
      const year = event.eventYear
      if (!grouped[year]) {
        grouped[year] = []
      }
      grouped[year].push(event)
    })
    return grouped
  }

  // 获取事件相关人物
  const getEventPersons = (event: Event): Person[] => {
    if (!event.persons || event.persons.length === 0) return []
    return event.persons
  }

  // 滚动到指定年份
  const scrollToYear = (year: number) => {
    const element = document.getElementById(`year-${year}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setSelectedYear(year)
      setTimeout(() => setSelectedYear(null), 2000)
    }
  }

  // 格式化年份显示
  const formatYear = (year: number): string => {
    if (year < 0) {
      return `公元前${Math.abs(year)}年`
    }
    return `公元${year}年`
  }

  // 根据年份获取对应的朝代和背景渐变
  const getDynastyByYear = (year: number): Dynasty | null => {
    return dynasties.find(d => year >= d.startYear && year <= d.endYear) || null
  }

  // 获取背景渐变色
  const getGradientByYear = (year: number) => {
    const dynasty = getDynastyByYear(year)
    if (dynasty && dynastyGradients[dynasty.name]) {
      return dynastyGradients[dynasty.name]
    }
    return defaultGradient
  }

  const groupedEvents = groupEventsByYear()
  const allYears = Array.from(new Set(events.map(e => e.eventYear))).sort((a, b) => a - b)

  // 监听滚动，更新背景渐变
  useEffect(() => {
    if (events.length === 0 || allYears.length === 0 || dynasties.length === 0) return

    const handleScroll = () => {
      // 获取视口中心位置（相对于文档顶部）
      const viewportCenter = window.scrollY + window.innerHeight / 2

      // 找到视口中心位置对应的年份
      let closestYear: number | null = null
      let minDistance = Infinity

      allYears.forEach(year => {
        const element = document.getElementById(`year-${year}`)
        if (element) {
          const rect = element.getBoundingClientRect()
          const elementTop = window.scrollY + rect.top
          const elementCenter = elementTop + rect.height / 2
          const distance = Math.abs(elementCenter - viewportCenter)
          
          if (distance < minDistance) {
            minDistance = distance
            closestYear = year
          }
        }
      })

      if (closestYear !== null) {
        const gradient = getGradientByYear(closestYear)
        setBackgroundGradient(gradient)
      }
    }

    // 使用节流优化性能
    let ticking = false
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    // 延迟初始调用，确保DOM已渲染
    setTimeout(() => {
      handleScroll()
    }, 300)
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll)
      // 清理时恢复默认背景
      const body = document.body
      const html = document.documentElement
      if (body && html) {
        body.style.background = ''
        body.style.backgroundAttachment = ''
        body.style.transition = ''
        html.style.background = ''
        html.style.backgroundAttachment = ''
        html.style.transition = ''
      }
    }
  }, [events, dynasties, allYears])

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-6">
        <Spin size="large" className="w-full flex justify-center items-center" style={{ minHeight: '600px' }} />
      </div>
    )
  }

  return (
    <div className="timeline-page-container">
      {/* 顶部筛选栏 */}
      <Card className="timeline-filter-card">
        <Space size="large" wrap>
          <Select
            style={{ width: 150 }}
            value={dynasty}
            onChange={setDynasty}
            options={[
              { label: '全部朝代', value: 'all' },
              ...dynasties.map(d => ({ label: d.name, value: d.id.toString() })),
            ]}
          />
          <Select
            style={{ width: 150 }}
            value={eventType}
            onChange={setEventType}
            options={[
              { label: '全部类型', value: 'all' },
              { label: '政治', value: 'political' },
              { label: '经济', value: 'economic' },
              { label: '文化', value: 'cultural' },
              { label: '军事', value: 'military' },
              { label: '改革', value: 'reform' },
            ]}
          />
          <Input
            placeholder="搜索事件..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Space>
      </Card>

      <div className="timeline-layout">
        {/* 左侧侧边栏 - 朝代导航 */}
        <div className="timeline-sidebar">
          <div className="dynasty-nav-header">朝代导航</div>
          <div className="dynasty-nav">
            {dynasties
              .sort((a, b) => a.startYear - b.startYear)
              .map(dynasty => {
                const dynastyEvents = events.filter(e => e.dynastyId === dynasty.id)
                if (dynastyEvents.length === 0) return null
                
                const firstEventYear = Math.min(...dynastyEvents.map(e => e.eventYear))
                
                return (
                  <Button
                    key={dynasty.id}
                    type="text"
                    block
                    className="dynasty-nav-item"
                    onClick={() => scrollToYear(firstEventYear)}
                  >
                    <div className="dynasty-nav-name">{dynasty.name}</div>
                    <div className="dynasty-nav-years">
                      {formatYear(dynasty.startYear)} - {formatYear(dynasty.endYear)}
                    </div>
                  </Button>
                )
              })}
          </div>
        </div>

        {/* 中间时间轴区域 */}
        <div className="timeline-main" ref={timelineContainerRef}>
          {allYears.map(year => {
            const yearEvents = groupedEvents[year] || []
            if (yearEvents.length === 0) return null

            return (
              <div key={year} id={`year-${year}`} className="timeline-year-section">
                {/* 年份标签 */}
                <div className="timeline-year-label">
                  <span className="year-text">{formatYear(year)}</span>
                </div>

                {/* 时间轴内容 */}
                <div className="timeline-content-row">
                  {/* 左侧：事件列表 */}
                  <div className="timeline-events">
                    {yearEvents.map(event => (
                      <Card
                        key={event.id}
                        className={`timeline-event-card event-${event.eventType} ${selectedYear === year ? 'highlighted' : ''}`}
                        hoverable
                        onClick={() => navigate(`/detail/event/${event.id}`)}
                      >
                        <div className="event-header">
                          <Title level={5} className="event-title">{event.title}</Title>
                          <Tag color={eventTypeColors[event.eventType]}>
                            {eventTypeLabels[event.eventType]}
                          </Tag>
                        </div>
                        <div className="event-description">
                          {event.description}
                        </div>
                        {event.location && (
                          <div className="event-location">
                            <CalendarOutlined /> {event.location}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {/* 右侧：相关人物 */}
                  <div className="timeline-persons">
                    {yearEvents.map(event => {
                      const eventPersons = getEventPersons(event)
                      if (eventPersons.length === 0) return null

                      return (
                        <div key={event.id} className="event-persons-group">
                          {eventPersons.map(person => (
                            <Button
                              key={person.id}
                              type="link"
                              className="person-link"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/detail/person/${person.id}`)
                              }}
                            >
                              {person.avatarUrl ? (
                                <Space size={8}>
                                  <Avatar
                                    src={person.avatarUrl}
                                    icon={<UserOutlined />}
                                    size="small"
                                    className="person-avatar"
                                    onError={() => true}
                                  />
                                  <span className="person-name">{person.name}</span>
                                </Space>
                              ) : (
                                <span className="person-name">{person.name}</span>
                              )}
                            </Button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
