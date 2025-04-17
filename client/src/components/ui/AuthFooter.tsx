import React from 'react';
import { Link } from 'wouter';

export function AuthFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-4 px-6 text-center text-sm border-0 mt-auto relative z-10">
      <div className="container mx-auto flex flex-col items-center justify-center gap-2">
        <p className="text-[#3d3a98] font-medium">
          Powered by <Link href="https://matchpro.ai" className="font-semibold text-[#3d3a98] hover:text-[#2d2a88]">MatchPro</Link>
        </p>
        <p className="text-[#3d3a98] font-medium">
          &copy; {currentYear} MatchPro. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default AuthFooter;