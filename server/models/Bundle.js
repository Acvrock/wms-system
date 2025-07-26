const db = require('./database');

class Bundle {
  static getAll() {
    try {
      const stmt = db.prepare(`
        SELECT b.*, 
               GROUP_CONCAT(c.name || ' x' || bc.quantity) as components_info
        FROM bundles b
        LEFT JOIN bundle_components bc ON b.id = bc.bundle_id
        LEFT JOIN components c ON bc.component_id = c.id
        GROUP BY b.id
        ORDER BY b.created_at DESC
      `);
      return stmt.all();
    } catch (err) {
      throw err;
    }
  }

  static getById(id) {
    try {
      const bundleStmt = db.prepare('SELECT * FROM bundles WHERE id = ?');
      const bundle = bundleStmt.get(id);
      
      if (!bundle) {
        return null;
      }

      const componentsStmt = db.prepare(`
        SELECT c.*, bc.quantity 
        FROM bundle_components bc
        JOIN components c ON bc.component_id = c.id
        WHERE bc.bundle_id = ?
      `);
      const components = componentsStmt.all(id);
      
      return { ...bundle, components };
    } catch (err) {
      throw err;
    }
  }

  static create(data) {
    try {
      const { name, description, image_url, components } = data;
      
      const bundleStmt = db.prepare('INSERT INTO bundles (name, description, image_url) VALUES (?, ?, ?)');
      const result = bundleStmt.run(name, description || '', image_url || null);
      const bundleId = result.lastInsertRowid;
      
      if (components && components.length > 0) {
        // For SQL.js, prepare a new statement for each component to avoid "Statement closed" error
        for (const comp of components) {
          const componentStmt = db.prepare('INSERT INTO bundle_components (bundle_id, component_id, quantity) VALUES (?, ?, ?)');
          componentStmt.run(bundleId, comp.component_id, comp.quantity);
        }
      }
      
      return { id: bundleId, ...data };
    } catch (err) {
      throw err;
    }
  }

  static update(id, data) {
    try {
      const { name, description, image_url, components } = data;
      
      const updateStmt = db.prepare('UPDATE bundles SET name = ?, description = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const result = updateStmt.run(name, description || '', image_url || null, id);
      
      if (result.changes === 0) {
        throw new Error('Bundle not found');
      }
      
      const deleteStmt = db.prepare('DELETE FROM bundle_components WHERE bundle_id = ?');
      deleteStmt.run(id);
      
      if (components && components.length > 0) {
        // For SQL.js, prepare a new statement for each component to avoid "Statement closed" error
        for (const comp of components) {
          const insertStmt = db.prepare('INSERT INTO bundle_components (bundle_id, component_id, quantity) VALUES (?, ?, ?)');
          insertStmt.run(id, comp.component_id, comp.quantity);
        }
      }
      
      return { id, ...data };
    } catch (err) {
      throw err;
    }
  }

  static delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM bundles WHERE id = ?');
      const result = stmt.run(id);
      if (result.changes === 0) throw new Error('Bundle not found');
      return { deleted: true };
    } catch (err) {
      throw err;
    }
  }

  static getComponentRequirements(bundleId, quantity) {
    try {
      const stmt = db.prepare(`
        SELECT c.id, c.name, c.stock_quantity, 
               (bc.quantity * ?) as required_quantity,
               c.price,
               ((bc.quantity * ?) * c.price) as total_price
        FROM bundle_components bc
        JOIN components c ON bc.component_id = c.id
        WHERE bc.bundle_id = ?
      `);
      return stmt.all(quantity, quantity, bundleId);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Bundle;