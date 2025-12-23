import { Card, Row, Col, Button, Typography, Input, AutoComplete, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { ClockCircleOutlined, ShareAltOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { searchEvents, searchPersons } from '@/services/dataLoader'
import '@/styles/cinematic.css'

const { Title, Paragraph } = Typography

export default function HomePage() {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [searchOptions, setSearchOptions] = useState<Array<{ value: string; label: JSX.Element }>>([])
  const [loading, setLoading] = useState(false)

  // 搜索功能
  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setSearchOptions([])
      return
    }

    setLoading(true)
    try {
      const [events, persons] = await Promise.all([
        searchEvents(value),
        searchPersons(value),
      ])

      const options: Array<{ value: string; label: JSX.Element }> = []

      // 添加事件结果
      events.slice(0, 5).forEach(event => {
        options.push({
          value: `event-${event.id}`,
          label: (
            <div>
              <div className="font-semibold">{event.title}</div>
              <div className="text-xs text-gray-500">事件 · {event.eventYear}年</div>
            </div>
          ),
        })
      })

      // 添加人物结果
      persons.slice(0, 5).forEach(person => {
        options.push({
          value: `person-${person.id}`,
          label: (
            <div>
              <div className="font-semibold">{person.name}</div>
              <div className="text-xs text-gray-500">人物 · {person.dynasty?.name || '未知朝代'}</div>
            </div>
          ),
        })
      })

      setSearchOptions(options)
    } catch (error) {
      console.error('搜索失败:', error)
      message.error('搜索失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理选择搜索结果
  const handleSelect = (value: string) => {
    const [type, id] = value.split('-')
    navigate(`/detail/${type}/${id}`)
    setSearchValue('')
    setSearchOptions([])
  }

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
    <div className="container mx-auto px-6 py-12" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* 背景叠加层 */}
      <div className="cinematic-background-overlay" />
      
      <div className="text-center mb-12" style={{ position: 'relative', zIndex: 1 }}>
        <div className="cinematic-subtitle" style={{ marginBottom: '16px' }}>探索历史</div>
        <Title level={1} className="cinematic-title cinematic-title-large mb-4" style={{ color: 'var(--cinematic-text-primary)' }}>
          中国历史时间线
        </Title>
        <Paragraph className="text-xl max-w-2xl mx-auto mb-8" style={{ color: 'var(--cinematic-text-secondary)' }}>
          探索中国五千年的历史长河，通过时间线和关系图谱深入了解历史事件、人物及其相互关系
        </Paragraph>
        
        {/* 全局搜索 */}
        <div className="max-w-2xl mx-auto mb-8">
          <AutoComplete
            value={searchValue}
            options={searchOptions}
            onSearch={handleSearch}
            onSelect={handleSelect}
            placeholder="搜索历史事件、人物..."
            size="large"
            style={{ width: '100%' }}
            notFoundContent={loading ? '搜索中...' : searchValue ? '未找到相关结果' : null}
            className="cinematic-input"
          >
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--cinematic-accent-gold)' }} />}
              allowClear
              className="cinematic-input"
              onChange={(e) => {
                setSearchValue(e.target.value)
                if (!e.target.value) {
                  setSearchOptions([])
                }
              }}
            />
          </AutoComplete>
        </div>
      </div>

      <Row gutter={[24, 24]} className="mb-12" style={{ position: 'relative', zIndex: 1 }}>
        <Col xs={24} md={8}>
          <Card
            hoverable
            className="cinematic-card h-full text-center"
            onClick={() => navigate('/timeline')}
          >
            <ClockCircleOutlined className="text-5xl mb-4" style={{ color: 'var(--cinematic-accent-gold)' }} />
            <Title level={3} style={{ color: 'var(--cinematic-text-primary)' }}>时间线</Title>
            <Paragraph style={{ color: 'var(--cinematic-text-secondary)' }}>
              按时间顺序浏览历史事件，从远古到现代，一览中国历史的发展脉络
            </Paragraph>
            <Button className="cinematic-button cinematic-button-primary mt-4">
              进入时间线
            </Button>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            hoverable
            className="cinematic-card h-full text-center"
            onClick={() => navigate('/network')}
          >
            <ShareAltOutlined className="text-5xl mb-4" style={{ color: 'var(--cinematic-accent-gold)' }} />
            <Title level={3} style={{ color: 'var(--cinematic-text-primary)' }}>关系图谱</Title>
            <Paragraph style={{ color: 'var(--cinematic-text-secondary)' }}>
              可视化展示历史人物之间的关系网络，发现历史背后的联系
            </Paragraph>
            <Button className="cinematic-button cinematic-button-primary mt-4">
              查看关系图谱
            </Button>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            hoverable
            className="cinematic-card h-full text-center"
            onClick={() => navigate('/suggestion')}
          >
            <EditOutlined className="text-5xl mb-4" style={{ color: 'var(--cinematic-accent-gold)' }} />
            <Title level={3} style={{ color: 'var(--cinematic-text-primary)' }}>提交建议</Title>
            <Paragraph style={{ color: 'var(--cinematic-text-secondary)' }}>
              发现错误或想补充内容？欢迎提交您的建议，帮助我们完善数据
            </Paragraph>
            <Button className="cinematic-button cinematic-button-primary mt-4">
              提交建议
            </Button>
          </Card>
        </Col>
      </Row>

      <Card className="cinematic-card" style={{ position: 'relative', zIndex: 1, background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--cinematic-accent-gold)' }}>
        <Row gutter={24} align="middle">
          <Col xs={24} md={16}>
            <Title level={2} style={{ color: 'var(--cinematic-accent-gold)', marginBottom: '16px' }}>
              权威数据来源
            </Title>
            <Paragraph style={{ color: 'var(--cinematic-text-secondary)', fontSize: '1rem' }}>
              所有信息均来自官方权威来源，包括学术著作、官方史料、博物馆资料等，
              确保信息的准确性和可靠性。
            </Paragraph>
          </Col>
          <Col xs={24} md={8} className="text-right">
            <Button size="large" className="cinematic-button cinematic-button-primary">
              查看数据来源
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

