import { useEffect, useRef } from 'react'
import { Card, Typography } from 'antd'
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

  useEffect(() => {
    // 获取 Twikoo 配置
    const envId = import.meta.env.VITE_TWIKOO_ENV_ID || ''
    
    if (!envId) {
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
        initTwikoo()
        return
      }

      // 创建 script 标签
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.16/dist/twikoo.all.min.js'
      script.async = true
      script.onload = () => {
        initTwikoo()
      }
      script.onerror = () => {
        console.error('Twikoo 脚本加载失败')
      }
      document.head.appendChild(script)
    }

    // 初始化 Twikoo
    const initTwikoo = async () => {
      if (!containerRef.current || !window.twikoo) return

      try {
        // 获取当前页面路径作为评论路径
        const commentPath = path || window.location.pathname + window.location.search

        // 确保容器有 ID
        if (!containerRef.current.id) {
          containerRef.current.id = 'twikoo-comment-container'
        }

        await window.twikoo.init({
          envId: envId,
          el: '#' + containerRef.current.id,
          path: commentPath,
          lang: lang,
        })
        initializedRef.current = true
      } catch (error) {
        console.error('Twikoo 初始化失败:', error)
      }
    }

    // 延迟加载，确保 DOM 已渲染
    const timer = setTimeout(() => {
      loadTwikoo()
    }, 100)

    return () => {
      clearTimeout(timer)
      // 清理时不需要移除脚本，因为可能被其他组件使用
    }
  }, [path, lang])

  return (
    <Card className="mt-6">
      <Title level={4} className="mb-4">
        <CommentOutlined className="mr-2" />
        评论
      </Title>
      <div ref={containerRef} id="twikoo-comment-container" />
    </Card>
  )
}

