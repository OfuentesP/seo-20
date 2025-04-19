// This script scrapes SEO-related information from a given URL.
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Default maximum number of images to extract
const MAX_IMAGES = 20;

// Get the URL from the command line arguments
const url = process.argv[2];

// Check if a URL was provided
if (!url) {
  console.error('❌ Please provide a URL as a command-line argument.');
  process.exit(1); // Exit the script with an error code
}

// Extract the hostname from the URL to use in the filename
const urlObject = new URL(url);
const hostname = urlObject.hostname.replace('www.', '').replace(/\./g, '-'); // Replace dots with dashes for filename

// Define the output filename using the hostname
const outputFilename = `seo-onpage-${hostname}.json`;

// Asynchronous function to perform the scraping
async function scrapeSEOData(url) {
  try {
    // Fetch the web page content
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Extract title
    const title = $('title').text();

    // Extract meta description
    const metaDesc = $('meta[name="description"]').attr('content') || 'Not found';

    // Extract viewport
    const viewport = $('meta[name="viewport"]').attr('content') || 'Not found';

    // Extract lang attribute from html tag
    const lang = $('html').attr('lang') || 'Not found';

    // Extract H1 heading
    const h1 = $('h1').first().text().trim() || 'Not found';

    // Extract H2 headings
    const h2s = [];
    $('h2').each((i, el) => {
      h2s.push($(el).text().trim());
    });

    // Extract images and their alt text
    const images = [];
    $('img').each((i, el) => {
      images.push({
        src: $(el).attr('src'),
        alt: $(el).attr('alt') || 'No alt text provided'
      });
    });

    // Build the JSON object with the extracted data
    const seoData = {
      url,
      title,
      meta_description: metaDesc,
      viewport,
      lang,
      h1,
      h2: h2s,
      images: images.slice(0, MAX_IMAGES) // Limit the number of images
    };

    // Save the data to a JSON file
    fs.writeFileSync(outputFilename, JSON.stringify(seoData, null, 2));
    console.log(`✅ SEO on-page report saved as ${outputFilename}`);

  } catch (error) {
    // Handle errors during the process
    if (error.response) {
      console.error(`❌ Error loading URL: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
    } else {
      console.error('❌ Error during request setup:', error.message);
    }
  }
}

// Execute the scraping function
scrapeSEOData(url);
