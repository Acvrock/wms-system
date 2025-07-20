#!/bin/bash

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "=========================================="
echo "   WMS仓库管理系统 - Linux/Mac启动脚本"
echo "=========================================="
echo -e "${NC}"

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: 未检测到Node.js${NC}"
    echo "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

# 显示Node.js版本
echo -e "${GREEN}📍 Node.js版本:${NC}"
node --version

# 检查npm是否可用
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ 错误: npm不可用${NC}"
    exit 1
fi

echo -e "${GREEN}📦 npm版本:${NC}"
npm --version

# 创建必要目录
if [ ! -d "data" ]; then
    echo -e "${YELLOW}📁 创建data目录...${NC}"
    mkdir -p data
fi

if [ ! -d "uploads" ]; then
    echo -e "${YELLOW}📁 创建uploads目录...${NC}"
    mkdir -p uploads
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 正在安装依赖包...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 依赖安装失败${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ 环境检查完成${NC}"
echo
echo -e "${BLUE}🚀 启动WMS系统...${NC}"
echo -e "${GREEN}📱 访问地址: http://localhost:3000${NC}"
echo -e "${GREEN}👤 默认账号: boss/admin 密码: admin123${NC}"
echo
echo -e "${YELLOW}按 Ctrl+C 停止服务器${NC}"
echo

# 启动服务器
node start.js