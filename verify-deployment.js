/**
 * Deployment verification script
 * Run this script to verify that your deployment is working correctly
 * Usage: node verify-deployment.js https://your-replit-url.repl.co
 */

const https = require('https');
const http = require('http');

// Get the target URL from command line arguments
const targetUrl = process.argv[2] || 'http://localhost:3000';
console.log(`Verifying deployment at: ${targetUrl}`);

// Test API endpoints
const apiEndpoints = [
  '/api/generate-id',
  '/api/user'
];

// Test pages
const pages = [
  '/',
  '/login',
  '/register'
];

/**
 * Makes a GET request to a given path
 * @param {string} path - The path to request
 * @returns {Promise<object>} - Promise resolving to the response data
 */
function makeGetRequest(path) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(path, targetUrl);
    const protocol = fullUrl.protocol === 'https:' ? https : http;
    
    console.log(`Testing: ${fullUrl.toString()}`);
    
    const req = protocol.get(fullUrl, (res) => {
      const statusCode = res.statusCode;
      const contentType = res.headers['content-type'];
      
      let error;
      if (statusCode !== 200) {
        error = new Error(`Request Failed: Status Code: ${statusCode}`);
      }
      
      if (error) {
        // Consume response data to free up memory
        res.resume();
        reject(error);
        return;
      }
      
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          if (contentType && contentType.includes('application/json')) {
            const parsedData = JSON.parse(rawData);
            resolve(parsedData);
          } else {
            // For HTML pages, just check if we got a response
            resolve({ success: true, type: 'html' });
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (e) => {
      reject(e);
    });
    
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error(`Request timeout: ${fullUrl.toString()}`));
    });
  });
}

/**
 * Makes a POST request to a given path with a JSON body
 * @param {string} path - The path to request
 * @param {object} body - The JSON body to send
 * @returns {Promise<object>} - Promise resolving to the response data
 */
function makePostRequest(path, body) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(path, targetUrl);
    const protocol = fullUrl.protocol === 'https:' ? https : http;
    
    console.log(`Testing POST: ${fullUrl.toString()}`);
    
    const data = JSON.stringify(body);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = protocol.request(fullUrl, options, (res) => {
      const statusCode = res.statusCode;
      
      let error;
      if (statusCode !== 200) {
        error = new Error(`Request Failed: Status Code: ${statusCode}`);
      }
      
      if (error) {
        // Consume response data to free up memory
        res.resume();
        reject(error);
        return;
      }
      
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (e) => {
      reject(e);
    });
    
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error(`Request timeout: ${fullUrl.toString()}`));
    });
    
    req.write(data);
    req.end();
  });
}

/**
 * Run all the tests
 */
async function runTests() {
  console.log('Starting verification tests...');
  let success = true;
  
  // Test API endpoints
  console.log('\n--- Testing API Endpoints ---');
  for (const endpoint of apiEndpoints) {
    try {
      const result = await makeGetRequest(endpoint);
      console.log(`✅ ${endpoint}: ${JSON.stringify(result).slice(0, 100)}${JSON.stringify(result).length > 100 ? '...' : ''}`);
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
      success = false;
    }
  }
  
  // Test login API
  console.log('\n--- Testing Login API ---');
  try {
    const result = await makePostRequest('/api/login', {
      email: 'admin@example.com',
      password: 'password'
    });
    console.log(`✅ Login API: ${JSON.stringify(result).slice(0, 100)}${JSON.stringify(result).length > 100 ? '...' : ''}`);
  } catch (error) {
    console.log(`❌ Login API: ${error.message}`);
    success = false;
  }
  
  // Test pages
  console.log('\n--- Testing Pages ---');
  for (const page of pages) {
    try {
      await makeGetRequest(page);
      console.log(`✅ ${page} loaded successfully`);
    } catch (error) {
      console.log(`❌ ${page}: ${error.message}`);
      success = false;
    }
  }
  
  // Print summary
  console.log('\n--- Test Summary ---');
  if (success) {
    console.log('✅ All tests passed! Your deployment is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the logs above for details.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Verification failed with error:', error);
  process.exit(1);
});