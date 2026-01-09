const db = require('../db/database');
const { checkStockAcrossRetailers } = require('./stockChecker');
const { notifyUsersOfStock, getActiveAlerts } = require('./alertService');

let monitoringActive = false;
const CHECK_INTERVAL = process.env.CHECK_INTERVAL_MS || 300000; // 5 minutes default

const logStockCheck = (productId, results) => {
  return new Promise((resolve, reject) => {
    const inStockRetailers = results.retailers
      .filter(r => r.inStock)
      .map(r => r.retailer)
      .join(', ') || 'None';

    const availableSizes = results.retailers
      .find(r => r.availableSizes && r.availableSizes.length > 0)
      ?.availableSizes?.join(', ') || 'Unknown';

    db.run(
      `INSERT INTO stock_history (productId, productName, inStock, availableSizes, source)
       VALUES (?, ?, ?, ?, ?)`,
      [
        productId,
        results.product?.sku,
        results.inStockAnywhere ? 1 : 0,
        availableSizes,
        'aggregated'
      ],
      function(err) {
        if (err) {
          console.error('Error logging stock:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, inStockRetailers });
        }
      }
    );
  });
};

const checkProductStock = async (product) => {
  console.log(`Checking stock for: ${product.productName}`);

  try {
    const results = await checkStockAcrossRetailers(product.productId, product.productUrl);

    // Log the check
    const logResult = await logStockCheck(product.productId, results);

    // Check if in stock and notify users
    if (results.inStockAnywhere) {
      const inStockRetailers = results.retailers
        .filter(r => r.inStock)
        .map(r => r.retailer);

      console.log(`✅ ${product.productName} is IN STOCK at: ${inStockRetailers.join(', ')}`);

      // Notify users
      const notifications = await notifyUsersOfStock(
        product.productId,
        product.productName,
        product.productUrl,
        inStockRetailers
      );

      console.log(`Notified ${notifications.length} users`);
    } else {
      console.log(`❌ ${product.productName} is OUT OF STOCK everywhere`);
    }

    return results;
  } catch (error) {
    console.error(`Error checking ${product.productName}:`, error);
    return null;
  }
};

const runStockCheck = async () => {
  try {
    console.log(`\n[${new Date().toISOString()}] Running stock check...`);

    const activeAlerts = await getActiveAlerts();

    if (activeAlerts.length === 0) {
      console.log('No active alerts to check');
      return;
    }

    console.log(`Checking ${activeAlerts.length} products...`);

    for (const product of activeAlerts) {
      await checkProductStock(product);
      // Stagger requests to avoid hammering servers
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('Stock check completed\n');
  } catch (error) {
    console.error('Error during stock check:', error);
  }
};

const startStockMonitoring = () => {
  if (monitoringActive) {
    console.log('Stock monitoring already active');
    return;
  }

  monitoringActive = true;
  console.log(`Stock monitoring started (interval: ${CHECK_INTERVAL}ms)`);

  // Run initial check
  runStockCheck();

  // Schedule periodic checks
  setInterval(runStockCheck, CHECK_INTERVAL);
};

const stopStockMonitoring = () => {
  monitoringActive = false;
  console.log('Stock monitoring stopped');
};

module.exports = {
  startStockMonitoring,
  stopStockMonitoring,
  runStockCheck,
  checkProductStock
};
