const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Component = require('../models/Component');
const { authenticateToken, hidePrice, filterPriceData, requireBossRole } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './server/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'component-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

router.get('/', authenticateToken, hidePrice, (req, res) => {
  try {
    const components = Component.getAll();
    const filteredComponents = filterPriceData(components, res.hidePrice);
    res.json(filteredComponents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticateToken, hidePrice, (req, res) => {
  try {
    const component = Component.getById(req.params.id);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    const filteredComponent = filterPriceData(component, res.hidePrice);
    res.json(filteredComponent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateToken, requireBossRole, upload.single('image'), (req, res) => {
  try {
    const { name, description, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const componentData = {
      name,
      description: description || '',
      price: parseFloat(price),
      image_url
    };

    const component = Component.create(componentData);
    res.status(201).json(component);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticateToken, requireBossRole, upload.single('image'), (req, res) => {
  try {
    const { name, description, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const existingComponent = Component.getById(req.params.id);
    if (!existingComponent) {
      return res.status(404).json({ error: 'Component not found' });
    }

    let image_url = existingComponent.image_url;
    if (req.file) {
      if (existingComponent.image_url) {
        const oldImagePath = path.join(__dirname, '..', existingComponent.image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      image_url = `/uploads/${req.file.filename}`;
    }

    const componentData = {
      name,
      description: description || '',
      price: parseFloat(price),
      image_url
    };

    const component = Component.update(req.params.id, componentData);
    res.json(component);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticateToken, requireBossRole, (req, res) => {
  try {
    const component = Component.getById(req.params.id);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    if (component.image_url) {
      const imagePath = path.join(__dirname, '..', component.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    Component.delete(req.params.id);
    res.json({ message: 'Component deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;