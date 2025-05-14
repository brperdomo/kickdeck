/**
 * Admin Authentication Fix
 * 
 * This script provides a direct way to access the admin section when regular login fails
 * It works by:
 * 1. Directly calling the API endpoints to authenticate
 * 2. Storing authentication state in the browser
 * 3. Redirecting to the admin dashboard
 * 
 * Instructions:
 * 1. Load this script in the browser console on the login page
 * 2. Call the adminEmergencyAccess() function with your credentials
 * 3. The script will attempt to log you in and redirect to the admin dashboard
 * 
 * Example:
 *   adminEmergencyAccess('admin@example.com', 'yourpassword')
 */

async function adminEmergencyAccess(username, password) {
  console.log('🔐 Admin Emergency Access: Starting authentication process...');
  
  try {
    // Step 1: Call login endpoint
    const loginResponse = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed with status: ${loginResponse.status}`);
    }
    
    // Get user data from response
    const userData = await loginResponse.json();
    console.log('✅ Login successful:', userData);
    
    // Verify admin status
    if (!userData.isAdmin) {
      throw new Error('User is not an admin. This tool is only for admin access.');
    }
    
    // Step 2: Set local markers to avoid redirect loops
    document.cookie = "is_authenticated=true; path=/";
    sessionStorage.setItem('user_authenticated', 'true');
    sessionStorage.setItem('user_is_admin', 'true');
    sessionStorage.setItem('admin_login_time', Date.now().toString());
    sessionStorage.setItem('admin_direct_access', 'true');
    
    // Save user data for emergency access
    localStorage.setItem('emergency_admin_user', JSON.stringify(userData));
    
    console.log('✅ Authentication markers set in browser storage');
    
    // Step 3: Redirect to emergency admin page
    console.log('🔄 Redirecting to emergency admin access page...');
    window.location.href = '/admin-emergency';
    
  } catch (error) {
    console.error('❌ Admin Emergency Access Error:', error);
    return false;
  }
}

// Auto-detect presence of the admin form and add an emergency access button
function addEmergencyAccessButton() {
  const loginForm = document.querySelector('form');
  if (!loginForm) return false;
  
  // Look for username/email input
  const usernameInput = document.querySelector('input[type="email"], input[type="text"]');
  const passwordInput = document.querySelector('input[type="password"]');
  
  if (!usernameInput || !passwordInput) return false;
  
  // Create emergency access button
  const button = document.createElement('button');
  button.innerText = 'Emergency Admin Access';
  button.className = 'w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition mt-4';
  button.type = 'button'; // Not a submit button
  
  button.addEventListener('click', () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    
    if (!username || !password) {
      alert('Please enter username and password first');
      return;
    }
    
    adminEmergencyAccess(username, password);
  });
  
  // Add button after the form
  loginForm.appendChild(button);
  return true;
}

// Add button when loaded
if (document.readyState === 'complete') {
  addEmergencyAccessButton();
} else {
  window.addEventListener('load', addEmergencyAccessButton);
}

// Export function for manual console use
window.adminEmergencyAccess = adminEmergencyAccess;

console.log('🚨 Admin Emergency Access Tool loaded!');
console.log('📝 Usage: adminEmergencyAccess("your-email@example.com", "your-password")');