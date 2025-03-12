
import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ColorPicker } from "@/components/ui/color-picker";

export function StyleSettingsView() {
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [secondaryColor, setSecondaryColor] = useState("#32CD32");
  const [accentColor, setAccentColor] = useState("#FF8C00");
  const [backgroundColor, setBackgroundColor] = useState("#F5F5F6");
  const [navBackgroundColor, setNavBackgroundColor] = useState("#FFFFFF");
  const [navTextColor, setNavTextColor] = useState("#000000");
  const [navActiveColor, setNavActiveColor] = useState("#E6F7FF");
  const [navHoverColor, setNavHoverColor] = useState("#f3f4f6");
  const [logoUrl, setLogoUrl] = useState("/uploads/MatchProAI_Linear_Black.png");
  const [favicon, setFavicon] = useState("/favicon.ico");

  useEffect(() => {
    // Fetch styling settings from the API
    fetch("/api/admin/styling")
      .then((response) => response.json())
      .then((data) => {
        setPrimaryColor(data.primary || "#000000");
        setSecondaryColor(data.secondary || "#32CD32");
        setAccentColor(data.accent || "#FF8C00");
        setBackgroundColor(data.background || "#F5F5F6");
        setNavBackgroundColor(data.adminNavBackground || "#FFFFFF");
        setNavTextColor(data.adminNavText || "#000000");
        setNavActiveColor(data.adminNavActive || "#E6F7FF");
        setNavHoverColor(data.adminNavHover || "#f3f4f6");
        setLogoUrl(data.logoUrl || "/uploads/MatchProAI_Linear_Black.png");
        setFavicon(data.favicon || "/favicon.ico");
        setIsLoadingSettings(false);
      })
      .catch((error) => {
        console.error("Error fetching styling settings:", error);
        setIsLoadingSettings(false);
      });
  }, []);

  // Apply styles to the DOM
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", primaryColor);
    root.style.setProperty("--color-secondary", secondaryColor);
    root.style.setProperty("--color-accent", accentColor);
    root.style.setProperty("--color-background", backgroundColor);
    
    // Update admin navigation styles
    const styleElement = document.getElementById("admin-dashboard-styles");
    if (styleElement) {
      styleElement.innerHTML = `
        :root {
          --admin-nav-bg: ${navBackgroundColor};
          --admin-nav-text: ${navTextColor};
          --admin-nav-active: ${navActiveColor};
          --admin-nav-hover: ${navHoverColor};
        }
        
        .admin-sidebar-item {
          transition: background-color 0.2s ease;
        }
        
        .admin-sidebar-item:hover {
          background-color: var(--admin-nav-hover) !important;
        }
        
        .admin-sidebar-item.active {
          background-color: var(--admin-nav-active) !important;
        }
      `;
    }
    
    // Update favicon
    const faviconElement = document.querySelector('link[rel="icon"]');
    if (faviconElement) {
      faviconElement.setAttribute('href', favicon);
    } else {
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = favicon;
      newFavicon.type = 'image/x-icon';
      document.head.appendChild(newFavicon);
    }
  }, [primaryColor, secondaryColor, accentColor, backgroundColor, navBackgroundColor, navTextColor, navActiveColor, navHoverColor, favicon]);

  const handleSaveSettings = async () => {
    try {
      const response = await fetch("/api/admin/styling", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
          background: backgroundColor,
          adminNavBackground: navBackgroundColor,
          adminNavText: navTextColor,
          adminNavActive: navActiveColor,
          adminNavHover: navHoverColor,
          logoUrl: logoUrl,
          favicon: favicon,
        }),
      });

      if (response.ok) {
        toast({
          title: "Settings updated",
          description: "Your styling settings have been saved.",
        });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }

      const data = await response.json();
      setLogoUrl(data.url);

      toast({
        title: "Logo uploaded",
        description: "Your logo has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error uploading logo",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Handle favicon upload
  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload favicon");
      }

      const data = await response.json();
      setFavicon(data.url);

      toast({
        title: "Favicon uploaded",
        description: "Your favicon has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error uploading favicon",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Style Settings</h1>
      
      <Tabs defaultValue="colors">
        <TabsList className="mb-4">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>
        
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Color Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      color={primaryColor}
                      onChange={setPrimaryColor}
                    />
                    <Input
                      id="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      color={secondaryColor}
                      onChange={setSecondaryColor}
                    />
                    <Input
                      id="secondaryColor"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      color={accentColor}
                      onChange={setAccentColor}
                    />
                    <Input
                      id="accentColor"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      color={backgroundColor}
                      onChange={setBackgroundColor}
                    />
                    <Input
                      id="backgroundColor"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="navigation">
          <Card>
            <CardHeader>
              <CardTitle>Navigation Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="navBackgroundColor">Navigation Background</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      color={navBackgroundColor}
                      onChange={setNavBackgroundColor}
                    />
                    <Input
                      id="navBackgroundColor"
                      value={navBackgroundColor}
                      onChange={(e) => setNavBackgroundColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="navTextColor">Navigation Text</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      color={navTextColor}
                      onChange={setNavTextColor}
                    />
                    <Input
                      id="navTextColor"
                      value={navTextColor}
                      onChange={(e) => setNavTextColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="navActiveColor">Active Item Background</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      color={navActiveColor}
                      onChange={setNavActiveColor}
                    />
                    <Input
                      id="navActiveColor"
                      value={navActiveColor}
                      onChange={(e) => setNavActiveColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="navHoverColor">Hover Item Background</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      color={navHoverColor}
                      onChange={setNavHoverColor}
                    />
                    <Input
                      id="navHoverColor"
                      value={navHoverColor}
                      onChange={(e) => setNavHoverColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      id="logo"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="Logo URL"
                    />
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("logo-upload")?.click()}
                      >
                        Upload
                      </Button>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </div>
                  </div>
                  {logoUrl && (
                    <div className="mt-2 p-2 border rounded">
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-12 object-contain"
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="favicon">Favicon</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      id="favicon"
                      value={favicon}
                      onChange={(e) => setFavicon(e.target.value)}
                      placeholder="Favicon URL"
                    />
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("favicon-upload")?.click()}
                      >
                        Upload
                      </Button>
                      <input
                        id="favicon-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFaviconUpload}
                      />
                    </div>
                  </div>
                  {favicon && (
                    <div className="mt-2 p-2 border rounded">
                      <img
                        src={favicon}
                        alt="Favicon"
                        className="h-8 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings}>
          Save Settings
        </Button>
      </div>
      
      <div className="mt-8 p-4 border rounded-lg bg-muted">
        <h2 className="text-xl font-semibold mb-4">Preview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: primaryColor }}>
            <p className="text-white font-bold">Primary Color</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: secondaryColor }}>
            <p className="text-white font-bold">Secondary Color</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: accentColor }}>
            <p className="text-white font-bold">Accent Color</p>
          </div>
          <div className="p-4 rounded-lg border" style={{ backgroundColor: backgroundColor }}>
            <p className="font-bold">Background Color</p>
          </div>
        </div>
        
        <div className="mt-4 border rounded-lg overflow-hidden">
          <div className="p-3" style={{ backgroundColor: navBackgroundColor, color: navTextColor }}>
            <p className="font-medium">Navigation Bar</p>
          </div>
          <div className="flex">
            <div className="p-3 font-medium" style={{ backgroundColor: navActiveColor, color: navTextColor }}>
              Active Item
            </div>
            <div className="p-3 font-medium" style={{ backgroundColor: navHoverColor, color: navTextColor }}>
              Hover Item
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StyleSettingsView;
