const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Unified scraping logic
    const propertyData = {
      price: $('[data-testid="price"]').text().trim() || $('.price').first().text().trim(),
      bedrooms: $('[data-testid="bed"]').text().trim() || $('.bedrooms').first().text().trim().split(' ')[0],
      bathrooms: $('[data-testid="bath"]').text().trim() || $('.bathrooms').first().text().trim().split(' ')[0],
      sqft: $('[data-testid="sqft"]').text().trim() || $('.sqft').first().text().trim(),
      address: $('[data-testid="address"]').text().trim() || $('.address').first().text().trim(),
      features: []
    };

    // Feature extraction
    $('.features li, .amenities li, .ds-feature-item').each((i, el) => {
      propertyData.features.push($(el).text().trim());
    });

    res.status(200).json({ success: true, data: propertyData });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: 'Failed to scrape property. Please try another URL or enter details manually.' });
  }
}