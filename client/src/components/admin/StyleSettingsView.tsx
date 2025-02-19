import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RotateCcw } from "lucide-react";

const colorSections = {
  layout: {
    title: "Layout Colors",
    colors: {
      background: { value: "#1A1A1A", label: "Main Background - Primary background color for the entire application" },
      foreground: { value: "#FFFFFF", label: "Main Text - Primary text color throughout the application" },
      border: { value: "#333333", label: "Borders - Color for borders, dividers, and separators" }
    }
  },
  primary: {
    title: "Primary Colors",
    colors: {
      primary: { value: "#1E88E5", label: "Primary Action - Buttons, links, and interactive elements" },
      secondary: { value: "#43A047", label: "Secondary Action - Alternative buttons and accents" },
      accent: { value: "#FFC107", label: "Accent - Highlights and special elements" }
    }
  },
  status: {
    title: "Status Colors",
    colors: {
      success: { value: "#4CAF50", label: "Success - Positive actions and confirmations" },
      warning: { value: "#FF9800", label: "Warning - Alerts and cautionary messages" },
      error: { value: "#F44336", label: "Error - Error messages and destructive actions" },
      info: { value: "#2196F3", label: "Info - Informational messages and help text" }
    }
  }
};

export function StyleSettingsView() {
  const { currentColor, setColor, styleConfig, updateStyleConfig, isLoading } = useTheme();
  const [colors, setColors] = useState(colorSections);
  const { toast } = useToast();

  const handleColorChange = (section: string, colorKey: string, value: string) => {
    setColors(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        colors: {
          ...prev[section].colors,
          [colorKey]: {
            ...prev[section].colors[colorKey],
            value
          }
        }
      }
    }));
  };

  const handleSave = async () => {
    try {
      // Convert color values to CSS variables format
      const colorValues = Object.entries(colors).reduce((acc, [_, section]) => ({
        ...acc,
        ...Object.entries(section.colors).reduce((colAcc, [key, { value }]) => ({
          ...colAcc,
          [`--${key}`]: value // Prefix with -- for CSS variable naming
        }), {})
      }), {});

      const response = await fetch('/api/admin/styling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(colorValues),
      });

      if (!response.ok) {
        throw new Error('Failed to update style configuration');
      }

      // Update CSS variables in the document
      Object.entries(colorValues).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value as string);

        // Special handling for background color
        if (key === '--background') {
          document.body.style.backgroundColor = value as string;
        }
      });

      toast({
        title: "Success",
        description: "Theme colors updated successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update theme colors"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Theme Colors</h2>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Changes
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {Object.entries(colors).map(([sectionKey, section]) => (
        <Card key={sectionKey}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(section.colors).map(([colorKey, color]) => (
                <div key={colorKey} className="space-y-2">
                  <Label htmlFor={colorKey}>
                    {colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {color.label}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id={colorKey}
                      value={color.value}
                      onChange={(e) => handleColorChange(sectionKey, colorKey, e.target.value)}
                      className="w-12 h-12 p-1"
                    />
                    <Input
                      value={color.value}
                      onChange={(e) => handleColorChange(sectionKey, colorKey, e.target.value)}
                      className="font-mono uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}