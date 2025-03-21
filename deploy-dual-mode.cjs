/**
 * Dual-mode deployment script for both ESM and CommonJS
 * This is designed to work around Replit's deployment quirks
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting dual-mode deployment setup...');

// Check for package.json and add necessary scripts
try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  console.log('Reading package.json...');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add/update scripts but keep the original start script
    const originalStart = packageJson.scripts ? packageJson.scripts.start : null;
    
    packageJson.scripts = packageJson.scripts || {};
    
    // Add our dual-mode server as the replit:start script
    packageJson.scripts['replit:start'] = 'node deploy-dual-mode-server.js';
    
    console.log('Updating package.json with dual-mode start script...');
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('Original start script:', originalStart);
    console.log('New replit:start script:', packageJson.scripts['replit:start']);
  } else {
    console.error('package.json not found!');
  }
} catch (error) {
  console.error('Error updating package.json:', error);
}

// Update or create .replit file to force the correct command
try {
  const replitPath = path.join(__dirname, '.replit');
  console.log('Updating .replit configuration...');
  
  const replitContent = `
modules = ["nodejs-20", "web", "postgresql-16"]
run = "npm run dev"
hidden = [".config", ".git", "generated-icon.png", "node_modules", "dist"]

[nix]
channel = "stable-24_05"

[deployment]
deploymentTarget = "cloudrun"
build = ["sh", "-c", "npm run build"]
run = ["sh", "-c", "node deploy-dual-mode-server.js"]

[[ports]]
localPort = 3000
externalPort = 3001

[[ports]]
localPort = 5000
externalPort = 80

[[ports]]
localPort = 5001
externalPort = 3002

[[ports]]
localPort = 8080
externalPort = 8080

[[ports]]
localPort = 24678
externalPort = 3000

[workflows]
runButton = "Start application"
`;
  
  // Writing new replit configuration
  fs.writeFileSync(replitPath, replitContent);
  console.log('.replit file updated successfully.');
} catch (error) {
  console.error('Error updating .replit file:', error);
}

// Ensure the dual-mode server file exists and is executable
try {
  const serverPath = path.join(__dirname, 'deploy-dual-mode-server.js');
  if (!fs.existsSync(serverPath)) {
    console.error('deploy-dual-mode-server.js not found! Please create it first.');
    process.exit(1);
  }
  
  // On Unix systems, make it executable (won't hurt on Windows)
  try {
    execSync(`chmod +x ${serverPath}`);
    console.log('Made dual-mode server executable');
  } catch (err) {
    console.log('Could not change file permissions, but this is OK on some systems:', err.message);
  }
} catch (error) {
  console.error('Error checking server file:', error);
}

// Create a simple index.html fallback
try {
  const indexPath = path.join(__dirname, 'index.html');
  const indexContent = `
<!DOCTYPE html>
<html>
  <head>
    <title>MatchPro Soccer Management Platform</title>
    <meta http-equiv="refresh" content="0;url=/app">
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
      .container { max-width: 800px; margin: 0 auto; }
      h1 { color: #0056b3; }
      .button { 
        display: inline-block; 
        background-color: #0056b3; 
        color: white; 
        padding: 10px 20px; 
        text-decoration: none; 
        border-radius: 4px; 
        margin-top: 20px; 
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>MatchPro Soccer Management Platform</h1>
      <p>The application is redirecting...</p>
      <p>If you are not redirected automatically, please click the button below.</p>
      <a href="/app" class="button">Go to Application</a>
    </div>
  </body>
</html>`;
  
  fs.writeFileSync(indexPath, indexContent);
  console.log('Created fallback index.html');
} catch (error) {
  console.error('Error creating index.html:', error);
}

console.log('Dual-mode deployment setup complete!');
console.log('To deploy, run: node deploy-dual-mode.cjs && npm run build');