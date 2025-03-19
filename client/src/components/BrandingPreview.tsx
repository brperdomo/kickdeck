
import React from 'react';
import { ImageIcon } from 'lucide-react';

interface BrandingPreviewProps {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
}

export function BrandingPreview({ logoUrl, primaryColor, secondaryColor, className }: BrandingPreviewProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {logoUrl ? (
        <div className="flex justify-center p-4 bg-background rounded-lg">
          <img
            src={logoUrl}
            alt="Logo preview"
            className="h-20 w-20 object-contain"
          />
        </div>
      ) : (
        <div className="flex justify-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <div className="flex items-center gap-4">
        <div>
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: primaryColor }}
          />
          <span className="text-sm">Primary</span>
        </div>
        <div>
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: secondaryColor }}
          />
          <span className="text-sm">Secondary</span>
        </div>
      </div>
    </div>
  );
}
