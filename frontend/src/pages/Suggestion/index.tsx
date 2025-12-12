import { useState } from 'react'
import { Card, Form, Input, Select, Button, Typography, message, Space } from 'antd'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'

const { Title } = Typography
const { TextArea } = Input

export default function SuggestionPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const suggestion = {
        ...values,
        id: Date.now(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      
      // 尝试提交到 GitHub Issues
      let submittedToGitHub = false
      try {
        const githubToken = import.meta.env.VITE_GITHUB_TOKEN
        const githubRepo = import.meta.env.VITE_GITHUB_REPO || 'chengms/HistoricalThreads'
        
        if (githubToken) {
          // 格式化建议为 GitHub Issue
          const issueTitle = `[建议] ${values.title}`
          const issueBody = formatSuggestionAsIssueBody(suggestion)
          
          const response = await fetch(`https://api.github.com/repos/${githubRepo}/issues`, {
            method: 'POST',
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: issueTitle,
              body: issueBody,
              labels: ['suggestion', getSuggestionTypeLabel(values.suggestionType)],
            }),
          })
          
          if (response.ok) {
            const issue = await response.json()
            submittedToGitHub = true
            message.success(`建议已提交到 GitHub Issue #${issue.number}！我们会尽快审核。`)
          } else {
            const error = await response.json()
            console.error('GitHub API 错误:', error)
            throw new Error(error.message || '提交到 GitHub 失败')
          }
        }
      } catch (githubError) {
        console.log('GitHub API 不可用，尝试其他方式', githubError)
      }
      
      // 如果 GitHub 提交失败，尝试后端 API
      if (!submittedToGitHub) {
        let submittedToBackend = false
        try {
          const response = await fetch('/api/suggestions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(suggestion),
          })
          
          if (response.ok) {
            submittedToBackend = true
            message.success('建议已提交到服务器！我们会尽快审核。')
          }
        } catch (apiError) {
          console.log('后端 API 不可用，保存到本地存储', apiError)
        }
        
        // 如果后端也不可用，保存到 localStorage
        if (!submittedToBackend) {
          const existing = JSON.parse(localStorage.getItem('suggestions') || '[]')
          existing.push(suggestion)
          localStorage.setItem('suggestions', JSON.stringify(existing))
          message.success('建议已保存到本地！由于服务未启用，数据仅保存在浏览器本地存储中。')
        }
      }
      
      form.resetFields()
    } catch (error) {
      console.error('提交失败:', error)
      message.error('提交失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  // 格式化建议为 GitHub Issue 内容
  const formatSuggestionAsIssueBody = (suggestion: any): string => {
    const typeLabels: Record<string, string> = {
      add_event: '新增事件',
      add_person: '新增人物',
      add_relationship: '新增关系',
      correct_event: '修正事件',
      correct_person: '修正人物',
      add_source: '补充来源',
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
    body += `- **姓名：** ${suggestion.name}\n`
    body += `- **邮箱：** ${suggestion.email}\n\n`
    
    body += `---\n`
    body += `*提交时间：${new Date(suggestion.createdAt).toLocaleString('zh-CN')}*\n`
    
    return body
  }

  // 获取建议类型对应的 GitHub Label
  const getSuggestionTypeLabel = (type: string): string => {
    const labelMap: Record<string, string> = {
      add_event: 'enhancement',
      add_person: 'enhancement',
      add_relationship: 'enhancement',
      correct_event: 'bug',
      correct_person: 'bug',
      add_source: 'documentation',
    }
    return labelMap[type] || 'suggestion'
  }

  return (
    <div className="container mx-auto px-6 py-6 max-w-4xl">
      <Title level={2} className="mb-6">提交建议</Title>
      
      <Card className="mb-4" style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
        <div style={{ color: '#0369a1' }}>
          <strong>提示：</strong>
          <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
            <li>如果配置了 GitHub Token，建议将自动提交到 GitHub Issues，便于追踪和统计</li>
            <li>如果未配置 GitHub Token，将尝试提交到后端 API</li>
            <li>如果后端服务也未启用，建议将保存在浏览器本地存储（localStorage）中</li>
            <li>配置 GitHub Token：在项目根目录创建 <code>.env</code> 文件，添加 <code>VITE_GITHUB_TOKEN=your_token</code></li>
          </ul>
        </div>
      </Card>

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

