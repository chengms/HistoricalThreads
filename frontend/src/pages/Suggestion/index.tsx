import { useState } from 'react'
import { Card, Form, Input, Select, Button, Typography, message, Space, Descriptions, Tag } from 'antd'
import { PlusOutlined, MinusCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography
const { TextArea } = Input

export default function SuggestionPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
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
          // 如果 Twikoo 提交失败，只显示提示
          // 错误信息已在 submitToTwikoo 中显示
        }
      } else {
        // 如果 Twikoo 未配置
        message.warning('Twikoo 未配置，建议已保存到本地。请联系管理员配置 Twikoo 后端服务。')
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
      
      console.log('Twikoo API URL:', apiUrl)
      console.log('Twikoo Comment Data:', comment)
      
      // Twikoo API 请求格式
      // 正确格式：event: COMMENT_SUBMIT, comment 为字符串，其他参数在顶层
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'COMMENT_SUBMIT',
          comment: comment.comment, // comment 字段是字符串
          nick: comment.nick,
          mail: comment.mail,
          link: comment.link || '',
          url: comment.url,
          ua: comment.ua,
          ip: '', // IP 地址由服务器获取
          master: false,
          // pid 和 rid 用于回复，新评论不需要
          ...(comment.pid && { pid: comment.pid }),
          ...(comment.rid && { rid: comment.rid }),
        }),
      })
      
      console.log('Twikoo Response Status:', response.status, response.statusText)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Twikoo Response Data:', result)
        
        // Twikoo 成功响应：
        // 1. errno: 0 或 code: 0
        // 2. 返回 id 和 accessToken（表示提交成功）
        if (result.errno === 0 || result.code === 0 || (result.id && result.accessToken)) {
          return true
        }
        
        // 处理特定的错误码
        if (result.code === 1001) {
          console.error('Twikoo 云函数版本过旧，需要更新:', result.message)
          message.error({
            content: 'Twikoo 后端服务需要更新。请更新 Twikoo 云函数至最新版本。建议已保存到本地。',
            duration: 8,
          })
        } else if (result.code === 1000) {
          console.error('Twikoo API 参数错误:', result.message)
          message.error({
            content: `Twikoo 提交失败: ${result.message}。建议已保存到本地。`,
            duration: 6,
          })
        } else if (result.message) {
          console.error('Twikoo API 错误:', result.message)
          message.error({
            content: `Twikoo 提交失败: ${result.message}。建议已保存到本地。`,
            duration: 6,
          })
        } else {
          console.warn('Twikoo API 响应格式异常:', result)
          message.warning({
            content: 'Twikoo 提交失败，建议已保存到本地。请检查 Twikoo 后端服务配置。',
            duration: 6,
          })
        }
        
        return false
      } else {
        // 响应失败，获取错误信息
        const errorText = await response.text()
        console.error('Twikoo API 错误响应:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        return false
      }
    } catch (error: any) {
      console.error('Twikoo 提交失败 - 详细错误:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      })
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
        if (source.page) {
          commentContent += `- **页码：** ${source.page}\n`
        }
        if (source.line) {
          commentContent += `- **行数：** ${source.line}\n`
        }
        commentContent += `\n`
      })
    }
    
    // 获取正确的 URL 路径
    // 考虑 basename 和当前域名
    const getCorrectUrl = () => {
      // 如果使用自定义域名，basename 是 ''
      // 如果使用 GitHub Pages，basename 是 '/HistoricalThreads'
      const isCustomDomain = import.meta.env.VITE_USE_CUSTOM_DOMAIN === 'true' || 
                             (typeof window !== 'undefined' && 
                              !window.location.hostname.includes('github.io') && 
                              window.location.hostname !== 'localhost' &&
                              window.location.hostname !== '127.0.0.1')
      
      const basename = isCustomDomain ? '' : (import.meta.env.PROD ? '/HistoricalThreads' : '')
      
      // 使用完整的 URL，包含协议和域名，这样管理后台可以正确跳转
      if (typeof window !== 'undefined') {
        return `${window.location.origin}${basename}/suggestion`
      }
      
      // 如果 window 不可用（SSR），使用相对路径
      return `${basename}/suggestion`
    }
    
    // Twikoo 评论数据结构
    return {
      nick: suggestion.name || '匿名用户',
      mail: suggestion.email || '',
      link: '', // 用户网站链接，建议表单中没有，留空
      comment: commentContent,
      ua: navigator.userAgent,
      url: getCorrectUrl(), // 使用完整的 URL 路径，确保管理后台可以正确跳转
      pid: '', // 父评论 ID，新建议没有父评论
      rid: '', // 回复的评论 ID，新建议没有回复
      created: Date.now(),
    }
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
            <li><strong>信息来源</strong>：请提供可靠的信息来源，可以是权威网站或学术书籍，以增加建议的可信度。如果是书籍，可以填写页码和行数以便查找</li>
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
                        {source.page && <div><strong>页码：</strong>{source.page}</div>}
                        {source.line && <div><strong>行数：</strong>{source.line}</div>}
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
            
            <Button
              type="default"
              onClick={() => {
                setSubmittedSuggestion(null)
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
                                  <Space style={{ width: '100%' }}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'page']}
                                      label="页码（可选）"
                                      style={{ flex: 1 }}
                                    >
                                      <Input placeholder="例如：第123页" />
                                    </Form.Item>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'line']}
                                      label="行数（可选）"
                                      style={{ flex: 1 }}
                                    >
                                      <Input placeholder="例如：第5-10行" />
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

