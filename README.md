# WMS 仓库管理系统

一个专为耳机配件电商设计的简单仓库管理系统，支持配件管理、套装组合、库存追踪和补货计划。

## 功能特性

### 核心功能
- **配件管理**: 创建、编辑配件信息，支持图片上传和价格管理
- **套装管理**: 创建套装并关联多个配件，支持复杂的产品组合
- **补货计划**: 智能库存验证，支持临时保存和正式打包两种状态
- **库存管理**: 实时库存概览、入库出库记录追踪
- **权限管理**: 角色分离，管理员无法查看价格信息

### 技术特点
- **离线运行**: 无需联网，本地SQLite数据库
- **角色权限**: BOSS和管理员两种角色，价格信息分级显示
- **状态管理**: 补货计划状态机，确保库存操作的原子性
- **响应式UI**: 基于Ant Design的现代化界面

## 快速开始

### Windows系统（推荐）

#### Method 1: Recommended Windows Setup
1. Double-click `install-windows.bat` (comprehensive first-time setup)
2. Double-click `RUN.bat` (to start server)
3. Access http://localhost:3000

#### Method 2: Quick Setup
1. Double-click `SETUP.bat` (first time only)
2. Double-click `RUN.bat` (to start server)
3. Access http://localhost:3000

#### Method 3: Smart Start
1. Double-click `start.bat` (auto-setup and start)
2. Access http://localhost:3000

#### Database Fix (if needed)
If you see "Cannot find module 'sql.js'" error:
- Double-click `fix-sqlite.bat` (reinstall dependencies)
- This will reinstall the pure JavaScript database library

#### Port Issues
- Double-click `kill-port.bat` to free port 3000
- System will auto-try ports 3001, 3002, etc.

#### 手动启动（备用方案）
如果启动脚本无法使用，请打开命令提示符手动执行：
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client
npm install

# 构建前端
npm run build
cd ..

# 启动系统
npm start
```

### 故障排除

如果遇到问题，请查看 `启动说明.txt` 文件，其中包含：
- 常见错误解决方案
- Node.js安装指导
- 端口冲突解决
- 权限问题处理

## 默认账户

- **老板账户**: `boss` / `123456aa`
- **管理员账户**: `manager` / `123456aa`

## 系统架构

### 后端 (Node.js + Express)
- **数据库**: sql.js (纯JavaScript SQLite数据库)
- **认证**: JWT token
- **文件上传**: Multer
- **API设计**: RESTful

### 前端 (React + Ant Design)
- **路由**: React Router
- **UI组件**: Ant Design
- **HTTP客户端**: Axios
- **构建工具**: Vite

### 核心业务逻辑

#### 补货计划状态机
```
创建计划 → 临时保存 → 打包中 → 验证库存 → 已打包 → 扣减库存
```

#### 权限控制
- **BOSS**: 完整访问权限，可查看所有价格信息
- **管理员**: 基础操作权限，价格信息显示为 `***`

## 部署要求

- Windows 10/11
- Node.js 16.0+
- 无需额外数据库安装

## 开发指南

### 项目结构
```
wms/
├── server/           # 后端代码
│   ├── models/       # 数据模型
│   ├── routes/       # API路由
│   ├── middleware/   # 中间件
│   └── uploads/      # 文件上传目录
├── client/           # 前端代码
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── utils/
└── start.bat         # Windows启动脚本
```

### 开发命令
```bash
npm run dev          # 开发模式
npm run build        # 构建生产版本
npm start           # 启动生产服务器
npm run install:all # 安装所有依赖
```

## 数据库模式

### 核心表结构
- `users` - 用户账户
- `components` - 配件信息
- `bundles` - 套装定义
- `bundle_components` - 套装配件关联
- `restock_plans` - 补货计划
- `restock_plan_bundles` - 补货计划套装关联
- `inbound_records` - 入库记录
- `outbound_records` - 出库记录

## 许可证

MIT License