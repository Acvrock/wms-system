#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 检测环境
const isWindows = os.platform() === 'win32';
const isVercel = process.env.VERCEL || process.env.NOW_REGION;
const isDevelopment = process.env.NODE_ENV !== 'production';

console.log('🚀 WMS系统启动脚本');
console.log(`📍 操作系统: ${os.platform()}`);
console.log(`🌍 环境: ${isDevelopment ? '开发环境' : '生产环境'}`);
console.log(`☁️  Vercel环境: ${isVercel ? '是' : '否'}`);

// 检查必要的目录和文件
function checkEnvironment() {
  console.log('\n🔍 检查环境...');
  
  // 检查data目录
  if (!fs.existsSync('./data')) {
    console.log('📁 创建data目录...');
    fs.mkdirSync('./data', { recursive: true });
  }
  
  // 检查uploads目录
  if (!fs.existsSync('./uploads')) {
    console.log('📁 创建uploads目录...');
    fs.mkdirSync('./uploads', { recursive: true });
  }
  
  // 检查package.json
  if (!fs.existsSync('./package.json')) {
    console.error('❌ 未找到package.json文件');
    process.exit(1);
  }
  
  // 检查node_modules
  if (!fs.existsSync('./node_modules')) {
    console.log('📦 未找到node_modules，正在安装依赖...');
    return installDependencies();
  }
  
  console.log('✅ 环境检查完成');
  return Promise.resolve();
}

// 安装依赖
function installDependencies() {
  return new Promise((resolve, reject) => {
    console.log('📦 正在安装依赖包...');
    
    const npmCommand = isWindows ? 'npm.cmd' : 'npm';
    const installProcess = spawn(npmCommand, ['install'], {
      stdio: 'inherit',
      shell: isWindows
    });
    
    installProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 依赖安装完成');
        resolve();
      } else {
        console.error('❌ 依赖安装失败');
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
    
    installProcess.on('error', (error) => {
      console.error('❌ 启动npm失败:', error.message);
      reject(error);
    });
  });
}

// 启动服务器
function startServer() {
  console.log('\n🚀 启动WMS服务器...');
  
  const nodeCommand = 'node';
  const serverProcess = spawn(nodeCommand, ['server.js'], {
    stdio: 'inherit',
    shell: isWindows,
    env: {
      ...process.env,
      NODE_ENV: isDevelopment ? 'development' : 'production',
      PORT: process.env.PORT || 3000
    }
  });
  
  serverProcess.on('close', (code) => {
    console.log(`\n🛑 服务器已停止 (退出码: ${code})`);
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ 启动服务器失败:', error.message);
    process.exit(1);
  });
  
  // 处理进程信号
  process.on('SIGINT', () => {
    console.log('\n🛑 收到停止信号，正在关闭服务器...');
    serverProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 收到终止信号，正在关闭服务器...');
    serverProcess.kill('SIGTERM');
  });
}

// 主函数
async function main() {
  try {
    await checkEnvironment();
    
    // 如果是Vercel环境，直接require server.js
    if (isVercel) {
      console.log('☁️  在Vercel环境中运行');
      require('./server.js');
    } else {
      startServer();
    }
  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main();