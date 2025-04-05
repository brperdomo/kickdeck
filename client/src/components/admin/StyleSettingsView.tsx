import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { Toggle } from "@/components/ui/toggle";
import { 
  Loader2, 
  Moon, 
  Sun, 
  Save, 
  Layers, 
  Settings, 
  Users 
} from "lucide-react";

export function StyleSettingsView() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { currentAppearance, setAppearance } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(currentAppearance);

  useEffect(() => {
    setCurrentTheme(currentAppearance);
  }, [currentAppearance]);

  const handleThemeToggle = () => {
    const newTheme = currentAppearance === 'dark' ? 'light' : 'dark';
    setAppearance(newTheme);
  };

  const defaultStyles = {
    primary: 'hsl(150 65% 45%)', // Green primary
    secondary: 'hsl(190 80% 50%)', // Teal/cyan secondary
    accent: 'hsl(260 60% 55%)', // Purple accent
    background: '#FAFBFC',
    adminNavBackground: '#FFFFFF',
    adminNavText: '#42526E',
    adminNavActive: 'hsl(150 65% 45%)', // Same as primary - green
    adminNavHover: 'hsl(150 65% 10%)', // Darker green
    adminNavActiveText: '#FFFFFF', // Text color for active items
    adminNavSelectedBg: 'hsl(150 65% 45%)', // Background for selected items
    adminNavSelectedText: '#FFFFFF', // Text for selected items
    adminNavIconColor: '#566A7F', // Icon color for nav items
    adminNavActiveIconColor: '#FFFFFF', // Icon color for active items
    tableHeaderBg: '#F4F5F7',
    tableRowHoverBg: 'hsl(150 30% 95%)', // Very light green
    cardBg: '#FFFFFF',
    textColor: '#172B4D',
    cardHeaderBg: '#f9fafb',
    inputBg: '#FFFFFF',
    inputBorder: '#d1d5db',
    darkBackground: '#1D2330',
    darkText: '#E2E8F0',
    darkAccent: 'hsl(260 50% 40%)', // Dark purple accent
    darkPrimary: 'hsl(150 65% 40%)', // Dark green primary
    darkSecondary: 'hsl(190 70% 40%)', // Dark teal/cyan
    darkCardBg: '#2D3748',
    darkInputBg: '#1D2330',
    darkInputBorder: '#4A5568',
    warning: 'hsl(45 100% 50%)', // Bright yellow for warnings
    success: 'hsl(150 65% 45%)', // Match primary green
    adminSectionBg: '#FFFFFF' // Section backgrounds
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
        --admin-nav-selected-bg: ${previewStyles.adminNavSelectedBg || previewStyles.primary || '#000000'};
        --admin-nav-selected-text: ${previewStyles.adminNavSelectedText || '#FFFFFF'};
        --admin-nav-active-text: ${previewStyles.adminNavActiveText || '#FFFFFF'};
        --admin-nav-icon-color: ${previewStyles.adminNavIconColor || '#566A7F'};
        --admin-nav-active-icon-color: ${previewStyles.adminNavActiveIconColor || '#FFFFFF'};
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

  const handleStyleChange = (key: string, value: string) => {
    setPreviewStyles(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveStyles = async (e?: React.MouseEvent<HTMLButtonElement>, sectionName: string = "All") => {
    // If called directly as event handler
    if (e) {
      e.preventDefault();
    }
    setIsSaving(true);
    try {
      const completeStyles = {
        ...previewStyles,
        adminNavBackground: previewStyles.adminNavBackground || '#FFFFFF',
        adminNavText: previewStyles.adminNavText || '#000000',
        adminNavActive: previewStyles.adminNavActive || previewStyles.primary || '#000000',
        adminNavHover: previewStyles.adminNavHover || '#f3f4f6',
        adminNavSelectedBg: previewStyles.adminNavSelectedBg || previewStyles.primary || '#000000',
        adminNavSelectedText: previewStyles.adminNavSelectedText || '#FFFFFF',
        adminNavActiveText: previewStyles.adminNavActiveText || '#FFFFFF',
        adminNavIconColor: previewStyles.adminNavIconColor || '#566A7F',
        adminNavActiveIconColor: previewStyles.adminNavActiveIconColor || '#FFFFFF',
        tableHeaderBg: previewStyles.tableHeaderBg || "#f9fafb",
        tableRowHoverBg: previewStyles.tableRowHoverBg || "#f3f4f6",
        cardBg: previewStyles.cardBg || "#FFFFFF",
        cardHeaderBg: previewStyles.cardHeaderBg || "#f9fafb",
        inputBg: previewStyles.inputBg || "#FFFFFF",
        inputBorder: previewStyles.inputBorder || "#d1d5db",
        adminSectionBg: previewStyles.adminSectionBg || "#FFFFFF",
      };

      const response = await fetch('/api/admin/styling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeStyles),
      });

      if (response.ok) {
        let successMessage = "Style settings saved successfully";
        if (sectionName) {
          successMessage = `${sectionName} settings saved successfully`;
        }
        
        toast({
          title: "Success",
          description: successMessage,
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
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => handleSaveStyles(e, "UI")}
            disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Toggle
            pressed={currentAppearance === 'dark'}
            onPressedChange={(pressed) => {
              const newTheme = pressed ? 'dark' : 'light';
              setAppearance(newTheme);
            }}
            aria-label="Toggle dark mode"
            className="p-2"
          >
            {currentAppearance === 'dark' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Toggle>
        </div>
      </div>
      
      {/* Color scheme preview */}
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 border-r border-b">
              <h4 className="font-medium mb-3">Button Preview</h4>
              <div className="flex flex-wrap gap-2">
                <Button style={{backgroundColor: previewStyles.primary, color: "#fff"}}>
                  Primary
                </Button>
                <Button variant="outline" style={{borderColor: previewStyles.primary, color: previewStyles.primary}}>
                  Outline
                </Button>
                <Button style={{backgroundColor: previewStyles.secondary, color: "#fff"}}>
                  Secondary
                </Button>
                <Button style={{backgroundColor: previewStyles.accent, color: "#fff"}}>
                  Accent
                </Button>
              </div>
            </div>
            
            <div className="p-6 border-b" style={{backgroundColor: previewStyles.adminNavBackground}}>
              <h4 className="font-medium mb-3">Navigation Preview</h4>
              <div className="flex flex-col space-y-1">
                {/* Selected/Active Item */}
                <div 
                  className="flex items-center px-3 py-2 rounded-md" 
                  style={{
                    backgroundColor: previewStyles.adminNavSelectedBg, 
                    color: previewStyles.adminNavSelectedText
                  }}
                >
                  <Layers className="h-4 w-4 mr-2" style={{color: previewStyles.adminNavActiveIconColor}} />
                  <span className="text-sm font-medium">Selected Item</span>
                </div>
                
                {/* Active Hover Item */}
                <div 
                  className="flex items-center px-3 py-2 rounded-md" 
                  style={{
                    backgroundColor: previewStyles.adminNavActive, 
                    color: previewStyles.adminNavActiveText
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" style={{color: previewStyles.adminNavActiveIconColor}} />
                  <span className="text-sm font-medium">Active Item</span>
                </div>
                
                {/* Hover State (simulated) */}
                <div 
                  className="flex items-center px-3 py-2 rounded-md" 
                  style={{
                    backgroundColor: previewStyles.adminNavHover, 
                    color: previewStyles.adminNavText
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" style={{color: previewStyles.adminNavIconColor}} />
                  <span className="text-sm">Hover Item</span>
                </div>
                
                {/* Normal Item */}
                <div 
                  className="flex items-center px-3 py-2 rounded-md" 
                  style={{
                    color: previewStyles.adminNavText
                  }}
                >
                  <Users className="h-4 w-4 mr-2" style={{color: previewStyles.adminNavIconColor}} />
                  <span className="text-sm">Normal Item</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-r" style={{backgroundColor: previewStyles.tableHeaderBg}}>
              <h4 className="font-medium mb-3">Table Header</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm font-medium">ID</div>
                <div className="text-sm font-medium">Name</div>
                <div className="text-sm font-medium">Status</div>
              </div>
            </div>
            
            <div className="p-6" style={{backgroundColor: previewStyles.cardBg}}>
              <h4 className="font-medium mb-3">Card Preview</h4>
              <div className="p-3 rounded-md border" style={{backgroundColor: previewStyles.cardHeaderBg}}>
                <p className="text-sm">Card with header style</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div 
        className="p-4 rounded-md shadow mb-6" 
        style={{ backgroundColor: previewStyles.adminSectionBg || "#FFFFFF" }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Color Settings</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => handleSaveStyles(e, "Color")}
            disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Colors
              </>
            )}
          </Button>
        </div>

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
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium">Admin Dashboard Colors</h3>
            <p className="text-sm text-gray-500">These colors control the appearance of the admin dashboard navigation.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => handleSaveStyles(e, "Navigation")}
            disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Navigation
              </>
            )}
          </Button>
        </div>

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
            <Label htmlFor="adminNavSelectedBg">Selected Item Background</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavSelectedBg"
                  type="color"
                  value={previewStyles.adminNavSelectedBg || previewStyles.primary || "#0d365e"}
                  onChange={(e) => handleStyleChange('adminNavSelectedBg', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavSelectedBg || previewStyles.primary || "#0d365e"}
                onChange={(e) => handleStyleChange('adminNavSelectedBg', e.target.value)}
                className="font-mono"
                placeholder="#0d365e"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color for selected navigation items</p>
          </div>

          <div>
            <Label htmlFor="adminNavSelectedText">Selected Item Text</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavSelectedText"
                  type="color"
                  value={previewStyles.adminNavSelectedText || "#FFFFFF"}
                  onChange={(e) => handleStyleChange('adminNavSelectedText', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavSelectedText || "#FFFFFF"}
                onChange={(e) => handleStyleChange('adminNavSelectedText', e.target.value)}
                className="font-mono"
                placeholder="#FFFFFF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Text color for selected navigation items</p>
          </div>

          <div>
            <Label htmlFor="adminNavActiveText">Active Item Text</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavActiveText"
                  type="color"
                  value={previewStyles.adminNavActiveText || "#FFFFFF"}
                  onChange={(e) => handleStyleChange('adminNavActiveText', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavActiveText || "#FFFFFF"}
                onChange={(e) => handleStyleChange('adminNavActiveText', e.target.value)}
                className="font-mono"
                placeholder="#FFFFFF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Text color for active navigation items</p>
          </div>

          <div>
            <Label htmlFor="adminNavIconColor">Navigation Icon Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavIconColor"
                  type="color"
                  value={previewStyles.adminNavIconColor || "#566A7F"}
                  onChange={(e) => handleStyleChange('adminNavIconColor', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavIconColor || "#566A7F"}
                onChange={(e) => handleStyleChange('adminNavIconColor', e.target.value)}
                className="font-mono"
                placeholder="#566A7F"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Color for icons in navigation items</p>
          </div>

          <div>
            <Label htmlFor="adminNavActiveIconColor">Active Icon Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavActiveIconColor"
                  type="color"
                  value={previewStyles.adminNavActiveIconColor || "#FFFFFF"}
                  onChange={(e) => handleStyleChange('adminNavActiveIconColor', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavActiveIconColor || "#FFFFFF"}
                onChange={(e) => handleStyleChange('adminNavActiveIconColor', e.target.value)}
                className="font-mono"
                placeholder="#FFFFFF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Color for icons in active/selected navigation items</p>
          </div>
        </div>
      </div>

      <div 
        className="p-4 rounded-md shadow mb-6" 
        style={{ backgroundColor: previewStyles.adminSectionBg || "#FFFFFF" }}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium">Table & Card Styling</h3>
            <p className="text-sm text-gray-500">Customize the appearance of tables, cards and form elements.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => handleSaveStyles(e, "Components")}
            disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Components
              </>
            )}
          </Button>
        </div>

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
        <h2 className="text-2xl font-bold">Theme Preview</h2>
        <Button onClick={(e) => handleSaveStyles(e, "All")} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Settings
            </>
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