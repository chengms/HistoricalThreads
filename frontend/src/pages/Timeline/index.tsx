import { useState, useEffect, useRef } from 'react'
import { Card, Select, Input, Space, Typography, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { Timeline } from 'vis-timeline/standalone'
import type { DataSet } from 'vis-data/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'
import '@/styles/timeline.css'
import { loadEvents, loadDynasties, searchEvents } from '@/services/dataLoader'
import type { Event } from '@/types'

const { Title } = Typography

export default function TimelinePage() {
  const timelineRef = useRef<HTMLDivElement>(null)
  const timelineInstanceRef = useRef<Timeline | null>(null)
  const [dynasty, setDynasty] = useState<string>('all')
  const [eventType, setEventType] = useState<string>('all')
  const [searchText, setSearchText] = useState<string>('')
  const [events, setEvents] = useState<Event[]>([])
  const [dynasties, setDynasties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        filtered = await searchEvents(searchText)
        if (dynasty !== 'all') {
          filtered = filtered.filter(e => e.dynastyId === Number(dynasty))
        }
        if (eventType !== 'all') {
          filtered = filtered.filter(e => e.eventType === eventType)
        }
      }
      
      setEvents(filtered)
    }
    filterEvents()
  }, [dynasty, eventType, searchText])

  // 更新时间线
  useEffect(() => {
    if (!timelineRef.current || loading || !events.length) return

    const items = new DataSet(
      events.map(event => ({
        id: event.id,
        content: event.title,
        start: event.eventYear.toString(),
        type: 'point',
        className: `event-${event.eventType}`,
        title: `${event.title}\n${event.description?.substring(0, 100)}...`,
      }))
    )

    if (timelineInstanceRef.current) {
      timelineInstanceRef.current.setItems(items)
    } else {
      const timeline = new Timeline(timelineRef.current, items, {
        start: '-300',
        end: '2000',
        zoomMin: 1000 * 60 * 60 * 24 * 365, // 1年
        zoomMax: 1000 * 60 * 60 * 24 * 365 * 1000, // 1000年
        locale: 'zh',
      })
      timelineInstanceRef.current = timeline
    }
  }, [events, loading])

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-6">
        <Spin size="large" className="w-full flex justify-center items-center" style={{ minHeight: '600px' }} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-6">
      <Title level={2} className="mb-6">历史时间线</Title>

      <Card className="mb-6">
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
              { label: '战争', value: 'military' },
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

      <Card>
        <div ref={timelineRef} style={{ height: '600px' }} />
      </Card>
    </div>
  )
}

