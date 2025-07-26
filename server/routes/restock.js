const express = require('express');
const RestockPlan = require('../models/RestockPlan');
const { authenticateToken, hidePrice, filterPriceData } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const plans = RestockPlan.getAll();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticateToken, hidePrice, (req, res) => {
  try {
    const plan = RestockPlan.getById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Restock plan not found' });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, description, bundles } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const planData = {
      name,
      description: description || '',
      bundles: bundles || []
    };

    const plan = RestockPlan.create(planData);
    res.status(201).json(plan);
  } catch (error) {
    console.error('RestockPlan creation error:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { name, description, bundles } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const planData = {
      name,
      description: description || '',
      bundles: bundles || []
    };

    const plan = RestockPlan.update(req.params.id, planData);
    res.json(plan);
  } catch (error) {
    console.error('RestockPlan update error:', error.message || error);
    console.error('Error stack:', error.stack || 'No stack trace');
    console.error('Error object:', error);
    console.error('Request body:', req.body);
    console.error('Plan ID:', req.params.id);
    res.status(error.status || 500).json({ error: error.message || error.toString() || 'Unknown error' });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    RestockPlan.delete(req.params.id);
    res.json({ message: 'Restock plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/validate', authenticateToken, hidePrice, (req, res) => {
  try {
    const validation = RestockPlan.validateInventory(req.params.id);
    
    validation.requirements = filterPriceData(validation.requirements, res.hidePrice);
    validation.shortages = filterPriceData(validation.shortages, res.hidePrice);
    
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/pack', authenticateToken, (req, res) => {
  try {
    const result = RestockPlan.packPlan(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;