import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";

export function StyleSettingsView() {
  const { settings, updateSettings } = useOrganizationSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewStyles, setPreviewStyles] = useState({
    primary: settings?.primaryColor || '#000000',
    secondary: settings?.secondaryColor || '#32CD32',
    accent: '#FF8C00',
    background: '#F5F5F6',
    adminNavBackground: '#FFFFFF',
    adminNavText: '#000000',
    adminNavActive: '#000000',
    adminNavHover: '#f3f4f6',
    tableHeaderBg: "#f9fafb",
    tableRowHoverBg: "#f3f4f6",
    cardBg: "#FFFFFF",
    cardHeaderBg: "#f9fafb",
    inputBg: "#FFFFFF",
    inputBorder: "#d1d5db",
  });
  const { toast } = useToast();

  // Apply CSS styles to document head
  useEffect(() => {
    // Check if our custom style element already exists
    let styleElement = document.getElementById('admin-dashboard-styles');

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'admin-dashboard-styles';
      document.head.appendChild(styleElement);
    }

    // Update the style element with our custom CSS
    styleElement.textContent = `
      :root {
        --color-primary: ${previewStyles.primary};
        --color-secondary: ${previewStyles.secondary};
        --color-accent: ${previewStyles.accent};
        --color-background: ${previewStyles.background};
        --color-admin-nav-bg: ${previewStyles.adminNavBackground};
        --color-admin-nav-text: ${previewStyles.adminNavText};
        --color-admin-nav-active: ${previewStyles.adminNavActive};
        --color-admin-nav-hover: ${previewStyles.adminNavHover};
        --color-table-header-bg: ${previewStyles.tableHeaderBg};
        --color-table-row-hover-bg: ${previewStyles.tableRowHoverBg};
        --color-card-bg: ${previewStyles.cardBg};
        --color-card-header-bg: ${previewStyles.cardHeaderBg};
        --color-input-bg: ${previewStyles.inputBg};
        --color-input-border: ${previewStyles.inputBorder};
      }
    `;

    return () => {
      // Clean up when component unmounts
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, [previewStyles]);

  const handleColorChange = (e) => {
    const { name, value } = e.target;
    setPreviewStyles(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveStyles = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/style-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(previewStyles),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Style settings saved successfully",
        });

        // Update the organization settings if needed
        if (updateSettings) {
          await updateSettings({
            primaryColor: previewStyles.primary,
            secondaryColor: previewStyles.secondary
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to save style settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving style settings:', error);
      toast({
        title: "Error",
        description: "An error occurred while saving",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading style settings</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Style Settings</h2>
        <Button onClick={handleSaveStyles} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Live Preview</h3>
                <p className="text-sm text-gray-500">This is how your color scheme will look</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary">Primary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="primary"
                      name="primary"
                      value={previewStyles.primary}
                      onChange={handleColorChange}
                    />
                    <input
                      type="color"
                      name="primary"
                      value={previewStyles.primary}
                      onChange={handleColorChange}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary">Secondary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="secondary"
                      name="secondary"
                      value={previewStyles.secondary}
                      onChange={handleColorChange}
                    />
                    <input
                      type="color"
                      name="secondary"
                      value={previewStyles.secondary}
                      onChange={handleColorChange}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent">Accent Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="accent"
                      name="accent"
                      value={previewStyles.accent}
                      onChange={handleColorChange}
                    />
                    <input
                      type="color"
                      name="accent"
                      value={previewStyles.accent}
                      onChange={handleColorChange}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background">Background Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="background"
                      name="background"
                      value={previewStyles.background}
                      onChange={handleColorChange}
                    />
                    <input
                      type="color"
                      name="background"
                      value={previewStyles.background}
                      onChange={handleColorChange}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-md" style={{ backgroundColor: previewStyles.primary, color: 'white' }}>
                  <h4 className="font-medium">Primary Color</h4>
                  <p className="text-sm mt-1">This is your primary brand color</p>
                  <Button 
                    className="mt-4" 
                    style={{ backgroundColor: 'white', color: previewStyles.primary }}
                  >
                    Button
                  </Button>
                </div>

                <div className="p-4 rounded-md" style={{ backgroundColor: previewStyles.secondary, color: 'white' }}>
                  <h4 className="font-medium">Secondary Color</h4>
                  <p className="text-sm mt-1">This is your secondary brand color</p>
                  <Button 
                    className="mt-4" 
                    style={{ backgroundColor: 'white', color: previewStyles.secondary }}
                  >
                    Button
                  </Button>
                </div>

                <div
                  className="p-4 rounded-md border mt-4"
                  style={{
                    borderColor: previewStyles.accent + '40',
                    backgroundColor: previewStyles.accent + '10',
                  }}
                >
                  <h5 style={{ color: previewStyles.accent }}>Accent Section</h5>
                  <p className="text-sm mt-1">This section uses the accent color for highlighting.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}