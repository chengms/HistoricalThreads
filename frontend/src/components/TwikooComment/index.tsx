import { useEffect, useRef, useState } from 'react'
import { Card, Typography, Spin, Alert, Upload, Progress, message } from 'antd'
import { CommentOutlined, PlusOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import '@/styles/twikoo-comment.css'

const { Title } = Typography

interface TwikooCommentProps {
  path?: string // 评论路径，用于区分不同页面的评论
  lang?: string // 语言设置
}

declare global {
  interface Window {
    twikoo: {
      init: (options: {
        envId: string
        el: string
        region?: string
        path?: string
        lang?: string
      }) => Promise<void>
    }
  }
}

export default function TwikooComment({ path, lang = 'zh-CN' }: TwikooCommentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)
  const scriptLoadedRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageList, setImageList] = useState<UploadFile[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  useEffect(() => {
    // 获取 Twikoo 配置
    const envId = import.meta.env.VITE_TWIKOO_ENV_ID || ''
    
    if (!envId) {
      setError('Twikoo 环境 ID 未配置')
      setLoading(false)
      console.warn('Twikoo envId 未配置，评论功能将不可用。请在环境变量中设置 VITE_TWIKOO_ENV_ID')
      return
    }

    // 如果已经初始化过，先清理
    if (initializedRef.current && containerRef.current) {
      containerRef.current.innerHTML = ''
      initializedRef.current = false
    }

    // 动态加载 Twikoo 脚本
    const loadTwikoo = () => {
      // 检查是否已经加载
      if (window.twikoo) {
        scriptLoadedRef.current = true
        initTwikoo()
        return
      }

      // 如果脚本正在加载，等待
      if (scriptLoadedRef.current) {
        return
      }

      // 检查是否已经存在脚本标签
      const existingScript = document.querySelector('script[src*="twikoo"]') as HTMLScriptElement | null
      if (existingScript) {
        // 等待脚本加载完成
        if (window.twikoo) {
          scriptLoadedRef.current = true
          initTwikoo()
        } else {
          existingScript.addEventListener('load', () => {
            scriptLoadedRef.current = true
            initTwikoo()
          })
        }
        return
      }

      // 创建 script 标签
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.16/dist/twikoo.all.min.js'
      script.async = true
      script.onload = () => {
        scriptLoadedRef.current = true
        initTwikoo()
      }
      script.onerror = () => {
        setError('Twikoo 脚本加载失败，请检查网络连接')
        setLoading(false)
        console.error('Twikoo 脚本加载失败')
      }
      document.head.appendChild(script)
    }

    // 初始化 Twikoo
    const initTwikoo = async () => {
      if (!containerRef.current || !window.twikoo) {
        // 如果脚本还没加载完成，等待一下
        if (!window.twikoo) {
          setTimeout(() => {
            if (window.twikoo) {
              initTwikoo()
            }
          }, 100)
        }
        return
      }

      try {
        // 获取当前页面路径作为评论路径
        // 如果提供了 path，使用 path；否则使用当前页面路径
        const commentPath = path || window.location.pathname + window.location.search

        // 确保容器有唯一的 ID
        const containerId = `twikoo-comment-${Date.now()}`
        if (containerRef.current) {
          containerRef.current.id = containerId
        }

        await window.twikoo.init({
          envId: envId,
          el: '#' + containerId,
          path: commentPath,
          lang: lang,
        })
        initializedRef.current = true
        setLoading(false)
        setError(null)
        
        // 初始化后隐藏上传图片按钮
        setTimeout(() => {
          hideUploadButtons(containerId)
        }, 500)
      } catch (error) {
        console.error('Twikoo 初始化失败:', error)
        setError('Twikoo 初始化失败，请检查配置')
        setLoading(false)
      }
    }

    // 延迟加载，确保 DOM 已渲染
    const timer = setTimeout(() => {
      loadTwikoo()
    }, 200)

    return () => {
      clearTimeout(timer)
      // 清理时不需要移除脚本，因为可能被其他组件使用
    }
  }, [path, lang])

  // 隐藏 Twikoo 上传图片按钮
  const hideUploadButtons = (containerId: string) => {
    const container = document.getElementById(containerId)
    if (!container) return
    
    // 查找并隐藏上传图片按钮
    const uploadButtons = container.querySelectorAll('.tk-submit-action-icon')
    uploadButtons.forEach((btn) => {
      const svg = btn.querySelector('svg')
      if (svg) {
        const path = svg.querySelector('path')
        if (path && path.getAttribute('d')?.includes('464 64H48')) {
          // 这是上传图片的 SVG 路径特征
          ;(btn as HTMLElement).style.display = 'none'
        }
      }
    })
    
    // 使用 MutationObserver 监听新添加的元素
    const observer = new MutationObserver(() => {
      uploadButtons.forEach((btn) => {
        const svg = btn.querySelector('svg')
        if (svg) {
          const path = svg.querySelector('path')
          if (path && path.getAttribute('d')?.includes('464 64H48')) {
            ;(btn as HTMLElement).style.display = 'none'
          }
        }
      })
    })
    
    observer.observe(container, { childList: true, subtree: true })
  }

  // 上传图片到 Netlify 函数
  const handleImageUpload = async (file: File, uid: string) => {
    try {
      setUploadProgress(prev => ({ ...prev, [uid]: 0 }))
      
      // 读取文件并转换为 base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          const base64 = result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
      })
      
      reader.readAsDataURL(file)
      const base64Content = await base64Promise
      
      setUploadProgress(prev => ({ ...prev, [uid]: 30 }))
      
      // 生成文件名
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop() || 'jpg'
      const filename = `comments/${timestamp}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`
      
      // 获取图床 API 地址
      const imageUploadApi = import.meta.env.VITE_IMAGE_UPLOAD_API || ''
      if (!imageUploadApi) {
        throw new Error('图床 API 地址未配置，请在环境变量中设置 VITE_IMAGE_UPLOAD_API')
      }
      
      // 调用上传 API
      const uploadUrl = imageUploadApi
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: filename,
          content: base64Content,
        }),
      })
      
      setUploadProgress(prev => ({ ...prev, [uid]: 80 }))
      
      if (!response.ok) {
        let errorMessage = '上传失败'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `服务器错误 (${response.status})`
        }
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      const imageUrl = result.url
      
      if (!imageUrl) {
        throw new Error('服务器未返回图片 URL')
      }
      
      setUploadProgress(prev => ({ ...prev, [uid]: 100 }))
      
      // 更新文件列表
      const newList: UploadFile[] = imageList.map(item => 
        item.uid === uid 
          ? { ...item, status: 'done' as const, url: imageUrl, response: { url: imageUrl } }
          : item
      )
      setImageList(newList)
      
      // 将图片插入到评论输入框
      insertImageToComment(imageUrl)
      
      message.success('图片上传成功')
      
      // 清除进度
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[uid]
          return newProgress
        })
      }, 1000)
    } catch (error: any) {
      console.error('图片上传失败:', error)
      message.error(`图片上传失败: ${error.message || '未知错误'}`)
      
      // 移除失败的文件
      const newList = imageList.filter(item => item.uid !== uid)
      setImageList(newList)
      
      // 清除进度
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[uid]
        return newProgress
      })
    }
  }

  // 将图片插入到评论输入框
  const insertImageToComment = (imageUrl: string) => {
    if (!containerRef.current) return
    
    // 查找评论输入框
    const textarea = containerRef.current.querySelector('textarea.tk-input') as HTMLTextAreaElement
    if (textarea) {
      const markdownImage = `![图片](${imageUrl})`
      const currentValue = textarea.value
      const cursorPos = textarea.selectionStart
      const newValue = currentValue.slice(0, cursorPos) + markdownImage + '\n' + currentValue.slice(cursorPos)
      textarea.value = newValue
      
      // 触发 input 事件，让 Twikoo 知道内容已更改
      const event = new Event('input', { bubbles: true })
      textarea.dispatchEvent(event)
      
      // 设置光标位置
      const newCursorPos = cursorPos + markdownImage.length + 1
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }
  }

  // 如果环境 ID 未配置，不显示评论区域
  const envId = import.meta.env.VITE_TWIKOO_ENV_ID || ''
  if (!envId) {
    return null
  }

  return (
    <Card className="mt-6">
      <Title level={4} className="mb-4">
        <CommentOutlined className="mr-2" />
        评论
      </Title>
      
      {error && (
        <Alert
          message="评论加载失败"
          description={error}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      {loading && !error && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: 'var(--cinematic-text-secondary)' }}>正在加载评论...</div>
        </div>
      )}
      
      <div ref={containerRef} style={{ minHeight: loading ? 0 : '200px' }} />
      
      {/* 自定义图片上传区域 */}
      {!loading && !error && (
        <div className="twikoo-custom-upload">
          <Upload
            listType="picture-card"
            fileList={imageList}
            beforeUpload={(file) => {
              // 检查文件大小
              const isLt5M = file.size / 1024 / 1024 < 5
              if (!isLt5M) {
                message.error('图片大小不能超过 5MB')
                return Upload.LIST_IGNORE
              }
              // 阻止自动上传
              return false
            }}
            onChange={async (info) => {
              setImageList(info.fileList)
              
              // 如果有新文件，自动上传
              const newFile = info.fileList[info.fileList.length - 1]
              if (newFile && newFile.originFileObj && newFile.status !== 'uploading' && newFile.status !== 'done') {
                const uid = newFile.uid
                // 设置上传中状态
                const newList = info.fileList.map(item => 
                  item.uid === uid ? { ...item, status: 'uploading' as const } : item
                )
                setImageList(newList)
                
                await handleImageUpload(newFile.originFileObj, uid)
              }
            }}
            onRemove={(file) => {
              const newList = imageList.filter(item => item.uid !== file.uid)
              setImageList(newList)
            }}
            accept="image/jpeg,image/png,image/jpg"
            maxCount={5}
          >
            {imageList.length < 5 && (
              <div style={{ color: 'var(--cinematic-text-primary, #ffffff)' }}>
                <PlusOutlined style={{ color: 'var(--cinematic-text-primary, #ffffff)' }} />
                <div style={{ marginTop: 8, color: 'var(--cinematic-text-primary, #ffffff)' }}>上传图片</div>
              </div>
            )}
          </Upload>
          
          {/* 显示上传进度 */}
          {Object.keys(uploadProgress).length > 0 && (
            <div style={{ marginTop: 12 }}>
              {Object.entries(uploadProgress).map(([uid, progress]) => {
                const file = imageList.find(item => item.uid === uid)
                return (
                  <div key={uid} style={{ marginBottom: 8 }}>
                    <div style={{ marginBottom: 4, fontSize: '12px', color: 'var(--cinematic-text-secondary, #f0f0f0)' }}>
                      {file?.name || '上传中...'}
                    </div>
                    <Progress 
                      percent={progress} 
                      status={progress === 100 ? 'success' : 'active'}
                      size="small"
                      showInfo
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

