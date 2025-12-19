import { Layout as AntLayout, Menu, theme, Input, AutoComplete, message } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  HomeOutlined, 
  ClockCircleOutlined, 
  ShareAltOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  MenuOutlined,
  CloseOutlined
} from '@ant-design/icons'
import { ReactNode, useState, useEffect } from 'react'
import { searchEvents, searchPersons } from '@/services/dataLoader'
import './index.css'

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
  const [menuCollapsed, setMenuCollapsed] = useState(false)
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const isMobile = viewportWidth < 768
  const isCompactHeader = viewportWidth <= 1024

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      setViewportWidth(w)
      
      // 在大屏幕上自动展开菜单
      if (w > 1024) {
        setMenuCollapsed(false)
      } else if (w <= 1024 && w > 768) {
        // 中等屏幕：默认折叠（但用户可通过按钮展开）
        setMenuCollapsed(true)
      } else if (w <= 768) {
        // 小屏幕：折叠
        setMenuCollapsed(true)
      }
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
  }

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

  const isTimelinePage = location.pathname === '/timeline' || 
                         location.pathname === '/HistoricalThreads/timeline' || 
                         location.pathname === '/' ||
                         location.pathname.startsWith('/timeline')
  
  return (
    <AntLayout 
      className="min-h-screen"
      style={isTimelinePage ? { background: 'transparent' } : {}}
    >
      <Header className="text-white px-6" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #2563eb 100%)' }}>
        <div className="flex items-center h-full gap-4">
          <div 
            className="text-xl font-bold cursor-pointer"
            style={{ flexShrink: 0, whiteSpace: 'nowrap', marginRight: '20px' }}
            onClick={() => navigate('/')}
          >
            中国历史时间线
          </div>
          
          {/* 折叠按钮 - 在小屏幕和中等屏幕上显示 */}
          {isCompactHeader && (
            <div 
              className="cursor-pointer text-white p-2 rounded hover:bg-white/10 transition-all"
              onClick={() => setMenuCollapsed(!menuCollapsed)}
              style={{ marginRight: '10px' }}
            >
              {menuCollapsed ? <CloseOutlined /> : <MenuOutlined />}
            </div>
          )}
          
          {/* 导航菜单 */}
          <div 
            className="flex-1"
            style={{ 
              overflow: 'hidden',
              transition: 'width 0.3s ease'
            }}
          >
            <Menu
              theme="dark"
              mode="horizontal"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => {
                navigate(key)
                // 在小屏幕和中等屏幕上点击菜单项后自动折叠菜单
                if (isCompactHeader) {
                  setMenuCollapsed(true)
                }
              }}
              className="border-0"
              style={{
                display: (isCompactHeader && menuCollapsed) ? 'none' : 'flex',
                flexWrap: 'wrap'
              }}
            />
          </div>
          
          {/* 搜索框 */}
          <div 
            className="flex items-center"
            style={{ 
              flexShrink: 0,
              width: (isCompactHeader && !menuCollapsed) ? '0' : '160px',
              overflow: 'hidden',
              transition: 'width 0.3s ease'
            }}
          >
            <AutoComplete
              value={searchValue}
              options={searchOptions}
              onSearch={handleSearch}
              onSelect={handleSelect}
              placeholder="搜索..."
              size="small"
              style={{ width: '100%' }}
              notFoundContent={searchLoading ? '搜索中...' : searchValue ? '未找到' : null}
              popupClassName="search-autocomplete-dropdown"
            >
              <Input
                prefix={<SearchOutlined style={{ color: 'white' }} />}
                allowClear
                onChange={(e) => {
                  setSearchValue(e.target.value)
                  if (!e.target.value) {
                    setSearchOptions([])
                  }
                }}
                className="header-search-input"
                style={{ 
                  color: 'white',
                }}
              />
            </AutoComplete>
          </div>
        </div>
      </Header>
      <Content className="flex-1">
        <div 
          className="min-h-[calc(100vh-64px-70px)]"
          style={{ 
            background: location.pathname === '/timeline' || location.pathname === '/HistoricalThreads/timeline' || location.pathname === '/' || location.pathname.startsWith('/timeline') 
              ? 'transparent' 
              : colorBgContainer 
          }}
        >
          {children}
        </div>
      </Content>
      <Footer className="text-center bg-gray-100">
        中国历史时间线 ©2025 | 
        <a href="#" className="ml-2">数据来源</a> | 
        <a href="#" className="ml-2">关于我们</a>
      </Footer>
    </AntLayout>
  )
}

