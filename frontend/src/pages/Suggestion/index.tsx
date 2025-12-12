import { useState } from 'react'
import { Card, Form, Input, Select, Button, Typography, message, Space, Alert, Descriptions, Tag } from 'antd'
import { PlusOutlined, MinusCircleOutlined, CopyOutlined, CheckCircleOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography
const { TextArea } = Input

export default function SuggestionPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [discussionContent, setDiscussionContent] = useState<string>('')
  const [showCopyButton, setShowCopyButton] = useState(false)
  const [submittedSuggestion, setSubmittedSuggestion] = useState<any>(null)

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const suggestion = {
        ...values,
        id: Date.now(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      
      // 使用 Twikoo 提交建议
      const twikooEnvId = import.meta.env.VITE_TWIKOO_ENV_ID || ''
      
      // 显示提交的建议信息
      setSubmittedSuggestion(suggestion)
      
      if (twikooEnvId) {
        // 方案 1: 使用 Twikoo 提交（推荐）
        const twikooComment = formatSuggestionAsTwikooComment(suggestion)
        const success = await submitToTwikoo(twikooEnvId, twikooComment)
        
        if (success) {
          message.success('建议已成功提交到 Twikoo！感谢您的反馈。')
          form.resetFields()
        } else {
          // 如果 Twikoo 提交失败，显示提示但不跳转
          message.warning('Twikoo 提交失败，建议已保存到本地。您可以使用下方的复制按钮手动提交到 GitHub。')
          setDiscussionContent(formatSuggestionAsDiscussionBody(suggestion))
          setShowCopyButton(true)
        }
      } else {
        // 方案 2: 如果 Twikoo 未配置，显示内容供用户复制
        message.info('建议已保存。您可以使用下方的复制按钮提交到 GitHub Discussions。')
        setDiscussionContent(formatSuggestionAsDiscussionBody(suggestion))
        setShowCopyButton(true)
      }
      
      // 同时保存到本地作为备份
      try {
        const existing = JSON.parse(localStorage.getItem('suggestions') || '[]')
        existing.push(suggestion)
        localStorage.setItem('suggestions', JSON.stringify(existing))
      } catch (localError) {
        console.log('保存到本地存储失败', localError)
      }
      
    } catch (error) {
      console.error('提交失败:', error)
      message.error('提交失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }
  
  // 格式化建议显示内容
  const formatSuggestionForDisplay = (suggestion: any) => {
    const typeLabels: Record<string, string> = {
      add_event: '新增事件',
      add_person: '新增人物',
      add_relationship: '新增关系',
      correct_event: '修正事件',
      correct_person: '修正人物',
      add_source: '补充来源',
      other: '其他建议',
    }
    
    return {
      type: typeLabels[suggestion.suggestionType] || suggestion.suggestionType,
      time: suggestion.time || '未填写',
      description: suggestion.description,
      sources: suggestion.sources || [],
      name: suggestion.name || '未提供',
      email: suggestion.email || '未提供',
      createdAt: new Date(suggestion.createdAt).toLocaleString('zh-CN'),
    }
  }
  
  // 提交到 Twikoo
  const submitToTwikoo = async (envId: string, comment: any): Promise<boolean> => {
    try {
      // Twikoo API 端点处理
      // 根据不同的部署方式，API 端点可能不同
      let apiUrl = envId
      
      // 如果是 Netlify 部署，API 端点通常是 /.netlify/functions/twikoo
      if (envId.includes('netlify.app')) {
        // 如果 envId 已经包含完整路径，直接使用
        if (envId.includes('/.netlify/functions/')) {
          apiUrl = envId
        } else {
          // 否则添加 /.netlify/functions/twikoo 路径
          apiUrl = envId.replace(/\/$/, '') + '/.netlify/functions/twikoo'
        }
      } else if (envId.includes('vercel.app')) {
        // Vercel 部署，API 端点通常是 /api
        if (envId.endsWith('/api')) {
          apiUrl = envId
        } else {
          apiUrl = envId.replace(/\/$/, '') + '/api'
        }
      } else {
        // 其他部署方式（如腾讯云、私有服务器），尝试添加 /api
        apiUrl = envId.replace(/\/$/, '') + '/api'
      }
      
      // Twikoo API 请求格式
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'COMMENT',
          ...comment,
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        // Twikoo 成功响应通常是 errno: 0 或 code: 0
        if (result.errno === 0 || result.code === 0) {
          return true
        }
        // 有些版本可能直接返回 200 状态码
        if (response.status === 200 && !result.errno && !result.code) {
          return true
        }
      }
      
      console.warn('Twikoo API 响应:', await response.text())
      return false
    } catch (error) {
      console.error('Twikoo 提交失败:', error)
      return false
    }
  }
  
  // 格式化建议为 Twikoo 评论格式
  const formatSuggestionAsTwikooComment = (suggestion: any): any => {
    const typeLabels: Record<string, string> = {
      add_event: '新增事件',
      add_person: '新增人物',
      add_relationship: '新增关系',
      correct_event: '修正事件',
      correct_person: '修正人物',
      add_source: '补充来源',
      other: '其他建议',
    }
    
    // 构建评论内容（Markdown 格式）
    let commentContent = `## ${typeLabels[suggestion.suggestionType] || suggestion.suggestionType}\n\n`
    commentContent += `**时间：** ${suggestion.time || '未填写'}\n\n`
    commentContent += `**详细描述：**\n${suggestion.description}\n\n`
    
    if (suggestion.sources && suggestion.sources.length > 0) {
      commentContent += `## 信息来源\n\n`
      suggestion.sources.forEach((source: any, index: number) => {
        commentContent += `### 来源 ${index + 1}\n\n`
        commentContent += `- **类型：** ${source.sourceType === 'authoritative_website' ? '网站' : '书籍'}\n`
        commentContent += `- **标题：** ${source.title}\n`
        if (source.url) {
          commentContent += `- **链接：** ${source.url}\n`
        }
        if (source.author) {
          commentContent += `- **作者：** ${source.author}\n`
        }
        if (source.publisher) {
          commentContent += `- **出版社：** ${source.publisher}\n`
        }
        if (source.publishDate) {
          commentContent += `- **出版日期：** ${source.publishDate}\n`
        }
        commentContent += `\n`
      })
    }
    
    // Twikoo 评论数据结构
    return {
      nick: suggestion.name || '匿名用户',
      mail: suggestion.email || '',
      link: '', // 用户网站链接，建议表单中没有，留空
      comment: commentContent,
      ua: navigator.userAgent,
      url: '/suggestion', // 建议页面的路径
      pid: '', // 父评论 ID，新建议没有父评论
      rid: '', // 回复的评论 ID，新建议没有回复
      created: Date.now(),
    }
  }
  
  // 复制讨论内容到剪贴板
  const copyDiscussionContent = async () => {
    try {
      await navigator.clipboard.writeText(discussionContent)
      message.success('内容已复制到剪贴板！请在 GitHub Discussions 页面粘贴。')
    } catch (error) {
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea')
      textArea.value = discussionContent
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        message.success('内容已复制到剪贴板！请在 GitHub Discussions 页面粘贴。')
      } catch (err) {
        message.error('复制失败，请手动复制下方内容。')
      }
      document.body.removeChild(textArea)
    }
  }
  
  // 格式化建议为 GitHub Discussion 内容
  const formatSuggestionAsDiscussionBody = (suggestion: any): string => {
    const typeLabels: Record<string, string> = {
      add_event: '新增事件',
      add_person: '新增人物',
      add_relationship: '新增关系',
      correct_event: '修正事件',
      correct_person: '修正人物',
      add_source: '补充来源',
      other: '其他建议',
    }
    
    let body = `## 建议信息\n\n`
    body += `**类型：** ${typeLabels[suggestion.suggestionType] || suggestion.suggestionType}\n\n`
    body += `**时间：** ${suggestion.time || '未填写'}\n\n`
    body += `**详细描述：**\n${suggestion.description}\n\n`
    
    if (suggestion.sources && suggestion.sources.length > 0) {
      body += `## 信息来源\n\n`
      suggestion.sources.forEach((source: any, index: number) => {
        body += `### 来源 ${index + 1}\n\n`
        body += `- **类型：** ${source.sourceType === 'authoritative_website' ? '网站' : '书籍'}\n`
        body += `- **标题：** ${source.title}\n`
        if (source.url) {
          body += `- **链接：** ${source.url}\n`
        }
        if (source.author) {
          body += `- **作者：** ${source.author}\n`
        }
        if (source.publisher) {
          body += `- **出版社：** ${source.publisher}\n`
        }
        if (source.publishDate) {
          body += `- **出版日期：** ${source.publishDate}\n`
        }
        body += `\n`
      })
    }
    
    body += `## 联系方式\n\n`
    body += `- **姓名：** ${suggestion.name || '未提供'}\n`
    body += `- **邮箱：** ${suggestion.email || '未提供'}\n\n`
    
    body += `---\n`
    body += `*提交时间：${new Date(suggestion.createdAt).toLocaleString('zh-CN')}*\n`
    
    return body
  }


  return (
    <div className="container mx-auto px-6 py-6 max-w-4xl">
      <Title level={2} className="mb-6">提交建议</Title>
      
      <Card className="mb-4" style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
        <div style={{ color: '#0369a1' }}>
          <strong>填写提示：</strong>
          <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
            <li><strong>建议类型</strong>：请根据您的建议内容选择相应的类型，如新增事件、新增人物、修正信息等</li>
            <li><strong>时间</strong>：请填写具体的时间，格式如"公元前1046年"或"2024年"</li>
            <li><strong>详细描述</strong>：请尽可能详细地描述您的建议内容，包括相关背景信息</li>
            <li><strong>信息来源</strong>：请提供可靠的信息来源，可以是权威网站或学术书籍，以增加建议的可信度</li>
            <li><strong>联系方式</strong>：姓名和邮箱为选填项，填写后我们可以在需要时与您联系</li>
          </ul>
        </div>
      </Card>
      
      {/* 显示已提交的建议 */}
      {submittedSuggestion && (
        <Card className="mb-4" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <Title level={4} style={{ margin: 0, color: '#52c41a' }}>建议已提交</Title>
            </div>
            
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="建议类型">
                <Tag color="blue">{formatSuggestionForDisplay(submittedSuggestion).type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="时间">{formatSuggestionForDisplay(submittedSuggestion).time}</Descriptions.Item>
              <Descriptions.Item label="详细描述">
                <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {formatSuggestionForDisplay(submittedSuggestion).description}
                </Paragraph>
              </Descriptions.Item>
              {formatSuggestionForDisplay(submittedSuggestion).sources.length > 0 && (
                <Descriptions.Item label="信息来源">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {formatSuggestionForDisplay(submittedSuggestion).sources.map((source: any, index: number) => (
                      <Card key={index} size="small" style={{ backgroundColor: '#fafafa' }}>
                        <div><strong>类型：</strong>{source.sourceType === 'authoritative_website' ? '网站' : '书籍'}</div>
                        <div><strong>标题：</strong>{source.title}</div>
                        {source.url && <div><strong>链接：</strong><a href={source.url} target="_blank" rel="noopener noreferrer">{source.url}</a></div>}
                        {source.author && <div><strong>作者：</strong>{source.author}</div>}
                        {source.publisher && <div><strong>出版社：</strong>{source.publisher}</div>}
                        {source.publishDate && <div><strong>出版日期：</strong>{source.publishDate}</div>}
                      </Card>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="提交人">
                {formatSuggestionForDisplay(submittedSuggestion).name}
                {formatSuggestionForDisplay(submittedSuggestion).email && (
                  <span style={{ marginLeft: 8, color: '#666' }}>
                    ({formatSuggestionForDisplay(submittedSuggestion).email})
                  </span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {formatSuggestionForDisplay(submittedSuggestion).createdAt}
              </Descriptions.Item>
            </Descriptions>
            
            {showCopyButton && discussionContent && (
              <Alert
                message="手动提交到 GitHub（可选）"
                description={
                  <div>
                    <p style={{ marginBottom: 8 }}>如果 Twikoo 提交失败，您可以复制以下内容并手动提交到 GitHub Discussions：</p>
                    <Button
                      type="primary"
                      icon={<CopyOutlined />}
                      onClick={copyDiscussionContent}
                      block
                    >
                      复制内容到剪贴板
                    </Button>
                    <Button
                      type="link"
                      onClick={() => {
                        const githubRepo = import.meta.env.VITE_GITHUB_REPO || 'chengms/HistoricalThreads'
                        window.open(`https://github.com/${githubRepo}/discussions/new`, '_blank')
                      }}
                      style={{ marginTop: 8, padding: 0 }}
                    >
                      打开 GitHub Discussions 页面
                    </Button>
                  </div>
                }
                type="info"
                closable
                onClose={() => setShowCopyButton(false)}
              />
            )}
            
            <Button
              type="default"
              onClick={() => {
                setSubmittedSuggestion(null)
                setShowCopyButton(false)
                setDiscussionContent('')
              }}
            >
              提交新建议
            </Button>
          </Space>
        </Card>
      )}

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="suggestionType"
            label="建议类型"
            rules={[{ required: true, message: '请选择建议类型' }]}
          >
            <Select placeholder="请选择建议类型">
              <Select.Option value="add_event">新增事件</Select.Option>
              <Select.Option value="add_person">新增人物</Select.Option>
              <Select.Option value="add_relationship">新增关系</Select.Option>
              <Select.Option value="correct_event">修正事件</Select.Option>
              <Select.Option value="correct_person">修正人物</Select.Option>
              <Select.Option value="add_source">补充来源</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="详细描述"
            rules={[{ required: true, message: '请输入详细描述' }]}
          >
            <TextArea rows={6} placeholder="请输入详细描述" />
          </Form.Item>

          <Form.Item
            name="time"
            label="时间"
            rules={[
              { required: true, message: '请输入时间' },
              {
                pattern: /^(公元前)?\d+年$/,
                message: '请输入正确的时间格式，例如：公元前221年 或 1234年',
              },
            ]}
          >
            <Input placeholder="例如：公元前221年 或 1234年" />
          </Form.Item>

          <Form.Item
            name="sources"
            label="信息来源（必填，至少一个）"
            rules={[
              { required: true, message: '请至少提供一个信息来源' },
              { type: 'array', min: 1, message: '请至少提供一个信息来源' },
            ]}
          >
            <Form.List name="sources">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card key={key} style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
                      <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Space style={{ width: '100%' }} align="baseline">
                          <Form.Item
                            {...restField}
                            name={[name, 'sourceType']}
                            label="来源类型"
                            rules={[{ required: true, message: '请选择来源类型' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Select placeholder="选择类型" style={{ width: 120 }}>
                              <Select.Option value="authoritative_website">网站</Select.Option>
                              <Select.Option value="academic_book">书籍</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'title']}
                            label="标题"
                            rules={[{ required: true, message: '请输入来源标题' }]}
                            style={{ marginBottom: 0, flex: 1 }}
                          >
                            <Input placeholder="来源标题" />
                          </Form.Item>
                          <MinusCircleOutlined 
                            onClick={() => remove(name)} 
                            style={{ color: '#ff4d4f', fontSize: 18, cursor: 'pointer' }}
                          />
                        </Space>
                        
                        {/* 根据来源类型显示不同的字段 */}
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) =>
                            prevValues.sources?.[name]?.sourceType !== currentValues.sources?.[name]?.sourceType
                          }
                        >
                          {({ getFieldValue }) => {
                            const sourceType = getFieldValue(['sources', name, 'sourceType'])
                            
                            if (sourceType === 'authoritative_website') {
                              // 网站类型：需要 URL
                              return (
                                <Form.Item
                                  {...restField}
                                  name={[name, 'url']}
                                  label="网站链接"
                                  rules={[
                                    { required: true, message: '请输入网站链接' },
                                    { type: 'url', message: '请输入有效的URL' },
                                  ]}
                                >
                                  <Input placeholder="https://example.com" />
                                </Form.Item>
                              )
                            } else if (sourceType === 'academic_book') {
                              // 书籍类型：需要作者、出版社等信息
                              return (
                                <>
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'author']}
                                    label="作者"
                                    rules={[{ required: true, message: '请输入作者' }]}
                                  >
                                    <Input placeholder="作者姓名" />
                                  </Form.Item>
                                  <Space style={{ width: '100%' }}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'publisher']}
                                      label="出版社"
                                      rules={[{ required: true, message: '请输入出版社' }]}
                                      style={{ flex: 1 }}
                                    >
                                      <Input placeholder="出版社名称" />
                                    </Form.Item>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'publishDate']}
                                      label="出版日期"
                                      style={{ flex: 1 }}
                                    >
                                      <Input placeholder="例如：2020年" />
                                    </Form.Item>
                                  </Space>
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'url']}
                                    label="相关链接（可选）"
                                    rules={[
                                      { type: 'url', message: '请输入有效的URL' },
                                    ]}
                                  >
                                    <Input placeholder="如有在线版本或购买链接，可填写" />
                                  </Form.Item>
                                </>
                              )
                            }
                            return null
                          }}
                        </Form.Item>
                      </Space>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add({ sourceType: 'authoritative_website' })} block icon={<PlusOutlined />}>
                      添加来源
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Title level={4}>联系方式</Title>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入您的姓名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入您的邮箱" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large" block>
              提交建议
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

