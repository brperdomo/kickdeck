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
            <svg className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" fill="currentColor"/>
            </svg>
            <span className="ml-2 text-xl font-bold text-white hidden md:inline">MATCHPRO.AI</span>
          </Link>
        </div>
        
        {/* Center Navigation */}
        <nav className="hidden absolute left-1/2 transform -translate-x-1/2 md:flex md:items-center md:gap-8">
          <Link href="/#features" className="text-sm font-medium text-gray-300 transition-colors hover:text-blue-400">
            Features
          </Link>
          <Link href="/#testimonials" className="text-sm font-medium text-gray-300 transition-colors hover:text-blue-400">
            Testimonials
          </Link>
          <Link href="/#pricing" className="text-sm font-medium text-gray-300 transition-colors hover:text-blue-400">
            Pricing
          </Link>
          <Link href="/#contact" className="text-sm font-medium text-gray-300 transition-colors hover:text-blue-400">
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
              className="text-sm font-medium text-gray-300 transition-colors hover:text-blue-400"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/#testimonials" 
              className="text-sm font-medium text-gray-300 transition-colors hover:text-blue-400"
              onClick={() => setIsMenuOpen(false)}
            >
              Testimonials
            </Link>
            <Link 
              href="/#pricing" 
              className="text-sm font-medium text-gray-300 transition-colors hover:text-blue-400"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/#contact" 
              className="text-sm font-medium text-gray-300 transition-colors hover:text-blue-400"
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