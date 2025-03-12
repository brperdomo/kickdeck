import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export function StyleSettingsView() {
  const { styleConfig, updateStyleConfig, isLoading } = useTheme();
  const [previewStyles, setPreviewStyles] = useState<{ [key: string]: string }>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
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

  if (isLoadingSettings) {
    return <div className="p-4">Loading style settings...</div>;
  }

  return (
    <div className="space-y-6">
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
                  <div 
                    className="h-8 rounded-md flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: previewStyles.primary }}
                  >
                    Button
                  </div>
                  <div 
                    className="h-1 rounded-full" 
                    style={{ backgroundColor: previewStyles.primary }}
                  ></div>
                  <div className="flex gap-1">
                    <div 
                      className="h-4 w-4 rounded-full" 
                      style={{ backgroundColor: previewStyles.primary }}
                    ></div>
                    <div 
                      className="h-4 w-4 rounded-sm" 
                      style={{ backgroundColor: previewStyles.primary }}
                    ></div>
                  </div>
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
                <p className="text-sm text-gray-500">Used for secondary buttons, accents, and supporting elements</p>
              </div>
              <div className="min-w-36 border rounded-md p-3">
                <p className="mb-2 text-xs text-gray-500">Preview:</p>
                <div className="flex flex-col gap-2">
                  <div 
                    className="h-8 rounded-md border flex items-center justify-center text-xs font-medium"
                    style={{ 
                      backgroundColor: "white", 
                      borderColor: previewStyles.secondary,
                      color: previewStyles.secondary 
                    }}
                  >
                    Outline Button
                  </div>
                  <div 
                    className="h-1 rounded-full" 
                    style={{ backgroundColor: previewStyles.secondary }}
                  ></div>
                  <div 
                    className="h-6 text-xs px-2 rounded-full inline-flex items-center justify-center" 
                    style={{ backgroundColor: previewStyles.secondary + "33", color: previewStyles.secondary }}
                  >
                    Tag
                  </div>
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
                  <div 
                    className="h-8 rounded-md flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: previewStyles.accent }}
                  >
                    Highlight
                  </div>
                  <div className="flex items-center gap-1">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: previewStyles.accent }}
                    ></div>
                    <div className="text-xs">Notification</div>
                  </div>
                  <div 
                    className="h-1 w-16 rounded-full" 
                    style={{ backgroundColor: previewStyles.accent }}
                  ></div>
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
                      value={previewStyles.background || "#FFFFFF"}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                    />
                  </div>
                  <Input
                    value={previewStyles.background || "#FFFFFF"}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="font-mono"
                    placeholder="#FFFFFF"
                  />
                </div>
                <p className="text-sm text-gray-500">Used for main app background and content areas</p>
              </div>
              <div className="min-w-36 border rounded-md p-3">
                <p className="mb-2 text-xs text-gray-500">Preview:</p>
                <div 
                  className="h-24 rounded-md border p-2"
                  style={{ backgroundColor: previewStyles.background }}
                >
                  <div className="bg-white bg-opacity-80 h-5 w-16 rounded mb-1"></div>
                  <div className="bg-white bg-opacity-80 h-3 w-full rounded mb-1"></div>
                  <div className="bg-white bg-opacity-80 h-3 w-full rounded mb-1"></div>
                  <div className="bg-white bg-opacity-80 h-3 w-24 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Style Settings</h2>
        <Button onClick={handleSaveStyles} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Color Scheme Preview */}
      <div className="bg-white p-6 rounded-md shadow">
        <h3 className="text-lg font-medium mb-4">Color Scheme Preview</h3>
        <div 
          className="border rounded-lg p-4"
          style={{ backgroundColor: previewStyles.background }}
        >
          <div className="flex gap-4 flex-wrap">
            <div 
              className="h-10 px-4 rounded-md flex items-center justify-center text-white"
              style={{ backgroundColor: previewStyles.primary }}
            >
              Primary Button
            </div>
            <div 
              className="h-10 px-4 rounded-md border flex items-center justify-center"
              style={{ 
                borderColor: previewStyles.secondary,
                color: previewStyles.secondary 
              }}
            >
              Secondary Button
            </div>
            <div 
              className="h-10 px-4 rounded-md flex items-center justify-center text-white"
              style={{ backgroundColor: previewStyles.accent }}
            >
              Accent Button
            </div>
          </div>
          <div className="mt-6 p-4 rounded-md border">
            <div className="h-4 w-36 rounded mb-3" style={{ backgroundColor: previewStyles.primary + '50' }}></div>
            <div className="h-2 w-full rounded-sm mb-2" style={{ backgroundColor: previewStyles.secondary + '30' }}></div>
            <div className="h-2 w-full rounded-sm mb-2" style={{ backgroundColor: previewStyles.secondary + '30' }}></div>
            <div className="h-2 w-3/4 rounded-sm mb-2" style={{ backgroundColor: previewStyles.secondary + '30' }}></div>
            <div className="mt-4 flex justify-end">
              <div 
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: previewStyles.accent, color: 'white' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}