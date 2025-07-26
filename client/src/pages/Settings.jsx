import React, { useState, useEffect } from 'react'
import { 
  Card,
  Form, 
  Input, 
  Button,
  message,
  Typography,
  Row,
  Col,
  Table,
  Select,
  Divider
} from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Title, Text } = Typography
const { Option } = Select

const Settings = () => {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchUsers()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile')
      setUser(response.data.user)
    } catch (error) {
      // console.error('Failed to fetch profile:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users')
      setUsers(response.data)
    } catch (error) {
      // console.error('Failed to fetch users:', error)
    }
  }

  const handleChangePassword = async (values) => {
    setLoading(true)
    try {
      await api.post('/auth/change-password', values)
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error) {
      message.error(error.response?.data?.error || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => role === 'BOSS' ? '老板' : '管理员'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString()
    }
  ]

  return (
    <div className="content-container">
      <div className="page-header">
        <Title level={2} className="page-title">系统设置</Title>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="个人信息" size="small">
            <div style={{ marginBottom: 16 }}>
              <Text strong>用户名: </Text>
              <Text>{user?.username}</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>角色: </Text>
              <Text>{user?.role === 'BOSS' ? '老板' : '管理员'}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="修改密码" size="small">
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              {user?.role === 'BOSS' && (
                <Form.Item
                  label="目标用户"
                  name="targetUserId"
                  tooltip="老板可以修改其他用户的密码"
                >
                  <Select placeholder="选择要修改密码的用户（默认为自己）" allowClear>
                    {users.map(u => (
                      <Option key={u.id} value={u.id}>
                        {u.username} ({u.role === 'BOSS' ? '老板' : '管理员'})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              <Form.Item
                label="当前密码"
                name="oldPassword"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请输入当前密码" 
                />
              </Form.Item>

              <Form.Item
                label="新密码"
                name="newPassword"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 8, message: '密码长度至少8位' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请输入新密码" 
                />
              </Form.Item>

              <Form.Item
                label="确认新密码"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'))
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请确认新密码" 
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {user?.role === 'BOSS' && (
          <Col xs={24}>
            <Card title="用户管理" size="small">
              <Table
                columns={userColumns}
                dataSource={users}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        )}

        <Col xs={24}>
          <Card title="系统信息" size="small">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div>
                  <Text strong>系统名称</Text>
                  <br />
                  <Text>WMS 仓库管理系统</Text>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text strong>版本</Text>
                  <br />
                  <Text>1.0.0</Text>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text strong>技术栈</Text>
                  <br />
                  <Text>React + Node.js + SQLite</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Settings