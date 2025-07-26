import React from 'react'
import { Layout, Menu } from 'antd'
import { 
  DashboardOutlined,
  AppstoreOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Sider } = Layout

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘'
    },
    {
      key: '/components',
      icon: <AppstoreOutlined />,
      label: '配件管理'
    },
    {
      key: '/bundles',
      icon: <InboxOutlined />,
      label: '套装管理'
    },
    {
      key: '/restock',
      icon: <ShoppingCartOutlined />,
      label: '补货计划'
    },
    {
      key: '/inventory',
      icon: <BarChartOutlined />,
      label: '库存管理'
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置'
    }
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  return (
    <Sider width={200} className="ant-layout-sider">
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        theme="dark"
        style={{ height: '100%', borderRight: 0 }}
      />
    </Sider>
  )
}

export default Sidebar