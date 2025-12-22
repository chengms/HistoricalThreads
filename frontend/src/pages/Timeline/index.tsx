import { useState, useEffect, useRef } from 'react'
import { Card, Select, Space, Typography, Spin, Tag, Button, FloatButton, Tooltip, message } from 'antd'
import { CalendarOutlined, VerticalAlignTopOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { loadEvents, loadDynasties } from '@/services/dataLoader'
import type { Dynasty, Event, Person } from '@/types'
import '@/styles/timeline.css'

const { Title } = Typography

// 事件类型标签颜色
const eventTypeColors: Record<string, string> = {
  political: 'blue',
  economic: 'green',
  cultural: 'orange',
  military: 'red',
  reform: 'purple',
  other: 'default',
}

const eventTypeLabels: Record<string, string> = {
  political: '政治',
  economic: '经济',
  cultural: '文化',
  military: '军事',
  reform: '改革',
  other: '其他',
}

// 朝代背景渐变色配置（体现各朝代特征）
const dynastyGradients: Record<string, { start: string; end: string; name: string }> = {
  '夏朝': { start: '#8B6F47', end: '#A0826D', name: '古朴土黄' }, // 古朴的土黄色，体现原始古老
  '商朝': { start: '#4A5D23', end: '#6B7F3A', name: '青铜深绿' }, // 青铜色，体现青铜器文明
  '周朝': { start: '#D4AF37', end: '#F4D03F', name: '礼制金黄' }, // 金色，体现礼制正统
  '春秋': { start: '#E67E22', end: '#D35400', name: '争霸橙红' }, // 橙红色，体现争霸激烈
  '战国': { start: '#8B0000', end: '#A52A2A', name: '战火深红' }, // 深红色，体现战争混乱
  '秦朝': { start: '#2C2C2C', end: '#4A4A4A', name: '统一玄黑' }, // 黑色，体现统一威严
  '汉朝': { start: '#C0392B', end: '#E74C3C', name: '强盛朱红' }, // 朱红色，体现强盛繁荣
  '三国': { start: '#6C3483', end: '#8E44AD', name: '英雄深紫' }, // 深紫色，体现英雄传奇
  '晋朝': { start: '#7D3C98', end: '#9B59B6', name: '短暂淡紫' }, // 淡紫色，体现短暂分裂
  '南北朝': { start: '#5D6D7E', end: '#7F8C8D', name: '对峙灰蓝' }, // 灰蓝色，体现分裂对峙
  '隋朝': { start: '#1B4F72', end: '#2874A6', name: '统一深蓝' }, // 深蓝色，体现统一短暂
  '唐朝': { start: '#F39C12', end: '#F7DC6F', name: '盛世金黄' }, // 金黄色，体现盛世辉煌
  '宋朝': { start: '#1ABC9C', end: '#48C9B0', name: '文化青绿' }, // 青绿色，体现文化雅致
  '元朝': { start: '#27AE60', end: '#52BE80', name: '辽阔草原' }, // 草原绿，体现辽阔游牧
  '明朝': { start: '#C0392B', end: '#E74C3C', name: '汉族朱红' }, // 朱红色，体现汉族强盛
  '清朝': { start: '#1B4F72', end: '#34495E', name: '传统深蓝' }, // 深蓝色，体现传统满族
}

// 默认背景色
const defaultGradient = { start: '#667eea', end: '#764ba2', name: '默认紫蓝' }

export default function TimelinePage() {
  const navigate = useNavigate()
  const timelineContainerRef = useRef<HTMLDivElement>(null)
  const [dynasty, setDynasty] = useState<string>('all')
  const [eventType, setEventType] = useState<string>('all')
  const [events, setEvents] = useState<Event[]>([])
  const [dynasties, setDynasties] = useState<Dynasty[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  // 悬浮导航按钮可见性（桌面端可自动隐藏；移动端始终可见）
  const [floatingNavVisible, setFloatingNavVisible] = useState<boolean>(false)
  const [floatingNavOpen, setFloatingNavOpen] = useState<boolean>(false)
  const [isMobile, setIsMobile] = useState(false)
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const floatingNavRef = useRef<HTMLDivElement>(null)
  const autoHideTimerRef = useRef<number | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // 事件右侧人物列表：默认只显示少量，点击“更多”展开
  const [expandedPersonsByEventId, setExpandedPersonsByEventId] = useState<Record<number, boolean>>({})
  
  // 导航栏自动折叠逻辑
  const [shouldCollapseNav, setShouldCollapseNav] = useState(false)
  const [isNavCollapsed, setIsNavCollapsed] = useState(false)
  const [isSidebarFloating, setIsSidebarFloating] = useState(false)
  const EVENTS_THRESHOLD = 5 // 事件数量阈值，少于此数量时自动折叠

  // Timeline 页面不展示引用/来源，避免信息噪音（详情页提供“确认信息”即可）
  
  // 初始化响应式状态（仅在客户端）
  useEffect(() => {
    const checkMobile = () => {
      const w = window.innerWidth
      setViewportWidth(w)
      const mobile = w <= 768
      setIsMobile(mobile)
      setFloatingNavVisible(mobile)
    }
    checkMobile()
  }, [])
  
  // 页面变窄时自动折叠（但允许点击图标临时展开为浮动面板）
  const autoCollapseSidebar = !isMobile && viewportWidth <= 1100
  const navCollapsed = autoCollapseSidebar ? !isSidebarFloating : isNavCollapsed

  // 当当前筛选结果事件数量很少时，让页面进入“全宽模式”（隐藏左侧朝代导航）
  // 这对应原先 shouldCollapseNav 的用途：事件太少时侧边栏价值不大，且容易显得拥挤
  useEffect(() => {
    const should = events.length > 0 && events.length < EVENTS_THRESHOLD
    setShouldCollapseNav(should)
    if (should) {
      // 进入全宽模式时关闭浮动面板/折叠状态，避免状态互相影响布局
      setIsSidebarFloating(false)
      setIsNavCollapsed(false)
    }
  }, [events.length])
  
  // 点击导航栏外部区域时取消浮动
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarFloating(false)
      }
    }

    if (isSidebarFloating) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isSidebarFloating])
  
  // 监听窗口大小变化，在窄屏设备上默认显示悬浮导航
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      setViewportWidth(w)
      const mobile = w <= 768
      setIsMobile(mobile)
      if (mobile) {
        setFloatingNavVisible(true)
      } else {
        // 在宽屏设备上，保持默认隐藏状态
        setFloatingNavVisible(false)
      }

      // 当进入自动折叠区间时，强制退出浮动（避免遮挡）
      if (w <= 1100 && w > 768) {
        setIsSidebarFloating(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 设置背景的函数 - 使用CSS变量实现平滑渐变过渡
  const setBackgroundGradient = (gradient: typeof defaultGradient) => {
    const body = document.body
    const html = document.documentElement
    const layout = document.querySelector('.ant-layout')
    const content = document.querySelector('.ant-layout-content')
    const contentWrapper = document.querySelector('.ant-layout-content > div')
    const root = document.getElementById('root')
    
    if (body && html) {
      // 使用CSS变量来存储渐变的起始和结束颜色，实现平滑过渡
      body.style.setProperty('--gradient-start', gradient.start)
      body.style.setProperty('--gradient-end', gradient.end)
      body.style.setProperty('background', 'linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%)', 'important')
      body.style.setProperty('background-attachment', 'fixed', 'important')
      body.style.setProperty('transition', '--gradient-start 2s ease-in-out, --gradient-end 2s ease-in-out', 'important')
      body.style.setProperty('min-height', '100vh', 'important')
      body.classList.add('timeline-page-active')
      
      html.style.setProperty('--gradient-start', gradient.start)
      html.style.setProperty('--gradient-end', gradient.end)
      html.style.setProperty('background', 'linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%)', 'important')
      html.style.setProperty('background-attachment', 'fixed', 'important')
      html.style.setProperty('transition', '--gradient-start 2s ease-in-out, --gradient-end 2s ease-in-out', 'important')
      html.style.setProperty('min-height', '100vh', 'important')
      html.classList.add('timeline-page-active')
      
      // 确保根元素也设置背景
      if (root) {
        root.style.setProperty('--gradient-start', gradient.start)
        root.style.setProperty('--gradient-end', gradient.end)
        root.style.setProperty('background', 'linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%)', 'important')
        root.style.setProperty('min-height', '100vh', 'important')
      }
      
      // 确保 Layout 组件背景透明
      if (layout) {
        ;(layout as HTMLElement).style.setProperty('background', 'transparent', 'important')
        layout.classList.add('timeline-page')
      }
      if (content) {
        ;(content as HTMLElement).style.setProperty('background', 'transparent', 'important')
        content.classList.add('timeline-page')
      }
      if (contentWrapper) {
        ;(contentWrapper as HTMLElement).style.setProperty('background', 'transparent', 'important')
      }
      
      console.log('背景已设置为:', gradient.name, `linear-gradient(135deg, ${gradient.start} 0%, ${gradient.end} 100%)`)
    }
  }

  // 加载数据
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [eventsData, dynastiesData] = await Promise.all([
          loadEvents(),
          loadDynasties(),
        ])
        setEvents(eventsData)
        setDynasties(dynastiesData)
        
        // 设置初始背景
        if (eventsData.length > 0 && dynastiesData.length > 0) {
          const firstYear = Math.min(...eventsData.map(e => e.eventYear))
          const dynasty = dynastiesData.find(d => firstYear >= d.startYear && firstYear <= d.endYear)
          const gradient = dynasty && dynastyGradients[dynasty.name] 
            ? dynastyGradients[dynasty.name] 
            : defaultGradient
          
          // 使用 setTimeout 确保 DOM 已渲染
          setTimeout(() => {
            setBackgroundGradient(gradient)
          }, 300)
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        message.error('加载数据失败，请刷新页面重试')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    
    // 组件卸载时清理背景
    return () => {
      const body = document.body
      const html = document.documentElement
      const layout = document.querySelector('.ant-layout')
      const content = document.querySelector('.ant-layout-content')
      
      if (body && html) {
        body.style.background = ''
        body.style.backgroundAttachment = ''
        body.style.transition = ''
        body.style.minHeight = ''
        body.classList.remove('timeline-page-active')
        
        html.style.background = ''
        html.style.backgroundAttachment = ''
        html.style.transition = ''
        html.style.minHeight = ''
        html.classList.remove('timeline-page-active')
      }
      
      if (layout) {
        ;(layout as HTMLElement).style.background = ''
        layout.classList.remove('timeline-page')
      }
      if (content) {
        ;(content as HTMLElement).style.background = ''
        content.classList.remove('timeline-page')
      }
    }
  }, [])

  // 筛选和搜索
  useEffect(() => {
    async function filterEvents() {
      let filtered = await loadEvents()
      
      if (dynasty !== 'all') {
        filtered = filtered.filter(e => e.dynastyId === Number(dynasty))
      }
      
      if (eventType !== 'all') {
        filtered = filtered.filter(e => e.eventType === eventType)
      }

      // 按年份排序
      filtered.sort((a, b) => a.eventYear - b.eventYear)
      setEvents(filtered)
    }
    filterEvents()
  }, [dynasty, eventType])

  // 按年份分组事件
  const groupEventsByYear = () => {
    const grouped: Record<number, Event[]> = {}
    events.forEach(event => {
      const year = event.eventYear
      if (!grouped[year]) {
        grouped[year] = []
      }
      grouped[year].push(event)
    })
    return grouped
  }

  // 获取事件相关人物
  const getEventPersons = (event: Event): Person[] => {
    if (!event.persons || event.persons.length === 0) return []
    return event.persons
  }

  // 滚动到指定年份
  const scrollToYear = (year: number) => {
    const element = document.getElementById(`year-${year}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setSelectedYear(year)
      setTimeout(() => setSelectedYear(null), 2000)
    }
  }

  // 显示悬浮导航
  const showFloatingNav = () => {
    setFloatingNavVisible(true)
    // 如果有自动隐藏定时器，清除它
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current)
      autoHideTimerRef.current = null
    }
    
    // 在宽屏设备上设置5秒后自动隐藏，窄屏设备上不自动隐藏
    if (!isMobile) {
      autoHideTimerRef.current = setTimeout(() => {
        setFloatingNavVisible(false)
      }, 5000)
    }
  }

  // 隐藏悬浮导航
  const hideFloatingNav = () => {
    // 在窄屏设备上不允许隐藏悬浮按钮
    if (isMobile) return
    
    setFloatingNavVisible(false)
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current)
      autoHideTimerRef.current = null
    }
  }

  // 切换悬浮导航展开/收起
  const toggleFloatingNav = () => {
    setFloatingNavOpen(!floatingNavOpen)
  }

  // 点击悬浮导航项
  const handleNavItemClick = (year: number) => {
    scrollToYear(year)
    // 点击导航项后自动收起菜单
    setFloatingNavOpen(false)
    // 重置自动隐藏计时
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current)
      autoHideTimerRef.current = null
    }
    
    // 在宽屏设备上设置3秒后自动隐藏，窄屏设备上不自动隐藏
    if (!isMobile) {
      autoHideTimerRef.current = setTimeout(() => {
        setFloatingNavVisible(false)
      }, 3000)
    }
  }

  // 监听鼠标移动以显示/隐藏悬浮按钮
  useEffect(() => {
    // 在窄屏设备上不自动隐藏悬浮按钮，始终保持可见
    if (isMobile) return
    
    const handleMouseMove = (e: MouseEvent) => {
      // 当鼠标在屏幕右侧区域时显示悬浮按钮
      const isInRightArea = e.clientX > window.innerWidth * 0.7
      const isNearTop = e.clientY < window.innerHeight * 0.2
      
      if (isInRightArea && isNearTop) {
        showFloatingNav()
      } else if (!floatingNavOpen) {
        // 如果菜单没有展开，则可以自动隐藏按钮
        hideFloatingNav()
      }
    }

    // 添加触摸事件支持移动设备
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      const isInRightArea = touch.clientX > window.innerWidth * 0.7
      const isNearTop = touch.clientY < window.innerHeight * 0.2
      
      if (isInRightArea && isNearTop) {
        showFloatingNav()
      } else if (!floatingNavOpen) {
        // 如果菜单没有展开，则可以自动隐藏按钮
        hideFloatingNav()
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchstart', handleTouchStart)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchstart', handleTouchStart)
    }
  }, [floatingNavOpen])

  // 点击外部区域隐藏悬浮菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (floatingNavRef.current && !floatingNavRef.current.contains(event.target as Node)) {
        setFloatingNavOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 格式化年份显示
  const formatYear = (year: number): string => {
    if (year < 0) {
      return `公元前${Math.abs(year)}年`
    }
    return `公元${year}年`
  }

  // 根据年份获取对应的朝代和背景渐变
  const getDynastyByYear = (year: number): Dynasty | null => {
    return dynasties.find(d => year >= d.startYear && year <= d.endYear) || null
  }

  // 获取背景渐变色
  const getGradientByYear = (year: number) => {
    const dynasty = getDynastyByYear(year)
    if (dynasty && dynastyGradients[dynasty.name]) {
      return dynastyGradients[dynasty.name]
    }
    return defaultGradient
  }

  const groupedEvents = groupEventsByYear()
  const allYears = Array.from(new Set(events.map(e => e.eventYear))).sort((a, b) => a - b)

  // 监听滚动，更新背景渐变
  useEffect(() => {
    if (events.length === 0 || allYears.length === 0 || dynasties.length === 0) return

    let lastGradient: typeof defaultGradient | null = null

    const handleScroll = () => {
      // 获取视口中心位置（相对于文档顶部）
      const viewportCenter = window.scrollY + window.innerHeight / 2

      // 找到视口中心位置对应的年份
      let closestYear: number | null = null
      let minDistance = Infinity

      allYears.forEach(year => {
        const element = document.getElementById(`year-${year}`)
        if (element) {
          const rect = element.getBoundingClientRect()
          const elementTop = window.scrollY + rect.top
          const elementCenter = elementTop + rect.height / 2
          const distance = Math.abs(elementCenter - viewportCenter)
          
          if (distance < minDistance) {
            minDistance = distance
            closestYear = year
          }
        }
      })

      if (closestYear !== null) {
        const gradient = getGradientByYear(closestYear)
        // 只有当渐变改变时才更新，避免频繁切换
        if (!lastGradient || lastGradient.start !== gradient.start || lastGradient.end !== gradient.end) {
          lastGradient = gradient
          // 使用 requestAnimationFrame 确保平滑过渡
          requestAnimationFrame(() => {
            setBackgroundGradient(gradient)
          })
        }
      }
    }

    // 使用节流优化性能
    let ticking = false
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    // 延迟初始调用，确保DOM已渲染
    setTimeout(() => {
      handleScroll()
    }, 300)
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll)
      // 清理时恢复默认背景
      const body = document.body
      const html = document.documentElement
      if (body && html) {
        body.style.background = ''
        body.style.backgroundAttachment = ''
        body.style.transition = ''
        html.style.background = ''
        html.style.backgroundAttachment = ''
        html.style.transition = ''
      }
    }
  }, [events, dynasties, allYears])

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-6">
        <Spin size="large" className="w-full flex justify-center items-center" style={{ minHeight: '600px' }} />
      </div>
    )
  }

  const containerCollapsedClass = (!shouldCollapseNav && (navCollapsed && !isMobile)) ? 'nav-collapsed' : ''

  return (
    <div className={`timeline-page-container ${containerCollapsedClass}`}>
      {/* 顶部筛选栏 */}
      <Card className={`timeline-filter-card ${shouldCollapseNav ? 'full-width' : ''}`}>
        <Space size="large" wrap>
          <Select
            style={{ width: 150 }}
            value={dynasty}
            onChange={setDynasty}
            options={[
              { label: '全部朝代', value: 'all' },
              ...dynasties.map(d => ({ label: d.name, value: d.id.toString() })),
            ]}
          />
          <Select
            style={{ width: 150 }}
            value={eventType}
            onChange={setEventType}
            options={[
              { label: '全部类型', value: 'all' },
              { label: '政治', value: 'political' },
              { label: '经济', value: 'economic' },
              { label: '文化', value: 'cultural' },
              { label: '军事', value: 'military' },
              { label: '改革', value: 'reform' },
            ]}
          />
        </Space>
      </Card>

      <div className="timeline-layout">
        {/* 左侧侧边栏 - 朝代导航 (含自动折叠逻辑) */}
        {!shouldCollapseNav && !isMobile && (
          navCollapsed ? (
            <Button
              type="text"
              className="timeline-sidebar-toggle"
              onClick={(e) => {
                e.stopPropagation()
                // 宽屏手动折叠：点击图标应真正展开
                if (!autoCollapseSidebar) {
                  setIsNavCollapsed(false)
                }
                setIsSidebarFloating(true)
              }}
            >
              <MenuUnfoldOutlined />
            </Button>
          ) : (
            <div 
              ref={sidebarRef}
              className={`timeline-sidebar ${isSidebarFloating ? 'floating' : ''}`}
              style={{ 
                visibility: 'visible',
                opacity: 1,
                transition: 'opacity 0.3s ease'
              }}
              onClick={() => setIsSidebarFloating(true)}
            >
              <div className="dynasty-nav-header">
                <span className="dynasty-nav-title">朝代导航</span>
                <Button 
                  type="text" 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    // 自动折叠区间：关闭浮动面板即可回到“只显示图标”
                    if (autoCollapseSidebar) {
                      setIsSidebarFloating(false)
                      return
                    }
                    // 非自动区间：真正折叠
                    setIsSidebarFloating(false)
                    setIsNavCollapsed(true)
                  }}
                  className="nav-collapse-button"
                >
                  <MenuFoldOutlined />
                </Button>
              </div>
              <div 
                className="dynasty-nav"
                onClick={(e) => e.stopPropagation()}
              >
                {dynasties
                  .sort((a, b) => a.startYear - b.startYear)
                  .map(dynasty => {
                    const dynastyEvents = events.filter(e => e.dynastyId === dynasty.id)
                    const firstEventYear = dynastyEvents.length > 0 ? Math.min(...dynastyEvents.map(e => e.eventYear)) : dynasty.startYear
                    
                    return (
                      <Button
                        key={dynasty.id}
                        type="text"
                        block
                        className="dynasty-nav-item"
                        onClick={(e) => {
                          e.stopPropagation()
                          scrollToYear(firstEventYear)
                        }}
                      >
                        <div className="dynasty-nav-name">{dynasty.name}</div>
                        <div className="dynasty-nav-years">
                          {formatYear(dynasty.startYear)} - {formatYear(dynasty.endYear)}
                        </div>
                      </Button>
                    )
                  })}
              </div>
            </div>
          )
        )}

        {/* 悬浮导航 */}
        <div
          ref={floatingNavRef}
          className={`floating-dynasty-nav ${floatingNavVisible ? 'visible' : ''}`}
        >
          <Tooltip title="朝代导航" placement="right">
            <div className="floating-nav-button" onClick={toggleFloatingNav}>
              {floatingNavOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            </div>
          </Tooltip>
          <div className={`floating-nav-menu ${floatingNavOpen ? 'visible' : ''}`}>
            <div className="dynasty-nav-header" style={{ marginBottom: '8px' }}>朝代导航</div>
            {dynasties
              .sort((a, b) => a.startYear - b.startYear)
              .map(dynasty => {
                const dynastyEvents = events.filter(e => e.dynastyId === dynasty.id)
                const firstEventYear = dynastyEvents.length > 0 ? Math.min(...dynastyEvents.map(e => e.eventYear)) : dynasty.startYear
                
                return (
                  <div
                    key={dynasty.id}
                    className="floating-nav-item"
                    onClick={() => handleNavItemClick(firstEventYear)}
                  >
                    <div className="floating-nav-name">{dynasty.name}</div>
                    <div className="floating-nav-years">
                      {formatYear(dynasty.startYear)} - {formatYear(dynasty.endYear)}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* 中间时间轴区域 */}
        <div className={`timeline-main ${shouldCollapseNav ? 'full-width' : ''}`} ref={timelineContainerRef}>
          {allYears.map(year => {
            const yearEvents = groupedEvents[year] || []
            if (yearEvents.length === 0) return null

            return (
              <div key={year} id={`year-${year}`} className="timeline-year-section">
                {/* 年份标签 */}
                <div className="timeline-year-label">
                  <span className="year-text">{formatYear(year)}</span>
                </div>

                {/* 时间轴内容 */}
                <div className="timeline-content-row">
                  {/* 左侧：事件列表 */}
                  <div className="timeline-events">
                    {yearEvents.map(event => (
                      <Card
                        key={event.id}
                        className={`timeline-event-card event-${event.eventType} ${selectedYear === year ? 'highlighted' : ''}`}
                        hoverable
                        onClick={() => navigate(`/detail/event/${event.id}`)}
                      >
                        <div className="event-header">
                          <Title level={5} className="event-title">{event.title}</Title>
                          <Space size={6} wrap={false} className="event-tags">
                            <Tag color={eventTypeColors[event.eventType]}>
                              {eventTypeLabels[event.eventType]}
                            </Tag>
                            {event.dynasty?.name && (
                              <Tag color="gold">
                                {event.dynasty.name}
                              </Tag>
                            )}
                          </Space>
                        </div>
                        <div className="event-description">
                          {event.description}
                        </div>
                        {event.location && (
                          <div key={`location-${event.id}`} className="event-location">
                            <CalendarOutlined /> {event.location}
                          </div>
                        )}

                        {/* Timeline 不展示来源/引用；详情页提供“确认信息”即可 */}
                      </Card>
                    ))}
                  </div>

                  {/* 右侧：相关人物 */}
                  <div className="timeline-persons">
                    {yearEvents.map(event => {
                      const eventPersons = getEventPersons(event)
                      if (eventPersons.length === 0) return null

                      const isExpanded = !!expandedPersonsByEventId[event.id]
                      const MAX_VISIBLE_PERSONS = 3
                      const shouldUseMoreSlot = eventPersons.length > MAX_VISIBLE_PERSONS
                      const visiblePersons = isExpanded
                        ? eventPersons
                        : shouldUseMoreSlot
                          ? eventPersons.slice(0, 2) // 第3个位置留给“更多”按钮
                          : eventPersons.slice(0, MAX_VISIBLE_PERSONS)
                      const hiddenCount = isExpanded
                        ? 0
                        : shouldUseMoreSlot
                          ? eventPersons.length - 2
                          : Math.max(0, eventPersons.length - visiblePersons.length)

                      return (
                        <div key={event.id} className={`event-persons-group ${isExpanded ? 'expanded' : ''}`}>
                          {visiblePersons.map(person => (
                            <Button
                              key={person.id}
                              type="link"
                              className="person-link"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/detail/person/${person.id}`)
                              }}
                            >
                              <span className="person-name">{person.name}</span>
                            </Button>
                          ))}

                          {!isExpanded && shouldUseMoreSlot && hiddenCount > 0 && (
                            <Button
                              type="link"
                              className="person-link person-link-more"
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedPersonsByEventId(prev => ({ ...prev, [event.id]: true }))
                              }}
                            >
                              <span className="person-name">更多 +{hiddenCount}</span>
                            </Button>
                          )}

                          {isExpanded && shouldUseMoreSlot && (
                            <Button
                              type="link"
                              className="person-link person-link-more"
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedPersonsByEventId(prev => ({ ...prev, [event.id]: false }))
                              }}
                            >
                              <span className="person-name">收起</span>
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* 返回顶部按钮 */}
      <FloatButton
        icon={<VerticalAlignTopOutlined />}
        type="primary"
        style={{
          right: 24,
          bottom: 24,
        }}
        onClick={() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        }}
      />
    </div>
  )
}
