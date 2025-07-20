# WMS仓库管理系统

一个专为电商耳机套装产品设计的仓库管理系统，支持配件管理、套装组合、补货计划、库存管理等功能。

## 功能特性

### 🎯 核心功能
- **配件管理** - 新建配件，支持图片、价格、描述等信息
- **套装管理** - 创建套装，关联多个配件及数量
- **补货计划** - 制定补货计划，统计所需配件和总价
- **库存管理** - 入库出库记录，库存实时更新
- **库存概览** - 全面的库存统计和价值分析

### 👥 权限管理
- **BOSS角色** - 可查看所有信息包括价格
- **管理员角色** - 价格信息显示为***，其他功能正常

### 📱 技术特点
- 响应式设计，支持移动端访问
- 基于Node.js + Express后端
- 使用JSON文件存储数据，轻量级部署
- Bootstrap UI框架，界面美观易用
- 支持图片上传和管理

## 快速开始

### 环境要求
- Node.js 14.0 或更高版本
- npm 6.0 或更高版本

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/wms-system.git
cd wms-system
```

2. **安装依赖**
```bash
npm install
```

3. **启动系统**

**Windows用户:**
```bash
# 英文版启动脚本
start.bat

# 中文版启动脚本  
start-cn.bat
```

**Linux/Mac用户:**
```bash
chmod +x start.sh
./start.sh
```

**或直接使用Node.js:**
```bash
node server.js
```

4. **访问系统**
- 打开浏览器访问: http://localhost:3000
- BOSS账号: `boss` / `admin123`
- 管理员账号: `admin` / `admin123`

## 项目结构

```
wms-system/
├── data/                   # 数据文件目录
│   ├── users.json         # 用户数据
│   ├── components.json    # 配件数据
│   ├── packages.json      # 套装数据
│   └── ...
├── public/                # 前端静态文件
│   ├── index.html        # 主页面
│   └── app.js            # 前端逻辑
├── uploads/              # 图片上传目录
├── server.js             # 服务器主文件
├── start.js              # 启动脚本
├── start.bat             # Windows启动脚本
├── start.sh              # Linux/Mac启动脚本
└── package.json          # 项目配置
```

## API接口

### 认证接口
- `POST /api/login` - 用户登录

### 配件管理
- `GET /api/components` - 获取配件列表
- `POST /api/components` - 新建配件

### 套装管理
- `GET /api/packages` - 获取套装列表
- `POST /api/packages` - 新建套装

### 补货计划
- `GET /api/restock-plans` - 获取补货计划列表
- `POST /api/restock-plans` - 新建补货计划
- `PATCH /api/restock-plans/:id/toggle-pack` - 切换打包状态

### 库存管理
- `POST /api/inbound` - 新增入库
- `POST /api/outbound` - 新增出库
- `GET /api/outbound/:componentId` - 获取出库记录
- `GET /api/inventory-overview` - 库存概览

## 部署说明

### 本地部署
直接运行启动脚本即可，系统会自动创建必要的目录和数据文件。

### 云端部署
项目已配置Vercel部署支持，可直接部署到Vercel平台。

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署到Vercel
vercel
```

## 开发说明

### 数据存储
系统使用JSON文件存储数据，所有数据文件位于`data/`目录下：
- 轻量级，无需数据库
- 易于备份和迁移
- 适合中小型应用

### 文件上传
图片文件上传到`uploads/`目录，支持常见图片格式。

### 权限控制
通过JWT token进行身份验证，根据用户角色控制数据访问权限。

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件至: [your-email@example.com]

## 更新日志

### v1.0.0 (2024-07-20)
- 初始版本发布
- 实现基础的WMS功能
- 支持配件、套装、补货计划管理
- 完整的权限控制系统