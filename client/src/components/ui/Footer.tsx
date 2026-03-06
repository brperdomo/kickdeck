import React from 'react';
import { Link, useLocation } from 'wouter';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [location] = useLocation();
  
  // Check for routes where footer should not be displayed
  const isAuthPage = location === '/' || location === '/auth' || location.includes('/register') || location.includes('/forgot-password') || location.includes('/reset-password');
  const isAdminPage = location.startsWith('/admin');
  
  // Get the current URL to detect if we're already inside a MainLayout
  const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '';
  
  // Don't show footer on admin routes or auth pages when they use MainLayout
  if (isAdminPage || isAuthPage) {
    return null;
  }
  
  // Use purple for auth pages, gray for other pages
  const textColor = isAuthPage ? 'text-[#3d3a98]' : 'text-gray-600';
  const linkColor = isAuthPage ? 'text-[#3d3a98] hover:text-[#2d2a88]' : 'text-primary hover:underline';
  
  return (
    <footer className="py-4 px-6 text-center text-sm border-t mt-auto relative z-10">
      <div className="container mx-auto flex flex-col items-center justify-center gap-2">
        <p className={textColor}>
          Powered by <Link href="https://kickdeck.io" className={`font-semibold ${linkColor}`}>KickDeck</Link>
        </p>
        <p className={textColor}>
          &copy; {currentYear} KickDeck. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;