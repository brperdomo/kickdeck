/**
 * AdminPageWrapper — Lightweight dark-theme wrapper for standalone admin pages.
 *
 * Use this for admin pages that are NOT inside the main AdminDashboardLayout
 * (e.g. Brevo setup, accounting codes, game cards, etc.).
 *
 * Provides the same CRT-scanline / neon-grid background as the main dashboard
 * without the sidebar or top-nav chrome.
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NeonBackground } from '@/components/admin/NeonBackground';

interface AdminPageWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  backUrl?: string;
  backLabel?: string;
}

export function AdminPageWrapper({
  children,
  title,
  subtitle,
  backUrl,
  backLabel = 'Back to Dashboard',
}: AdminPageWrapperProps) {
  const [, navigate] = useLocation();

  // Toggle dashboard-dark-active on body so portalled elements
  // (dialogs, popovers, selects) pick up the dark CSS variables.
  useEffect(() => {
    document.body.classList.add('dashboard-dark-active');
    return () => {
      document.body.classList.remove('dashboard-dark-active');
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col dashboard-dark"
      style={{
        backgroundColor: '#0f0f1a',
        backgroundImage: [
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, transparent 1px, transparent 3px)',
          'linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px)',
          'linear-gradient(180deg, #0f0f1a 0%, #0d0b2e 100%)',
        ].join(', '),
        backgroundSize: '100% 3px, 60px 60px, 60px 60px, 100% 100%',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Neon ambient background — z-index:1, behind all content */}
      <NeonBackground />

      {/* Page content — z-index:2 */}
      <div className="relative flex-1 p-3 sm:p-6 md:p-8" style={{ zIndex: 2 }}>
        {/* Optional header with back button + title */}
        {(backUrl || title) && (
          <div className="max-w-7xl mx-auto mb-6">
            {backUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(backUrl)}
                className="mb-3 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLabel}
              </Button>
            )}
            {title && (
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight neon-text-glow">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main content area */}
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
