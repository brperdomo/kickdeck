/**
 * Clear Emulation Utility
 * 
 * This script helps clear any active user emulation by removing
 * emulation-related data from localStorage and sessionStorage.
 */

// Run this immediately when the script is loaded
(function clearEmulation() {
  if (typeof window !== 'undefined') {
    console.log('Clearing user emulation data...');
    
    // Remove emulation data from localStorage
    localStorage.removeItem('emulationToken');
    
    // Remove emulation data from sessionStorage
    sessionStorage.removeItem('emulationActive');
    sessionStorage.removeItem('emulatedAdminName');
    sessionStorage.removeItem('emulatedRoles');
    
    console.log('User emulation data cleared successfully');
  }
})();

export default function clearEmulationData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('emulationToken');
    sessionStorage.removeItem('emulationActive');
    sessionStorage.removeItem('emulatedAdminName');
    sessionStorage.removeItem('emulatedRoles');
  }
  return true;
}