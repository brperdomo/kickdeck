import React from 'react';
import { Link, useLocation } from 'wouter';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [location] = useLocation();
  
  // Check for routes where footer should not be displayed
  const isAuthPage = location.includes('/auth') || location.includes('/register') || location.includes('/forgot-password');
  const isAdminPage = location.startsWith('/admin');
  
  // Get the current URL to detect if we're already inside a MainLayout
  const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '';
  
  // Don't show footer on admin routes or auth pages when they use MainLayout
  // The check for ?layout=main is a trick to detect if the page is using MainLayout
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
          Powered by <Link href="https://matchpro.ai" className={`font-semibold ${linkColor}`}>MatchPro</Link>
        </p>
        <p className={textColor}>
          &copy; {currentYear} MatchPro. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;