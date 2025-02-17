
import { useState } from "react";
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
    backgroundColor: '#ffffff',
    textColor: '#000000',
    buttonColor: '#4CAF50',
  });

  const handleColorChange = (color: string, value: string) => {
    setTheme(prev => ({ ...prev, [color]: value }));
  };

  const handleApplyTheme = async () => {
    try {
      await setColor(theme.buttonColor);
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={theme.backgroundColor}
                  onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                  className="w-12 h-12 p-1"
                />
                <Input
                  value={theme.backgroundColor}
                  onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="textColor"
                  type="color"
                  value={theme.textColor}
                  onChange={(e) => handleColorChange('textColor', e.target.value)}
                  className="w-12 h-12 p-1"
                />
                <Input
                  value={theme.textColor}
                  onChange={(e) => handleColorChange('textColor', e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="buttonColor">Button Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="buttonColor"
                  type="color"
                  value={theme.buttonColor}
                  onChange={(e) => handleColorChange('buttonColor', e.target.value)}
                  className="w-12 h-12 p-1"
                />
                <Input
                  value={theme.buttonColor}
                  onChange={(e) => handleColorChange('buttonColor', e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
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
