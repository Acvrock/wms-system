import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Upload, 
  Image, 
  Popconfirm, 
  message,
  Typography,
  Space,
  Tag
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Title } = Typography
const { TextArea } = Input

const Components = () => {
  const [components, setComponents] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingComponent, setEditingComponent] = useState(null)
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState([])

  useEffect(() => {
    fetchComponents()
  }, [])

  const fetchComponents = async () => {
    setLoading(true)
    try {
      const response = await api.get('/components')
      setComponents(response.data)
    } catch (error) {
      message.error('获取配件列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingComponent(null)
    setFileList([])
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingComponent(record)
    form.setFieldsValue(record)
    setFileList(record.image_url ? [{
      uid: '-1',
      name: 'image.png',
      status: 'done',
      url: record.image_url,
    }] : [])
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/components/${id}`)
      message.success('删除成功')
      fetchComponents()
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
      formData.append('price', values.price)
      
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('image', fileList[0].originFileObj)
      }

      if (editingComponent) {
        await api.put(`/components/${editingComponent.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        message.success('更新成功')
      } else {
        await api.post('/components', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchComponents()
    } catch (error) {
      message.error(editingComponent ? '更新失败' : '创建失败')
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
      title: '配件名称',
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
      title: '库存',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      render: (stock) => (
        <Tag color={stock <= 5 ? 'red' : stock <= 10 ? 'orange' : 'green'}>
          {stock}
        </Tag>
      )
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
            title="确定要删除这个配件吗？"
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
        <Title level={2} className="page-title">配件管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建配件
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={components}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingComponent ? '编辑配件' : '新建配件'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="配件名称"
            name="name"
            rules={[{ required: true, message: '请输入配件名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label="单价"
            name="price"
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              addonBefore="¥"
            />
          </Form.Item>

          <Form.Item label="配件图片">
            <Upload {...uploadProps}>
              {fileList.length < 1 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Components