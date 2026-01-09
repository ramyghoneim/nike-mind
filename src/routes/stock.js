const express = require('express');
const db = require('../db/database');
const { checkStockAcrossRetailers } = require('../services/stockChecker');
const { runStockCheck } = require('../services/stockMonitor');
const router = express.Router();

// Check stock for a specific product
router.post('/check', async (req, res) => {
  const { productSku, productUrl } = req.body;

  if (!productSku || !productUrl) {
    return res.status(400).json({
      error: 'productSku and productUrl are required'
    });
  }

  try {
    const results = await checkStockAcrossRetailers(productSku, productUrl);

    res.json({
      product: results.product,
      inStockAnywhere: results.inStockAnywhere,
      retailers: results.retailers,
      checkedAt: results.timestamp
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error checking stock',
      message: error.message
    });
  }
});

// Get stock history for a product
router.get('/history/:productId', (req, res) => {
  const productId = req.params.productId;
  const limit = req.query.limit || 50;

  db.all(
    'SELECT * FROM stock_history WHERE productId = ? ORDER BY checkedAt DESC LIMIT ?',
    [productId, limit],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (rows.length === 0) {
        return res.json({
          productId,
          message: 'No stock history found',
          history: []
        });
      }

      // Analyze stock patterns
      const inStockCount = rows.filter(r => r.inStock).length;
      const outOfStockCount = rows.filter(r => !r.inStock).length;
      const lastCheck = rows[0];
      const firstCheck = rows[rows.length - 1];

      res.json({
        productId,
        checks: rows.length,
        inStockCount,
        outOfStockCount,
        lastCheck,
        firstCheck,
        estimatedRestockChance: inStockCount > 0 ? 'High' : 'Unknown',
        history: rows
      });
    }
  );
});

// Trigger an immediate stock check for all active alerts
router.post('/check-all', async (req, res) => {
  try {
    res.json({
      message: 'Stock check initiated',
      status: 'running'
    });

    // Run check asynchronously
    runStockCheck().catch(error => {
      console.error('Error in manual stock check:', error);
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error initiating stock check',
      message: error.message
    });
  }
});

// Get current stock status for a product
router.get('/status/:productId', (req, res) => {
  const productId = req.params.productId;

  db.get(
    'SELECT * FROM stock_history WHERE productId = ? ORDER BY checkedAt DESC LIMIT 1',
    [productId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.json({
          productId,
          status: 'unknown',
          message: 'No stock checks performed yet'
        });
      }

      res.json({
        productId,
        status: row.inStock ? 'in_stock' : 'out_of_stock',
        lastChecked: row.checkedAt,
        availableSizes: row.availableSizes,
        source: row.source
      });
    }
  );
});

module.exports = router;
