import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RotateCcw } from "lucide-react";

interface ColorSection {
  title: string;
  colors: {
    [key: string]: string;
  };
  description?: string;
}

interface LoginScreenSettings {
  logoUrl: string;
  youtubeVideoId: string;
}

const colors = {
  branding: {
    title: "Brand Colors",
    description: "Main colors that define your brand identity",
    colors: {
      primary: "#000000",
      secondary: "#32CD32",
      accent: "#FF8C00"
    }
  },
  loginScreen: {
    title: "Login Screen",
    description: "Customize the login and register page appearance",
    colors: {},
    settings: {
      logoUrl: "/uploads/MatchProAI_Linear_Black.png",
      youtubeVideoId: "8DFc6wHHWPY"
    }
  },
  interface: {
    title: "Interface Colors",
    description: "Colors used for the application interface",
    colors: {
      background: "#568FCB",
      foreground: "#000000",
      border: "#CCCCCC",
      muted: "#999999",
      hover: "#FF8C00",
      active: "#32CD32"
    }
  },
  status: {
    title: "Status Colors",
    description: "Colors used to indicate different states",
    colors: {
      success: "#32CD32",
      warning: "#FF8C00",
      destructive: "#E63946"
    }
  },
  adminRoles: {
    title: "Admin Role Colors",
    description: "Colors used to distinguish admin roles",
    colors: {
      superAdmin: "#DB4D4D",
      tournamentAdmin: "#4CAF50",
      scoreAdmin: "#4169E1",
      financeAdmin: "#9C27B0"
    }
  }
};

export function StyleSettingsView() {
  const { currentColor, setColor, styleConfig, updateStyleConfig, isLoading } = useTheme();
  const [activeSection, setActiveSection] = useState("branding");
  const [previewStyles, setPreviewStyles] = useState<{ [key: string]: string }>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadStylingSettings = async () => {
      try {
        const response = await fetch('/api/admin/styling');
        if (!response.ok) {
          throw new Error('Failed to load styling settings');
        }
        const settings = await response.json();
        setPreviewStyles(settings);
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
  }, []);

  const handleColorChange = (section: string, colorKey: string, value: string) => {
    // Ensure the value is a valid hex color
    const hexColor = value.startsWith('#') ? value : `#${value}`;
    setPreviewStyles((prev) => ({
      ...prev,
      [colorKey]: hexColor,
    }));
  };

  const handleReset = (section: string) => {
    const defaultColors = colors[section as keyof typeof colors].colors;
    Object.entries(defaultColors).forEach(([key, value]) => {
      handleColorChange(section, key, value);
    });

    if (section === 'loginScreen') {
      setPreviewStyles((prev) => ({
        ...prev,
        logoUrl: colors.loginScreen.settings.logoUrl,
        youtubeVideoId: colors.loginScreen.settings.youtubeVideoId,
      }));
    }

    toast({
      title: "Reset Complete",
      description: `${colors[section as keyof typeof colors].title} reset to defaults`,
    });
  };

  const handleSave = async () => {
    try {
      // Update theme color
      await setColor(previewStyles.primary || colors.branding.colors.primary);

      // Update all styling settings
      const response = await fetch('/api/admin/styling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(previewStyles),
      });

      if (!response.ok) {
        throw new Error('Failed to save styling changes');
      }

      toast({
        title: "Success",
        description: "UI styling updated successfully",
      });
    } catch (error) {
      console.error('Error saving styling changes:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update styling",
      });
    }
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

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle>Color Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {Object.entries(colors).map(([key, section]) => (
                  <Button
                    key={key}
                    variant={activeSection === key ? "secondary" : "ghost"}
                    className="justify-start w-full text-left"
                    onClick={() => setActiveSection(key)}
                  >
                    {section.title}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="col-span-3">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>{colors[activeSection as keyof typeof colors].title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {colors[activeSection as keyof typeof colors].description}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReset(activeSection)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Section
            </Button>
          </CardHeader>
          <CardContent>
            {activeSection === 'loginScreen' ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Login Page Logo URL</Label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter logo URL (e.g., /uploads/logo.png)"
                        value={previewStyles.logoUrl || ''}
                        onChange={(e) => handleColorChange('loginScreen', 'logoUrl', e.target.value)}
                      />
                    </div>
                    <img
                      src={previewStyles.logoUrl || ''}
                      alt="Login logo preview"
                      className="h-16 w-16 object-contain bg-gray-50 rounded p-2"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Background YouTube Video ID</Label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter YouTube video ID (e.g., OdObDXBzNYk)"
                        value={previewStyles.youtubeVideoId || ''}
                        onChange={(e) => handleColorChange('loginScreen', 'youtubeVideoId', e.target.value)}
                      />
                    </div>
                    <div className="h-16 w-28 overflow-hidden rounded bg-gray-50">
                      <img
                        src={`https://img.youtube.com/vi/${previewStyles.youtubeVideoId || ''}/default.jpg`}
                        alt="YouTube thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter the YouTube video ID from the video URL. For example, in 'https://youtube.com/watch?v=OdObDXBzNYk', the ID is 'OdObDXBzNYk'.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {Object.entries(colors[activeSection as keyof typeof colors].colors).map(
                  ([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>
                        {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id={key}
                          value={previewStyles[key] || value}
                          onChange={(e) => handleColorChange(activeSection, key, e.target.value)}
                          className="w-12 h-12 p-1"
                        />
                        <Input
                          value={previewStyles[key] || value}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            if (newValue.match(/^#[0-9A-Fa-f]{6}$/)) {
                              handleColorChange(activeSection, key, newValue);
                            }
                          }}
                          placeholder="#000000"
                          className="font-mono uppercase"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}