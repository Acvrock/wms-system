const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'wms_secret_key_2024';

// 数据文件路径
const DATA_DIR = './data';
const DATA_FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  components: path.join(DATA_DIR, 'components.json'),
  packages: path.join(DATA_DIR, 'packages.json'),
  restockPlans: path.join(DATA_DIR, 'restock_plans.json'),
  inboundRecords: path.join(DATA_DIR, 'inbound_records.json'),
  outboundRecords: path.join(DATA_DIR, 'outbound_records.json')
};

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// 数据存储工具函数
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readData(filename) {
  try {
    if (fs.existsSync(filename)) {
      const data = fs.readFileSync(filename, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`读取文件失败 ${filename}:`, error);
    return [];
  }
}

function writeData(filename, data) {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`写入文件失败 ${filename}:`, error);
    return false;
  }
}

function getNextId(data) {
  return data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;
}

// 初始化数据
function initializeData() {
  ensureDataDir();
  
  // 初始化用户数据
  let users = readData(DATA_FILES.users);
  if (users.length === 0) {
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    users = [
      { id: 1, username: 'boss', password: defaultPassword, role: 'boss', created_at: new Date().toISOString() },
      { id: 2, username: 'admin', password: defaultPassword, role: 'admin', created_at: new Date().toISOString() }
    ];
    writeData(DATA_FILES.users, users);
  }
  
  // 初始化其他数据文件
  Object.values(DATA_FILES).forEach(file => {
    if (file !== DATA_FILES.users && !fs.existsSync(file)) {
      writeData(file, []);
    }
  });
}

// 身份验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '需要登录' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '无效的token' });
    }
    req.user = user;
    next();
  });
};

// 登录接口
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readData(DATA_FILES.users);
  
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  if (bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } else {
    res.status(401).json({ error: '用户名或密码错误' });
  }
});

// ==================== 配件管理 ====================

// 新建配件
app.post('/api/components', authenticateToken, upload.single('image'), (req, res) => {
  const { name, description, price } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  const components = readData(DATA_FILES.components);
  const newComponent = {
    id: getNextId(components),
    name,
    description,
    price: parseFloat(price),
    image_url,
    stock_quantity: 0,
    created_at: new Date().toISOString()
  };
  
  components.push(newComponent);
  
  if (writeData(DATA_FILES.components, components)) {
    res.json({ id: newComponent.id, message: '配件创建成功' });
  } else {
    res.status(500).json({ error: '创建配件失败' });
  }
});

// 获取配件列表
app.get('/api/components', authenticateToken, (req, res) => {
  const hidePrice = req.user.role === 'admin';
  let components = readData(DATA_FILES.components);
  
  if (hidePrice) {
    components = components.map(comp => ({ ...comp, price: '***' }));
  }
  
  res.json(components.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

// ==================== 套装管理 ====================

// 新建套装
app.post('/api/packages', authenticateToken, upload.single('image'), (req, res) => {
  const { name, description, components } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const componentList = JSON.parse(components || '[]');
  
  const packages = readData(DATA_FILES.packages);
  const newPackage = {
    id: getNextId(packages),
    name,
    description,
    image_url,
    components: componentList,
    created_at: new Date().toISOString()
  };
  
  packages.push(newPackage);
  
  if (writeData(DATA_FILES.packages, packages)) {
    res.json({ id: newPackage.id, message: '套装创建成功' });
  } else {
    res.status(500).json({ error: '创建套装失败' });
  }
});

// 获取套装列表
app.get('/api/packages', authenticateToken, (req, res) => {
  const packages = readData(DATA_FILES.packages);
  const components = readData(DATA_FILES.components);
  
  const packagesWithComponents = packages.map(pkg => {
    const componentList = pkg.components.map(comp => {
      const component = components.find(c => c.id === comp.component_id);
      return component ? `${component.name} x${comp.quantity}` : '';
    }).filter(Boolean).join(', ');
    
    return {
      ...pkg,
      component_list: componentList
    };
  });
  
  res.json(packagesWithComponents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

// ==================== 补货计划管理 ====================

// 新建补货计划
app.post('/api/restock-plans', authenticateToken, (req, res) => {
  const { name, description, packages } = req.body;
  const packageList = JSON.parse(packages || '[]');
  
  const restockPlans = readData(DATA_FILES.restockPlans);
  const newPlan = {
    id: getNextId(restockPlans),
    name,
    description,
    packages: packageList,
    is_packed: false,
    created_at: new Date().toISOString()
  };
  
  restockPlans.push(newPlan);
  
  if (writeData(DATA_FILES.restockPlans, restockPlans)) {
    res.json({ id: newPlan.id, message: '补货计划创建成功' });
  } else {
    res.status(500).json({ error: '创建补货计划失败' });
  }
});

// 获取补货计划列表
app.get('/api/restock-plans', authenticateToken, (req, res) => {
  const hidePrice = req.user.role === 'admin';
  const restockPlans = readData(DATA_FILES.restockPlans);
  const packages = readData(DATA_FILES.packages);
  const components = readData(DATA_FILES.components);
  
  const plansWithStats = restockPlans.map(plan => {
    // 计算套装列表
    const packageList = plan.packages.map(planPkg => {
      const pkg = packages.find(p => p.id === planPkg.package_id);
      return pkg ? `${pkg.name} x${planPkg.quantity}` : '';
    }).filter(Boolean).join(', ');
    
    // 计算配件统计
    const componentStats = {};
    plan.packages.forEach(planPkg => {
      const pkg = packages.find(p => p.id === planPkg.package_id);
      if (pkg) {
        pkg.components.forEach(pkgComp => {
          const component = components.find(c => c.id === pkgComp.component_id);
          if (component) {
            const key = component.id;
            if (!componentStats[key]) {
              componentStats[key] = {
                id: component.id,
                name: component.name,
                price: component.price,
                total_quantity: 0
              };
            }
            componentStats[key].total_quantity += pkgComp.quantity * planPkg.quantity;
          }
        });
      }
    });
    
    const statsArray = Object.values(componentStats);
    const totalPrice = statsArray.reduce((sum, item) => sum + (item.price * item.total_quantity), 0);
    
    return {
      ...plan,
      package_list: packageList,
      component_stats: hidePrice ? 
        statsArray.map(s => ({ ...s, price: '***' })) : statsArray,
      total_price: hidePrice ? '***' : totalPrice.toFixed(2)
    };
  });
  
  res.json(plansWithStats.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

// 切换补货计划打包状态
app.patch('/api/restock-plans/:id/toggle-pack', authenticateToken, (req, res) => {
  const planId = parseInt(req.params.id);
  const restockPlans = readData(DATA_FILES.restockPlans);
  const components = readData(DATA_FILES.components);
  const packages = readData(DATA_FILES.packages);
  
  const planIndex = restockPlans.findIndex(p => p.id === planId);
  if (planIndex === -1) {
    return res.status(404).json({ error: '补货计划不存在' });
  }
  
  const plan = restockPlans[planIndex];
  const newStatus = !plan.is_packed;
  
  // 如果从未打包变为已打包，需要减少库存并记录出库
  if (newStatus) {
    const outboundRecords = readData(DATA_FILES.outboundRecords);
    
    // 计算需要出库的配件
    const componentOutbound = {};
    plan.packages.forEach(planPkg => {
      const pkg = packages.find(p => p.id === planPkg.package_id);
      if (pkg) {
        pkg.components.forEach(pkgComp => {
          const key = pkgComp.component_id;
          if (!componentOutbound[key]) {
            componentOutbound[key] = 0;
          }
          componentOutbound[key] += pkgComp.quantity * planPkg.quantity;
        });
      }
    });
    
    // 更新库存并记录出库
    Object.entries(componentOutbound).forEach(([componentId, quantity]) => {
      const compIndex = components.findIndex(c => c.id === parseInt(componentId));
      if (compIndex !== -1) {
        components[compIndex].stock_quantity -= quantity;
        
        // 记录出库
        outboundRecords.push({
          id: getNextId(outboundRecords),
          component_id: parseInt(componentId),
          quantity,
          reason: '补货计划出库',
          description: `补货计划: ${plan.name}`,
          restock_plan_id: planId,
          created_at: new Date().toISOString()
        });
      }
    });
    
    writeData(DATA_FILES.components, components);
    writeData(DATA_FILES.outboundRecords, outboundRecords);
  }
  
  restockPlans[planIndex].is_packed = newStatus;
  
  if (writeData(DATA_FILES.restockPlans, restockPlans)) {
    res.json({ message: '状态更新成功', is_packed: newStatus });
  } else {
    res.status(500).json({ error: '更新状态失败' });
  }
});

// ==================== 库存管理 ====================

// 新增入库
app.post('/api/inbound', authenticateToken, (req, res) => {
  const { component_id, quantity } = req.body;
  const components = readData(DATA_FILES.components);
  const inboundRecords = readData(DATA_FILES.inboundRecords);
  
  const compIndex = components.findIndex(c => c.id === component_id);
  if (compIndex === -1) {
    return res.status(404).json({ error: '配件不存在' });
  }
  
  // 增加库存
  components[compIndex].stock_quantity += quantity;
  
  // 记录入库
  inboundRecords.push({
    id: getNextId(inboundRecords),
    component_id,
    quantity,
    created_at: new Date().toISOString()
  });
  
  if (writeData(DATA_FILES.components, components) && writeData(DATA_FILES.inboundRecords, inboundRecords)) {
    res.json({ message: '入库成功' });
  } else {
    res.status(500).json({ error: '入库失败' });
  }
});

// 新增出库记录
app.post('/api/outbound', authenticateToken, (req, res) => {
  const { component_id, quantity, reason, description } = req.body;
  const components = readData(DATA_FILES.components);
  const outboundRecords = readData(DATA_FILES.outboundRecords);
  
  const compIndex = components.findIndex(c => c.id === component_id);
  if (compIndex === -1) {
    return res.status(404).json({ error: '配件不存在' });
  }
  
  // 减少库存
  components[compIndex].stock_quantity -= quantity;
  
  // 记录出库
  outboundRecords.push({
    id: getNextId(outboundRecords),
    component_id,
    quantity,
    reason,
    description,
    restock_plan_id: null,
    created_at: new Date().toISOString()
  });
  
  if (writeData(DATA_FILES.components, components) && writeData(DATA_FILES.outboundRecords, outboundRecords)) {
    res.json({ message: '出库成功' });
  } else {
    res.status(500).json({ error: '出库失败' });
  }
});

// 获取出库记录
app.get('/api/outbound/:componentId', authenticateToken, (req, res) => {
  const componentId = parseInt(req.params.componentId);
  const outboundRecords = readData(DATA_FILES.outboundRecords);
  const components = readData(DATA_FILES.components);
  const restockPlans = readData(DATA_FILES.restockPlans);
  
  const records = outboundRecords
    .filter(record => record.component_id === componentId)
    .map(record => {
      const component = components.find(c => c.id === record.component_id);
      const restockPlan = record.restock_plan_id ? 
        restockPlans.find(p => p.id === record.restock_plan_id) : null;
      
      return {
        ...record,
        component_name: component ? component.name : '未知配件',
        restock_plan_name: restockPlan ? restockPlan.name : null
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json(records);
});

// 库存概览
app.get('/api/inventory-overview', authenticateToken, (req, res) => {
  const hidePrice = req.user.role === 'admin';
  const components = readData(DATA_FILES.components);
  const inboundRecords = readData(DATA_FILES.inboundRecords);
  const outboundRecords = readData(DATA_FILES.outboundRecords);
  
  const inventory = components.map(component => {
    const totalInbound = inboundRecords
      .filter(record => record.component_id === component.id)
      .reduce((sum, record) => sum + record.quantity, 0);
    
    const totalOutbound = outboundRecords
      .filter(record => record.component_id === component.id)
      .reduce((sum, record) => sum + record.quantity, 0);
    
    return {
      ...component,
      price: hidePrice ? '***' : component.price,
      total_inbound: totalInbound,
      total_outbound: totalOutbound
    };
  });
  
  res.json(inventory.sort((a, b) => a.name.localeCompare(b.name)));
});

// 初始化数据并启动服务器
initializeData();

app.listen(PORT, () => {
  console.log(`WMS系统服务器运行在 http://localhost:${PORT}`);
  console.log('默认登录账号:');
  console.log('BOSS账号: boss /  ');
  console.log('管理员账号: admin /  ');
});