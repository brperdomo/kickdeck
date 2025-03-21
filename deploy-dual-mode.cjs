/**
 * Dual-mode deployment setup for Replit
 * This script configures Replit to use our dual-mode server for deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Runs a system command and returns the output
 */
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return null;
  }
}

/**
 * Creates a fallback index.html file
 */
function createFallbackIndex() {
  const indexContent = `
<!DOCTYPE html>
<html>
  <head>
    <title>MatchPro Soccer Management Platform</title>
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
      <p>The application is running successfully.</p>
      <a href="/app" class="button">Go to Application</a>
    </div>
  </body>
</html>
  `;

  fs.writeFileSync('index.html', indexContent);
  console.log('Created fallback index.html file');
}

/**
 * Main function to setup the dual-mode deployment
 */
function setupDualModeDeployment() {
  console.log('Setting up dual-mode deployment for Replit...');

  // 1. Create a fallback index.html file
  createFallbackIndex();

  // 2. Install required dependencies
  console.log('Installing http-proxy dependency...');
  runCommand('npm install http-proxy --no-save');

  // 3. Create a .replit file if it doesn't exist
  if (!fs.existsSync('.replit')) {
    const replitContent = `
entrypoint = "deploy-dual-mode-server.js"
modules = ["nodejs-20:v8-20230920-bd784b9"]

hidden = [".config", "package-lock.json"]

[nix]
channel = "stable-23_05"

[deployment]
run = ["node", "deploy-dual-mode-server.js"]
deploymentTarget = "cloudrun"
ignorePorts = false

[rules]

[rules.formatter]

[rules.formatter.fileExtensions]

[rules.formatter.fileExtensions.".js"]
id = "formatter_prettier"

[rules.formatter.fileExtensions.".ts"]
id = "formatter_prettier"

[rules.formatter.fileExtensions.".html"]
id = "formatter_prettier"
    `;
    fs.writeFileSync('.replit', replitContent);
    console.log('Created .replit configuration file');
  } else {
    console.log('.replit file already exists, updating deployment configuration...');
    
    // Read the current .replit file
    let replitConfig = fs.readFileSync('.replit', 'utf8');
    
    // Update the entrypoint and deployment settings
    if (replitConfig.includes('entrypoint =')) {
      replitConfig = replitConfig.replace(/entrypoint = .*/, 'entrypoint = "deploy-dual-mode-server.js"');
    } else {
      replitConfig += '\nentrypoint = "deploy-dual-mode-server.js"';
    }
    
    if (replitConfig.includes('[deployment]')) {
      // Update existing deployment section
      let inDeployment = false;
      let updatedConfig = '';
      
      for (const line of replitConfig.split('\n')) {
        if (line.trim() === '[deployment]') {
          inDeployment = true;
          updatedConfig += line + '\n';
        } else if (inDeployment && line.match(/run =/)) {
          updatedConfig += 'run = ["node", "deploy-dual-mode-server.js"]\n';
        } else if (inDeployment && line.match(/deploymentTarget =/)) {
          updatedConfig += 'deploymentTarget = "cloudrun"\n';
        } else if (inDeployment && line.match(/ignorePorts =/)) {
          updatedConfig += 'ignorePorts = false\n';
        } else if (line.trim().startsWith('[') && line.trim() !== '[deployment]') {
          inDeployment = false;
          updatedConfig += line + '\n';
        } else {
          updatedConfig += line + '\n';
        }
      }
      
      replitConfig = updatedConfig;
    } else {
      // Add deployment section
      replitConfig += `
[deployment]
run = ["node", "deploy-dual-mode-server.js"]
deploymentTarget = "cloudrun"
ignorePorts = false
      `;
    }
    
    // Write the updated config back to .replit
    fs.writeFileSync('.replit', replitConfig);
    console.log('Updated .replit deployment configuration');
  }

  // 4. Create a replit.nix file if it doesn't exist or update it
  if (!fs.existsSync('replit.nix')) {
    const nixContent = `
{ pkgs }: {
	deps = [
		pkgs.nodejs-20_x
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
	];
}
    `;
    fs.writeFileSync('replit.nix', nixContent);
    console.log('Created replit.nix file');
  }

  // 5. Ensure dual-mode-server.js is executable
  try {
    fs.chmodSync('deploy-dual-mode-server.js', '755');
    console.log('Made deploy-dual-mode-server.js executable');
  } catch (error) {
    console.warn('Unable to make deploy-dual-mode-server.js executable:', error.message);
  }

  console.log('\nDual-mode deployment setup complete!');
  console.log('\nNext steps:');
  console.log('1. Run "npm run build" to build your application');
  console.log('2. Click "Deploy" in the Replit interface');
  console.log('\nFor more information, see the DEPLOY-NOW.md file');
}

// Run the deployment setup
setupDualModeDeployment();