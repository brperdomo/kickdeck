import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { Toggle } from "@/components/ui/toggle";
import { Moon, Sun } from "lucide-react";

export function StyleSettingsView() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { theme, setAppearance } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(theme);

  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setAppearance(newTheme);
  };

  const defaultStyles = {
    primary: '#0052CC',
    secondary: '#344563',
    accent: '#00B8D9',
    background: '#FAFBFC',
    adminNavBackground: '#FFFFFF',
    adminNavText: '#42526E',
    adminNavActive: '#DEEBFF',
    adminNavHover: '#F4F5F7',
    tableHeaderBg: '#F4F5F7',
    tableRowHoverBg: '#F4F5F7',
    cardBg: '#FFFFFF',
    textColor: '#172B4D',
    cardHeaderBg: '#f9fafb',
    inputBg: '#FFFFFF',
    inputBorder: '#d1d5db',
    darkBackground: '#1D2330',
    darkText: '#E2E8F0',
    darkAccent: '#2C3E50',
    darkPrimary: '#4C9AFF',
    darkSecondary: '#A2B0C3',
    darkCardBg: '#2D3748',
    darkInputBg: '#1D2330',
    darkInputBorder: '#4A5568'
  };
  const [previewStyles, setPreviewStyles] = useState(defaultStyles);

  useEffect(() => {
    // Ensure all style values are defined
    setPreviewStyles(current => ({
      ...defaultStyles,
      ...current
    }));
  }, []);
  const { toast } = useToast();

  useEffect(() => {
    let styleElement = document.getElementById('admin-dashboard-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'admin-dashboard-styles';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = `
      :root {
        --admin-nav-bg: ${previewStyles.adminNavBackground || '#FFFFFF'};
        --admin-nav-text: ${previewStyles.adminNavText || '#000000'};
        --admin-nav-active: ${previewStyles.adminNavActive || previewStyles.primary || '#000000'};
        --admin-nav-hover: ${previewStyles.adminNavHover || '#f3f4f6'};
        --table-header-bg: ${previewStyles.tableHeaderBg || "#f9fafb"};
        --table-row-hover-bg: ${previewStyles.tableRowHoverBg || "#f3f4f6"};
        --card-bg: ${previewStyles.cardBg || "#FFFFFF"};
        --card-header-bg: ${previewStyles.cardHeaderBg || "#f9fafb"};
        --input-bg: ${previewStyles.inputBg || "#FFFFFF"};
        --input-border: ${previewStyles.inputBorder || "#d1d5db"};

      }
    `;
  }, [previewStyles]);

  useEffect(() => {
    const fetchStylingSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/styling');
        if (response.ok) {
          const data = await response.json();
          setPreviewStyles(data);
        } else {
          console.error('Failed to fetch styling settings');
        }
      } catch (error) {
        console.error('Error fetching styling settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStylingSettings();
  }, []);

  const handleStyleChange = (key, value) => {
    setPreviewStyles(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveStyles = async () => {
    setIsSaving(true);
    try {
      const completeStyles = {
        ...previewStyles,
        adminNavBackground: previewStyles.adminNavBackground || '#FFFFFF',
        adminNavText: previewStyles.adminNavText || '#000000',
        adminNavActive: previewStyles.adminNavActive || previewStyles.primary || '#000000',
        adminNavHover: previewStyles.adminNavHover || '#f3f4f6',
        tableHeaderBg: previewStyles.tableHeaderBg || "#f9fafb",
        tableRowHoverBg: previewStyles.tableRowHoverBg || "#f3f4f6",
        cardBg: previewStyles.cardBg || "#FFFFFF",
        cardHeaderBg: previewStyles.cardHeaderBg || "#f9fafb",
        inputBg: previewStyles.inputBg || "#FFFFFF",
        inputBorder: previewStyles.inputBorder || "#d1d5db",
      };

      const response = await fetch('/api/admin/styling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeStyles),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Style settings saved successfully",
        });
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
        <h3 className="text-lg font-medium">UI Colors</h3>
        <Toggle
          pressed={theme === 'dark'}
          onPressedChange={(pressed) => {
            const newTheme = pressed ? 'dark' : 'light';
            setAppearance(newTheme);
          }}
          aria-label="Toggle dark mode"
          className="p-2"
        >
          {theme === 'dark' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Toggle>
      </div>
      <div 
        className="p-4 rounded-md shadow mb-6" 
        style={{ backgroundColor: previewStyles.adminSectionBg || "#FFFFFF" }}
      >
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
                  onChange={(e) => handleStyleChange('primary', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.primary || "#000000"}
                onChange={(e) => handleStyleChange('primary', e.target.value)}
                className="font-mono"
                placeholder="#000000"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Used for primary buttons and important UI elements</p>
          </div>

          <div>
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={previewStyles.secondary || "#000000"}
                  onChange={(e) => handleStyleChange('secondary', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.secondary || "#000000"}
                onChange={(e) => handleStyleChange('secondary', e.target.value)}
                className="font-mono"
                placeholder="#000000"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Used for secondary buttons and accents</p>
          </div>

          <div>
            <Label htmlFor="accentColor">Accent Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="accentColor"
                  type="color"
                  value={previewStyles.accent || "#000000"}
                  onChange={(e) => handleStyleChange('accent', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.accent || "#000000"}
                onChange={(e) => handleStyleChange('accent', e.target.value)}
                className="font-mono"
                placeholder="#000000"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Used for highlighted items and hover states</p>
          </div>

          <div>
            <Label htmlFor="backgroundColor">Background Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={previewStyles.background || "#FFFFFF"}
                  onChange={(e) => handleStyleChange('background', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.background || "#FFFFFF"}
                onChange={(e) => handleStyleChange('background', e.target.value)}
                className="font-mono"
                placeholder="#FFFFFF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Used for page backgrounds</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="darkBackground">Dark Background</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-12 h-12 rounded-md border overflow-hidden">
                  <Input
                    id="darkBackground"
                    type="color"
                    value={previewStyles.darkBackground}
                    onChange={(e) => handleStyleChange('darkBackground', e.target.value)}
                    className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                  />
                </div>
                <Input
                  value={previewStyles.darkBackground}
                  onChange={(e) => handleStyleChange('darkBackground', e.target.value)}
                  className="font-mono"
                  placeholder="#1D2330"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="darkText">Dark Mode Text</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-12 h-12 rounded-md border overflow-hidden">
                  <Input
                    id="darkText"
                    type="color"
                    value={previewStyles.darkText}
                    onChange={(e) => handleStyleChange('darkText', e.target.value)}
                    className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                  />
                </div>
                <Input
                  value={previewStyles.darkText}
                  onChange={(e) => handleStyleChange('darkText', e.target.value)}
                  className="font-mono"
                  placeholder="#E2E8F0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="darkAccent">Dark Mode Accent</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-12 h-12 rounded-md border overflow-hidden">
                  <Input
                    id="darkAccent"
                    type="color"
                    value={previewStyles.darkAccent}
                    onChange={(e) => handleStyleChange('darkAccent', e.target.value)}
                    className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                  />
                </div>
                <Input
                  value={previewStyles.darkAccent}
                  onChange={(e) => handleStyleChange('darkAccent', e.target.value)}
                  className="font-mono"
                  placeholder="#2C3E50"
                />
              </div>
            </div>
          </div>
      </div>

      <div 
        className="p-4 rounded-md shadow mb-6" 
        style={{ backgroundColor: previewStyles.adminSectionBg || "#FFFFFF" }}
      >
        <h3 className="text-lg font-medium mb-4">Admin Dashboard Colors</h3>
        <p className="text-sm text-gray-500 mb-4">These colors control the appearance of the admin dashboard navigation.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="adminNavBgColor">Navigation Background</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavBgColor"
                  type="color"
                  value={previewStyles.adminNavBackground || "#FFFFFF"}
                  onChange={(e) => handleStyleChange('adminNavBackground', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavBackground || "#FFFFFF"}
                onChange={(e) => handleStyleChange('adminNavBackground', e.target.value)}
                className="font-mono"
                placeholder="#FFFFFF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color of the admin sidebar</p>
          </div>

          <div>
            <Label htmlFor="adminSectionBg">Admin Section Background</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminSectionBg"
                  type="color"
                  value={previewStyles.adminSectionBg || "#FFFFFF"}
                  onChange={(e) => handleStyleChange('adminSectionBg', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminSectionBg || "#FFFFFF"}
                onChange={(e) => handleStyleChange('adminSectionBg', e.target.value)}
                className="font-mono"
                placeholder="#FFFFFF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color of admin sections and cards</p>
          </div>

          <div>
            <Label htmlFor="adminNavTextColor">Navigation Text</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavTextColor"
                  type="color"
                  value={previewStyles.adminNavText || "#000000"}
                  onChange={(e) => handleStyleChange('adminNavText', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavText || "#000000"}
                onChange={(e) => handleStyleChange('adminNavText', e.target.value)}
                className="font-mono"
                placeholder="#000000"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Text color for sidebar navigation items</p>
          </div>

          <div>
            <Label htmlFor="adminNavActiveColor">Navigation Active</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavActiveColor"
                  type="color"
                  value={previewStyles.adminNavActive || "#E6F7FF"}
                  onChange={(e) => handleStyleChange('adminNavActive', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavActive || "#E6F7FF"}
                onChange={(e) => handleStyleChange('adminNavActive', e.target.value)}
                className="font-mono"
                placeholder="#E6F7FF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color of the active/selected navigation item</p>
          </div>

          <div>
            <Label htmlFor="adminNavHoverColor">Navigation Hover</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavHoverColor"
                  type="color"
                  value={previewStyles.adminNavHover || "#f3f4f6"}
                  onChange={(e) => handleStyleChange('adminNavHover', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavHover || "#f3f4f6"}
                onChange={(e) => handleStyleChange('adminNavHover', e.target.value)}
                className="font-mono"
                placeholder="#f3f4f6"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color when hovering over navigation items</p>
          </div>

          <div>
            <Label htmlFor="adminNavHoverColor">Navigation Hover</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavHoverColor"
                  type="color"
                  value={previewStyles.adminNavHover || "#F5F5F5"}
                  onChange={(e) => handleStyleChange('adminNavHover', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavHover || "#F5F5F5"}
                onChange={(e) => handleStyleChange('adminNavHover', e.target.value)}
                className="font-mono"
                placeholder="#F5F5F5"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color when hovering over navigation items</p>
          </div>
        </div>
      </div>

      <div 
        className="p-4 rounded-md shadow mb-6" 
        style={{ backgroundColor: previewStyles.adminSectionBg || "#FFFFFF" }}
      >
        <h3 className="text-lg font-medium mb-4">Table & Card Styling</h3>
        <p className="text-sm text-gray-500 mb-4">Customize the appearance of tables, cards and form elements.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="tableHeaderBg">Table Header Background</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="tableHeaderBg"
                  type="color"
                  value={previewStyles.tableHeaderBg || "#f9fafb"}
                  onChange={(e) => handleStyleChange('tableHeaderBg', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.tableHeaderBg || "#f9fafb"}
                onChange={(e) => handleStyleChange('tableHeaderBg', e.target.value)}
                className="font-mono"
                placeholder="#f9fafb"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color for table headers</p>
          </div>

          <div>
            <Label htmlFor="tableRowHoverBg">Table Row Hover</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="tableRowHoverBg"
                  type="color"
                  value={previewStyles.tableRowHoverBg || "#f3f4f6"}
                  onChange={(e) => handleStyleChange('tableRowHoverBg', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.tableRowHoverBg || "#f3f4f6"}
                onChange={(e) => handleStyleChange('tableRowHoverBg', e.target.value)}
                className="font-mono"
                placeholder="#f3f4f6"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color when hovering over table rows</p>
          </div>

          <div>
            <Label htmlFor="cardBg">Card Background</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="cardBg"
                  type="color"
                  value={previewStyles.cardBg || "#FFFFFF"}
                  onChange={(e) => handleStyleChange('cardBg', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.cardBg || "#FFFFFF"}
                onChange={(e) => handleStyleChange('cardBg', e.target.value)}
                className="font-mono"
                placeholder="#FFFFFF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color for cards</p>
          </div>

          <div>
            <Label htmlFor="cardHeaderBg">Card Header Background</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="cardHeaderBg"
                  type="color"
                  value={previewStyles.cardHeaderBg || "#f9fafb"}
                  onChange={(e) => handleStyleChange('cardHeaderBg', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.cardHeaderBg || "#f9fafb"}
                onChange={(e) => handleStyleChange('cardHeaderBg', e.target.value)}
                className="font-mono"
                placeholder="#f9fafb"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color for card headers</p>
          </div>

          <div>
            <Label htmlFor="inputBg">Input Background</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="inputBg"
                  type="color"
                  value={previewStyles.inputBg || "#FFFFFF"}
                  onChange={(e) => handleStyleChange('inputBg', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.inputBg || "#FFFFFF"}
                onChange={(e) => handleStyleChange('inputBg', e.target.value)}
                className="font-mono"
                placeholder="#FFFFFF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color for form inputs</p>
          </div>

          <div>
            <Label htmlFor="inputBorder">Input Border</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="inputBorder"
                  type="color"
                  value={previewStyles.inputBorder || "#d1d5db"}
                  onChange={(e) => handleStyleChange('inputBorder', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.inputBorder || "#d1d5db"}
                onChange={(e) => handleStyleChange('inputBorder', e.target.value)}
                className="font-mono"
                placeholder="#d1d5db"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Border color for form inputs</p>
          </div>
        </div>
      </div>

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

            <div
              className="rounded-md p-6 mt-4 border"
              style={{ backgroundColor: previewStyles.background }}
            >
              <div className="space-y-4">
                <h4 className="text-lg font-semibold" style={{ color: previewStyles.primary }}>Preview Heading</h4>
                <p>This is sample text that shows how your content will appear.</p>
                <div className="flex space-x-2">
                  <button
                    className="px-4 py-2 rounded-md"
                    style={{
                      backgroundColor: previewStyles.primary,
                      color: '#FFFFFF',
                    }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded-md"
                    style={{
                      backgroundColor: previewStyles.secondary,
                      color: '#FFFFFF',
                    }}
                  >
                    Secondary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded-md border"
                    style={{
                      borderColor: previewStyles.accent,
                      color: previewStyles.accent,
                    }}
                  >
                    Accent Button
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div
                    className="p-4 rounded-md border"
                    style={{
                      borderColor: previewStyles.primary + '40',
                      backgroundColor: previewStyles.primary + '10',
                    }}
                  >
                    <h5 style={{ color: previewStyles.primary }}>Card with Primary</h5>
                    <p className="text-sm mt-1">Sample card with primary color.</p>
                  </div>
                  <div
                    className="p-4 rounded-md border"
                    style={{
                      borderColor: previewStyles.secondary + '40',
                      backgroundColor: previewStyles.secondary + '10',
                    }}
                  >
                    <h5 style={{ color: previewStyles.secondary }}>Card with Secondary</h5>
                    <p className="text-sm mt-1">Sample card with secondary color.</p>
                  </div>
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