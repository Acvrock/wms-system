import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber,
  Popconfirm, 
  message,
  Typography,
  Space,
  Tag,
  Alert,
  Descriptions,
  Row,
  Col,
  Card
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CheckOutlined, 
  SaveOutlined,
  EyeOutlined,
  MinusCircleOutlined
} from '@ant-design/icons'
import api from '../services/api'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

const RestockPlans = () => {
  const [plans, setPlans] = useState([])
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [validationVisible, setValidationVisible] = useState(false)
  const [viewVisible, setViewVisible] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [viewingPlan, setViewingPlan] = useState(null)
  const [validationData, setValidationData] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchPlans()
    fetchBundles()
  }, [])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const response = await api.get('/restock')
      setPlans(response.data)
    } catch (error) {
      message.error('获取补货计划失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchBundles = async () => {
    try {
      const response = await api.get('/bundles')
      setBundles(response.data)
    } catch (error) {
      message.error('获取套装列表失败')
    }
  }

  const handleAdd = () => {
    setEditingPlan(null)
    form.resetFields()
    form.setFieldsValue({ bundles: [] })
    setModalVisible(true)
  }

  const handleEdit = async (record) => {
    try {
      const response = await api.get(`/restock/${record.id}`)
      const plan = response.data
      
      setEditingPlan(plan)
      
      const bundlesData = plan.bundles?.map(b => ({
        bundle_id: b.id,
        quantity: b.plan_quantity
      })) || []
      
      form.resetFields()
      form.setFieldsValue({
        name: plan.name,
        description: plan.description,
        bundles: bundlesData
      })
      
      setModalVisible(true)
    } catch (error) {
      message.error('获取补货计划详情失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/restock/${id}`)
      message.success('删除成功')
      fetchPlans()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      // Filter out incomplete bundle entries
      const validBundles = (values.bundles || []).filter(bundle => 
        bundle && bundle.bundle_id && bundle.quantity && bundle.quantity > 0
      );
      
      const planData = {
        name: values.name,
        description: values.description || '',
        bundles: validBundles
      }

      let response
      if (editingPlan) {
        response = await api.put(`/restock/${editingPlan.id}`, planData)
        message.success('更新成功')
      } else {
        response = await api.post('/restock', planData)
        message.success('创建成功')
      }

      setModalVisible(false)
      await fetchPlans()
    } catch (error) {
      // console.error('Submit error:', error)
      // Only show error for actual API failures, not for form validation or other issues
      if (error.response) {
        // Server responded with error status
        if (error.response.data && error.response.data.error) {
          message.error(error.response.data.error)
        } else {
          message.error(`服务器错误: ${error.response.status}`)
        }
      } else if (error.request) {
        // Network error
        message.error('网络请求失败，请检查网络连接')
      } else if (error.errors) {
        // Form validation error - don't show as API error
        // console.log('Form validation error:', error.errors)
      } else {
        // Other errors
        message.error(editingPlan ? '更新失败' : '创建失败')
      }
    }
  }

  const handleValidate = async (planId) => {
    try {
      const response = await api.post(`/restock/${planId}/validate`)
      setValidationData(response.data)
      setValidationVisible(true)
    } catch (error) {
      message.error('验证失败')
    }
  }

  const handlePack = async (planId) => {
    try {
      await api.post(`/restock/${planId}/pack`)
      message.success('补货计划已打包，库存已扣减')
      fetchPlans()
    } catch (error) {
      message.error(error.response?.data?.error || '打包失败')
    }
  }

  const handleView = async (record) => {
    try {
      const response = await api.get(`/restock/${record.id}`)
      const plan = response.data
      setViewingPlan(plan)
      setViewVisible(true)
    } catch (error) {
      message.error('获取补货计划详情失败')
    }
  }

  const getStatusTag = (status) => {
    const statusMap = {
      'PACKING': { color: 'processing', text: '打包中' },
      'PACKED': { color: 'success', text: '已打包' }
    }
    const config = statusMap[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const columns = [
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: '包含套装',
      dataIndex: 'bundles_info',
      key: 'bundles_info',
      render: (info) => info ? (
        <div>
          {info.split(',').map((item, index) => (
            <Tag key={index} style={{ marginBottom: 4 }}>
              {item.trim()}
            </Tag>
          ))}
        </div>
      ) : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small" className="table-actions">
          {record.status === 'PACKING' && (
            <>
              <Button 
                size="small" 
                icon={<EyeOutlined />} 
                onClick={() => handleValidate(record.id)}
              >
                验证
              </Button>
              <Button 
                size="small" 
                icon={<EditOutlined />} 
                onClick={() => handleEdit(record)}
              />
              <Popconfirm
                title="确定要打包这个计划吗？一旦打包将扣减库存！"
                onConfirm={() => handlePack(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button size="small" type="primary" icon={<CheckOutlined />}>
                  打包
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'PACKED' && (
            <Button 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => handleView(record)}
            >
              查看
            </Button>
          )}
          <Popconfirm
            title="确定要删除这个补货计划吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  const validationColumns = [
    {
      title: '配件名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '需要数量',
      dataIndex: 'required',
      key: 'required'
    },
    {
      title: '可用库存',
      dataIndex: 'available',
      key: 'available'
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        const sufficient = record.required <= record.available
        return (
          <Tag color={sufficient ? 'success' : 'error'}>
            {sufficient ? '充足' : `缺少 ${record.required - record.available}`}
          </Tag>
        )
      }
    }
  ]

  return (
    <div className="content-container">
      <div className="page-header">
        <Title level={2} className="page-title">补货计划</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建补货计划
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={plans}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingPlan ? '编辑补货计划' : '新建补货计划'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="计划名称"
            name="name"
            rules={[{ required: true, message: '请输入计划名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item label="包含套装">
            <Form.List name="bundles">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={16} align="middle">
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[name, 'bundle_id']}
                          rules={[{ required: true, message: '请选择套装' }]}
                        >
                          <Select placeholder="选择套装">
                            {bundles.map(bundle => (
                              <Option key={bundle.id} value={bundle.id}>
                                {bundle.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          rules={[{ required: true, message: '请输入数量' }]}
                        >
                          <InputNumber min={1} placeholder="数量" style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      </Col>
                    </Row>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加套装
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="库存验证结果"
        open={validationVisible}
        onCancel={() => setValidationVisible(false)}
        footer={null}
        width={800}
      >
        {validationData && (
          <>
            <Alert
              message={validationData.valid ? '库存充足，可以打包' : '库存不足，无法打包'}
              type={validationData.valid ? 'success' : 'error'}
              style={{ marginBottom: 16 }}
            />
            
            <Table
              columns={validationColumns}
              dataSource={validationData.requirements}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 400 }}
            />
          </>
        )}
      </Modal>

      <Modal
        title="查看补货计划"
        open={viewVisible}
        onCancel={() => setViewVisible(false)}
        footer={null}
        width={800}
      >
        {viewingPlan && (
          <>
            <Descriptions bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="计划名称">{viewingPlan.name}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(viewingPlan.status)}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(viewingPlan.created_at).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={3}>
                {viewingPlan.description || '无'}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>包含套装</Title>
            {viewingPlan.bundles && viewingPlan.bundles.length > 0 ? (
              viewingPlan.bundles.map((bundle, index) => (
                <Card key={bundle.id} size="small" style={{ marginBottom: 12 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>套装名称：</Text>{bundle.name}
                    </Col>
                    <Col span={6}>
                      <Text strong>数量：</Text>{bundle.plan_quantity}
                    </Col>
                    <Col span={6}>
                      <Text strong>单价：</Text>¥{bundle.price}
                    </Col>
                  </Row>
                  <Row style={{ marginTop: 8 }}>
                    <Col span={24}>
                      <Text strong>套装描述：</Text>{bundle.description || '无'}
                    </Col>
                  </Row>
                  {bundle.components && bundle.components.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong>包含配件：</Text>
                      <div style={{ marginTop: 4 }}>
                        {bundle.components.map((comp, compIndex) => (
                          <Tag key={comp.id} style={{ marginBottom: 4 }}>
                            {comp.name} × {comp.quantity}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <Text type="secondary">暂无套装</Text>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}

export default RestockPlans