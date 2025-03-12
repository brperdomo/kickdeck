import React, { useState, useEffect, useCallback, useContext } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const { styleConfig, updateStyleConfig, isLoading } = useTheme();
  const [activeSection, setActiveSection] = useState("branding");
  const [previewStyles, setPreviewStyles] = useState<{ [key: string]: string }>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { toast } = useToast();

  // Initialize preview styles when the component mounts
  useEffect(() => {
    if (styleConfig) {
      const initialStyles = {
        primary: styleConfig.primary || colors.branding.colors.primary,
        secondary: styleConfig.secondary || colors.branding.colors.secondary,
        accent: styleConfig.accent || colors.branding.colors.accent,
        background: styleConfig.background || colors.interface.colors.background,
        foreground: styleConfig.foreground || colors.interface.colors.foreground,
        card: styleConfig.card || colors.interface.colors.card,
        border: styleConfig.border || colors.interface.colors.border,
        input: styleConfig.input || colors.interface.colors.input,
        success: styleConfig.success || colors.feedback.colors.success,
        warning: styleConfig.warning || colors.feedback.colors.warning,
        destructive: styleConfig.destructive || colors.feedback.colors.destructive,
        info: styleConfig.info || colors.feedback.colors.info,
      };
      setPreviewStyles(initialStyles);
      setIsLoadingSettings(false);
    } else {
      // If styleConfig is empty, set default values
      const defaultStyles = {
        primary: colors.branding.colors.primary,
        secondary: colors.branding.colors.secondary,
        accent: colors.branding.colors.accent,
        background: colors.interface.colors.background,
        foreground: colors.interface.colors.foreground,
        card: colors.interface.colors.card,
        border: colors.interface.colors.border,
        input: colors.interface.colors.input,
        success: colors.feedback.colors.success,
        warning: colors.feedback.colors.warning,
        destructive: colors.feedback.colors.destructive,
        info: colors.feedback.colors.info,
      };
      setPreviewStyles(defaultStyles);
      setIsLoadingSettings(false);
    }
  }, [styleConfig]);

  // Apply preview styles to document
  useEffect(() => {
    if (Object.keys(previewStyles).length > 0) {
      document.documentElement.style.setProperty('--primary', previewStyles.primary);
      document.documentElement.style.setProperty('--secondary', previewStyles.secondary);
      document.documentElement.style.setProperty('--accent', previewStyles.accent);
    }
  }, [previewStyles]);

  // This effect ensures consistent hook ordering
  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleSaveStyles = useCallback(async () => {
    try {
      await updateStyleConfig(previewStyles);
      toast({
        title: "Success",
        description: "Style settings have been updated successfully"
      });
    } catch (error) {
      console.error("Failed to update style settings:", error);
      toast({
        title: "Error",
        description: "Failed to update style settings",
        variant: "destructive"
      });
    }
  }, [previewStyles, updateStyleConfig, toast]);

  const handleColorChange = useCallback((key: string, value: string) => {
    setPreviewStyles(prev => ({ ...prev, [key]: value }));
  }, []);

  if (isLoadingSettings) {
    return <div className="p-4">Loading style settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-md shadow mb-6">
        <h3 className="text-lg font-medium mb-4">Color Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="primaryColor"
                  type="color"
                  value={previewStyles.primary || "#000000"}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.primary || "#000000"}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="font-mono"
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={previewStyles.secondary || "#000000"}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.secondary || "#000000"}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="font-mono"
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="accentColor">Accent Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="accentColor"
                  type="color"
                  value={previewStyles.accent || "#000000"}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.accent || "#000000"}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                className="font-mono"
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="backgroundColor">Background Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
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

      <Tabs defaultValue={activeSection} onValueChange={setActiveSection}>
        <TabsList className="mb-4">
          <TabsTrigger value="branding">Brand Colors</TabsTrigger>
          <TabsTrigger value="interface">Interface Colors</TabsTrigger>
          <TabsTrigger value="feedback">Feedback Colors</TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>{colors.branding.title}</CardTitle>
              <CardDescription>{colors.branding.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {Object.entries(colors.branding.colors).map(([key, defaultValue]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="capitalize">
                      {key}
                    </Label>
                    <div className="flex gap-2">
                      <div
                        className="h-10 w-10 rounded-md border"
                        style={{ backgroundColor: previewStyles[key] || defaultValue }}
                      />
                      <Input
                        id={key}
                        type="text"
                        value={previewStyles[key] || defaultValue}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interface">
          <Card>
            <CardHeader>
              <CardTitle>{colors.interface.title}</CardTitle>
              <CardDescription>{colors.interface.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {Object.entries(colors.interface.colors).map(([key, defaultValue]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="capitalize">
                      {key}
                    </Label>
                    <div className="flex gap-2">
                      <div
                        className="h-10 w-10 rounded-md border"
                        style={{ backgroundColor: previewStyles[key] || defaultValue }}
                      />
                      <Input
                        id={key}
                        type="text"
                        value={previewStyles[key] || defaultValue}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>{colors.feedback.title}</CardTitle>
              <CardDescription>{colors.feedback.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {Object.entries(colors.feedback.colors).map(([key, defaultValue]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="capitalize">
                      {key}
                    </Label>
                    <div className="flex gap-2">
                      <div
                        className="h-10 w-10 rounded-md border"
                        style={{ backgroundColor: previewStyles[key] || defaultValue }}
                      />
                      <Input
                        id={key}
                        type="text"
                        value={previewStyles[key] || defaultValue}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}