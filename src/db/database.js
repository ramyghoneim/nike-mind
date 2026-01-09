const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/nike-stock.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.serialize(() => {
  // Alerts table
  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      productUrl TEXT NOT NULL,
      userEmail TEXT,
      webhookUrl TEXT,
      notificationMethod TEXT DEFAULT 'email',
      size TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      active BOOLEAN DEFAULT 1,
      notifiedAt DATETIME
    )
  `);

  // Add webhookUrl column if it doesn't exist (for existing databases)
  db.run(`
    PRAGMA table_info(alerts)
  `, (err, info) => {
    if (!err) {
      db.get(
        `PRAGMA table_info(alerts) WHERE name='webhookUrl'`,
        (err, row) => {
          if (!row && !err) {
            db.run(`ALTER TABLE alerts ADD COLUMN webhookUrl TEXT`, (err) => {
              if (err && err.message.includes('duplicate column')) {
                // Column already exists, ignore
              } else if (err) {
                console.error('Error adding webhookUrl column:', err);
              }
            });
          }
        }
      );
    }
  });

  // Stock history table
  db.run(`
    CREATE TABLE IF NOT EXISTS stock_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      inStock BOOLEAN NOT NULL,
      price REAL,
      availableSizes TEXT,
      checkedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      source TEXT DEFAULT 'nike'
    )
  `);

  // Retailers table
  db.run(`
    CREATE TABLE IF NOT EXISTS retailers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      checkUrl TEXT,
      enabled BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
