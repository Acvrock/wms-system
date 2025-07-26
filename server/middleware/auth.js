const jwt = require('jsonwebtoken');
const db = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'wms-secret-key-2024-default-change-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

const hidePrice = (req, res, next) => {
  if (req.user && req.user.role === 'MANAGER') {
    res.hidePrice = true;
  }
  next();
};

const filterPriceData = (data, shouldHide) => {
  if (!shouldHide) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      price: (item.price !== undefined && item.price !== null) ? '***' : item.price,
      total_value: (item.total_value !== undefined && item.total_value !== null) ? '***' : item.total_value,
      total_price: (item.total_price !== undefined && item.total_price !== null) ? '***' : item.total_price
    }));
  } else if (data && typeof data === 'object') {
    return {
      ...data,
      price: (data.price !== undefined && data.price !== null) ? '***' : data.price,
      total_value: (data.total_value !== undefined && data.total_value !== null) ? '***' : data.total_value,
      total_price: (data.total_price !== undefined && data.total_price !== null) ? '***' : data.total_price
    };
  }
  
  return data;
};

const requireBossRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'BOSS') {
    return res.status(403).json({ error: 'Only BOSS can perform this operation' });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  hidePrice,
  filterPriceData,
  requireBossRole,
  JWT_SECRET
};