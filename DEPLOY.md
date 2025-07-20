# 部署指南

## GitHub部署步骤

### 1. 创建GitHub仓库

1. 访问 [GitHub](https://github.com)
2. 点击右上角的 "+" 按钮，选择 "New repository"
3. 填写仓库信息：
   - Repository name: `wms-system`
   - Description: `WMS仓库管理系统 - 电商耳机套装产品仓库管理`
   - 选择 Public 或 Private
   - 不要勾选 "Initialize this repository with a README"
4. 点击 "Create repository"

### 2. 推送代码到GitHub

在项目目录下执行以下命令：

```bash
# 添加远程仓库（替换为你的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/wms-system.git

# 推送代码
git branch -M main
git push -u origin main
```

### 3. 设置仓库描述和标签

在GitHub仓库页面：
1. 点击右侧的齿轮图标 "Settings"
2. 在 "About" 部分添加：
   - Description: `WMS仓库管理系统 - 专为电商耳机套装产品设计的轻量级仓库管理系统`
   - Website: 如果部署到了在线环境，填写访问地址
   - Topics: `wms`, `warehouse-management`, `nodejs`, `express`, `inventory`, `ecommerce`

## Vercel部署步骤

### 1. 连接GitHub仓库

1. 访问 [Vercel](https://vercel.com)
2. 使用GitHub账号登录
3. 点击 "New Project"
4. 选择你的 `wms-system` 仓库
5. 点击 "Import"

### 2. 配置部署设置

- Framework Preset: 选择 "Other"
- Root Directory: 保持默认 `./`
- Build Command: 留空
- Output Directory: 留空
- Install Command: `npm install`

### 3. 环境变量设置

在 Vercel 项目设置中添加环境变量：
- `NODE_ENV`: `production`
- `JWT_SECRET`: `your_jwt_secret_key_here`

### 4. 部署

点击 "Deploy" 开始部署，几分钟后即可获得访问链接。

## 本地开发环境

### 快速启动

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/wms-system.git
cd wms-system

# 安装依赖
npm install

# 启动服务器
npm start
# 或使用启动脚本
./start.bat  # Windows
./start.sh   # Linux/Mac
```

### 开发模式

```bash
# 安装开发依赖
npm install --save-dev nodemon

# 启动开发模式（自动重启）
npm run dev
```

## 数据备份

### 备份数据文件

```bash
# 创建备份目录
mkdir backup

# 备份数据文件
cp -r data/ backup/data_$(date +%Y%m%d_%H%M%S)/

# 备份上传文件
cp -r uploads/ backup/uploads_$(date +%Y%m%d_%H%M%S)/
```

### 恢复数据

```bash
# 恢复数据文件
cp -r backup/data_YYYYMMDD_HHMMSS/ data/

# 恢复上传文件
cp -r backup/uploads_YYYYMMDD_HHMMSS/ uploads/
```

## 常见问题

### Q: 端口被占用怎么办？
A: 修改 `server.js` 中的 PORT 变量，或设置环境变量 `PORT=4000`

### Q: 数据文件丢失怎么办？
A: 重启服务器会自动创建默认数据文件和用户账号

### Q: 忘记登录密码怎么办？
A: 删除 `data/users.json` 文件，重启服务器会重新创建默认账号

### Q: 如何修改默认账号？
A: 修改 `server.js` 中的 `initializeData()` 函数

## 技术支持

如遇到问题，请：
1. 查看控制台错误信息
2. 检查 `data/` 目录权限
3. 确认 Node.js 版本 >= 14.0
4. 在GitHub仓库提交Issue