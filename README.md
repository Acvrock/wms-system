# WMS仓库管理系统

一个专为电商耳机套装产品设计的仓库管理系统，支持配件管理、套装组合、补货计划、库存管理等功能。

## 功能特性

## 提示词
```
AI Agent开发一套【WMS系统】需求：

背景：
我在某电商平台销售有线入耳式耳机套装产品，套装中除了一款有线耳机外，还会额外搭配例如 附赠耳机线、解码耳放、耳机收纳盒、TYPE-C至3.5mm适配器 等等多种配件。
现在的难点是，随着配件的多元化、套装多样化，依靠一份EXCEL表格已经很难管理这些配件，我需要一个简单的WMS系统，来提升管理和感知仓库已有配件的种类和数量，以及 评估仍需采购数量、记录配件出库去处（用于哪款套装、丢弃了检查出的不良品 等）

一、功能
新建配件
新建套装
预估补货
新增入库
库存出库
库存概览

二、功能详细介绍
1、新建配件
可以新建【配件】，参数包括【图片】【价格】【名称】【描述】
2、新建套装
可以新建【套装】，参数包括【图片】【名称】【描述】；并且可以关联多个【配件】
3、预估补货
可以新建【补货计划】，参数包括【名称】【描述】，隐性参数【创建时间】；并且可以关联多个【套装】，和设置各个【套装】的数量；创建中和创建后都可以统计和查看该【补货计划】下所有【套装】中的所有同款【配件】的数量和总价。
【补货计划】有一个是否已打包状态【未打包/已打包】，该状态是是依靠一个开关按钮来改变，创建后默认为【未打包】，开关打开后就变成【已打包】
4、新增入库
可以新增某个【配件】的入库数量
5、库存出库
1）可以列出每件【配件】的出库记录，也就是关联到【已打包】的【补货计划】，例如【补货计划】A中包含100件【配件】甲，那么【补货计划】A的是否打包状态变成【已打包】后，【配件】甲就数量-100
2）也可以新建一条出库记录，参数【原因】【数量】【详细描述】，这个功能主要用于盘整，针对像丢货、发现和丢弃不良品等情况
6、库存概览
可以查看现有各个【配件】的当前库存

三、角色权限
分 BOSS、管理员 2种角色/账号，管理员 无法查看到【配件】的价格（包括 补货计划、库存出库 中的配件的价格，总之就是价格就显示***）
```


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