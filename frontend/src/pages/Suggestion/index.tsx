import { useState } from 'react'
import { Card, Form, Input, Select, Button, Typography, message, Space, Alert } from 'antd'
import { PlusOutlined, MinusCircleOutlined, CopyOutlined } from '@ant-design/icons'

const { Title } = Typography
const { TextArea } = Input

export default function SuggestionPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [discussionContent, setDiscussionContent] = useState<string>('')
  const [showCopyButton, setShowCopyButton] = useState(false)

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const suggestion = {
        ...values,
        id: Date.now(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      
      // 方案 1: 使用 GitHub Discussions（推荐，无需 Token）
      const githubRepo = import.meta.env.VITE_GITHUB_REPO || 'chengms/HistoricalThreads'
      const discussionTitle = `[建议] ${values.title}`
      const discussionBody = formatSuggestionAsDiscussionBody(suggestion)
      
      // 生成 GitHub Discussions 创建链接
      const discussionUrl = generateDiscussionUrl(githubRepo)
      
      // 保存讨论内容，供用户复制
      setDiscussionContent(`标题：${discussionTitle}\n\n${discussionBody}`)
      setShowCopyButton(true)
      
      // 打开新标签页，让用户在 GitHub 上提交
      window.open(discussionUrl, '_blank')
      
      message.success({
        content: '已跳转到 GitHub Discussions 页面。如果内容未自动填充，请使用下方的"复制内容"按钮。',
        duration: 6,
      })
      form.resetFields()
      
      // 可选：同时保存到本地作为备份
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
  
  // 生成 GitHub Discussions 创建链接
  const generateDiscussionUrl = (repo: string): string => {
    // GitHub Discussions 创建页面
    return `https://github.com/${repo}/discussions/new`
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
          <strong>提示：</strong>
          <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
            <li>提交建议后，系统会跳转到 GitHub Discussions 页面</li>
            <li>请在 GitHub 上确认内容后点击 "Start discussion" 提交</li>
            <li>如果内容未自动填充，请使用下方的"复制内容"按钮</li>
            <li>这种方式无需配置 Token，安全且方便</li>
            <li>如果遇到问题，请参考 <a href="https://github.com/chengms/HistoricalThreads/discussions" target="_blank" rel="noopener noreferrer">GitHub Discussions 页面</a></li>
          </ul>
        </div>
      </Card>
      
      {showCopyButton && discussionContent && (
        <Alert
          message="内容已准备好"
          description={
            <div>
              <p>如果 GitHub 页面中的内容未自动填充，请点击下方按钮复制内容，然后粘贴到 GitHub Discussions 页面。</p>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={copyDiscussionContent}
                style={{ marginTop: 8 }}
              >
                复制内容到剪贴板
              </Button>
            </div>
          }
          type="info"
          closable
          onClose={() => setShowCopyButton(false)}
          style={{ marginBottom: 16 }}
        />
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

