import { useEffect, useRef, useState } from 'react'
import { Card, Typography, Spin, Alert } from 'antd'
import { CommentOutlined } from '@ant-design/icons'

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
          <div style={{ marginTop: 16, color: '#666' }}>正在加载评论...</div>
        </div>
      )}
      
      <div ref={containerRef} style={{ minHeight: loading ? 0 : '200px' }} />
    </Card>
  )
}

