const db = require('./database');
const Bundle = require('./Bundle');

class RestockPlan {
  static getAll() {
    try {
      const stmt = db.prepare(`
        SELECT rp.*,
               GROUP_CONCAT(b.name || ' x' || rpb.quantity) as bundles_info
        FROM restock_plans rp
        LEFT JOIN restock_plan_bundles rpb ON rp.id = rpb.restock_plan_id
        LEFT JOIN bundles b ON rpb.bundle_id = b.id
        GROUP BY rp.id
        ORDER BY rp.created_at DESC
      `);
      return stmt.all();
    } catch (err) {
      throw err;
    }
  }

  static getById(id) {
    try {
      const planStmt = db.prepare('SELECT * FROM restock_plans WHERE id = ?');
      const plan = planStmt.get(id);
      
      if (!plan) {
        return null;
      }

      const bundlesStmt = db.prepare(`
        SELECT b.*, rpb.quantity as plan_quantity
        FROM restock_plan_bundles rpb
        JOIN bundles b ON rpb.bundle_id = b.id
        WHERE rpb.restock_plan_id = ?
      `);
      const bundles = bundlesStmt.all(id);
      
      // Get components for each bundle
      for (let bundle of bundles) {
        const componentsStmt = db.prepare(`
          SELECT c.id, c.name, c.price, bc.quantity
          FROM bundle_components bc
          JOIN components c ON bc.component_id = c.id
          WHERE bc.bundle_id = ?
        `);
        bundle.components = componentsStmt.all(bundle.id);
      }
      
      return { ...plan, bundles };
    } catch (err) {
      throw err;
    }
  }

  static create(data) {
    const transaction = db.transaction((data) => {
      const { name, description, bundles } = data;
      
      // First validate all bundle data
      if (bundles && bundles.length > 0) {
        for (const bundle of bundles) {
          // Validate bundle data before insertion
          if (!bundle.bundle_id || !bundle.quantity || bundle.quantity < 1) {
            throw new Error(`Invalid bundle data: bundle_id=${bundle.bundle_id}, quantity=${bundle.quantity}`);
          }
          
          // Validate quantity is not too large (prevent integer overflow)
          if (bundle.quantity > 999999) {
            const error = new Error(`Quantity too large: ${bundle.quantity}. Maximum allowed is 999999`);
            error.status = 400;
            throw error;
          }
          
          // Check if bundle exists using a fresh statement each time
          const bundleCheck = db.prepare('SELECT id FROM bundles WHERE id = ?');
          const existingBundle = bundleCheck.get(bundle.bundle_id);
          if (!existingBundle) {
            throw new Error(`Bundle with id ${bundle.bundle_id} does not exist`);
          }
        }
      }
      
      // Create the restock plan
      const planStmt = db.prepare('INSERT INTO restock_plans (name, description, status) VALUES (?, ?, ?)');
      const result = planStmt.run(name, description, 'PACKING');
      const planId = result.lastInsertRowid;
      
      // Insert bundle relationships
      if (bundles && bundles.length > 0) {
        for (const bundle of bundles) {
          const bundleStmt = db.prepare('INSERT INTO restock_plan_bundles (restock_plan_id, bundle_id, quantity) VALUES (?, ?, ?)');
          bundleStmt.run(planId, bundle.bundle_id, bundle.quantity);
        }
      }
      
      return { id: planId, ...data };
    });

    try {
      return transaction(data);
    } catch (err) {
      throw err;
    }
  }

  static update(id, data) {
    try {
      const { name, description, bundles } = data;
      
      // Validate input data
      if (bundles && bundles.length > 0) {
        for (const bundle of bundles) {
          if (!bundle.bundle_id || !bundle.quantity || bundle.quantity < 1) {
            throw new Error(`Invalid bundle data: bundle_id=${bundle.bundle_id}, quantity=${bundle.quantity}`);
          }
          if (bundle.quantity > 999999) {
            const error = new Error(`Quantity too large: ${bundle.quantity}. Maximum allowed is 999999`);
            error.status = 400;
            throw error;
          }
        }
      }
      
      // Check plan exists and status using separate operation
      const checkStmt = db.prepare('SELECT status FROM restock_plans WHERE id = ?');
      const plan = checkStmt.get(id);
      
      if (!plan) {
        throw new Error('Restock plan not found');
      }
      if (plan.status === 'PACKED') {
        throw new Error('Cannot update packed restock plan');
      }
      
      // Use string-based SQL to avoid prepared statement conflicts
      const escapedName = name.replace(/'/g, "''");
      const escapedDescription = description.replace(/'/g, "''");
      
      // Build SQL commands as strings
      const updateSQL = `UPDATE restock_plans SET name = '${escapedName}', description = '${escapedDescription}', updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
      const deleteSQL = `DELETE FROM restock_plan_bundles WHERE restock_plan_id = ${id}`;
      
      let insertSQL = '';
      if (bundles && bundles.length > 0) {
        const values = bundles.map(bundle => 
          `(${id}, ${bundle.bundle_id}, ${bundle.quantity})`
        ).join(', ');
        insertSQL = `INSERT INTO restock_plan_bundles (restock_plan_id, bundle_id, quantity) VALUES ${values}`;
      }
      
      // Execute all SQL commands
      const transaction = db.transaction(() => {
        // Update plan info
        db.exec(updateSQL);
        
        // Delete old bundles
        db.exec(deleteSQL);
        
        // Insert new bundles
        if (insertSQL) {
          db.exec(insertSQL);
        }
      });
      
      transaction();
      return { id, ...data };
      
    } catch (err) {
      console.error('RestockPlan.update error:', err);
      throw err instanceof Error ? err : new Error(err ? err.toString() : 'Unknown database error');
    }
  }

  static delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM restock_plans WHERE id = ?');
      const result = stmt.run(id);
      if (result.changes === 0) throw new Error('Restock plan not found');
      return { deleted: true };
    } catch (err) {
      throw err;
    }
  }

  static validateInventory(id) {
    try {
      const plan = RestockPlan.getById(id);
      if (!plan) throw new Error('Restock plan not found');

      const requirements = {};
      const shortages = [];

      for (const bundle of plan.bundles) {
        const componentReqs = Bundle.getComponentRequirements(bundle.id, bundle.plan_quantity);
        
        for (const req of componentReqs) {
          if (!requirements[req.id]) {
            requirements[req.id] = {
              id: req.id,
              name: req.name,
              required: 0,
              available: req.stock_quantity,
              price: req.price
            };
          }
          requirements[req.id].required += req.required_quantity;
        }
      }

      for (const compId in requirements) {
        const req = requirements[compId];
        if (req.required > req.available) {
          shortages.push({
            ...req,
            shortage: req.required - req.available
          });
        }
      }

      return {
        valid: shortages.length === 0,
        requirements: Object.values(requirements),
        shortages
      };
    } catch (error) {
      throw error;
    }
  }

  static packPlan(id) {
    const transaction = db.transaction((id) => {
      const validation = RestockPlan.validateInventory(id);
      if (!validation.valid) {
        throw new Error('Insufficient inventory for this plan');
      }

      // Update restock plan status
      const updateStatusStmt = db.prepare('UPDATE restock_plans SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      updateStatusStmt.run('PACKED', id);
      
      // For SQL.js, prepare new statements for each operation to avoid "Statement closed" error
      for (const req of validation.requirements) {
        // Update component stock
        const updateStockStmt = db.prepare('UPDATE components SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        updateStockStmt.run(req.required, req.id);
        
        // Insert outbound record
        const insertRecordStmt = db.prepare('INSERT INTO outbound_records (component_id, quantity, reason, restock_plan_id) VALUES (?, ?, ?, ?)');
        insertRecordStmt.run(req.id, req.required, 'Restock Plan Execution', id);
      }
      
      return { packed: true };
    });

    try {
      return transaction(id);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RestockPlan;