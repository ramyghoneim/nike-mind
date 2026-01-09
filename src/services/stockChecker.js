const axios = require('axios');
const cheerio = require('cheerio');

const RETAILERS = {
  NIKE: {
    name: 'Nike',
    url: 'https://www.nike.com',
    getCheckUrl: (sku) => `https://www.nike.com/t/mind-001-mens-pregame-mules-${sku}`
  },
  FOOTPATROL: {
    name: 'Foot Patrol',
    url: 'https://www.footpatrol.com',
    getCheckUrl: (sku) => `https://www.footpatrol.com/products/${sku}`
  },
  JDSPORTS: {
    name: 'JD Sports',
    url: 'https://www.jdsports.co.uk',
    getCheckUrl: (sku) => `https://www.jdsports.co.uk/product/${sku}`
  },
  FOOTLOCKER: {
    name: 'Foot Locker',
    url: 'https://www.footlocker.com',
    getCheckUrl: (sku) => `https://www.footlocker.com/products/${sku}`
  },
  SNKRS: {
    name: 'SNKRS',
    url: 'https://www.nike.com/snkrs',
    getCheckUrl: (sku) => `https://www.nike.com/snkrs/view/${sku}`
  }
};

const checkNikeStock = async (productSku, productUrl) => {
  try {
    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Look for stock status indicators
    const outOfStockIndicator = $('[data-qa="pdp-buy-cta-button"]').attr('aria-disabled');
    const inStock = outOfStockIndicator !== 'true';

    // Try to extract available sizes
    const sizes = [];
    $('[data-qa="size-selector"] option').each((i, el) => {
      const sizeText = $(el).text();
      if (sizeText && !sizeText.includes('Select')) {
        sizes.push(sizeText);
      }
    });

    return {
      inStock,
      availableSizes: sizes,
      checkedAt: new Date(),
      source: 'nike',
      retailer: 'Nike'
    };
  } catch (error) {
    console.error('Error checking Nike stock:', error.message);
    return {
      inStock: false,
      availableSizes: [],
      checkedAt: new Date(),
      error: error.message,
      retailer: 'Nike'
    };
  }
};

const checkRetailerStock = async (retailer, productSku) => {
  try {
    const url = retailer.getCheckUrl(productSku);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Generic out of stock check
    const isOutOfStock =
      response.status === 404 ||
      $('body').text().toLowerCase().includes('out of stock') ||
      $('body').text().toLowerCase().includes('sold out');

    return {
      inStock: !isOutOfStock,
      checkedAt: new Date(),
      source: retailer.name.toLowerCase(),
      retailer: retailer.name,
      url: url
    };
  } catch (error) {
    console.error(`Error checking ${retailer.name} stock:`, error.message);
    return {
      inStock: false,
      checkedAt: new Date(),
      error: error.message,
      retailer: retailer.name
    };
  }
};

const checkStockAcrossRetailers = async (productSku, productUrl) => {
  const results = {
    timestamp: new Date(),
    product: {
      sku: productSku,
      url: productUrl
    },
    retailers: []
  };

  // Check Nike first
  const nikeStock = await checkNikeStock(productSku, productUrl);
  results.retailers.push(nikeStock);

  // Check other major retailers
  const otherRetailers = [RETAILERS.FOOTPATROL, RETAILERS.JDSPORTS, RETAILERS.FOOTLOCKER];
  for (const retailer of otherRetailers) {
    const stock = await checkRetailerStock(retailer, productSku);
    results.retailers.push(stock);
    // Stagger requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Determine overall stock status
  results.inStockAnywhere = results.retailers.some(r => r.inStock);

  return results;
};

module.exports = {
  checkNikeStock,
  checkRetailerStock,
  checkStockAcrossRetailers,
  RETAILERS
};
