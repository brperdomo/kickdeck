import { createContext, useContext, useState, useMemo } from 'react';
import type { SelectOrganizationSettings } from '@db/schema';

interface BrandingPreview extends Partial<SelectOrganizationSettings> {
  isDraft?: boolean;
}

interface BrandingPreviewContext {
  preview: BrandingPreview;
  updatePreview: (settings: Partial<BrandingPreview>) => void;
}

const BrandingPreviewContext = createContext<BrandingPreviewContext | null>(null);

export function BrandingPreviewProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreview] = useState<BrandingPreview>(() => ({
    name: '',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    logoUrl: '',
    isDraft: true,
  }));

  const updatePreview = (settings: Partial<BrandingPreview>) => {
    setPreview(prev => ({ ...prev, ...settings }));
  };

  const value = useMemo(() => ({ preview, updatePreview }), [preview]);

  return (
    <BrandingPreviewContext.Provider value={value}>
      {children}
    </BrandingPreviewContext.Provider>
  );
}

export function useBrandingPreview() {
  const context = useContext(BrandingPreviewContext);
  if (!context) {
    throw new Error('useBrandingPreview must be used within a BrandingPreviewProvider');
  }
  return context;
}