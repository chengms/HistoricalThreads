import { Layout as AntLayout, Menu, Input, AutoComplete, message } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  HomeOutlined, 
  ClockCircleOutlined, 
  ShareAltOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  MenuOutlined,
  CloseOutlined,
  BookOutlined
} from '@ant-design/icons'
import type { InputRef } from 'antd'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { searchEvents, searchPersons } from '@/services/dataLoader'
import './index.css'
import '@/styles/cinematic.css'

const { Header, Content, Footer } = AntLayout

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchValue, setSearchValue] = useState('')
  const [searchOptions, setSearchOptions] = useState<Array<{ value: string; label: JSX.Element }>>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false)
  const [menuCollapsed, setMenuCollapsed] = useState(false) // 用于手动折叠/展开（仅在非常小的屏幕上使用）
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const searchOverlayRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<InputRef>(null)

  // <= 1024: 用搜索图标 + 点击弹出搜索框，避免占用导航栏空间
  const isSearchIconMode = viewportWidth <= 1024

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      setViewportWidth(w)
      
      // 默认展开菜单，让菜单项根据空间自动显示/隐藏
      // 不再根据屏幕尺寸自动折叠菜单
    }

    // 初始化一次
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 搜索功能
  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setSearchOptions([])
      return
    }

    setSearchLoading(true)
    try {
      const [events, persons] = await Promise.all([
        searchEvents(value),
        searchPersons(value),
      ])

      const options: Array<{ value: string; label: JSX.Element }> = []

      // 添加事件结果
      events.slice(0, 3).forEach(event => {
        options.push({
          value: `event-${event.id}`,
          label: (
            <div>
              <div className="font-semibold text-gray-800">{event.title}</div>
              <div className="text-xs text-gray-500">事件 · {event.eventYear}年</div>
            </div>
          ),
        })
      })

      // 添加人物结果
      persons.slice(0, 3).forEach(person => {
        options.push({
          value: `person-${person.id}`,
          label: (
            <div>
              <div className="font-semibold text-gray-800">{person.name}</div>
              <div className="text-xs text-gray-500">人物 · {person.dynasty?.name || '未知朝代'}</div>
            </div>
          ),
        })
      })

      setSearchOptions(options)
    } catch (error) {
      console.error('搜索失败:', error)
      message.error('搜索失败，请稍后重试')
    } finally {
      setSearchLoading(false)
    }
  }

  // 处理选择搜索结果
  const handleSelect = (value: string) => {
    const [type, id] = value.split('-')
    navigate(`/detail/${type}/${id}`)
    setSearchValue('')
    setSearchOptions([])
    setSearchOverlayOpen(false)
  }

  const openSearchOverlay = () => {
    setSearchOverlayOpen(true)
    // next tick focus
    setTimeout(() => {
      searchInputRef.current?.focus?.()
    }, 0)
  }

  const closeSearchOverlay = () => {
    setSearchOverlayOpen(false)
  }

  // icon-mode -> show icon. If viewport becomes wide, close overlay.
  useEffect(() => {
    if (!isSearchIconMode && searchOverlayOpen) {
      setSearchOverlayOpen(false)
    }
  }, [isSearchIconMode, searchOverlayOpen])

  // close overlay on outside click / Esc
  useEffect(() => {
    if (!searchOverlayOpen) return

    const onMouseDown = (e: MouseEvent) => {
      const el = searchOverlayRef.current
      if (el && !el.contains(e.target as Node)) {
        closeSearchOverlay()
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSearchOverlay()
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [searchOverlayOpen])

  const menuItems = [
    {
      key: '/',
      icon: <ClockCircleOutlined />,
      label: '时间线',
    },
    {
      key: '/home',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/knowledge-points',
      icon: <BookOutlined />,
      label: '知识点',
    },
    {
      key: '/network',
      icon: <ShareAltOutlined />,
      label: '关系图谱',
    },
    {
      key: '/suggestion',
      icon: <EditOutlined />,
      label: '提交建议',
    },
    {
      key: '/suggestions',
      icon: <EyeOutlined />,
      label: '查看建议',
    },
  ]

  // 确保所有页面都应用深色主题
  useEffect(() => {
    document.body.classList.add('cinematic-theme')
    document.documentElement.classList.add('cinematic-theme')
    return () => {
      // 不在这里移除，让各个页面自己管理
    }
  }, [])
  
  return (
    <AntLayout 
      className="min-h-screen"
      style={{ background: 'transparent' }}
    >
      <Header className="cinematic-header text-white px-3 sm:px-6">
        <div className="flex items-center h-full gap-2 sm:gap-4" style={{ minWidth: 0 }}>
          {/* 标题 - 在小屏幕上缩短 */}
          <div 
            className="text-base sm:text-xl font-bold cursor-pointer"
            style={{ 
              flexShrink: viewportWidth <= 640 ? 1 : 0, 
              whiteSpace: 'nowrap',
              marginRight: viewportWidth <= 640 ? '8px' : '20px',
              overflow: viewportWidth <= 640 ? 'hidden' : 'visible',
              textOverflow: viewportWidth <= 640 ? 'ellipsis' : 'clip',
              maxWidth: viewportWidth <= 640 ? '120px' : 'none'
            }}
            onClick={() => navigate('/')}
            title="中国历史时间线"
          >
            {viewportWidth <= 640 ? '历史时间线' : '中国历史时间线'}
          </div>
          
          {/* 折叠按钮 - 仅在非常小的屏幕上显示，用于完全隐藏菜单 */}
          {viewportWidth <= 640 && (
            <div 
              className="cursor-pointer text-white p-2 rounded hover:bg-white/10 transition-all flex-shrink-0"
              onClick={() => setMenuCollapsed(!menuCollapsed)}
              style={{ marginRight: '8px' }}
              title={menuCollapsed ? '展开菜单' : '折叠菜单'}
            >
              {/* menuCollapsed=true 表示菜单已折叠，应显示"展开菜单"图标 */}
              {menuCollapsed ? <MenuOutlined /> : <CloseOutlined />}
            </div>
          )}
          
          {/* 导航菜单 - 默认显示，根据空间自动适应，无法显示的项进入下拉菜单 */}
          <div 
            className="flex-1"
            style={{ 
              overflow: 'hidden',
              minWidth: 0,
              display: (viewportWidth <= 640 && menuCollapsed) ? 'none' : 'flex'
            }}
          >
            <Menu
              theme="dark"
              mode="horizontal"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => {
                navigate(key)
              }}
              className="border-0"
              style={{
                flex: 1,
                minWidth: 0,
                border: 'none',
                background: 'transparent'
              }}
              overflowedIndicator={
                <span style={{ 
                  color: 'white', 
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MenuOutlined style={{ fontSize: '16px' }} />
                </span>
              }
            />
          </div>
          
          {/* 搜索框 */}
          {!isSearchIconMode ? (
            <div 
              className="flex items-center flex-shrink-0"
              style={{ 
                width: viewportWidth <= 768 ? '120px' : '160px',
                overflow: 'hidden',
                marginLeft: '8px'
              }}
            >
              <AutoComplete
                value={searchValue}
                options={searchOptions}
                onSearch={handleSearch}
                onSelect={handleSelect}
                style={{ width: '100%' }}
                notFoundContent={searchLoading ? '搜索中...' : searchValue ? '未找到' : null}
                classNames={{ popup: { root: 'search-autocomplete-dropdown' } }}
              >
                <Input
                  prefix={<SearchOutlined style={{ color: 'white' }} />}
                  placeholder={viewportWidth <= 768 ? '' : '搜索...'}
                  size="small"
                  allowClear
                  onChange={(e) => {
                    setSearchValue(e.target.value)
                    if (!e.target.value) {
                      setSearchOptions([])
                    }
                  }}
                  className="header-search-input"
                  style={{ color: 'white' }}
                />
              </AutoComplete>
            </div>
          ) : (
            <div
              ref={searchOverlayRef}
              className="header-search-icon-wrap"
              style={{ flexShrink: 0, marginLeft: '8px' }}
            >
              <div
                className="header-search-icon"
                role="button"
                tabIndex={0}
                onClick={() => (searchOverlayOpen ? closeSearchOverlay() : openSearchOverlay())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    searchOverlayOpen ? closeSearchOverlay() : openSearchOverlay()
                  }
                }}
              >
                <SearchOutlined />
              </div>

              {searchOverlayOpen && (
                <div className="header-search-overlay">
                  <AutoComplete
                    value={searchValue}
                    options={searchOptions}
                    onSearch={handleSearch}
                    onSelect={handleSelect}
                    style={{ width: Math.min(320, Math.max(220, viewportWidth - 240)) }}
                    notFoundContent={searchLoading ? '搜索中...' : searchValue ? '未找到' : null}
                    classNames={{ popup: { root: 'search-autocomplete-dropdown' } }}
                  >
                    <Input
                      ref={searchInputRef}
                      prefix={<SearchOutlined style={{ color: 'white' }} />}
                      placeholder="搜索..."
                      allowClear
                      onChange={(e) => {
                        setSearchValue(e.target.value)
                        if (!e.target.value) {
                          setSearchOptions([])
                        }
                      }}
                      className="header-search-input header-search-input-overlay"
                      style={{ color: 'white' }}
                    />
                  </AutoComplete>
                </div>
              )}
            </div>
          )}
        </div>
      </Header>
      <Content className="flex-1">
        <div 
          className="min-h-[calc(100vh-64px-70px)]"
          style={{ 
            background: 'transparent'
          }}
        >
          {children}
        </div>
      </Content>
      <Footer className="text-center" style={{ background: 'rgba(26, 26, 26, 0.9)', color: 'var(--cinematic-text-secondary)', borderTop: '1px solid var(--cinematic-border)' }}>
        中国历史时间线 ©2025 | 
        <a href="#" className="ml-2" style={{ color: 'var(--cinematic-accent-gold)' }}>数据来源</a> | 
        <a href="#" className="ml-2" style={{ color: 'var(--cinematic-accent-gold)' }}>关于我们</a>
        <div className="mt-2" style={{ fontSize: '12px', color: 'var(--cinematic-text-secondary)' }}>
          <a 
            href="https://beian.miit.gov.cn/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: 'var(--cinematic-text-secondary)', textDecoration: 'none' }}
          >
            粤ICP备2021082879号
          </a>
        </div>
      </Footer>
    </AntLayout>
  )
}

