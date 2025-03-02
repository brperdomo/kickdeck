import React from "react";
import { useBrandingPreview } from "@/hooks/use-branding-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BrandingPreview() {
  const { preview } = useBrandingPreview();

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Logo Preview */}
          {preview.logoUrl && (
            <div className="flex justify-center p-4 bg-background rounded-lg">
              <img
                src={preview.logoUrl}
                alt="Organization logo"
                className="h-20 w-20 object-contain"
              />
            </div>
          )}
          {/* Color Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: preview.primaryColor || undefined }}
              />
              <span className="text-sm">Primary Color</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: preview.secondaryColor || undefined }}
              />
              <span className="text-sm">Secondary Color</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}