import React from 'react';
import Footer from '@/components/ui/Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * MainLayout component wraps all content with a footer
 * This ensures the "powered by KickDeck" text is displayed on every page
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        {children}
      </div>
      <Footer />
    </div>
  );
}

export default MainLayout;