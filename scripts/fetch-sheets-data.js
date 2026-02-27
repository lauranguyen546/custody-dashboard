#!/usr/bin/env node
/**
 * Fetch Sheets Data Script
 * ========================
 * Uses Google Sheets API v4 to download data
 * Saves as CSV and calls process-custody-data.js
 * 
 * USAGE:
 *   node scripts/fetch-sheets-data.js
 * 
 * ENVIRONMENT VARIABLES:
 *   GOOGLE_SHEETS_API_KEY - Your Google Sheets API key
 *   GOOGLE_SHEETS_ID - The spreadsheet ID (default: 1sXBco6sNFGMl2DQG61Z34jRcg3JTMuuMW4mI5vaTDyY)
 *   GOOGLE_SHEETS_RANGE - The range to fetch (default: 'Parenting Time'!A1:AM1000)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Default configuration
const DEFAULT_SHEET_ID = '1sXBco6sNFGMl2DQG61Z34jRcg3JTMuuMW4mI5vaTDyY';
const DEFAULT_RANGE = 'Parenting Time!A1:AM1000';

/**
 * Fetch data from Google Sheets API v4
 * @param {string} apiKey - Google Sheets API key
 * @param {string} sheetId - Spreadsheet ID
 * @param {string} range - Cell range to fetch
 * @returns {Promise<Array>} Sheet data
 */
async function fetchSheetData(apiKey, sheetId, range) {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedRange}?key=${apiKey}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          if (json.error) {
            reject(new Error(`API Error: ${json.error.message}`));
            return;
          }
          
          if (!json.values || json.values.length === 0) {
            reject(new Error('No data found in sheet'));
            return;
          }
          
          resolve(json.values);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });
  });
}

/**
 * Convert array data to CSV string
 * @param {Array} data - Array of rows
 * @returns {string} CSV content
 */
function convertToCSV(data) {
  return data.map(row => {
    return row.map(cell => {
      // Escape cells containing commas, quotes, or newlines
      const cellStr = String(cell || '').replace(/"/g, '""');
      if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
        return `"${cellStr}"`;
      }
      return cellStr;
    }).join(',');
  }).join('\n');
}

/**
 * Save data to CSV file
 * @param {string} csvPath - Path to save CSV
 * @param {Array} data - Sheet data
 */
function saveCSV(csvPath, data) {
  const csvContent = convertToCSV(data);
  fs.writeFileSync(csvPath, csvContent, 'utf-8');
  console.log(`✓ CSV saved to: ${csvPath}`);
}

/**
 * Run the process-custody-data.js script
 * @param {string} csvPath - Path to CSV file
 */
function processData(csvPath) {
  const processScript = path.join(__dirname, 'process-custody-data.js');
  
  if (!fs.existsSync(processScript)) {
    console.error(`Process script not found: ${processScript}`);
    return;
  }

  console.log('\n→ Running data processing...');
  try {
    execSync(`node "${processScript}" "${csvPath}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
  } catch (e) {
    console.error('Processing failed:', e.message);
    throw e;
  }
}

/**
 * Main function
 */
async function main() {
  // Get configuration from environment or use defaults
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetId = process.env.GOOGLE_SHEETS_ID || DEFAULT_SHEET_ID;
  const range = process.env.GOOGLE_SHEETS_RANGE || DEFAULT_RANGE;
  
  // Determine paths
  const dataDir = path.join(__dirname, '..', 'data');
  const csvPath = path.join(dataDir, 'custody-data.csv');
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  console.log('=== Fetching Custody Data from Google Sheets ===');
  console.log(`Sheet ID: ${sheetId}`);
  console.log(`Range: ${range}`);
  
  if (!apiKey) {
    console.error('\n❌ Error: GOOGLE_SHEETS_API_KEY environment variable is required');
    console.error('\nTo get an API key:');
    console.error('  1. Go to https://console.cloud.google.com');
    console.error('  2. Create a new project or select existing');
    console.error('  3. Enable Google Sheets API');
    console.error('  4. Go to Credentials → Create Credentials → API Key');
    console.error('  5. Restrict the key to Google Sheets API only');
    console.error('\nThen run:');
    console.error('  export GOOGLE_SHEETS_API_KEY=your_api_key_here');
    console.error('  node scripts/fetch-sheets-data.js');
    process.exit(1);
  }
  
  try {
    // Fetch data from Google Sheets
    console.log('\n→ Fetching data from Google Sheets API...');
    const data = await fetchSheetData(apiKey, sheetId, range);
    console.log(`✓ Retrieved ${data.length} rows`);
    
    // Save to CSV
    saveCSV(csvPath, data);
    
    // Process the data
    processData(csvPath);
    
    console.log('\n✓ All done!');
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    
    if (error.message.includes('API key not valid')) {
      console.error('\nTroubleshooting:');
      console.error('  - Verify your API key is correct');
      console.error('  - Ensure Google Sheets API is enabled in your Google Cloud project');
      console.error('  - Check that the sheet is shared publicly or with the API key');
    }
    
    if (error.message.includes('Unable to parse range')) {
      console.error('\nTroubleshooting:');
      console.error('  - Verify the sheet name "Parenting Time" exists');
      console.error('  - Check that the sheet has data in the expected range');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fetchSheetData, convertToCSV };
