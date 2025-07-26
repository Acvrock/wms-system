const db = require('./database');

class Component {
  static getAll() {
    try {
      const stmt = db.prepare('SELECT * FROM components ORDER BY created_at DESC');
      return stmt.all();
    } catch (err) {
      throw err;
    }
  }

  static getById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM components WHERE id = ?');
      return stmt.get(id);
    } catch (err) {
      throw err;
    }
  }

  static create(data) {
    try {
      const { name, description, price, image_url } = data;
      const stmt = db.prepare('INSERT INTO components (name, description, price, image_url) VALUES (?, ?, ?, ?)');
      const result = stmt.run(name, description, price, image_url);
      return { id: result.lastInsertRowid, ...data };
    } catch (err) {
      throw err;
    }
  }

  static update(id, data) {
    try {
      const { name, description, price, image_url } = data;
      const stmt = db.prepare('UPDATE components SET name = ?, description = ?, price = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const result = stmt.run(name, description, price, image_url, id);
      if (result.changes === 0) throw new Error('Component not found');
      return { id, ...data };
    } catch (err) {
      throw err;
    }
  }

  static delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM components WHERE id = ?');
      const result = stmt.run(id);
      if (result.changes === 0) throw new Error('Component not found');
      return { deleted: true };
    } catch (err) {
      throw err;
    }
  }

  static updateStock(id, quantity) {
    try {
      const stmt = db.prepare('UPDATE components SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const result = stmt.run(quantity, id);
      if (result.changes === 0) throw new Error('Component not found');
      return { updated: true };
    } catch (err) {
      throw err;
    }
  }

  static getStockSummary() {
    try {
      const stmt = db.prepare('SELECT id, name, stock_quantity, price, (stock_quantity * price) as total_value FROM components');
      return stmt.all();
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Component;