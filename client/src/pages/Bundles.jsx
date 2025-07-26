import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber,
  Upload, 
  Image, 
  Popconfirm, 
  message,
  Typography,
  Space,
  Tag,
  Card,
  Row,
  Col
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, MinusCircleOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

const Bundles = () => {
  const [bundles, setBundles] = useState([])
  const [components, setComponents] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingBundle, setEditingBundle] = useState(null)
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState([])

  useEffect(() => {
    fetchBundles()
    fetchComponents()
  }, [])

  const fetchBundles = async () => {
    setLoading(true)
    try {
      const response = await api.get('/bundles')
      setBundles(response.data)
    } catch (error) {
      message.error('获取套装列表失败')
    } finally {
      setLoading(false)
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

  const handleAdd = () => {
    setEditingBundle(null)
    setFileList([])
    form.resetFields()
    form.setFieldsValue({ components: [{ component_id: undefined, quantity: 1 }] })
    setModalVisible(true)
  }

  const handleEdit = async (record) => {
    try {
      const response = await api.get(`/bundles/${record.id}`)
      const bundle = response.data
      
      setEditingBundle(bundle)
      form.setFieldsValue({
        name: bundle.name,
        description: bundle.description,
        components: bundle.components?.map(c => ({
          component_id: c.id,
          quantity: c.quantity
        })) || []
      })
      
      setFileList(bundle.image_url ? [{
        uid: '-1',
        name: 'image.png',
        status: 'done',
        url: bundle.image_url,
      }] : [])
      
      setModalVisible(true)
    } catch (error) {
      message.error('获取套装详情失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/bundles/${id}`)
      message.success('删除成功')
      fetchBundles()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const formData = new FormData()
      
      formData.append('name', values.name)
      formData.append('description', values.description || '')
      formData.append('components', JSON.stringify(values.components || []))
      
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('image', fileList[0].originFileObj)
      }

      if (editingBundle) {
        await api.put(`/bundles/${editingBundle.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        message.success('更新成功')
      } else {
        await api.post('/bundles', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchBundles()
    } catch (error) {
      message.error(editingBundle ? '更新失败' : '创建失败')
    }
  }

  const uploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    beforeUpload: () => false,
    listType: 'picture-card',
    maxCount: 1,
    accept: 'image/*'
  }

  const columns = [
    {
      title: '图片',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 80,
      render: (url) => url ? (
        <Image width={50} height={50} src={url} style={{ objectFit: 'cover' }} />
      ) : null
    },
    {
      title: '套装名称',
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
      title: '包含配件',
      dataIndex: 'components_info',
      key: 'components_info',
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
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small" className="table-actions">
          <Button 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定要删除这个套装吗？"
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

  return (
    <div className="content-container">
      <div className="page-header">
        <Title level={2} className="page-title">套装管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建套装
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={bundles}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingBundle ? '编辑套装' : '新建套装'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="套装名称"
                name="name"
                rules={[{ required: true, message: '请输入套装名称' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="套装图片">
                <Upload {...uploadProps}>
                  {fileList.length < 1 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>上传图片</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="描述" name="description">
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item label="包含配件">
            <Form.List name="components">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={16} align="middle">
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[name, 'component_id']}
                          rules={[{ required: true, message: '请选择配件' }]}
                        >
                          <Select placeholder="选择配件">
                            {components.map(component => (
                              <Option key={component.id} value={component.id}>
                                {component.name}
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
                      添加配件
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Bundles