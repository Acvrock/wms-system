const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Bundle = require('../models/Bundle');
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
    cb(null, 'bundle-' + uniqueSuffix + path.extname(file.originalname));
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

router.get('/', authenticateToken, (req, res) => {
  try {
    const bundles = Bundle.getAll();
    res.json(bundles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticateToken, hidePrice, (req, res) => {
  try {
    const bundle = Bundle.getById(req.params.id);
    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }
    
    if (bundle.components) {
      bundle.components = filterPriceData(bundle.components, res.hidePrice);
    }
    
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateToken, requireBossRole, upload.single('image'), (req, res) => {
  try {
    const { name, description, components } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    let parsedComponents = [];
    if (components) {
      try {
        parsedComponents = typeof components === 'string' ? JSON.parse(components) : components;
      } catch (e) {
        return res.status(400).json({ error: 'Invalid components format' });
      }
    }

    const bundleData = {
      name,
      description: description || '',
      image_url,
      components: parsedComponents
    };

    const bundle = Bundle.create(bundleData);
    res.status(201).json(bundle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticateToken, requireBossRole, upload.single('image'), (req, res) => {
  try {
    const { name, description, components } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const existingBundle = Bundle.getById(req.params.id);
    if (!existingBundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    let image_url = existingBundle.image_url;
    if (req.file) {
      if (existingBundle.image_url) {
        const oldImagePath = path.join(__dirname, '..', existingBundle.image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      image_url = `/uploads/${req.file.filename}`;
    }

    let parsedComponents = [];
    if (components) {
      try {
        parsedComponents = typeof components === 'string' ? JSON.parse(components) : components;
      } catch (e) {
        return res.status(400).json({ error: 'Invalid components format' });
      }
    }

    const bundleData = {
      name,
      description: description || '',
      image_url,
      components: parsedComponents
    };

    const bundle = Bundle.update(req.params.id, bundleData);
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticateToken, requireBossRole, (req, res) => {
  try {
    const bundle = Bundle.getById(req.params.id);
    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    if (bundle.image_url) {
      const imagePath = path.join(__dirname, '..', bundle.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    Bundle.delete(req.params.id);
    res.json({ message: 'Bundle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/requirements/:quantity', authenticateToken, hidePrice, (req, res) => {
  try {
    const { id, quantity } = req.params;
    
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const requirements = Bundle.getComponentRequirements(id, parseInt(quantity));
    const filteredRequirements = filterPriceData(requirements, res.hidePrice);
    res.json(filteredRequirements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;