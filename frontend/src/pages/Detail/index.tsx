import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Tag, Button, List, Space, Spin } from 'antd'
import { ArrowLeftOutlined, LinkOutlined, CalendarOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { loadEvents, loadPersons, loadRelationships } from '@/services/dataLoader'
import type { Citation, Event, Person, PersonWithDetails } from '@/types'
import TwikooComment from '@/components/TwikooComment'
import '@/styles/detail.css'

const { Title, Paragraph } = Typography

function renderCitationMeta(c: Citation) {
  const parts: string[] = []
  if (c.chapter) parts.push(`章节：${c.chapter}`)
  if (c.page) parts.push(`页码：${c.page}`)
  if (c.line) parts.push(`行：${c.line}`)
  // “待补页码” 用更醒目的 Tag 展示，这里不再塞进 meta 文案里
  if (c.note && c.note !== '待补页码') parts.push(c.note)
  return parts.length ? `（${parts.join('；')}）` : ''
}

export default function DetailPage() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Event | Person | PersonWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!id) return
      try {
        setLoading(true)
        if (type === 'event') {
          const events = await loadEvents()
          const event = events.find(e => e.id === Number(id))
          setData(event || null)
        } else if (type === 'person') {
          const [persons, events, relationships] = await Promise.all([
            loadPersons(),
            loadEvents(),
            loadRelationships()
          ])
          const person = persons.find(p => p.id === Number(id))
          if (person) {
            // 获取人物关系
            const personRelationships = relationships
              .filter(r => r.fromPersonId === person.id || r.toPersonId === person.id)
              .map(rel => {
                // 确保关系包含完整的人物信息
                const fromPerson = persons.find(p => p.id === rel.fromPersonId)
                const toPerson = persons.find(p => p.id === rel.toPersonId)
                return {
                  ...rel,
                  fromPerson,
                  toPerson,
                }
              })
              .filter(rel => rel.fromPerson && rel.toPerson) // 过滤掉不完整的关系
            
            // 获取相关事件
            const personEvents = events.filter(e => 
              e.persons && e.persons.some(p => p.id === person.id)
            )
            
            const personWithDetails: PersonWithDetails = {
              ...person,
              relationships: personRelationships,
              events: personEvents,
            }
            
            setData(personWithDetails)
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        setError('加载数据失败，请稍后重试')
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [type, id])

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-6">
        <Spin size="large" className="w-full flex justify-center items-center" style={{ minHeight: '400px' }} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto px-6 py-6">
        <Card>
          {error ? (
            <div>
              <Typography.Text type="danger">{error}</Typography.Text>
              <Button 
                type="primary" 
                onClick={() => window.location.reload()} 
                style={{ marginLeft: 16 }}
              >
                重新加载
              </Button>
            </div>
          ) : (
            <Typography.Text>未找到数据</Typography.Text>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-6">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        返回
      </Button>

      {type === 'event' ? (
        <Card>
          <Space direction="vertical" size="large" className="w-full">
            {/* 事件标题和基本信息 */}
            <div>
              <Title level={2} style={{ marginBottom: 16 }}>{(data as Event).title}</Title>
              
              {/* 事件信息 */}
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {/* 事件年份 */}
                {(data as Event).eventYear && (
                  <div>
                    <span className="text-gray-500 mr-2">发生年份：</span>
                    <Tag color="blue" style={{ margin: 0 }}>{(data as Event).eventYear}年</Tag>
                  </div>
                )}
                
                {/* 事件日期 */}
                {(data as Event).eventDate && (
                  <div>
                    <span className="text-gray-500 mr-2">具体日期：</span>
                    <span className="text-gray-700">{(data as Event).eventDate}</span>
                  </div>
                )}
                
                {/* 所属朝代 */}
                {(data as Event).dynasty?.name && (
                  <div>
                    <span className="text-gray-500 mr-2">所属朝代：</span>
                    <Tag color="green" style={{ margin: 0 }}>{(data as Event).dynasty?.name}</Tag>
                  </div>
                )}
                
                {/* 事件类型 */}
                {(data as Event).eventType && (
                  <div>
                    <span className="text-gray-500 mr-2">事件类型：</span>
                    {(() => {
                      const typeLabels: Record<string, string> = {
                        political: '政治',
                        economic: '经济',
                        cultural: '文化',
                        military: '军事',
                        reform: '改革',
                        other: '其他'
                      }
                      const typeColors: Record<string, string> = {
                        political: 'blue',
                        economic: 'green',
                        cultural: 'orange',
                        military: 'red',
                        reform: 'purple',
                        other: 'default'
                      }
                      return (
                        <Tag color={typeColors[(data as Event).eventType] || 'default'} style={{ margin: 0 }}>
                          {typeLabels[(data as Event).eventType] || (data as Event).eventType}
                        </Tag>
                      )
                    })()}
                  </div>
                )}
                
                {/* 事件地点 */}
                {(data as Event).location && (
                  <div>
                    <span className="text-gray-500 mr-2">发生地点：</span>
                    <span className="text-gray-700">
                      <CalendarOutlined className="mr-1" />
                      {(data as Event).location}
                    </span>
                  </div>
                )}
              </Space>
            </div>
            
            {/* 事件描述 */}
            {(data as Event).description && (
              <div>
                <Title level={4} style={{ marginBottom: 12 }}>事件详情</Title>
                <Paragraph className="text-base leading-7 mb-6" style={{ fontSize: '15px', lineHeight: '1.8' }}>
                  {(data as Event).description}
                </Paragraph>
              </div>
            )}

            {/* 相关人物 */}
            {(data as Event).persons && (data as Event).persons!.length > 0 && (
              <>
                <Title level={4}>相关人物</Title>
                <List
                  dataSource={(data as Event).persons}
                  renderItem={(person) => (
                    <List.Item>
                      <Space>
                        <Button 
                          type="link" 
                          onClick={() => navigate(`/detail/person/${person.id}`)}
                          style={{ padding: 0, height: 'auto' }}
                        >
                          {person.name}
                        </Button>
                        {person.dynasty?.name && (
                          <Tag color="default" style={{ margin: 0 }}>{person.dynasty.name}</Tag>
                        )}
                      </Space>
                    </List.Item>
                  )}
                  className="mb-6"
                />
              </>
            )}

            {/* 信息来源（优先 citations，兼容 sources） */}
            {(((data as Event).citations && (data as Event).citations!.length > 0) || ((data as Event).sources && (data as Event).sources!.length > 0)) && (
              <>
                <Title level={4}>信息来源</Title>
                <List
                  dataSource={((data as Event).citations && (data as Event).citations!.length > 0)
                    ? (data as Event).citations!
                    : ((data as Event).sources || []).map(s => ({ sourceId: s.id, source: s } as Citation))}
                  renderItem={(item: any) => {
                    const c = item as Citation
                    const source = c.source
                    if (!source) return null
                    return (
                    <List.Item>
                      <LinkOutlined className="mr-2" />
                      {source.url ? (
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          {source.title}
                        </a>
                      ) : (
                        <span>{source.title}</span>
                      )}
                      {source.author && (
                        <span className="text-gray-500 ml-2">（{source.author}）</span>
                      )}
                      {c.note === '待补页码' && (
                        <Tag color="gold" style={{ marginLeft: 8, marginRight: 0 }}>待补页码</Tag>
                      )}
                      <span className="text-gray-500 ml-2">{renderCitationMeta(c)}</span>
                    </List.Item>
                    )
                  }}
                />
              </>
            )}
          </Space>
        </Card>
      ) : (
        <Card>
          <Space direction="vertical" size="large" className="w-full">
            <Space size="large" align="start" style={{ marginTop: '-20px' }}>
              {(data as Person).avatarUrl?.trim() !== '' ? (
                <div
                  className="person-detail-avatar"
                  style={{ marginBottom: '0', marginTop: '-10px' }}
                >
                  <img
                    src={(data as Person).avatarUrl}
                    alt={(data as Person).name}
                    className="person-detail-avatar-image"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ) : null}
              <Space direction="vertical" size="small" style={{ flex: 1 }}>
                <Title level={2} style={{ marginBottom: 16 }}>{(data as Person).name}</Title>
                
                {/* 别名 */}
                {(data as Person).nameVariants && (data as Person).nameVariants!.length > 0 && (
                  <div className="mb-3">
                    <span className="text-gray-500 mr-2">别名：</span>
                    <Space wrap>
                      {(data as Person).nameVariants!.map(variant => (
                        <Tag key={variant} color="default">{variant}</Tag>
                      ))}
                    </Space>
                  </div>
                )}
                
                {/* 年份和朝代信息 */}
                <div className="mb-4">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {/* 生卒年份 */}
                    {((data as Person).birthYear || (data as Person).deathYear) && (
                      <div>
                        <span className="text-gray-500 mr-2">生卒年份：</span>
                        <span className="text-gray-700">
                          {(data as Person).birthYear ? `${(data as Person).birthYear}年` : '未知'} 
                          {((data as Person).birthYear || (data as Person).deathYear) && ' - '}
                          {(data as Person).deathYear ? `${(data as Person).deathYear}年` : '未知'}
                        </span>
                      </div>
                    )}
                    
                    {/* 朝代 */}
                    {(data as Person).dynasty?.name && (
                      <div>
                        <span className="text-gray-500 mr-2">所属朝代：</span>
                        <Tag color="green" style={{ margin: 0 }}>{(data as Person).dynasty?.name}</Tag>
                      </div>
                    )}
                  </Space>
                </div>
                
                {/* 出生地和逝世地 */}
                {((data as Person).birthplace || (data as Person).deathplace) && (
                  <div className="mb-4">
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {(data as Person).birthplace && (
                        <div>
                          <span className="text-gray-500 mr-2">出生地：</span>
                          <span className="text-gray-700">{(data as Person).birthplace}</span>
                        </div>
                      )}
                      {(data as Person).deathplace && (
                        <div>
                          <span className="text-gray-500 mr-2">逝世地：</span>
                          <span className="text-gray-700">{(data as Person).deathplace}</span>
                        </div>
                      )}
                    </Space>
                  </div>
                )}
              </Space>
            </Space>
            
            {/* 传记 */}
            {(data as Person).biography && (
              <div>
                <Title level={4} style={{ marginBottom: 12 }}>人物简介</Title>
                <Paragraph className="text-base leading-7 mb-6" style={{ fontSize: '15px', lineHeight: '1.8' }}>
                  {(data as Person).biography}
                </Paragraph>
              </div>
            )}
          </Space>

          {/* 相关事件 */}
          {type === 'person' && (data as PersonWithDetails).events && (data as PersonWithDetails).events.length > 0 && (
            <>
              <Title level={4}>相关事件</Title>
              <List
                dataSource={(data as PersonWithDetails).events}
                renderItem={(event: Event) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Button 
                          type="link" 
                          onClick={() => navigate(`/detail/event/${event.id}`)}
                          style={{ padding: 0, height: 'auto', fontSize: '16px', fontWeight: 500 }}
                        >
                          {event.title}
                        </Button>
                        <Tag color="blue">{event.eventYear}年</Tag>
                      </div>
                      {event.description && (
                        <div className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                          {event.description}
                        </div>
                      )}
                    </div>
                  </List.Item>
                )}
                className="mb-6"
              />
            </>
          )}

          {type === 'person' && (data as PersonWithDetails).relationships && (data as PersonWithDetails).relationships.length > 0 && (
            <>
              <Title level={4}>人物关系</Title>
              <List
                dataSource={(data as PersonWithDetails).relationships}
                renderItem={(rel: any) => {
                  const currentPersonId = (data as Person).id
                  const otherPerson = rel.fromPersonId === currentPersonId 
                    ? rel.toPerson 
                    : rel.fromPerson
                  
                  if (!otherPerson) return null
                  
                  const getRelationshipLabel = (type: string): string => {
                    const labels: Record<string, string> = {
                      teacher_student: '师生',
                      colleague: '同僚',
                      enemy: '敌对',
                      family: '家族',
                      friend: '朋友',
                      mentor: '导师',
                      influence: '影响',
                      cooperation: '合作',
                      other: '其他',
                    }
                    return labels[type] || type
                  }
                  
                  return (
                    <List.Item>
                      <Button 
                        type="link" 
                        onClick={() => navigate(`/detail/person/${otherPerson.id}`)}
                        className="mr-4"
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        {otherPerson.name}
                      </Button>
                      <Tag color="blue">{getRelationshipLabel(rel.relationshipType)}</Tag>
                      {rel.description && (
                        <span className="text-gray-500 ml-4">{rel.description}</span>
                      )}
                    </List.Item>
                  )
                }}
                className="mb-6"
              />
            </>
          )}

          {/* 信息来源（优先 citations，兼容 sources） */}
          {(((data as Person).citations && (data as Person).citations!.length > 0) || ((data as Person).sources && (data as Person).sources!.length > 0)) && (
            <>
              <Title level={4}>信息来源</Title>
              <List
                dataSource={((data as Person).citations && (data as Person).citations!.length > 0)
                  ? (data as Person).citations!
                  : ((data as Person).sources || []).map(s => ({ sourceId: s.id, source: s } as Citation))}
                renderItem={(item: any) => {
                  const c = item as Citation
                  const source = c.source
                  if (!source) return null
                  return (
                  <List.Item>
                    <LinkOutlined className="mr-2" />
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.title}
                      </a>
                    ) : (
                      <span>{source.title}</span>
                    )}
                    {source.author && (
                      <span className="text-gray-500 ml-2">（{source.author}）</span>
                    )}
                    {c.note === '待补页码' && (
                      <Tag color="gold" style={{ marginLeft: 8, marginRight: 0 }}>待补页码</Tag>
                    )}
                    <span className="text-gray-500 ml-2">{renderCitationMeta(c)}</span>
                  </List.Item>
                  )
                }}
              />
            </>
          )}
        </Card>
      )}

      {/* Twikoo 评论组件 - 只在数据加载完成后显示 */}
      {!loading && data && (
        <TwikooComment path={`/detail/${type}/${id}`} />
      )}
    </div>
  )
}

