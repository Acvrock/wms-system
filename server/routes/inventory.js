const express = require('express');
const db = require('../models/database');
const Component = require('../models/Component');
const { authenticateToken, hidePrice, filterPriceData } = require('../middleware/auth');

const router = express.Router();

router.post('/inbound', authenticateToken, (req, res) => {
  try {
    const { component_id, quantity, note } = req.body;

    if (!component_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Component ID and valid quantity are required' });
    }

    const component = Component.getById(component_id);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const transaction = db.transaction(() => {
      const insertStmt = db.prepare('INSERT INTO inbound_records (component_id, quantity, note) VALUES (?, ?, ?)');
      const result = insertStmt.run(component_id, quantity, note || '');
      const recordId = result.lastInsertRowid;
      
      const updateStmt = db.prepare('UPDATE components SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      updateStmt.run(quantity, component_id);
      
      return {
        id: recordId,
        component_id,
        quantity,
        note,
        created_at: new Date().toISOString()
      };
    });

    const result = transaction();
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/inbound', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT ir.*, c.name as component_name
      FROM inbound_records ir
      JOIN components c ON ir.component_id = c.id
      ORDER BY ir.created_at DESC
    `);
    const records = stmt.all();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/outbound', authenticateToken, (req, res) => {
  try {
    const { component_id, quantity, reason, description } = req.body;

    if (!component_id || !quantity || quantity <= 0 || !reason) {
      return res.status(400).json({ error: 'Component ID, valid quantity, and reason are required' });
    }

    const component = Component.getById(component_id);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    if (component.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const transaction = db.transaction(() => {
      const insertStmt = db.prepare('INSERT INTO outbound_records (component_id, quantity, reason, description) VALUES (?, ?, ?, ?)');
      const result = insertStmt.run(component_id, quantity, reason, description || '');
      const recordId = result.lastInsertRowid;
      
      const updateStmt = db.prepare('UPDATE components SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      updateStmt.run(quantity, component_id);
      
      return {
        id: recordId,
        component_id,
        quantity,
        reason,
        description,
        created_at: new Date().toISOString()
      };
    });

    const result = transaction();
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/outbound', authenticateToken, (req, res) => {
  try {
    const { component_id } = req.query;
    
    let sql = `
      SELECT o.*, c.name as component_name, rp.name as restock_plan_name
      FROM outbound_records o
      JOIN components c ON o.component_id = c.id
      LEFT JOIN restock_plans rp ON o.restock_plan_id = rp.id
    `;
    
    let params = [];
    
    if (component_id) {
      sql += ' WHERE o.component_id = ?';
      params.push(component_id);
    }
    
    sql += ' ORDER BY o.created_at DESC';
    
    const stmt = db.prepare(sql);
    const records = stmt.all(...params);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/stock-overview', authenticateToken, hidePrice, (req, res) => {
  try {
    const summary = Component.getStockSummary();
    const filteredSummary = filterPriceData(summary, res.hidePrice);
    res.json(filteredSummary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;