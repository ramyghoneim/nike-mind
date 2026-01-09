const express = require('express');
const db = require('../db/database');
const router = express.Router();

// Create a new stock alert
router.post('/', (req, res) => {
  const { productId, productName, productUrl, userEmail, discordChannelId, notificationMethod, size } = req.body;

  if (!productId || !productName) {
    return res.status(400).json({
      error: 'productId and productName are required'
    });
  }

  const method = notificationMethod || 'email';

  // Validate required fields based on notification method
  if (method === 'email' && !userEmail) {
    return res.status(400).json({
      error: 'userEmail is required for email notifications'
    });
  }

  if (method === 'discord' && !discordChannelId) {
    return res.status(400).json({
      error: 'discordChannelId is required for Discord notifications'
    });
  }

  db.run(
    `INSERT INTO alerts (productId, productName, productUrl, userEmail, discordChannelId, notificationMethod, size, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [productId, productName, productUrl, userEmail || null, discordChannelId || null, method, size || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        id: this.lastID,
        message: 'Stock alert created successfully',
        productId,
        productName,
        notificationMethod: method,
        discordChannelId: discordChannelId ? '(hidden)' : undefined,
        userEmail: userEmail ? '(hidden)' : undefined
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
