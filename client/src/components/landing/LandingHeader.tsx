import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

/**
 * Header component for the landing page
 * Contains the logo, navigation links, and CTA buttons
 */
const LandingHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1a1e36]/40 bg-[#0a0c16]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0c16]/80">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="MatchPro.ai" 
              className="h-10 w-auto"
              onError={(e) => {
                // Fallback in case the image doesn't load
                const target = e.target as HTMLImageElement;
                target.src = "https://raw.githubusercontent.com/replit/replit.github.io/main/static/images/logo.svg";
              }} 
            />
            <span className="ml-2 text-xl font-bold text-white hidden md:inline">MATCHPRO.AI</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-5">
          <Link href="/#features" className="text-sm font-medium text-gray-300 transition-colors hover:text-primary">
            Features
          </Link>
          <Link href="/#testimonials" className="text-sm font-medium text-gray-300 transition-colors hover:text-primary">
            Testimonials
          </Link>
          <Link href="/#pricing" className="text-sm font-medium text-gray-300 transition-colors hover:text-primary">
            Pricing
          </Link>
          <Link href="/#contact" className="text-sm font-medium text-gray-300 transition-colors hover:text-primary">
            Contact
          </Link>
        </nav>
        
        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex md:items-center md:gap-2">
          <Link href="/auth">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-[#1a1e36]">Login</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white">
              Get Started
            </Button>
          </Link>
        </div>
        
        {/* Contact Us Button - Matches the image design */}
        <div className="hidden md:flex">
          <Link href="/#contact">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-full text-white">
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
        <div className="container md:hidden bg-[#0a0c16]/95 border-b border-[#1a1e36]/40">
          <nav className="flex flex-col space-y-3 p-4">
            <Link 
              href="/#features" 
              className="text-sm font-medium text-gray-300 transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/#testimonials" 
              className="text-sm font-medium text-gray-300 transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Testimonials
            </Link>
            <Link 
              href="/#pricing" 
              className="text-sm font-medium text-gray-300 transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/#contact" 
              className="text-sm font-medium text-gray-300 transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-[#1a1e36]">
                  Login
                </Button>
              </Link>
              <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white">
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