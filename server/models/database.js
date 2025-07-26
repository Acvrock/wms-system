const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../wms.db');

// Synchronous database initialization
let db = null;
let SQL = null;

function initializeDatabase() {
  if (db) return db;
  
  return initSqlJs().then(sql => {
    SQL = sql;
    
    // Load existing database file or create new one
    let data;
    if (fs.existsSync(dbPath)) {
      data = fs.readFileSync(dbPath);
    }
    
    db = new SQL.Database(data);
    
    // Enable foreign keys
    db.exec("PRAGMA foreign_keys = ON;");
    
    // Create tables
    createTables();
    
    // Save to file
    saveToFile();
    
    return db;
  });
}

function createTables() {
  try {
    // Create tables
    db.exec(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('BOSS', 'MANAGER')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      image_url TEXT,
      stock_quantity INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS bundles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS bundle_components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bundle_id INTEGER NOT NULL,
      component_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (bundle_id) REFERENCES bundles (id) ON DELETE CASCADE,
      FOREIGN KEY (component_id) REFERENCES components (id) ON DELETE CASCADE,
      UNIQUE(bundle_id, component_id)
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS restock_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL CHECK(status IN ('PACKING', 'PACKED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS restock_plan_bundles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restock_plan_id INTEGER NOT NULL,
      bundle_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (restock_plan_id) REFERENCES restock_plans (id) ON DELETE CASCADE,
      FOREIGN KEY (bundle_id) REFERENCES bundles (id) ON DELETE CASCADE
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS inbound_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      component_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (component_id) REFERENCES components (id) ON DELETE CASCADE
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS outbound_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      component_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      restock_plan_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (component_id) REFERENCES components (id) ON DELETE CASCADE,
      FOREIGN KEY (restock_plan_id) REFERENCES restock_plans (id) ON DELETE SET NULL
    )`);

    // Initialize default users
    const defaultPassword = bcrypt.hashSync('123456aa', 10);
    
    const stmt = db.prepare(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`);
    stmt.bind(['boss', defaultPassword, 'BOSS']);
    stmt.step();
    stmt.reset();
    
    stmt.bind(['manager', defaultPassword, 'MANAGER']);
    stmt.step();
    stmt.reset();
    
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

function saveToFile() {
  if (!db) return;
  try {
    const data = db.export();
    fs.writeFileSync(dbPath, data);
  } catch (error) {
    console.error('Database save error:', error);
  }
}

// Database wrapper for compatibility with existing code
class DatabaseWrapper {
  constructor() {
    this.ready = false;
    this.initPromise = initializeDatabase().then(() => {
      this.ready = true;
    });
  }
  
  async waitForReady() {
    if (!this.ready) {
      await this.initPromise;
    }
  }
  
  prepare(sql) {
    if (!db) throw new Error('Database not ready');
    const stmt = db.prepare(sql);
    
    return {
      exec: (sql) => {
        try {
          db.exec(sql);
          saveToFile();
          return { changes: db.getRowsModified() };
        } catch (error) {
          throw error instanceof Error ? error : new Error(error ? String(error) : 'Database exec failed');
        }
      },
      all: (...params) => {
        try {
          if (params.length > 0) {
            stmt.bind(params);
          }
          const results = [];
          while (stmt.step()) {
            const row = stmt.getAsObject();
            results.push(row);
          }
          stmt.reset();
          saveToFile(); // Save after each operation
          return results;
        } catch (error) {
          stmt.reset();
          throw error instanceof Error ? error : new Error(error ? String(error) : 'Database query failed');
        }
      },
      get: (...params) => {
        try {
          if (params.length > 0) {
            stmt.bind(params);
          }
          const result = stmt.step() ? stmt.getAsObject() : null;
          stmt.reset();
          return result;
        } catch (error) {
          stmt.reset();
          throw error instanceof Error ? error : new Error(error ? String(error) : 'Database query failed');
        }
      },
      run: (...params) => {
        try {
          if (params.length > 0) {
            stmt.bind(params);
          }
          stmt.step();
          const changes = db.getRowsModified();
          
          // Get last insert rowid
          let lastInsertRowid = 0;
          if (changes > 0) {
            const lastIdStmt = db.prepare("SELECT last_insert_rowid() as id");
            lastIdStmt.step();
            const row = lastIdStmt.getAsObject();
            lastInsertRowid = row.id || 0;
            lastIdStmt.reset();
          }
          
          stmt.reset();
          saveToFile(); // Save after each operation
          return { 
            changes,
            lastInsertRowid
          };
        } catch (error) {
          console.error('Database run error:', error);
          console.error('Error type:', typeof error);
          console.error('Error constructor:', error.constructor.name);
          stmt.reset();
          throw error instanceof Error ? error : new Error(error ? String(error) : 'Database operation failed');
        }
      }
    };
  }
  
  transaction(fn) {
    return (...args) => {
      if (!db) throw new Error('Database not ready');
      
      // For sql.js, we'll just execute the function without explicit transactions
      // since sql.js doesn't handle transactions the same way
      try {
        const result = fn(...args);
        saveToFile(); // Save after operation
        return result;
      } catch (error) {
        throw error;
      }
    };
  }
  
  // Direct SQL execution method
  exec(sql) {
    if (!db) throw new Error('Database not ready');
    try {
      db.exec(sql);
      saveToFile();
      return { success: true };
    } catch (error) {
      throw error instanceof Error ? error : new Error(error ? String(error) : 'Database exec failed');
    }
  }
  
  // Get raw database instance for direct access
  getRawDb() {
    return db;
  }
}

// Create and export database instance
const dbWrapper = new DatabaseWrapper();

// Save on process exit
process.on('exit', () => {
  saveToFile();
});

process.on('SIGINT', () => {
  saveToFile();
  process.exit();
});

process.on('SIGTERM', () => {
  saveToFile();
  process.exit();
});

module.exports = dbWrapper;