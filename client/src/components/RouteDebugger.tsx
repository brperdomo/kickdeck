import { useLocation } from 'wouter';
import { useEffect } from 'react';

type RouteDebuggerProps = {
  enableConsoleLog?: boolean;
};

// A debug component to show current route information
// Place this in any component to see route details
export function RouteDebugger({ enableConsoleLog = true }: RouteDebuggerProps) {
  const [location] = useLocation();
  
  useEffect(() => {
    if (enableConsoleLog) {
      console.log("Current route location (Wouter):", location);
      console.log("Current URL:", window.location.href);
      console.log("Current pathname:", window.location.pathname);
      console.log("Current search:", window.location.search);
    }
  }, [location, enableConsoleLog]);
  
  return (
    <div className="fixed bottom-2 left-2 bg-black/80 text-white p-2 rounded text-xs z-50 max-w-sm">
      <p><strong>Route:</strong> {location}</p>
      <p><strong>Path:</strong> {window.location.pathname}</p>
      <p><strong>Auth:</strong> {sessionStorage.getItem('user_authenticated') ? 'Yes' : 'No'}</p>
      <p><strong>Admin:</strong> {sessionStorage.getItem('user_is_admin') ? 'Yes' : 'No'}</p>
      <button 
        onClick={() => window.location.href = '/admin-emergency'} 
        className="mt-1 bg-red-500 hover:bg-red-600 p-1 rounded text-white text-xs"
      >
        Emergency Admin
      </button>
    </div>
  );
}