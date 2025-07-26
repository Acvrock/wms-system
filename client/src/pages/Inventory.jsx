import React, { useState, useEffect } from 'react'
import { 
  Tabs,
  Table, 
  Button, 
  Modal, 
  Form, 
  Select,
  InputNumber,
  Input,
  message,
  Typography,
  Space,
  Tag,
  Card,
  Statistic,
  Row,
  Col
} from 'antd'
import { PlusOutlined, InboxOutlined, MinusOutlined, BarChartOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

const Inventory = () => {
  const [stockOverview, setStockOverview] = useState([])
  const [inboundRecords, setInboundRecords] = useState([])
  const [outboundRecords, setOutboundRecords] = useState([])
  const [components, setComponents] = useState([])
  const [loading, setLoading] = useState(false)
  const [inboundModalVisible, setInboundModalVisible] = useState(false)
  const [outboundModalVisible, setOutboundModalVisible] = useState(false)
  const [inboundForm] = Form.useForm()
  const [outboundForm] = Form.useForm()

  useEffect(() => {
    fetchStockOverview()
    fetchInboundRecords()
    fetchOutboundRecords()
    fetchComponents()
  }, [])

  const fetchStockOverview = async () => {
    setLoading(true)
    try {
      const response = await api.get('/inventory/stock-overview')
      setStockOverview(response.data)
    } catch (error) {
      message.error('获取库存概览失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchInboundRecords = async () => {
    try {
      const response = await api.get('/inventory/inbound')
      setInboundRecords(response.data)
    } catch (error) {
      message.error('获取入库记录失败')
    }
  }

  const fetchOutboundRecords = async () => {
    try {
      const response = await api.get('/inventory/outbound')
      setOutboundRecords(response.data)
    } catch (error) {
      message.error('获取出库记录失败')
    }
  }

  const fetchComponents = async () => {
    try {
      const response = await api.get('/components')
      setComponents(response.data)
    } catch (error) {
      message.error('获取配件列表失败')
    }
  }

  const handleInbound = async () => {
    try {
      const values = await inboundForm.validateFields()
      await api.post('/inventory/inbound', values)
      message.success('入库成功')
      setInboundModalVisible(false)
      inboundForm.resetFields()
      fetchStockOverview()
      fetchInboundRecords()
    } catch (error) {
      message.error('入库失败')
    }
  }

  const handleOutbound = async () => {
    try {
      const values = await outboundForm.validateFields()
      await api.post('/inventory/outbound', values)
      message.success('出库成功')
      setOutboundModalVisible(false)
      outboundForm.resetFields()
      fetchStockOverview()
      fetchOutboundRecords()
    } catch (error) {
      message.error(error.response?.data?.error || '出库失败')
    }
  }

  const stockColumns = [
    {
      title: '配件名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '库存数量',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      render: (stock) => (
        <Tag color={stock <= 5 ? 'red' : stock <= 10 ? 'orange' : 'green'}>
          {stock}
        </Tag>
      )
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (price) => price === '***' ? (
        <span className="price-hidden">***</span>
      ) : (
        `¥${price}`
      )
    },
    {
      title: '总价值',
      dataIndex: 'total_value',
      key: 'total_value',
      render: (value) => value === '***' ? (
        <span className="price-hidden">***</span>
      ) : (
        `¥${parseFloat(value).toFixed(2)}`
      )
    }
  ]

  const inboundColumns = [
    {
      title: '配件名称',
      dataIndex: 'component_name',
      key: 'component_name'
    },
    {
      title: '入库数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity) => <Tag color="green">+{quantity}</Tag>
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note'
    },
    {
      title: '入库时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString()
    }
  ]

  const outboundColumns = [
    {
      title: '配件名称',
      dataIndex: 'component_name',
      key: 'component_name'
    },
    {
      title: '出库数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity) => <Tag color="red">-{quantity}</Tag>
    },
    {
      title: '出库原因',
      dataIndex: 'reason',
      key: 'reason'
    },
    {
      title: '关联计划',
      dataIndex: 'restock_plan_name',
      key: 'restock_plan_name',
      render: (name) => name || '-'
    },
    {
      title: '出库时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString()
    }
  ]

  const totalItems = stockOverview.length
  const totalStock = stockOverview.reduce((sum, item) => sum + item.stock_quantity, 0)
  const lowStockItems = stockOverview.filter(item => item.stock_quantity <= 10).length

  return (
    <div className="content-container">
      <div className="page-header">
        <Title level={2} className="page-title">库存管理</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setInboundModalVisible(true)}>
            新增入库
          </Button>
          <Button icon={<MinusOutlined />} onClick={() => setOutboundModalVisible(true)}>
            新增出库
          </Button>
        </Space>
      </div>

      <Tabs defaultActiveKey="overview" items={[
        {
          key: 'overview',
          label: <span><BarChartOutlined />库存概览</span>,
          children: (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="配件种类"
                    value={totalItems}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="总库存量"
                    value={totalStock}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="低库存预警"
                    value={lowStockItems}
                    valueStyle={{ color: lowStockItems > 0 ? '#ff4d4f' : '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>
            
            <Table
              columns={stockColumns}
              dataSource={stockOverview}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 20 }}
            />
          </>
          )
        },
        {
          key: 'inbound',
          label: <span><InboxOutlined />入库记录</span>,
          children: (
            <Table
              columns={inboundColumns}
              dataSource={inboundRecords}
              rowKey="id"
              pagination={{ pageSize: 20 }}
            />
          )
        },
        {
          key: 'outbound',
          label: <span><MinusOutlined />出库记录</span>,
          children: (
            <Table
              columns={outboundColumns}
              dataSource={outboundRecords}
              rowKey="id"
              pagination={{ pageSize: 20 }}
            />
          )
        }
      ]} />

      <Modal
        title="新增入库"
        open={inboundModalVisible}
        onOk={handleInbound}
        onCancel={() => setInboundModalVisible(false)}
        okText="确认入库"
        cancelText="取消"
      >
        <Form form={inboundForm} layout="vertical">
          <Form.Item
            label="选择配件"
            name="component_id"
            rules={[{ required: true, message: '请选择配件' }]}
          >
            <Select placeholder="选择配件">
              {components.map(component => (
                <Option key={component.id} value={component.id}>
                  {component.name} (当前库存: {component.stock_quantity})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="入库数量"
            name="quantity"
            rules={[{ required: true, message: '请输入入库数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="备注" name="note">
            <TextArea rows={3} placeholder="可选备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增出库"
        open={outboundModalVisible}
        onOk={handleOutbound}
        onCancel={() => setOutboundModalVisible(false)}
        okText="确认出库"
        cancelText="取消"
      >
        <Form form={outboundForm} layout="vertical">
          <Form.Item
            label="选择配件"
            name="component_id"
            rules={[{ required: true, message: '请选择配件' }]}
          >
            <Select placeholder="选择配件">
              {components.map(component => (
                <Option key={component.id} value={component.id}>
                  {component.name} (当前库存: {component.stock_quantity})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="出库数量"
            name="quantity"
            rules={[{ required: true, message: '请输入出库数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="出库原因"
            name="reason"
            rules={[{ required: true, message: '请输入出库原因' }]}
          >
            <Select placeholder="选择出库原因">
              <Option value="丢货">丢货</Option>
              <Option value="损坏">损坏</Option>
              <Option value="不良品">不良品</Option>
              <Option value="盘点调整">盘点调整</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item label="详细描述" name="description">
            <TextArea rows={3} placeholder="详细说明出库原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Inventory