import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, message } from 'antd'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Components from './pages/Components'
import Bundles from './pages/Bundles'
import RestockPlans from './pages/RestockPlans'
import Inventory from './pages/Inventory'
import Settings from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import { getToken, removeToken } from './utils/auth'
import api from './services/api'

const { Content } = Layout

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/profile')
      setUser(response.data.user)
    } catch (error) {
      // console.error('Auth check failed:', error)
      removeToken()
      message.error('登录已过期，请重新登录')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    removeToken()
    setUser(null)
    message.success('已退出登录')
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Layout>
      <Header user={user} onLogout={handleLogout} />
      <Layout>
        <Sidebar />
        <Layout>
          <Content style={{ margin: 0 }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/components" 
                element={
                  <ProtectedRoute>
                    <Components />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/bundles" 
                element={
                  <ProtectedRoute>
                    <Bundles />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/restock" 
                element={
                  <ProtectedRoute>
                    <RestockPlans />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/inventory" 
                element={
                  <ProtectedRoute>
                    <Inventory />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default App