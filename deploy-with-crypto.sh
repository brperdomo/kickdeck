#!/bin/bash

# Deployment script with crypto module support
set -e

echo "Starting deployment with crypto module support..."

# Ensure dist directory exists
mkdir -p dist/server

# Copy crypto module to dist
echo "Copying crypto module to dist directory..."
cp server/crypto.ts dist/server/crypto.js
sed -i 's/export const crypto/export const crypto/g' dist/server/crypto.js
sed -i 's/import { randomBytes } from "crypto";/import crypto from "crypto"; const { randomBytes, scrypt, timingSafeEqual } = crypto;/g' dist/server/crypto.js
sed -i 's/import { scrypt, timingSafeEqual } from "crypto";//g' dist/server/crypto.js

# Create the dual-mode server if it doesn't exist
echo "Setting up dual-mode server..."
cp deploy-dual-mode-crypto.js index.js

# Create a simple server.js that imports index.js for CommonJS compatibility
echo "Creating server.js for CommonJS compatibility..."
cat > server.js << 'EOF'
/**
 * CommonJS entry point for the server
 */
const server = require('./index.js');
EOF

# Set up basic HTML page
echo "Setting up basic HTML page..."
mkdir -p dist
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MatchPro Soccer Management</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f4f7fc;
      color: #333;
    }
    .container {
      max-width: 800px;
      text-align: center;
      padding: 2rem;
    }
    h1 {
      color: #0056b3;
      margin-bottom: 1rem;
    }
    p {
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .logo {
      width: 150px;
      margin-bottom: 2rem;
    }
    .status {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background-color: #e6f7ff;
      border-left: 4px solid #1890ff;
      border-radius: 4px;
    }
    .login-form {
      margin-top: 2rem;
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
    }
    .form-group {
      margin-bottom: 1rem;
      text-align: left;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      box-sizing: border-box;
    }
    button {
      background-color: #0056b3;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    button:hover {
      background-color: #003d82;
    }
    .error-message {
      color: #ff4d4f;
      margin-top: 1rem;
      text-align: left;
    }
    #user-info {
      margin-top: 1rem;
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: left;
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="https://i.imgur.com/G3yyHJx.png" alt="MatchPro Logo" class="logo">
    <h1>MatchPro Soccer Management</h1>
    <p>Your comprehensive platform for managing soccer facilities, teams, and events.</p>
    
    <div class="status">
      <span>API Status: </span>
      <span id="api-status">Checking...</span>
    </div>
    
    <div class="login-form">
      <h2>Login</h2>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" placeholder="admin@example.com" value="admin@example.com">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" placeholder="password" value="password">
      </div>
      <button id="login-button">Login</button>
      <div class="error-message" id="error-message"></div>
    </div>
    
    <div id="user-info">
      <h3>Current User</h3>
      <pre id="user-info-data"></pre>
    </div>
  </div>

  <script>
    const apiStatus = document.getElementById('api-status');
    const loginButton = document.getElementById('login-button');
    const errorMessage = document.getElementById('error-message');
    const userInfo = document.getElementById('user-info');
    const userInfoData = document.getElementById('user-info-data');
    
    // Check API status
    fetch('/api/generate-id')
      .then(response => {
        if (response.ok) return response.json();
        throw new Error('API server is not responding');
      })
      .then(data => {
        console.log('API response:', data);
        apiStatus.textContent = `Connected (ID: ${data.id})`;
        apiStatus.style.color = 'green';
        
        // Check if user is already logged in
        return fetch('/api/user');
      })
      .then(response => {
        if (response.ok) return response.json();
        return null;
      })
      .then(user => {
        if (user) {
          displayUserInfo(user);
        }
      })
      .catch(error => {
        console.error('API error:', error);
        apiStatus.textContent = 'Disconnected';
        apiStatus.style.color = 'red';
      });
    
    // Handle login form submission
    loginButton.addEventListener('click', () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        errorMessage.textContent = 'Please enter email and password';
        return;
      }
      
      errorMessage.textContent = '';
      loginButton.disabled = true;
      loginButton.textContent = 'Logging in...';
      
      fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      .then(response => {
        if (response.ok) return response.json();
        throw new Error('Login failed');
      })
      .then(data => {
        if (data.success) {
          displayUserInfo(data.user);
        } else {
          errorMessage.textContent = data.message || 'Login failed';
        }
      })
      .catch(error => {
        console.error('Login error:', error);
        errorMessage.textContent = error.message || 'An error occurred during login';
      })
      .finally(() => {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
      });
    });
    
    function displayUserInfo(user) {
      userInfoData.textContent = JSON.stringify(user, null, 2);
      userInfo.style.display = 'block';
    }
  </script>
</body>
</html>
EOF

echo "Setting execute permission on server files..."
chmod +x index.js
chmod +x server.js

echo "Deployment setup complete!"
echo "To run the server, use: node server.js"
echo "The application will be available at the URL provided by Replit"