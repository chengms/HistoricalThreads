import { Layout as AntLayout, Menu, theme } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  HomeOutlined, 
  ClockCircleOutlined, 
  ShareAltOutlined,
  EditOutlined 
} from '@ant-design/icons'
import { ReactNode } from 'react'

const { Header, Content, Footer } = AntLayout

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/timeline',
      icon: <ClockCircleOutlined />,
      label: '时间线',
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
  ]

  return (
    <AntLayout className="min-h-screen">
      <Header className="bg-primary text-white px-6">
        <div className="flex items-center h-full">
          <div 
            className="text-xl font-bold cursor-pointer mr-8"
            onClick={() => navigate('/')}
          >
            中国历史时间线
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            className="flex-1 border-0"
          />
        </div>
      </Header>
      <Content className="flex-1">
        <div 
          className="min-h-[calc(100vh-64px-70px)]"
          style={{ background: colorBgContainer }}
        >
          {children}
        </div>
      </Content>
      <Footer className="text-center bg-gray-100">
        中国历史时间线 ©2024 | 
        <a href="#" className="ml-2">数据来源</a> | 
        <a href="#" className="ml-2">关于我们</a>
      </Footer>
    </AntLayout>
  )
}

