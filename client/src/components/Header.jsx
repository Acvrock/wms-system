import React from 'react'
import { Layout, Dropdown, Space, Avatar, Typography } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Header: AntHeader } = Layout
const { Text } = Typography

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate()

  const menuItems = [
    {
      key: 'settings',
      label: '账号设置',
      icon: <SettingOutlined />,
      onClick: () => navigate('/settings')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: onLogout
    }
  ]

  return (
    <AntHeader className="ant-layout-header">
      <div className="logo">WMS 仓库管理系统</div>
      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Space style={{ cursor: 'pointer' }}>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text style={{ color: 'white' }}>
            {user?.username} ({user?.role === 'BOSS' ? '老板' : '管理员'})
          </Text>
        </Space>
      </Dropdown>
    </AntHeader>
  )
}

export default Header