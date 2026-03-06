import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingTestimonials from '@/components/landing/LandingTestimonials';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingContact from '@/components/landing/LandingContact';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';

/**
 * Landing page for the KickDeck main website
 * This serves as the marketing site on the main domain
 */
export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0c16]">
      <LandingHeader />
      <main className="flex-grow">
        <LandingHero />
        <LandingFeatures />
        <LandingTestimonials />
        <LandingPricing />
        <LandingContact />
      </main>
      <LandingFooter />
    </div>
  );
}

export default LandingPage;