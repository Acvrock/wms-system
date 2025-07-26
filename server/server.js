const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Initialize database first
const db = require('./models/database');

const authRoutes = require('./routes/auth');
const componentRoutes = require('./routes/components');
const bundleRoutes = require('./routes/bundles');
const inventoryRoutes = require('./routes/inventory');
const restockRoutes = require('./routes/restock');
const outboundRoutes = require('./routes/outbound');

const app = express();
const DEFAULT_PORT = 3000;
let PORT = process.env.PORT || DEFAULT_PORT;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (!fs.existsSync('./server/uploads')) {
  fs.mkdirSync('./server/uploads', { recursive: true });
}

// Database ready middleware
app.use(async (req, res, next) => {
  try {
    await db.waitForReady();
    next();
  } catch (error) {
    console.error('Database not ready:', error);
    res.status(503).json({ error: 'Database not ready' });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/restock', restockRoutes);
app.use('/api/outbound', outboundRoutes);

if (fs.existsSync(path.join(__dirname, 'public'))) {
  app.use(express.static(path.join(__dirname, 'public')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'WMS System API Server Running. Please build the client first.' });
  });
}

// 端口检查和自动切换功能
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`WMS System running on http://localhost:${port}`);
    console.log(`访问地址: http://localhost:${port}`);
    console.log(`默认账户: boss/123456aa 或 manager/123456aa`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`端口 ${port} 被占用，尝试端口 ${port + 1}...`);
      if (port < DEFAULT_PORT + 10) { // 最多尝试10个端口
        startServer(port + 1);
      } else {
        console.error('无法找到可用端口，请手动释放端口或重启电脑');
        process.exit(1);
      }
    } else {
      console.error('服务器启动失败:', err);
      process.exit(1);
    }
  });
  
  // 优雅关闭
  process.on('SIGTERM', () => {
    console.log('收到关闭信号，正在关闭服务器...');
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('\n收到 Ctrl+C，正在关闭服务器...');
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
  });
};

startServer(PORT);