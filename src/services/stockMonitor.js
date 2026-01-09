const db = require('../db/database');
const { checkStockAcrossRetailers } = require('./stockChecker');
const { notifyUsersOfStock, getActiveAlerts } = require('./alertService');
const { sendDiscordMessage, isDiscordBotReady } = require('./discordBot');

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

    // Check if in stock and notify
    if (results.inStockAnywhere) {
      const inStockRetailers = results.retailers
        .filter(r => r.inStock)
        .map(r => r.retailer);

      console.log(`✅ ${product.productName} is IN STOCK at: ${inStockRetailers.join(', ')}`);

      // Send Discord notification
      const channelId = process.env.DISCORD_CHANNEL_ID;
      if (channelId && isDiscordBotReady()) {
        await sendDiscordMessage(
          channelId,
          product.productName,
          product.productUrl,
          inStockRetailers
        );
        console.log('Discord notification sent');
      } else if (!channelId) {
        console.warn('DISCORD_CHANNEL_ID not configured in .env');
      } else {
        console.warn('Discord bot not ready yet');
      }
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

    // Default product from .env (Nike Mind 001)
    const defaultProduct = {
      productId: process.env.NIKE_PRODUCT_SKU || 'HQ4307-002',
      productName: process.env.NIKE_PRODUCT_NAME || 'Nike Mind 001',
      productUrl: process.env.NIKE_PRODUCT_URL || 'https://www.nike.com/t/mind-001-mens-pregame-mules-Ky4BSP5I/HQ4307-002'
    };

    await checkProductStock(defaultProduct);

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
