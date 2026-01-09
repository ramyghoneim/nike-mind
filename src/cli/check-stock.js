#!/usr/bin/env node

require('dotenv').config();
const { checkStockAcrossRetailers } = require('../services/stockChecker');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: npm run check-stock <productSku> <productUrl>');
  console.log('Example: npm run check-stock HQ4307-002 https://www.nike.com/t/mind-001-mens-pregame-mules-Ky4BSP5I/HQ4307-002');
  process.exit(1);
}

const productSku = args[0];
const productUrl = args[1];

console.log(`\n🏃 Checking Nike Mind 001 Stock...`);
console.log(`Product SKU: ${productSku}`);
console.log(`Product URL: ${productUrl}`);
console.log(`Checking ${new Date().toLocaleString()}\n`);

checkStockAcrossRetailers(productSku, productUrl)
  .then(results => {
    console.log('Results:');
    console.log('========\n');

    results.retailers.forEach(retailer => {
      const status = retailer.inStock ? '✅ IN STOCK' : '❌ OUT OF STOCK';
      console.log(`${retailer.retailer}: ${status}`);
      if (retailer.url) {
        console.log(`  URL: ${retailer.url}`);
      }
      if (retailer.availableSizes && retailer.availableSizes.length > 0) {
        console.log(`  Available Sizes: ${retailer.availableSizes.join(', ')}`);
      }
      if (retailer.error) {
        console.log(`  Error: ${retailer.error}`);
      }
      console.log();
    });

    console.log('Summary:');
    console.log('--------');
    if (results.inStockAnywhere) {
      const inStock = results.retailers
        .filter(r => r.inStock)
        .map(r => r.retailer)
        .join(', ');
      console.log(`✅ GOOD NEWS! In stock at: ${inStock}`);
    } else {
      console.log('❌ Out of stock everywhere');
    }

    process.exit(results.inStockAnywhere ? 0 : 1);
  })
  .catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
