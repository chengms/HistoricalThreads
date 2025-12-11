import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Tag, Button, List, Space, Spin } from 'antd'
import { ArrowLeftOutlined, LinkOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { loadEvents, loadPersons, loadRelationships } from '@/services/dataLoader'
import type { Event, Person } from '@/types'

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
          const persons = await loadPersons()
          const person = persons.find(p => p.id === Number(id))
          if (person) {
            const relationships = await loadRelationships()
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
            setData({ ...person, relationships: personRelationships } as any)
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error)
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
          <Title level={2}>{(data as Person).name}</Title>
          <Space className="mb-4">
            <Tag color="blue">
              {(data as Person).birthYear} - {(data as Person).deathYear}
            </Tag>
            <Tag color="green">{(data as Person).dynasty?.name}</Tag>
            {(data as Person).personType.map(type => (
              <Tag key={type} color="purple">{type}</Tag>
            ))}
          </Space>
          <Paragraph className="text-lg mb-6">{(data as Person).biography}</Paragraph>

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

