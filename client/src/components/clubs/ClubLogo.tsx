import React from 'react';
import { Shield } from 'lucide-react';

interface ClubLogoProps {
  logoUrl?: string | null;
  clubName?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ClubLogo({ logoUrl, clubName, size = 'md', className = '' }: ClubLogoProps) {
  // Size mapping
  const sizeMap = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  // Shield icon sizes
  const iconSizeMap = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  // Font sizes for initials
  const fontSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // If there's a logo URL, show the image
  if (logoUrl) {
    return (
      <div className={`relative rounded-full overflow-hidden bg-gray-100 flex-shrink-0 ${sizeMap[size]} ${className}`}>
        <img 
          src={logoUrl} 
          alt={clubName || 'Club logo'} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback in case image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.classList.add('fallback-active');
          }}
        />
        {/* Fallback content that shows if image fails to load */}
        <div className="absolute inset-0 flex items-center justify-center fallback">
          <Shield className={`${iconSizeMap[size]} text-indigo-500`} />
        </div>
      </div>
    );
  }

  // If no logo but has a name, show initials
  if (clubName) {
    // Get initials from club name (max 2 letters)
    const initials = clubName
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return (
      <div className={`rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center ${sizeMap[size]} ${className}`}>
        <span className={`${fontSizeMap[size]} font-medium text-indigo-800`}>
          {initials}
        </span>
      </div>
    );
  }

  // Default fallback (shield icon)
  return (
    <div className={`rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center ${sizeMap[size]} ${className}`}>
      <Shield className={`${iconSizeMap[size]} text-gray-400`} />
    </div>
  );
}