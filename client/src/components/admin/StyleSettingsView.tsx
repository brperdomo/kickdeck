import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DashboardPreview } from "./DashboardPreview";

export function StyleSettingsView({ organizationId }: { organizationId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [primaryColor, setPrimaryColor] = useState("#0066CC");
  const [secondaryColor, setSecondaryColor] = useState("#FF9900");
  const [logoUrl, setLogoUrl] = useState("");
  const [favicon, setFavicon] = useState("");
  const [customCSS, setCustomCSS] = useState("");
  const [selectedTab, setSelectedTab] = useState("branding");

  // Fetch organization style settings
  const { data: orgSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: [`/api/admin/organizations/${organizationId}/style-settings`],
    queryFn: async () => {
      const response = await fetch(`/api/admin/organizations/${organizationId}/style-settings`);
      if (!response.ok) {
        throw new Error("Failed to fetch organization style settings");
      }
      return response.json();
    },
    enabled: !!organizationId,
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (orgSettings) {
      setPrimaryColor(orgSettings.primaryColor || "#0066CC");
      setSecondaryColor(orgSettings.secondaryColor || "#FF9900");
      setLogoUrl(orgSettings.logoUrl || "");
      setFavicon(orgSettings.favicon || "");
      setCustomCSS(orgSettings.customCSS || "");
    }
  }, [orgSettings]);

  // Save style settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (styleData: any) => {
      const response = await fetch(`/api/admin/organizations/${organizationId}/style-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(styleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save style settings");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your style settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/organizations/${organizationId}/style-settings`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      primaryColor,
      secondaryColor,
      logoUrl,
      favicon,
      customCSS,
    });
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
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
        <div className="w-full lg:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>Style Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                <TabsContent value="branding" className="space-y-4">
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex items-center space-x-2">
                          <ColorPicker
                            id="primaryColor"
                            value={primaryColor}
                            onChange={setPrimaryColor}
                          />
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-28"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex items-center space-x-2">
                          <ColorPicker
                            id="secondaryColor"
                            value={secondaryColor}
                            onChange={setSecondaryColor}
                          />
                          <Input
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-28"
                          />
                        </div>
                      </div>
                    </div>

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
                            alt="Organization Logo"
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
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <div className="space-y-2 pt-4">
                    <Label htmlFor="customCSS">Custom CSS</Label>
                    <textarea
                      id="customCSS"
                      value={customCSS}
                      onChange={(e) => setCustomCSS(e.target.value)}
                      className="w-full h-64 p-2 border rounded font-mono"
                      placeholder=":root { /* Custom CSS variables */ }"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleSaveSettings}
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardPreview 
                organization={{
                  name: "Organization Name",
                  primaryColor,
                  secondaryColor,
                  logoUrl,
                  domain: "example.matchpro.ai"
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}