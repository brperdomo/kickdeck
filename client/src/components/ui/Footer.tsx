import React from 'react';
import { Link, useLocation } from 'wouter';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [location] = useLocation();
  
  // Don't show footer on admin routes
  if (location.startsWith('/admin')) {
    return null;
  }
  
  return (
    <footer className="py-4 px-6 text-center text-sm text-gray-600 border-t mt-auto">
      <div className="container mx-auto flex flex-col items-center justify-center gap-2">
        <p>
          Powered by <Link href="https://matchpro.ai" className="font-semibold text-primary hover:underline">MatchPro</Link>
        </p>
        <p>&copy; {currentYear} MatchPro. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;