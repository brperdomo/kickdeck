
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

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

  // Initialize preview styles when the component mounts
  useEffect(() => {
    if (styleConfig) {
      setPreviewStyles({
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
      });
      setIsLoadingSettings(false);
    }
  }, [styleConfig]);

  // Apply preview styles to document
  useEffect(() => {
    if (previewStyles.primary) {
      document.documentElement.style.setProperty('--primary', previewStyles.primary);
      document.documentElement.style.setProperty('--secondary', previewStyles.secondary);
      document.documentElement.style.setProperty('--accent', previewStyles.accent);
    }
  }, [previewStyles]);

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
              {/* Primary Color */}
              <div>
                <Label htmlFor="primary">Primary Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="primary"
                    type="color"
                    value={previewStyles.primary || colors.branding.colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={previewStyles.primary || colors.branding.colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <Label htmlFor="secondary">Secondary Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="secondary"
                    type="color"
                    value={previewStyles.secondary || colors.branding.colors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={previewStyles.secondary || colors.branding.colors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <Label htmlFor="accent">Accent Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="accent"
                    type="color"
                    value={previewStyles.accent || colors.branding.colors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={previewStyles.accent || colors.branding.colors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="font-mono"
                  />
                </div>
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
              {/* Background Color */}
              <div>
                <Label htmlFor="background">Background Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="background"
                    type="color"
                    value={previewStyles.background || colors.interface.colors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={previewStyles.background || colors.interface.colors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Foreground Color */}
              <div>
                <Label htmlFor="foreground">Text Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="foreground"
                    type="color"
                    value={previewStyles.foreground || colors.interface.colors.foreground}
                    onChange={(e) => handleColorChange('foreground', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={previewStyles.foreground || colors.interface.colors.foreground}
                    onChange={(e) => handleColorChange('foreground', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Card Color */}
              <div>
                <Label htmlFor="card">Card Background</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="card"
                    type="color"
                    value={previewStyles.card || colors.interface.colors.card}
                    onChange={(e) => handleColorChange('card', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={previewStyles.card || colors.interface.colors.card}
                    onChange={(e) => handleColorChange('card', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Border Color */}
              <div>
                <Label htmlFor="border">Border Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="border"
                    type="color"
                    value={previewStyles.border || colors.interface.colors.border}
                    onChange={(e) => handleColorChange('border', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={previewStyles.border || colors.interface.colors.border}
                    onChange={(e) => handleColorChange('border', e.target.value)}
                    className="font-mono"
                  />
                </div>
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
              {/* Success Color */}
              <div>
                <Label htmlFor="success">Success Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="success"
                    type="color"
                    value={previewStyles.success || colors.feedback.colors.success}
                    onChange={(e) => handleColorChange('success', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={previewStyles.success || colors.feedback.colors.success}
                    onChange={(e) => handleColorChange('success', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Warning Color */}
              <div>
                <Label htmlFor="warning">Warning Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="warning"
                    type="color"
                    value={previewStyles.warning || colors.feedback.colors.warning}
                    onChange={(e) => handleColorChange('warning', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={previewStyles.warning || colors.feedback.colors.warning}
                    onChange={(e) => handleColorChange('warning', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Destructive Color */}
              <div>
                <Label htmlFor="destructive">Destructive Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="destructive"
                    type="color"
                    value={previewStyles.destructive || colors.feedback.colors.destructive}
                    onChange={(e) => handleColorChange('destructive', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={previewStyles.destructive || colors.feedback.colors.destructive}
                    onChange={(e) => handleColorChange('destructive', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Info Color */}
              <div>
                <Label htmlFor="info">Info Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="info"
                    type="color"
                    value={previewStyles.info || colors.feedback.colors.info}
                    onChange={(e) => handleColorChange('info', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={previewStyles.info || colors.feedback.colors.info}
                    onChange={(e) => handleColorChange('info', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
