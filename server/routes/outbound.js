const express = require('express');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/component/:componentId', authenticateToken, (req, res) => {
  try {
    const { componentId } = req.params;
    
    const stmt = db.prepare(`
      SELECT 
        o.*,
        c.name as component_name,
        rp.name as restock_plan_name,
        rp.status as restock_plan_status,
        CASE 
          WHEN o.restock_plan_id IS NOT NULL THEN 'Restock Plan'
          ELSE 'Manual Outbound'
        END as outbound_type
      FROM outbound_records o
      JOIN components c ON o.component_id = c.id
      LEFT JOIN restock_plans rp ON o.restock_plan_id = rp.id
      WHERE o.component_id = ?
      ORDER BY o.created_at DESC
    `);
    const records = stmt.all(componentId);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/restock-plan/:planId', authenticateToken, (req, res) => {
  try {
    const { planId } = req.params;
    
    const stmt = db.prepare(`
      SELECT 
        o.*,
        c.name as component_name,
        c.price as component_price,
        (o.quantity * c.price) as total_value
      FROM outbound_records o
      JOIN components c ON o.component_id = c.id
      WHERE o.restock_plan_id = ?
      ORDER BY c.name
    `);
    const records = stmt.all(planId);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/summary', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let sql = `
      SELECT 
        DATE(o.created_at) as date,
        o.reason,
        COUNT(*) as record_count,
        SUM(o.quantity) as total_quantity,
        SUM(o.quantity * c.price) as total_value
      FROM outbound_records o
      JOIN components c ON o.component_id = c.id
    `;
    
    let params = [];
    
    if (start_date && end_date) {
      sql += ' WHERE DATE(o.created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    sql += ' GROUP BY DATE(o.created_at), o.reason ORDER BY date DESC, o.reason';
    
    const stmt = db.prepare(sql);
    const summary = stmt.all(...params);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;