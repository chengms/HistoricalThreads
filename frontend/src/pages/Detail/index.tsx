import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Tag, Button, List, Space, Spin, Avatar } from 'antd'
import { ArrowLeftOutlined, LinkOutlined, UserOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { loadEvents, loadPersons, loadRelationships } from '@/services/dataLoader'
import type { Event, Person } from '@/types'
import '@/styles/detail.css'

const { Title, Paragraph } = Typography

export default function DetailPage() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Event | Person | null>(null)
  const [loading, setLoading] = useState(true)

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
            
            setData({ ...person, relationships: personRelationships, events: personEvents } as any)
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error)
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
        <Card>未找到数据</Card>
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
          <Title level={2}>{(data as Event).title}</Title>
          <Space className="mb-4">
            <Tag color="blue">{(data as Event).eventYear}年</Tag>
            <Tag color="green">{(data as Event).dynasty?.name}</Tag>
            <Tag color="orange">{(data as Event).eventType}</Tag>
          </Space>
          <Paragraph className="text-lg mb-6">{(data as Event).description}</Paragraph>

          {(data as Event).persons && (data as Event).persons!.length > 0 && (
            <>
              <Title level={4}>相关人物</Title>
              <List
                dataSource={(data as Event).persons}
                renderItem={(person) => (
                  <List.Item>
                    <Button type="link" onClick={() => navigate(`/detail/person/${person.id}`)}>
                      {person.name}
                    </Button>
                  </List.Item>
                )}
                className="mb-6"
              />
            </>
          )}

          {(data as Event).sources && (data as Event).sources!.length > 0 && (
            <>
              <Title level={4}>信息来源</Title>
              <List
                dataSource={(data as Event).sources}
                renderItem={(source) => (
                  <List.Item>
                    <LinkOutlined className="mr-2" />
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.title}
                      </a>
                    ) : (
                      <span>{source.title}</span>
                    )}
                  </List.Item>
                )}
              />
            </>
          )}
        </Card>
      ) : (
        <Card>
          <Space direction="vertical" size="large" className="w-full">
            <Space size="large" align="start">
              <Avatar
                src={(data as Person).avatarUrl}
                icon={<UserOutlined />}
                size={120}
                shape="square"
                className="person-detail-avatar"
                onError={() => true}
              />
              <div style={{ flex: 1 }}>
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
              </div>
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
          {(data as any).events && (data as any).events.length > 0 && (
            <>
              <Title level={4}>相关事件</Title>
              <List
                dataSource={(data as any).events}
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

          {(data as any).relationships && (data as any).relationships.length > 0 && (
            <>
              <Title level={4}>人物关系</Title>
              <List
                dataSource={(data as any).relationships}
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
                        <Avatar
                          src={otherPerson.avatarUrl}
                          icon={<UserOutlined />}
                          size="small"
                          onError={() => true}
                        />
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

          {(data as Person).sources && (data as Person).sources!.length > 0 && (
            <>
              <Title level={4}>信息来源</Title>
              <List
                dataSource={(data as Person).sources}
                renderItem={(source) => (
                  <List.Item>
                    <LinkOutlined className="mr-2" />
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.title}
                      </a>
                    ) : (
                      <span>{source.title}</span>
                    )}
                  </List.Item>
                )}
              />
            </>
          )}
        </Card>
      )}
    </div>
  )
}

