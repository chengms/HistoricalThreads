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
      
      // 尝试提交到后端 API
      let submitted = false
      try {
        const response = await fetch('/api/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(suggestion),
        })
        
        if (response.ok) {
          submitted = true
          message.success('建议已提交到服务器！我们会尽快审核。')
        }
      } catch (apiError) {
        console.log('后端 API 不可用，保存到本地存储', apiError)
      }
      
      // 如果后端不可用，保存到 localStorage
      if (!submitted) {
        const existing = JSON.parse(localStorage.getItem('suggestions') || '[]')
        existing.push(suggestion)
        localStorage.setItem('suggestions', JSON.stringify(existing))
        message.success('建议已保存到本地！由于后端服务未启用，数据仅保存在浏览器本地存储中。')
      }
      
      form.resetFields()
    } catch (error) {
      console.error('提交失败:', error)
      message.error('提交失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-6 py-6 max-w-4xl">
      <Title level={2} className="mb-6">提交建议</Title>
      
      <Card className="mb-4" style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
        <div style={{ color: '#0369a1' }}>
          <strong>提示：</strong>
          <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
            <li>如果后端服务已启用，建议将提交到服务器数据库</li>
            <li>如果后端服务未启用，建议将保存在浏览器本地存储（localStorage）中</li>
            <li>您可以在浏览器开发者工具中查看保存的建议数据</li>
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

