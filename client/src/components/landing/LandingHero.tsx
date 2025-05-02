import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

/**
 * Hero section component for the landing page
 * This is the main section that visitors see first
 */
const LandingHero = () => {
  return (
    <section className="w-full py-24 md:py-36 lg:py-40 xl:py-48 bg-[#0a0c16] border-b border-[#1a1e36]/40 relative overflow-hidden">
      {/* Soccer field pattern background - subtle overlay */}
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
          backgroundBlendMode: "overlay",
          mixBlendMode: "luminosity"
        }}
      ></div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-[#4d79ff] mb-4">
            For Soccer Tournament Directors.
          </h1>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-[#4d79ff] mb-12">
            By Soccer Tournament Directors.
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <p className="text-base md:text-lg text-gray-300 mb-6">
              Our software is built with adaptability at its core. From player development to game-day management, we're constantly iterating, refining, and pushing boundaries. Every update, every feature, and every integration is driven by real-world feedback and forward-thinking strategy.
            </p>
            <p className="text-base md:text-lg text-gray-300 mb-12">
              We envision a sports ecosystem where data isn't just collected, it's translated into actionable insight — where coaches, players, and organizations are empowered by software that grows with the game.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/#features">
              <Button size="lg" variant="outline" className="text-gray-300 border-gray-600 hover:bg-[#1a1e36] hover:text-white">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;