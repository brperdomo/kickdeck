
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RotateCcw } from "lucide-react";

interface ColorSection {
  title: string;
  colors: {
    [key: string]: string;
  };
}

const defaultColors = {
  primary: {
    title: "Primary Colors",
    colors: {
      primary: "#0066FF",
      secondary: "#A4B5C6",
    },
  },
  buttons: {
    title: "Button Colors",
    colors: {
      buttonDefault: "#0066FF",
      buttonHover: "#0052CC",
      buttonActive: "#004499",
    },
  },
  interactive: {
    title: "Interactive Elements",
    colors: {
      hoverBackground: "#F5F6F7",
      activeBackground: "#ECEDEF",
    },
  },
  navigation: {
    title: "Navigation Colors",
    colors: {
      navBackground: "#FFFFFF",
      navText: "#1A1B1E",
      navHover: "#F5F6F7",
    },
  },
  adminRoles: {
    title: "Admin Role Colors",
    colors: {
      superAdmin: "#E63946",
      tournamentAdmin: "#0066FF",
      scoreAdmin: "#2A9D8F",
      financeAdmin: "#7B61FF",
    },
  },
};

export function StyleSettingsView() {
  const { currentColor, setColor, isLoading } = useTheme();
  const [activeSection, setActiveSection] = useState("primary");
  const [colors, setColors] = useState(defaultColors);
  const { toast } = useToast();
  const [previewStyles, setPreviewStyles] = useState<{ [key: string]: string }>({});

  const handleColorChange = (section: string, colorKey: string, value: string) => {
    setColors((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        colors: {
          ...prev[section].colors,
          [colorKey]: value,
        },
      },
    }));

    setPreviewStyles((prev) => ({
      ...prev,
      [colorKey]: value,
    }));
  };

  const handleSave = async () => {
    try {
      await setColor(colors.primary.colors.primary);

      const response = await fetch('/api/admin/styling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(colors),
      });

      if (!response.ok) {
        throw new Error('Failed to save styling changes');
      }

      toast({
        title: "Success",
        description: "UI styling updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update styling",
        variant: "destructive",
      });
    }
  };

  const handleReset = (section: string) => {
    setColors((prev) => ({
      ...prev,
      [section]: defaultColors[section as keyof typeof defaultColors],
    }));
    toast({
      title: "Reset Complete",
      description: `${defaultColors[section as keyof typeof defaultColors].title} reset to defaults`,
    });
  };

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

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Color Sections</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs value={activeSection} onValueChange={setActiveSection} orientation="vertical">
                <TabsList className="flex flex-col w-full space-y-2">
                  {Object.entries(colors).map(([key, section]) => (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className={`justify-start w-full ${
                        activeSection === key ? "bg-primary/10" : ""
                      }`}
                    >
                      {section.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Card className="col-span-2">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>{colors[activeSection as keyof typeof colors].title}</CardTitle>
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
            <div className="grid grid-cols-2 gap-4">
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
                        value={value}
                        onChange={(e) => handleColorChange(activeSection, key, e.target.value)}
                        className="w-12 h-12 p-1"
                      />
                      <Input
                        value={value}
                        onChange={(e) => handleColorChange(activeSection, key, e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              <div className="p-4 border rounded-lg">
                <div className="space-y-4">
                  {activeSection === "buttons" && (
                    <div className="space-x-2">
                      <Button
                        style={{
                          backgroundColor: previewStyles.buttonDefault,
                          "--hover-bg": previewStyles.buttonHover,
                          "--active-bg": previewStyles.buttonActive,
                        } as any}
                      >
                        Default Button
                      </Button>
                    </div>
                  )}
                  {activeSection === "adminRoles" && (
                    <div className="space-x-2">
                      {Object.entries(colors.adminRoles.colors).map(([role, color]) => (
                        <span
                          key={role}
                          className="px-2 py-1 rounded text-white text-sm"
                          style={{ backgroundColor: color }}
                        >
                          {role.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
