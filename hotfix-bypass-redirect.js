/**
 * Dashboard Redirect Bypass Hotfix
 * 
 * This script is a hotfix for bypassing problematic redirects in the React application.
 * It directly loads either the admin or member dashboard based on URL parameters.
 * 
 * HOW TO USE:
 * 1. Open the browser console on your app.matchpro.ai site
 * 2. Copy and paste the entire content of this script into the console
 * 3. Press Enter to execute it
 * 4. The script will navigate you to the appropriate dashboard
 */

(function() {
  console.log('🛠️ Starting Dashboard Redirect Bypass Hotfix');
  
  // Main function to handle the bypass
  function bypassRedirects() {
    // Get the current user from localStorage or sessionStorage if available
    let userData = null;
    try {
      // Try to get user from the auth query cache in localStorage
      const queryCache = JSON.parse(localStorage.getItem('tanstack-query-cache') || '{}');
      const keys = Object.keys(queryCache);
      const userQueryKey = keys.find(key => key.includes('/api/user'));
      
      if (userQueryKey && queryCache[userQueryKey] && queryCache[userQueryKey].state) {
        userData = queryCache[userQueryKey].state.data;
        console.log('📋 User data retrieved from query cache:', userData);
      }
    } catch (error) {
      console.error('❌ Error parsing local storage:', error);
    }
    
    // Let user choose which dashboard to access
    const dashboardType = confirm(
      '📊 Dashboard Access Bypass\n\n' +
      'Click OK to access the ADMIN dashboard\n' +
      'Click Cancel to access the MEMBER dashboard'
    ) ? 'admin' : 'member';
    
    // Create a direct access page
    const accessPage = document.createElement('div');
    accessPage.style.position = 'fixed';
    accessPage.style.top = '0';
    accessPage.style.left = '0';
    accessPage.style.width = '100%';
    accessPage.style.height = '100%';
    accessPage.style.backgroundColor = '#f8fafc';
    accessPage.style.zIndex = '9999';
    accessPage.style.display = 'flex';
    accessPage.style.flexDirection = 'column';
    accessPage.style.alignItems = 'center';
    accessPage.style.justifyContent = 'center';
    accessPage.style.padding = '2rem';
    accessPage.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    
    // Add the content
    accessPage.innerHTML = `
      <div style="max-width: 500px; width: 100%; background-color: white; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); padding: 2rem; text-align: center;">
        <h1 style="color: #0f172a; margin-bottom: 1rem; font-size: 1.5rem;">Dashboard Access Bypass</h1>
        <p style="color: #64748b; margin-bottom: 2rem;">Loading ${dashboardType} dashboard directly...</p>
        <div style="width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; margin: 0 auto 1.5rem; animation: spin 1s linear infinite;"></div>
        <p style="color: #64748b; font-size: 0.875rem;">You'll be redirected automatically in a moment.</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    
    // Add the element to the body
    document.body.appendChild(accessPage);
    
    // Store a flag in sessionStorage to indicate the bypass is active
    sessionStorage.setItem('dashboard_bypass_active', 'true');
    
    // Construct the target dashboard URL depending on the choice
    const targetUrl = dashboardType === 'admin' 
      ? '/admin-direct' 
      : '/dashboard-direct';
      
    console.log(`🚀 Bypassing redirects to: ${targetUrl}`);
    
    // Wait a short time to show the loading screen, then redirect
    setTimeout(() => {
      // Create an invisible iframe to load the target page content directly
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100vh';
      iframe.style.border = 'none';
      iframe.style.position = 'fixed';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.zIndex = '10000'; // Above the accessPage
      
      // Handle iframe load event
      iframe.onload = function() {
        // Remove the loading page once iframe is loaded
        accessPage.style.display = 'none';
        
        // Add a helper bar at the top
        const helperBar = document.createElement('div');
        helperBar.style.position = 'fixed';
        helperBar.style.top = '0';
        helperBar.style.left = '0';
        helperBar.style.width = '100%';
        helperBar.style.backgroundColor = '#1e3a8a';
        helperBar.style.color = 'white';
        helperBar.style.padding = '8px 16px';
        helperBar.style.fontSize = '14px';
        helperBar.style.textAlign = 'center';
        helperBar.style.zIndex = '10001';
        helperBar.innerHTML = `
          <span style="margin-right: 16px;">⚠️ Emergency Access Mode</span>
          <span>You are viewing the ${dashboardType.toUpperCase()} dashboard directly</span>
          <button style="margin-left: 16px; background: white; color: #1e3a8a; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer;" 
                  onclick="window.location.reload()">Exit</button>
        `;
        document.body.appendChild(helperBar);
        
        // Adjust iframe to account for helper bar
        iframe.style.marginTop = helperBar.offsetHeight + 'px';
        iframe.style.height = `calc(100vh - ${helperBar.offsetHeight}px)`;
      };
      
      // Set the iframe source to the target URL
      iframe.src = targetUrl;
      document.body.appendChild(iframe);
    }, 1500);
  }
  
  // Check if bypass is already active to avoid running multiple times
  if (sessionStorage.getItem('dashboard_bypass_active') !== 'true') {
    bypassRedirects();
  } else {
    console.log('⚠️ Bypass already active');
    if (confirm('Dashboard bypass is already active. Reset and try again?')) {
      sessionStorage.removeItem('dashboard_bypass_active');
      window.location.reload();
    }
  }
})();