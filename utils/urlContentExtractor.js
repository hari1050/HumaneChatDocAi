// utils/urlContentExtractor.js
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

/**
 * Extract content from a URL using Cheerio first, with Puppeteer as fallback
 * @param {string} url - The URL to extract content from
 * @returns {Promise<string>} - The extracted content
 */
async function extractUrlContent(url) {
  try {
    // First attempt: Cheerio + Readability
    const cheerioContent = await extractWithCheerio(url);
    
    // Check if we got meaningful content (at least 100 characters)
    if (cheerioContent && cheerioContent.length > 100) {
      console.log(`Successfully extracted content from ${url} using Cheerio`);
      console.log(`Content length: ${cheerioContent}`);
      return cheerioContent;
    }
    
    console.log(`Cheerio extraction insufficient for ${url}, trying Puppeteer...`);
    
    // Second attempt: Puppeteer
    const puppeteerContent = await extractWithPuppeteer(url);
    return puppeteerContent;
  } catch (error) {
    console.error(`Error extracting content from ${url}:`, error);
    throw new Error(`Failed to extract content from ${url}: ${error.message}`);
  }
}

/**
 * Clean text by removing excess whitespace and normalizing line breaks
 * @param {string} text - The text to clean
 * @returns {string} - The cleaned text
 */
function cleanText(text) {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')        // Replace multiple spaces with a single space
    .replace(/\n\s*\n/g, '\n')   // Replace multiple line breaks with a single line break
    .replace(/\t/g, ' ')         // Replace tabs with spaces
    .trim();                     // Remove leading/trailing whitespace
}

/**
 * Extract content using Cheerio and Readability
 * @param {string} url - The URL to extract from
 * @returns {Promise<string>} - The extracted content
 */
async function extractWithCheerio(url) {
  try {
    // Set a user agent to avoid being blocked
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };

    const response = await axios.get(url, { 
      headers,
      timeout: 10000 // 10 second timeout
    });
    const html = response.data;

    // Method 1: Use Readability for article content
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    if (article && article.textContent) {
      return cleanText(article.textContent);
    }
    
    // Method 2: Fallback to Cheerio if Readability fails
    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $('script, style, nav, footer, iframe, header, .header, .footer, .nav, .menu, .advertisement, .ads, .ad, [aria-hidden="true"]').remove();
    
    // Better paragraph extraction
    let paragraphs = [];
    $('p, h1, h2, h3, h4, h5, h6, li').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 0) {
        paragraphs.push(text);
      }
    });
    
    if (paragraphs.length > 0) {
      return cleanText(paragraphs.join(' '));
    }
    
    // Extract text from article or main content
    const mainContent = $('article, main, .content, .article, .post, #content, #main').text();
    if (mainContent && mainContent.length > 100) {
      return cleanText(mainContent);
    }
    
    // Last resort: extract body text with better filtering
    let bodyText = '';
    $('body *').each((i, el) => {
      if (el.type === 'text' && $(el).text().trim().length > 0) {
        bodyText += ' ' + $(el).text().trim();
      }
    });
    
    return cleanText(bodyText || $('body').text());
  } catch (error) {
    console.error(`Cheerio extraction failed for ${url}:`, error);
    return ''; // Return empty string to trigger Puppeteer fallback
  }
}

/**
 * Extract content using Puppeteer
 * @param {string} url - The URL to extract from
 * @returns {Promise<string>} - The extracted content
 */
async function extractWithPuppeteer(url) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Handle navigation timeout
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 // 30 second timeout
    });
    
    // Wait for content to load
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Improved content extraction
    const content = await page.evaluate(() => {
      // Remove unwanted elements
      const elementsToRemove = document.querySelectorAll('script, style, nav, footer, iframe, header, [aria-hidden="true"]');
      elementsToRemove.forEach(el => el.remove());
      
      // Extract paragraphs and headings for better content
      const paragraphs = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li'))
        .map(el => el.textContent.trim())
        .filter(text => text.length > 0);
      
      if (paragraphs.length > 0) {
        return paragraphs.join(' ');
      }
      
      // Fallback to main content areas
      const mainContent = document.querySelector('article, main, .content, .article, .post, #content, #main');
      return mainContent ? mainContent.textContent : document.body.textContent;
    });
    
    return cleanText(content);
  } catch (error) {
    console.error(`Puppeteer extraction failed for ${url}:`, error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { extractUrlContent };