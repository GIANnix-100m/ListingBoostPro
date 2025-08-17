const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const puppeteer = require('puppeteer');

// For local development with Express
if (process.env.NODE_ENV !== 'production') {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // API endpoint for scraping
  app.post('/scrape', async (req, res) => {
    await handleScrape(req, res);
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// For Vercel serverless function
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await handleScrape(req, res);
};

// Export the handler function for Vercel
module.exports.handler = module.exports;

// Shared handler function
async function handleScrape(req, res) {
  const { url } = req.body;
  
  try {
    let propertyData = {};
    
    if (url.includes('zillow.com')) {
      propertyData = await scrapeZillow(url);
    } else if (url.includes('realtor.com')) {
      propertyData = await scrapeRealtor(url);
    } else if (url.includes('redfin.com')) {
      propertyData = await scrapeRedfin(url);
    } else {
      return res.status(400).json({ error: 'Unsupported website' });
    }
    
    res.json(propertyData);
  } catch (error) {
    res.status(500).json({ error: 'Scraping failed' });
  }
};

// Zillow scraping function
async function scrapeZillow(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  
  // Extract data using Puppeteer
  const data = await page.evaluate(() => {
    return {
      price: document.querySelector('span[data-testid="price"]')?.textContent,
      bedrooms: document.querySelector('span[data-testid="bed"]')?.textContent,
      bathrooms: document.querySelector('span[data-testid="bath"]')?.textContent,
      sqft: document.querySelector('span[data-testid="sqft"]')?.textContent,
      address: document.querySelector('h1[class="ds-address-container"]')?.textContent,
      features: Array.from(document.querySelectorAll('.ds-feature-item')).map(el => el.textContent)
    };
  });
  
  await browser.close();
  return data;
}

// Realtor.com scraping function
async function scrapeRealtor(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  
  // Extract data using Puppeteer
  const data = await page.evaluate(() => {
    return {
      price: document.querySelector('.Price__Component-rui__x3geed-0')?.textContent,
      bedrooms: document.querySelector('[data-testid="property-meta-beds"]')?.textContent,
      bathrooms: document.querySelector('[data-testid="property-meta-baths"]')?.textContent,
      sqft: document.querySelector('[data-testid="property-meta-sqft"]')?.textContent,
      address: document.querySelector('.address-value')?.textContent,
      features: Array.from(document.querySelectorAll('.feature-item, .amenity-item')).map(el => el.textContent)
    };
  });
  
  await browser.close();
  return data;
}

// Redfin scraping function
async function scrapeRedfin(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  
  // Extract data using Puppeteer
  const data = await page.evaluate(() => {
    return {
      price: document.querySelector('.price')?.textContent,
      bedrooms: document.querySelector('.beds .statsValue')?.textContent,
      bathrooms: document.querySelector('.baths .statsValue')?.textContent,
      sqft: document.querySelector('.sqFt .statsValue')?.textContent,
      address: document.querySelector('.street-address')?.textContent + ', ' + 
              document.querySelector('.cityStateZip')?.textContent,
      features: Array.from(document.querySelectorAll('.amenity-group li, .feature-item')).map(el => el.textContent)
    };
  });
  
  await browser.close();
  return data;
}

// End of handleScrape function