
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export function ThemeEditor() {
  const { setColor } = useTheme();
  const { toast } = useToast();
  const [theme, setTheme] = useState({
    backgroundColor: '#F2F2F7',
    textColor: '#1C1C1E',
    primaryColor: '#34C759',
    secondaryColor: '#FF9500',
    accentColor: '#FF9500',
  });

  const handleColorChange = (colorKey: string, value: string) => {
    setTheme(prev => ({ ...prev, [colorKey]: value }));
  };

  const handleApplyTheme = async () => {
    try {
      await setColor(theme.primaryColor);
      toast({
        title: "Success",
        description: "Theme updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update theme",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Theme Editor</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Color Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backgroundColor">Background Color</Label>
            <Input
              id="backgroundColor"
              type="color"
              value={theme.backgroundColor}
              onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="textColor">Text Color</Label>
            <Input
              id="textColor"
              type="color"
              value={theme.textColor}
              onChange={(e) => handleColorChange('textColor', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <Input
              id="primaryColor"
              type="color"
              value={theme.primaryColor}
              onChange={(e) => handleColorChange('primaryColor', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <Input
              id="secondaryColor"
              type="color"
              value={theme.secondaryColor}
              onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent Color</Label>
            <Input
              id="accentColor"
              type="color"
              value={theme.accentColor}
              onChange={(e) => handleColorChange('accentColor', e.target.value)}
            />
          </div>

          <Button 
            onClick={handleApplyTheme}
            className="w-full mt-6"
            size="lg"
          >
            <Save className="mr-2 h-4 w-4" />
            Apply Theme
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
