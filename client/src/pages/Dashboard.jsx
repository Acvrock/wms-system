import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Typography, Spin } from 'antd'
import { 
  AppstoreOutlined, 
  InboxOutlined, 
  ShoppingCartOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import api from '../services/api'

const { Title } = Typography

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalComponents: 0,
    totalBundles: 0,
    totalStock: 0,
    lowStockItems: []
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [componentsRes, bundlesRes, stockRes] = await Promise.all([
        api.get('/components'),
        api.get('/bundles'),
        api.get('/inventory/stock-overview')
      ])

      const components = componentsRes.data
      const bundles = bundlesRes.data
      const stockOverview = stockRes.data

      const totalStock = stockOverview.reduce((sum, item) => sum + item.stock_quantity, 0)
      const lowStockItems = stockOverview
        .filter(item => item.stock_quantity <= 10)
        .sort((a, b) => a.stock_quantity - b.stock_quantity)

      setStats({
        totalComponents: components.length,
        totalBundles: bundles.length,
        totalStock,
        lowStockItems
      })
    } catch (error) {
      // console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const lowStockColumns = [
    {
      title: '配件名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '当前库存',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      render: (value) => (
        <span style={{ color: value <= 5 ? '#ff4d4f' : '#faad14' }}>
          {value}
        </span>
      )
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (value) => value === '***' ? value : `¥${value}`
    }
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="content-container">
      <div className="page-header">
        <Title level={2} className="page-title">仪表盘</Title>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="配件总数"
              value={stats.totalComponents}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="套装总数"
              value={stats.totalBundles}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总库存量"
              value={stats.totalStock}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="低库存预警"
              value={stats.lowStockItems.length}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: stats.lowStockItems.length > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {stats.lowStockItems.length > 0 && (
        <Card title="低库存预警" style={{ marginBottom: 24 }}>
          <Table
            columns={lowStockColumns}
            dataSource={stats.lowStockItems}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}
    </div>
  )
}

export default Dashboard