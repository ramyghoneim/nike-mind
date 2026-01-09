require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db/database');
const alertRoutes = require('./routes/alerts');
const stockRoutes = require('./routes/stock');
const { startStockMonitoring } = require('./services/stockMonitor');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/alerts', alertRoutes);
app.use('/api/stock', stockRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Nike Mind Stock Alert Server running on port ${PORT}`);

  // Start background stock monitoring
  startStockMonitoring();
});

module.exports = app;
