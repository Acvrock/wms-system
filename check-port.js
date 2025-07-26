const net = require('net');

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // 端口可用
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false); // 端口被占用
    });
  });
}

async function findAvailablePort(startPort = 3000) {
  console.log('检查端口可用性...');
  
  for (let port = startPort; port <= startPort + 10; port++) {
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      console.log(`找到可用端口: ${port}`);
      return port;
    } else {
      console.log(`端口 ${port} 被占用`);
    }
  }
  
  console.log('未找到可用端口');
  return null;
}

// 如果直接运行此文件
if (require.main === module) {
  findAvailablePort().then(port => {
    if (port) {
      console.log(`推荐使用端口: ${port}`);
      console.log(`设置环境变量: set PORT=${port}`);
    } else {
      console.log('请关闭占用端口的程序或重启电脑');
    }
  });
}

module.exports = { checkPort, findAvailablePort };