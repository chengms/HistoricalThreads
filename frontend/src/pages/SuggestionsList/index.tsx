import { useState, useEffect } from 'react'
import { Card, List, Typography, Tag, Space, Spin, Select, Input, Button, Empty, Pagination, Descriptions } from 'antd'
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import '@/styles/suggestions-list.css'
import '@/styles/cinematic.css'

const { Title, Paragraph, Text } = Typography
const { Search } = Input

interface TwikooComment {
  id: string
  nick: string
  mail: string
  link: string
  comment: string
  url: string
  ua: string
  ip: string
  master: boolean
  created: number
  updated: number
  avatar: string
  pid: string
  rid: string
}

interface TwikooResponse {
  code?: number
  errno?: number
  data?: TwikooComment[]
  message?: string
}

export default function SuggestionsListPage() {
  const [loading, setLoading] = useState(false)
  const [comments, setComments] = useState<TwikooComment[]>([])
  const [filteredComments, setFilteredComments] = useState<TwikooComment[]>([])
  const [searchText, setSearchText] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'detail'>('list')
  const [selectedComment, setSelectedComment] = useState<TwikooComment | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  // 获取 Twikoo 评论列表
  const fetchComments = async () => {
    const envId = import.meta.env.VITE_TWIKOO_ENV_ID || ''
    if (!envId) {
      console.warn('Twikoo envId 未配置')
      return
    }

    setLoading(true)
    try {
      // 确定 API URL
      let apiUrl = envId
      if (envId.includes('netlify.app')) {
        if (envId.includes('/.netlify/functions/')) {
          apiUrl = envId
        } else {
          apiUrl = envId.replace(/\/$/, '') + '/.netlify/functions/twikoo'
        }
      } else if (envId.includes('vercel.app')) {
        if (envId.endsWith('/api')) {
          apiUrl = envId
        } else {
          apiUrl = envId.replace(/\/$/, '') + '/api'
        }
      } else {
        apiUrl = envId.replace(/\/$/, '') + '/api'
      }

      // 获取最新评论
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'GET_RECENT_COMMENTS',
          pageSize: 100, // 获取更多评论
          includeReply: false, // 不包括回复
        }),
      })

      if (response.ok) {
        const result: TwikooResponse = await response.json()
        // 开发环境调试日志
        if (import.meta.env.DEV) {
          console.log('Twikoo 评论列表响应:', result)
        }

        // GET_RECENT_COMMENTS 成功时直接返回 data 数组，没有 code/errno
        if (result.data && Array.isArray(result.data)) {
          const commentsList = result.data
          // 只显示建议页面的评论（url 包含 /suggestion）
          const suggestions = commentsList.filter(comment => 
            comment.url && (comment.url.includes('/suggestion') || comment.url.endsWith('/suggestion'))
          )
          setComments(suggestions)
          setFilteredComments(suggestions)
          setTotal(suggestions.length)
        } else if (result.errno === 0 || result.code === 0) {
          // 兼容其他可能的响应格式
          const commentsList = (result.data || []) as TwikooComment[]
          const suggestions = commentsList.filter((comment: TwikooComment) => 
            comment.url && (comment.url.includes('/suggestion') || comment.url.endsWith('/suggestion'))
          )
          setComments(suggestions)
          setFilteredComments(suggestions)
          setTotal(suggestions.length)
        } else {
          console.error('获取评论失败:', result.message || '未知错误')
        }
      } else {
        const errorText = await response.text()
        console.error('获取评论失败:', response.status, errorText)
      }
    } catch (error) {
      console.error('获取评论列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [])

  // 搜索过滤
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredComments(comments)
      setTotal(comments.length)
      return
    }

    const filtered = comments.filter(comment => {
      const searchLower = searchText.toLowerCase()
      return (
        comment.nick?.toLowerCase().includes(searchLower) ||
        comment.mail?.toLowerCase().includes(searchLower) ||
        comment.comment?.toLowerCase().includes(searchLower) ||
        comment.url?.toLowerCase().includes(searchLower)
      )
    })
    setFilteredComments(filtered)
    setTotal(filtered.length)
    setCurrentPage(1) // 重置到第一页
  }, [searchText, comments])

  // 分页处理
  const paginatedComments = filteredComments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // 解析建议内容（Markdown 格式）
  const parseSuggestionContent = (comment: string) => {
    const result: any = {
      type: '',
      time: '',
      description: '',
      sources: [],
      images: [],
    }

    // 解析类型
    const typeMatch = comment.match(/##\s*(.+?)\n/)
    if (typeMatch) {
      result.type = typeMatch[1].trim()
    }

    // 解析时间
    const timeMatch = comment.match(/\*\*时间：\*\*\s*(.+?)\n/)
    if (timeMatch) {
      result.time = timeMatch[1].trim()
    }

    // 解析详细描述
    const descMatch = comment.match(/\*\*详细描述：\*\*\n(.+?)(?=\n##|\n\*\*|$)/s)
    if (descMatch) {
      result.description = descMatch[1].trim()
    }

    // 解析附加图片
    const imagesMatch = comment.match(/##\s*附加图片\n\n(.+?)(?=\n##|$)/s)
    if (imagesMatch) {
      const imagesText = imagesMatch[1]
        if (import.meta.env.DEV) {
          console.log('图片文本内容:', imagesText)
        }
      // 匹配 Markdown 图片格式: ![alt](url) 或 ![alt](url)\n
      const imageRegex = /!\[[^\]]*\]\((https?:\/\/[^\s\)]+)\)/g
      let match
      while ((match = imageRegex.exec(imagesText)) !== null) {
        const imageUrl = match[1].trim()
        if (imageUrl) {
          result.images.push(imageUrl)
        }
      }
        if (import.meta.env.DEV) {
          console.log('解析到的图片URL:', result.images)
        }
    } else {
      // 如果没有匹配到"附加图片"章节，尝试在整个评论中查找图片
      const allImagesRegex = /!\[[^\]]*\]\((https?:\/\/[^\s\)]+)\)/g
      let match
      while ((match = allImagesRegex.exec(comment)) !== null) {
        const imageUrl = match[1].trim()
        if (imageUrl && !result.images.includes(imageUrl)) {
          result.images.push(imageUrl)
        }
      }
      if (result.images.length > 0) {
        if (import.meta.env.DEV) {
          console.log('从整个评论中解析到的图片URL:', result.images)
        }
      }
    }

    // 解析信息来源
    const sourcesMatch = comment.match(/##\s*信息来源\n\n(.+?)(?=\n##|$)/s)
    if (sourcesMatch) {
      const sourcesText = sourcesMatch[1]
      const sourceBlocks = sourcesText.split(/###\s*来源\s*\d+\n\n/)
      sourceBlocks.forEach((block: string) => {
        if (block.trim()) {
          const source: any = {}
          const typeMatch = block.match(/- \*\*类型：\*\*\s*(.+?)\n/)
          if (typeMatch) source.sourceType = typeMatch[1].trim()
          const titleMatch = block.match(/- \*\*标题：\*\*\s*(.+?)\n/)
          if (titleMatch) source.title = titleMatch[1].trim()
          const urlMatch = block.match(/- \*\*链接：\*\*\s*(.+?)\n/)
          if (urlMatch) source.url = urlMatch[1].trim()
          const authorMatch = block.match(/- \*\*作者：\*\*\s*(.+?)\n/)
          if (authorMatch) source.author = authorMatch[1].trim()
          const publisherMatch = block.match(/- \*\*出版社：\*\*\s*(.+?)\n/)
          if (publisherMatch) source.publisher = publisherMatch[1].trim()
          const publishDateMatch = block.match(/- \*\*出版日期：\*\*\s*(.+?)\n/)
          if (publishDateMatch) source.publishDate = publishDateMatch[1].trim()
          const pageMatch = block.match(/- \*\*页码：\*\*\s*(.+?)\n/)
          if (pageMatch) source.page = pageMatch[1].trim()
          const lineMatch = block.match(/- \*\*行数：\*\*\s*(.+?)\n/)
          if (lineMatch) source.line = lineMatch[1].trim()
          if (Object.keys(source).length > 0) {
            result.sources.push(source)
          }
        }
      })
    }

    return result
  }

  // 格式化日期
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 列表视图
  const renderListView = () => (
    <List
      dataSource={paginatedComments}
      loading={loading}
      renderItem={(comment) => {
        const suggestion = parseSuggestionContent(comment.comment)
        return (
          <List.Item
            actions={[
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedComment(comment)
                  setViewMode('detail')
                }}
              >
                查看详情
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{comment.nick}</Text>
                  {comment.mail && <Text type="secondary">({comment.mail})</Text>}
                  {suggestion.type && <Tag color="blue">{suggestion.type}</Tag>}
                  {suggestion.time && <Tag>{suggestion.time}</Tag>}
                </Space>
              }
              description={
                <div>
                  <Paragraph
                    ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                    style={{ marginBottom: 8 }}
                  >
                    {suggestion.description || comment.comment}
                  </Paragraph>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {formatDate(comment.created)}
                  </Text>
                </div>
              }
            />
          </List.Item>
        )
      }}
    />
  )

  // 卡片视图
  const renderCardView = () => (
    <div className="suggestions-grid">
      {paginatedComments.map((comment) => {
        const suggestion = parseSuggestionContent(comment.comment)
        return (
          <Card
            key={comment.id}
            hoverable
            style={{ marginBottom: 16 }}
            actions={[
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedComment(comment)
                  setViewMode('detail')
                }}
              >
                查看详情
              </Button>,
            ]}
          >
            <Card.Meta
              title={
                <Space>
                  <Text strong>{comment.nick}</Text>
                  {comment.mail && <Text type="secondary">({comment.mail})</Text>}
                </Space>
              }
              description={
                <div>
                  <Space style={{ marginBottom: 8 }}>
                    {suggestion.type && <Tag color="blue">{suggestion.type}</Tag>}
                    {suggestion.time && <Tag>{suggestion.time}</Tag>}
                  </Space>
                  <Paragraph
                    ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                    style={{ marginBottom: 8 }}
                  >
                    {suggestion.description || comment.comment}
                  </Paragraph>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {formatDate(comment.created)}
                  </Text>
                </div>
              }
            />
          </Card>
        )
      })}
    </div>
  )

  // 详情视图
  const renderDetailView = () => {
    if (!selectedComment) return null

    const suggestion = parseSuggestionContent(selectedComment.comment)

    return (
      <Card className="cinematic-card">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ color: 'var(--cinematic-text-primary)', margin: 0 }}>建议详情</Title>
            <Button onClick={() => setViewMode('list')} className="cinematic-button">返回列表</Button>
          </div>

          <Descriptions bordered column={1}>
            <Descriptions.Item label="提交人">
              <span style={{ color: 'var(--cinematic-text-primary)' }}>
                {selectedComment.nick}
                {selectedComment.mail && (
                  <span style={{ marginLeft: 8, color: 'var(--cinematic-text-muted)' }}>
                    ({selectedComment.mail})
                  </span>
                )}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="提交时间">
              <span style={{ color: 'var(--cinematic-text-primary)' }}>
                {formatDate(selectedComment.created)}
              </span>
            </Descriptions.Item>
            {suggestion.type && (
              <Descriptions.Item label="建议类型">
                <Tag color="blue">{suggestion.type}</Tag>
              </Descriptions.Item>
            )}
            {suggestion.time && (
              <Descriptions.Item label="时间">
                <span style={{ color: 'var(--cinematic-text-primary)' }}>{suggestion.time}</span>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="详细描述">
              <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0, color: 'var(--cinematic-text-secondary)' }}>
                {suggestion.description || selectedComment.comment}
              </Paragraph>
            </Descriptions.Item>
            {suggestion.images && suggestion.images.length > 0 && (
              <Descriptions.Item label="附加图片">
                <Space wrap>
                  {suggestion.images.map((imageUrl: string, index: number) => (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`附加图片 ${index + 1}`}
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={() => window.open(imageUrl, '_blank')}
                    />
                  ))}
                </Space>
              </Descriptions.Item>
            )}
            {suggestion.sources && suggestion.sources.length > 0 && (
              <Descriptions.Item label="信息来源">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {suggestion.sources.map((source: any, index: number) => (
                    <Card key={index} size="small" className="cinematic-card" style={{ backgroundColor: 'rgba(30, 30, 30, 0.6)' }}>
                      <div style={{ color: 'var(--cinematic-text-primary)' }}>
                        <strong style={{ color: 'var(--cinematic-accent-gold)' }}>类型：</strong>
                        <span style={{ color: 'var(--cinematic-text-secondary)' }}>{source.sourceType || '未知'}</span>
                      </div>
                      <div style={{ color: 'var(--cinematic-text-primary)' }}>
                        <strong style={{ color: 'var(--cinematic-accent-gold)' }}>标题：</strong>
                        <span style={{ color: 'var(--cinematic-text-secondary)' }}>{source.title || '未填写'}</span>
                      </div>
                      {source.url && (
                        <div style={{ color: 'var(--cinematic-text-primary)' }}>
                          <strong style={{ color: 'var(--cinematic-accent-gold)' }}>链接：</strong>
                          <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cinematic-accent-gold)' }}>
                            {source.url}
                          </a>
                        </div>
                      )}
                      {source.author && (
                        <div style={{ color: 'var(--cinematic-text-primary)' }}>
                          <strong style={{ color: 'var(--cinematic-accent-gold)' }}>作者：</strong>
                          <span style={{ color: 'var(--cinematic-text-secondary)' }}>{source.author}</span>
                        </div>
                      )}
                      {source.publisher && (
                        <div style={{ color: 'var(--cinematic-text-primary)' }}>
                          <strong style={{ color: 'var(--cinematic-accent-gold)' }}>出版社：</strong>
                          <span style={{ color: 'var(--cinematic-text-secondary)' }}>{source.publisher}</span>
                        </div>
                      )}
                      {source.publishDate && (
                        <div style={{ color: 'var(--cinematic-text-primary)' }}>
                          <strong style={{ color: 'var(--cinematic-accent-gold)' }}>出版日期：</strong>
                          <span style={{ color: 'var(--cinematic-text-secondary)' }}>{source.publishDate}</span>
                        </div>
                      )}
                      {source.page && (
                        <div style={{ color: 'var(--cinematic-text-primary)' }}>
                          <strong style={{ color: 'var(--cinematic-accent-gold)' }}>页码：</strong>
                          <span style={{ color: 'var(--cinematic-text-secondary)' }}>{source.page}</span>
                        </div>
                      )}
                      {source.line && (
                        <div style={{ color: 'var(--cinematic-text-primary)' }}>
                          <strong style={{ color: 'var(--cinematic-accent-gold)' }}>行数：</strong>
                          <span style={{ color: 'var(--cinematic-text-secondary)' }}>{source.line}</span>
                        </div>
                      )}
                    </Card>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Space>
      </Card>
    )
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
    <div className="container mx-auto px-6 py-6 max-w-6xl" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* 背景叠加层 */}
      <div className="cinematic-background-overlay" />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div className="cinematic-subtitle" style={{ marginBottom: '8px' }}>查看反馈</div>
            <Title level={2} className="cinematic-title cinematic-title-medium" style={{ color: 'var(--cinematic-text-primary)', margin: 0 }}>
              查看建议
            </Title>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchComments} loading={loading} className="cinematic-button">
            刷新
          </Button>
        </div>

        {/* 搜索和视图切换 */}
        <Card className="cinematic-card" style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Search
            placeholder="搜索昵称、邮箱、内容..."
            allowClear
            style={{ width: 400 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={(value) => setSearchText(value)}
          />
          <Select
            value={viewMode}
            onChange={setViewMode}
            style={{ width: 120 }}
          >
            <Select.Option value="list">列表视图</Select.Option>
            <Select.Option value="card">卡片视图</Select.Option>
            {selectedComment && <Select.Option value="detail">详情视图</Select.Option>}
          </Select>
        </Space>
      </Card>

      {/* 统计信息 */}
      <div style={{ marginBottom: 16, color: '#666' }}>
        共找到 {total} 条建议
      </div>

      {/* 内容区域 */}
      {loading && comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : filteredComments.length === 0 ? (
        <Empty description="暂无建议" />
      ) : viewMode === 'detail' ? (
        renderDetailView()
      ) : viewMode === 'card' ? (
        renderCardView()
      ) : (
        renderListView()
      )}

      {/* 分页 */}
      {filteredComments.length > 0 && viewMode !== 'detail' && (
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `共 ${total} 条`}
            onChange={(page, size) => {
              setCurrentPage(page)
              setPageSize(size)
            }}
            onShowSizeChange={(_, size) => {
              setCurrentPage(1)
              setPageSize(size)
            }}
          />
        </div>
      )}
      </div>
    </div>
  )
}

