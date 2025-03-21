/**
 * Force server deployment for Replit
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting forced server deployment process...');

// Check for package.json and add necessary scripts
try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  console.log('Reading package.json...');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add/update scripts
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts.start = 'node server.js';
    packageJson.scripts['replit:start'] = 'node server.js';
    
    console.log('Updating package.json with forced start script...');
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
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
run = ["sh", "-c", "node server.js"]

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

// Ensure the server.js file exists and is executable
try {
  const serverJsPath = path.join(__dirname, 'server.js');
  if (!fs.existsSync(serverJsPath)) {
    console.error('server.js not found! Please create it first.');
    process.exit(1);
  }
  
  // On Unix systems, make it executable (won't hurt on Windows)
  try {
    execSync(`chmod +x ${serverJsPath}`);
    console.log('Made server.js executable');
  } catch (err) {
    console.log('Could not change file permissions, but this is OK on some systems:', err.message);
  }
} catch (error) {
  console.error('Error checking server.js:', error);
}

console.log('Deployment configuration complete!');
console.log('To deploy, run: node deploy-force-server.js && npm run build');