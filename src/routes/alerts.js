const express = require('express');
const db = require('../db/database');
const router = express.Router();

// Create a new stock alert
router.post('/', (req, res) => {
  const { productId, productName, productUrl, userEmail, notificationMethod, size } = req.body;

  if (!productId || !productName || !userEmail) {
    return res.status(400).json({
      error: 'productId, productName, and userEmail are required'
    });
  }

  const method = notificationMethod || 'email';

  db.run(
    `INSERT INTO alerts (productId, productName, productUrl, userEmail, notificationMethod, size, active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [productId, productName, productUrl, userEmail, method, size || null],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({
            error: 'Alert already exists for this product and email'
          });
        }
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        id: this.lastID,
        message: 'Stock alert created successfully',
        productId,
        userEmail,
        notificationMethod: method
      });
    }
  );
});

// Get alerts for a user
router.get('/user/:email', (req, res) => {
  const email = req.params.email;

  db.all(
    'SELECT * FROM alerts WHERE userEmail = ? ORDER BY createdAt DESC',
    [email],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        email,
        alertCount: rows.length,
        alerts: rows
      });
    }
  );
});

// Get all active alerts
router.get('/', (req, res) => {
  db.all(
    'SELECT DISTINCT productId, productName, productUrl, COUNT(*) as userCount FROM alerts WHERE active = 1 GROUP BY productId',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        totalProducts: rows.length,
        products: rows
      });
    }
  );
});

// Update an alert
router.put('/:id', (req, res) => {
  const { active } = req.body;
  const alertId = req.params.id;

  db.run(
    'UPDATE alerts SET active = ? WHERE id = ?',
    [active ? 1 : 0, alertId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      res.json({
        message: 'Alert updated',
        id: alertId,
        active
      });
    }
  );
});

// Delete an alert
router.delete('/:id', (req, res) => {
  const alertId = req.params.id;

  db.run(
    'DELETE FROM alerts WHERE id = ?',
    [alertId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      res.json({
        message: 'Alert deleted',
        id: alertId
      });
    }
  );
});

module.exports = router;
