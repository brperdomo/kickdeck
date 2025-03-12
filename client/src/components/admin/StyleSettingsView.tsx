import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export function StyleSettingsView() {
  const { styleConfig, updateStyleConfig, isLoading } = useTheme();
  const [previewStyles, setPreviewStyles] = useState<{ [key: string]: string }>({
    primary: "#164e87",
    secondary: "#859387",
    accent: "#ffc107",
    background: "#ffffff"
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const { toast } = useToast();

  // Load current style config when component mounts
  useEffect(() => {
    if (styleConfig) {
      setPreviewStyles({
        primary: styleConfig.primary || "#164e87",
        secondary: styleConfig.secondary || "#859387",
        accent: styleConfig.accent || "#ffc107",
        background: styleConfig.background || "#ffffff"
      });
      setIsLoadingSettings(false);
    }
  }, [styleConfig]);

  // Handle saving style changes
  const handleSaveStyles = async () => {
    try {
      await updateStyleConfig(previewStyles);
      toast({
        title: "Success",
        description: "Style settings saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save style settings",
        variant: "destructive"
      });
    }
  };

  // Handle color change
  const handleColorChange = useCallback((key: string, value: string) => {
    setPreviewStyles(prev => ({ ...prev, [key]: value }));
  }, []);

  if (isLoadingSettings && !styleConfig) {
    return <div className="p-4">Loading style settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Style Settings</h2>
        <Button onClick={handleSaveStyles} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="bg-white p-6 rounded-md shadow mb-6">
        <h3 className="text-xl font-medium mb-6">Color Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Primary Color */}
          <div className="space-y-4">
            <Label htmlFor="primaryColor" className="text-base font-semibold">Primary Color</Label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-12 h-12 rounded-md border overflow-hidden">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={previewStyles.primary || "#164e87"}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                    />
                  </div>
                  <Input
                    value={previewStyles.primary || "#164e87"}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="font-mono"
                    placeholder="#164e87"
                  />
                </div>
                <p className="text-sm text-gray-500">Used for main buttons, navigation, and primary UI elements</p>
              </div>
              <div className="min-w-36 border rounded-md p-3">
                <p className="mb-2 text-xs text-gray-500">Preview:</p>
                <div className="flex flex-col gap-2">
                  <div className="h-8 rounded" style={{ backgroundColor: previewStyles.primary }}></div>
                  <Button className="w-full" style={{ backgroundColor: previewStyles.primary }}>Button</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Color */}
          <div className="space-y-4">
            <Label htmlFor="secondaryColor" className="text-base font-semibold">Secondary Color</Label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-12 h-12 rounded-md border overflow-hidden">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={previewStyles.secondary || "#859387"}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                    />
                  </div>
                  <Input
                    value={previewStyles.secondary || "#859387"}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="font-mono"
                    placeholder="#859387"
                  />
                </div>
                <p className="text-sm text-gray-500">Used for secondary buttons, borders, and supporting elements</p>
              </div>
              <div className="min-w-36 border rounded-md p-3">
                <p className="mb-2 text-xs text-gray-500">Preview:</p>
                <div className="flex flex-col gap-2">
                  <div className="h-8 rounded" style={{ backgroundColor: previewStyles.secondary }}></div>
                  <Button variant="outline" className="w-full border-2" style={{ borderColor: previewStyles.secondary, color: previewStyles.secondary }}>Button</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-4">
            <Label htmlFor="accentColor" className="text-base font-semibold">Accent Color</Label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-12 h-12 rounded-md border overflow-hidden">
                    <Input
                      id="accentColor"
                      type="color"
                      value={previewStyles.accent || "#ffc107"}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                    />
                  </div>
                  <Input
                    value={previewStyles.accent || "#ffc107"}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="font-mono"
                    placeholder="#ffc107"
                  />
                </div>
                <p className="text-sm text-gray-500">Used for highlights, focus states, and important notifications</p>
              </div>
              <div className="min-w-36 border rounded-md p-3">
                <p className="mb-2 text-xs text-gray-500">Preview:</p>
                <div className="flex flex-col gap-2">
                  <div className="h-8 rounded" style={{ backgroundColor: previewStyles.accent }}></div>
                  <div className="p-2 border rounded text-xs" style={{ borderColor: previewStyles.accent }}>
                    <span className="font-medium" style={{ color: previewStyles.accent }}>Highlighted text</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-4">
            <Label htmlFor="backgroundColor" className="text-base font-semibold">Background Color</Label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-12 h-12 rounded-md border overflow-hidden">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={previewStyles.background || "#ffffff"}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                    />
                  </div>
                  <Input
                    value={previewStyles.background || "#ffffff"}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="font-mono"
                    placeholder="#ffffff"
                  />
                </div>
                <p className="text-sm text-gray-500">Used for page backgrounds and content areas</p>
              </div>
              <div className="min-w-36 border rounded-md p-3">
                <p className="mb-2 text-xs text-gray-500">Preview:</p>
                <div className="flex flex-col gap-2">
                  <div className="h-8 rounded border" style={{ backgroundColor: previewStyles.background }}></div>
                  <div className="p-2 rounded text-xs text-gray-800" style={{ backgroundColor: previewStyles.background }}>
                    Sample background
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-md shadow">
        <h3 className="text-xl font-medium mb-4">Preview</h3>
        <div className="p-4 rounded-md" style={{ backgroundColor: previewStyles.background }}>
          <div className="flex gap-3 mb-4">
            <Button style={{ backgroundColor: previewStyles.primary }}>Primary Button</Button>
            <Button variant="outline" style={{ borderColor: previewStyles.secondary, color: previewStyles.secondary }}>Secondary</Button>
            <Button variant="ghost" style={{ color: previewStyles.accent }}>Ghost</Button>
          </div>
          <div className="p-4 border rounded-md mb-4" style={{ borderColor: previewStyles.secondary }}>
            <h4 className="font-medium mb-2" style={{ color: previewStyles.primary }}>Content Area</h4>
            <p className="text-sm">This is how content will appear on your site.</p>
            <p className="text-sm mt-1">Important information could be <span style={{ color: previewStyles.accent }}>highlighted like this</span>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}