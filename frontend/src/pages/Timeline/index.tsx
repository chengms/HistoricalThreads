import { useState, useEffect, useRef } from 'react'
import { Card, Select, Input, Space, Typography, Spin, Tag, Button, Affix } from 'antd'
import { SearchOutlined, CalendarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { loadEvents, loadDynasties, loadPersons, searchEvents } from '@/services/dataLoader'
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

export default function TimelinePage() {
  const navigate = useNavigate()
  const timelineContainerRef = useRef<HTMLDivElement>(null)
  const [dynasty, setDynasty] = useState<string>('all')
  const [eventType, setEventType] = useState<string>('all')
  const [searchText, setSearchText] = useState<string>('')
  const [events, setEvents] = useState<Event[]>([])
  const [dynasties, setDynasties] = useState<Dynasty[]>([])
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  // 加载数据
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [eventsData, dynastiesData, personsData] = await Promise.all([
          loadEvents(),
          loadDynasties(),
          loadPersons(),
        ])
        setEvents(eventsData)
        setDynasties(dynastiesData)
        setPersons(personsData)
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
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

  // 获取所有年份范围
  const getYearRange = () => {
    if (events.length === 0) return { min: -2000, max: 2000 }
    const years = events.map(e => e.eventYear)
    return {
      min: Math.min(...years),
      max: Math.max(...years),
    }
  }

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

  const { min, max } = getYearRange()
  const groupedEvents = groupEventsByYear()
  const allYears = Array.from(new Set(events.map(e => e.eventYear))).sort((a, b) => a - b)

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
        <Affix offsetTop={100}>
          <Card className="timeline-sidebar" title="朝代导航">
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
          </Card>
        </Affix>

        {/* 中间时间轴区域 */}
        <div className="timeline-main" ref={timelineContainerRef}>
          {allYears.map(year => {
            const yearEvents = groupedEvents[year] || []
            if (yearEvents.length === 0) return null

            return (
              <div key={year} id={`year-${year}`} className="timeline-year-section">
                {/* 年份标签 */}
                <div className="timeline-year-label">
                  <div className="year-marker" />
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
                              {person.name}
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
