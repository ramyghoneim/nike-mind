const nodemailer = require('nodemailer');
const axios = require('axios');
const db = require('../db/database');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendEmailAlert = async (userEmail, productName, productUrl, retailer) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `🎉 Alert: ${productName} is back in stock at ${retailer}!`,
    html: `
      <h2>Good News! ${productName} is in Stock!</h2>
      <p><strong>Retailer:</strong> ${retailer}</p>
      <p><strong>Product:</strong> ${productName}</p>
      <p>
        <a href="${productUrl}" style="background-color: #111; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Check Product Now
        </a>
      </p>
      <p style="font-size: 12px; color: #666;">
        This alert was sent because you subscribed to stock notifications for this product.
      </p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email alert sent to ${userEmail} for ${productName}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const sendWebhookAlert = async (webhookUrl, productName, productUrl, retailer) => {
  try {
    await axios.post(webhookUrl, {
      event: 'stock_alert',
      product: productName,
      productUrl: productUrl,
      retailer: retailer,
      timestamp: new Date().toISOString()
    }, {
      timeout: 5000
    });
    console.log(`Webhook alert sent to ${webhookUrl}`);
    return true;
  } catch (error) {
    console.error('Error sending webhook:', error.message);
    return false;
  }
};

const notifyUsersOfStock = async (productId, productName, productUrl, inStockRetailers) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM alerts WHERE productId = ? AND active = 1 AND notifiedAt IS NULL',
      [productId],
      async (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
          return;
        }

        const results = [];

        for (const alert of rows) {
          try {
            let notificationSent = false;

            if (alert.notificationMethod === 'email') {
              const retailers = inStockRetailers.join(', ');
              notificationSent = await sendEmailAlert(
                alert.userEmail,
                productName,
                productUrl,
                retailers
              );
            } else if (alert.notificationMethod === 'webhook') {
              const retailers = inStockRetailers.join(', ');
              notificationSent = await sendWebhookAlert(
                alert.notificationMethod,
                productName,
                productUrl,
                retailers
              );
            }

            if (notificationSent) {
              // Mark alert as notified
              db.run(
                'UPDATE alerts SET notifiedAt = CURRENT_TIMESTAMP WHERE id = ?',
                [alert.id],
                (err) => {
                  if (err) console.error('Error updating alert:', err);
                }
              );
              results.push({ alertId: alert.id, success: true });
            }
          } catch (error) {
            console.error(`Error notifying user ${alert.userEmail}:`, error);
            results.push({ alertId: alert.id, success: false, error: error.message });
          }
        }

        resolve(results);
      }
    );
  });
};

const getActiveAlerts = () => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT DISTINCT productId, productName, productUrl FROM alerts WHERE active = 1',
      [],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
};

module.exports = {
  sendEmailAlert,
  sendWebhookAlert,
  notifyUsersOfStock,
  getActiveAlerts
};
