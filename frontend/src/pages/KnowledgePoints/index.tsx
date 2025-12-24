import { useEffect, useMemo, useState } from 'react'
import { Card, Input, Select, Space, Tag, Typography, Spin, Button, FloatButton } from 'antd'
import { VerticalAlignTopOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { loadEvents, loadPersons, loadKnowledgePoints } from '@/services/dataLoader'
import type { Event, KnowledgePoint, Person } from '@/types'
import '@/styles/cinematic.css'

const { Title, Paragraph } = Typography

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr))
}

export default function KnowledgePointsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [kps, setKps] = useState<KnowledgePoint[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [persons, setPersons] = useState<Person[]>([])

  const [q, setQ] = useState('')
  const [stage, setStage] = useState<'all' | KnowledgePoint['stage']>('all')
  const [category, setCategory] = useState<string>('all')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const [kpData, evs, ps] = await Promise.all([loadKnowledgePoints(), loadEvents(), loadPersons()])
        if (!mounted) return
        setKps(kpData)
        setEvents(evs)
        setPersons(ps)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const categoryOptions = useMemo(() => {
    const cats = uniq(kps.map(x => x.category).filter((x): x is string => typeof x === 'string' && x.trim() !== ''))
    cats.sort((a, b) => a.localeCompare(b, 'zh-CN'))
    return [{ value: 'all', label: '全部' }, ...cats.map(c => ({ value: c, label: c }))]
  }, [kps])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return kps.filter(kp => {
      if (stage !== 'all' && kp.stage !== stage) return false
      if (category !== 'all') {
        const kpCategory = kp.category || ''
        // 精确匹配或子类目匹配（如"中国古代史"包含"中国古代史/政治"）
        if (kpCategory !== category && !kpCategory.startsWith(category + '/')) {
          return false
        }
      }
      if (!qq) return true
      const hay = [
        kp.title,
        kp.summary,
        kp.period || '',
        (kp.keyPoints || []).join(' '),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(qq)
    })
  }, [kps, q, stage, category])

  const eventById = useMemo(() => new Map(events.map(e => [e.id, e])), [events])
  const personById = useMemo(() => new Map(persons.map(p => [p.id, p])), [persons])

  // 应用深色主题
  useEffect(() => {
    document.body.classList.add('cinematic-theme')
    document.documentElement.classList.add('cinematic-theme')
    return () => {
      document.body.classList.remove('cinematic-theme')
      document.documentElement.classList.remove('cinematic-theme')
    }
  }, [])

  return (
    <div className="max-w-5xl mx-auto p-6" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* 背景叠加层 */}
      <div className="cinematic-background-overlay" />
      
      <Space direction="vertical" size="middle" style={{ width: '100%', position: 'relative', zIndex: 1 }}>
        <div>
          <div className="cinematic-subtitle" style={{ marginBottom: '8px' }}>知识点</div>
          <Title level={2} className="cinematic-title cinematic-title-medium" style={{ marginBottom: 8, color: 'var(--cinematic-text-primary)' }}>
            中小学历史知识点
          </Title>
          <Paragraph style={{ marginBottom: 0, color: 'var(--cinematic-text-secondary)' }}>
            这些知识点不依赖教材页码/章节，按学段与主题整理；每条都提供公开网页链接，便于继续深挖与核验。
          </Paragraph>
        </div>

        <Card className="cinematic-card">
          <Space wrap>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索：关键词/时期/要点..."
              style={{ width: 280 }}
              allowClear
              className="cinematic-input"
            />
            <Select
              value={stage}
              onChange={(v) => setStage(v)}
              style={{ width: 120 }}
              className="cinematic-input"
              options={[
                { value: 'all', label: '全部学段' },
                { value: '小学', label: '小学' },
                { value: '初中', label: '初中' },
                { value: '高中', label: '高中' },
              ]}
            />
            <Select
              value={category}
              onChange={(v) => setCategory(v)}
              style={{ width: 260 }}
              className="cinematic-input"
              options={categoryOptions}
              showSearch
              optionFilterProp="label"
            />
          </Space>
        </Card>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {filtered.map(kp => {
              const relEvents = (kp.relatedEventIds || [])
                .map(id => eventById.get(id))
                .filter((x): x is Event => !!x)
              const relPersons = (kp.relatedPersonIds || [])
                .map(id => personById.get(id))
                .filter((x): x is Person => !!x)

              return (
                <Card key={kp.id} hoverable className="cinematic-card">
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-semibold" style={{ color: 'var(--cinematic-text-primary)' }}>{kp.title}</div>
                      <Tag color={kp.stage === '小学' ? 'green' : kp.stage === '初中' ? 'blue' : 'purple'}>{kp.stage}</Tag>
                      {kp.period && <Tag>{kp.period}</Tag>}
                      {kp.category && <Tag color="default">{kp.category}</Tag>}
                    </div>

                    <div style={{ color: 'var(--cinematic-text-secondary)' }}>{kp.summary}</div>

                    {kp.keyPoints?.length ? (
                      <ul className="list-disc pl-5 mb-0" style={{ color: 'var(--cinematic-text-secondary)' }}>
                        {kp.keyPoints.map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    ) : null}

                    {(relEvents.length || relPersons.length) ? (
                      <div className="flex flex-wrap gap-2">
                        {relEvents.map(ev => (
                          <Button
                            key={`ev-${ev.id}`}
                            type="link"
                            onClick={() => navigate(`/detail/event/${ev.id}`)}
                          >
                            事件：{ev.title}
                          </Button>
                        ))}
                        {relPersons.map(p => (
                          <Button
                            key={`p-${p.id}`}
                            type="link"
                            onClick={() => navigate(`/detail/person/${p.id}`)}
                          >
                            人物：{p.name}
                          </Button>
                        ))}
                      </div>
                    ) : null}

                    {kp.references?.length ? (
                      <div className="text-sm" style={{ color: 'var(--cinematic-text-muted)' }}>
                        <div className="font-semibold mb-1" style={{ color: 'var(--cinematic-accent-gold)' }}>公开网页参考</div>
                        <ul className="list-disc pl-5 mb-0">
                          {kp.references.map((r, i) => (
                            <li key={i}>
                              <a href={r.url} target="_blank" rel="noreferrer" style={{ color: 'var(--cinematic-accent-gold)' }}>{r.title}</a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </Space>
                </Card>
              )
            })}
          </Space>
        )}
      </Space>
      
      {/* 返回顶部按钮 */}
      <FloatButton
        icon={<VerticalAlignTopOutlined />}
        type="primary"
        style={{
          right: 24,
          bottom: 24,
        }}
        onClick={() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        }}
      />
    </div>
  )
}


