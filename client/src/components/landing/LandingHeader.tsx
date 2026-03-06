import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X
} from 'lucide-react';

/**
 * Header component for the landing page
 * Contains the logo, navigation links, and CTA buttons
 */
const LandingHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1a1e36]/40 bg-[#0a0c16]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0c16]/80">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <img 
              src="/uploads/KickDeck_Linear_White.png" 
              alt="KickDeck.io" 
              className="h-10 md:h-12 w-auto"
              onError={(e) => {
                // Fallback in case the image doesn't load
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loop
                target.src = "https://placehold.co/200x50/1a1e36/4d79ff.png?text=KickDeck.io";
              }} 
            />
          </Link>
        </div>
        
        {/* Center Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-8 bg-[#1a1e36] px-6 py-1 rounded-full">
          <Link href="/#features" className="text-sm font-medium text-[#4d79ff] transition-colors hover:text-white">
            Features
          </Link>
          <Link href="/#testimonials" className="text-sm font-medium text-[#4d79ff] transition-colors hover:text-white">
            Testimonials
          </Link>
          <Link href="/#pricing" className="text-sm font-medium text-[#4d79ff] transition-colors hover:text-white">
            Pricing
          </Link>
          <Link href="/#contact" className="text-sm font-medium text-[#4d79ff] transition-colors hover:text-white">
            Contact
          </Link>
        </nav>
        
        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex md:items-center md:gap-3">
          <Link href="/auth">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">Login</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              Get Started
            </Button>
          </Link>
          <Link href="/#contact">
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-full text-white">
              CONTACT US
            </Button>
          </Link>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="flex items-center justify-center rounded-md p-2 text-gray-300 hover:bg-[#1a1e36] hover:text-white md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle menu</span>
        </button>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="container max-w-7xl mx-auto md:hidden bg-[#0a0c16]/95 border-b border-[#1a1e36]/40">
          <nav className="flex flex-col space-y-3 p-4 px-4 md:px-8">
            <Link 
              href="/#features" 
              className="text-sm font-medium text-[#4d79ff] transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/#testimonials" 
              className="text-sm font-medium text-[#4d79ff] transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Testimonials
            </Link>
            <Link 
              href="/#pricing" 
              className="text-sm font-medium text-[#4d79ff] transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/#contact" 
              className="text-sm font-medium text-[#4d79ff] transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-gray-300 hover:text-white">
                  Login
                </Button>
              </Link>
              <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;