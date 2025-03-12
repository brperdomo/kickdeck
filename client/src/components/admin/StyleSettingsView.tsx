import React, { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const colors = {
  branding: {
    title: "Brand Colors",
    description: "Color scheme for your organization's brand identity",
    colors: {
      primary: "#164e87",
      secondary: "#859387",
      accent: "#ffc107",
    },
  },
  interface: {
    title: "Interface Colors",
    description: "Colors for user interface elements",
    colors: {
      background: "#ffffff",
      foreground: "#1a1a1a",
      card: "#f9f9f9",
      border: "#e0e0e0",
      input: "#f5f5f5",
    },
  },
  feedback: {
    title: "Feedback Colors",
    description: "Colors for alerts, warnings, and status indicators",
    colors: {
      success: "#10b981",
      warning: "#f59e0b",
      destructive: "#ef4444",
      info: "#3b82f6",
    },
  },
};

export function StyleSettingsView() {
  const { currentColor, setColor, styleConfig, updateStyleConfig, isLoading } = useTheme();
  const [activeSection, setActiveSection] = useState("branding");
  const [previewStyles, setPreviewStyles] = useState<{ [key: string]: string }>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { toast } = useToast();

  // All hook declarations must be at the top level and unconditional
  // This empty effect always exists to ensure consistent hook count
  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  useEffect(() => {
    const loadStylingSettings = async () => {
      try {
        const response = await fetch('/api/admin/styling');
        if (!response.ok) {
          throw new Error('Failed to load styling settings');
        }
        const settings = await response.json();
        setPreviewStyles(settings);

        // Apply loaded settings to CSS variables
        Object.entries(settings).forEach(([key, value]) => {
          if (typeof value === 'string' && value.startsWith('#')) {
            document.documentElement.style.setProperty(`--${key}`, value);
          }
        });
      } catch (error) {
        console.error('Error loading styling settings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load current styling settings",
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadStylingSettings();
  }, [toast]);

  // Add an effect to apply CSS variables whenever previewStyles changes
  useEffect(() => {
    // Apply styling to CSS variables based on current previewStyles
    if (previewStyles.primary) {
      document.documentElement.style.setProperty('--primary', previewStyles.primary);
    }
    if (previewStyles.secondary) {
      document.documentElement.style.setProperty('--secondary', previewStyles.secondary);
    }
    if (previewStyles.accent) {
      document.documentElement.style.setProperty('--accent', previewStyles.accent);
    }
  }, [previewStyles]);

  // Combined handleSave function with all necessary functionality
  const handleSave = async () => {
    try {
      // Create a consistent color object with all required properties
      const stylingUpdate = {
        ...previewStyles,
        primary: previewStyles.primary || colors.branding.colors.primary,
        secondary: previewStyles.secondary || colors.branding.colors.secondary,
        accent: previewStyles.accent || colors.branding.colors.accent
      };

      // Update theme color
      await setColor(stylingUpdate.primary);

      // Save styles to the server
      await updateStyleConfig(stylingUpdate);

      // Apply the changes to CSS variables for branding colors
      document.documentElement.style.setProperty('--primary', stylingUpdate.primary);
      document.documentElement.style.setProperty('--secondary', stylingUpdate.secondary);
      document.documentElement.style.setProperty('--accent', stylingUpdate.accent);

      // Update local state to reflect the changes
      setPreviewStyles(stylingUpdate);

      toast({
        title: "Success",
        description: "Styling settings updated successfully",
      });
    } catch (error) {
      console.error('Failed to save styling settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save styling settings",
      });
    }
  };

  const handleColorChange = (section: string, key: string, value: string) => {
    setPreviewStyles(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Style Settings</h2>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Changes
            </>
          ) : (
            'Save All Changes'
          )}
        </Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="branding" onValueChange={setActiveSection}>
              <TabsList className="mb-4">
                <TabsTrigger value="branding">Brand Colors</TabsTrigger>
                <TabsTrigger value="interface">Interface</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
              </TabsList>

              {Object.entries(colors).map(([section, { title, description, colors: sectionColors }]) => (
                <TabsContent key={section} value={section} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">{title}</h3>
                    <p className="text-sm text-gray-500">{description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(sectionColors).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key}>
                          {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            id={key}
                            value={previewStyles[key] || value}
                            onChange={(e) => handleColorChange(section, key, e.target.value)}
                            className="w-12 h-12 p-1"
                          />
                          <Input
                            value={previewStyles[key] || value}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              if (newValue.match(/^#[0-9A-Fa-f]{6}$/)) {
                                handleColorChange(section, key, newValue);
                              }
                            }}
                            placeholder="#000000"
                            className="font-mono uppercase"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}