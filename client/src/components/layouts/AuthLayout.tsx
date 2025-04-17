import React from 'react';
import AuthFooter from '@/components/ui/AuthFooter';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * AuthLayout component wraps auth pages with a purple-styled footer
 * Specifically designed for login, register, and forgot password pages
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        {children}
      </div>
      <AuthFooter />
    </div>
  );
}

export default AuthLayout;