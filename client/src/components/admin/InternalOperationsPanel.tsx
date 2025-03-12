
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Paintbrush,
  Building,
  Settings,
  Upload,
  Download,
  Users,
} from "lucide-react";

import { Settings, PlusCircle, Upload, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type InternalOperationsPanelProps = {
  setActiveView: (view: string) => void;
  openSettings: (section: string) => void;
};

export function InternalOperationsPanel({
  setActiveView,
  openSettings,
}: InternalOperationsPanelProps) {
  return (
    <div className="w-72 border-l bg-background h-screen overflow-auto shrink-0">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Internal Operations</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium">Client Management</h3>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => setActiveView("households")}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Client Setup
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => openSettings("style")}
              >
                <Settings className="h-4 w-4 mr-2" />
                UI Styling Settings
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => openSettings("general")}
              >
                <FileText className="h-4 w-4 mr-2" />
                General Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium">Style Settings</h3>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                className="w-full justify-start text-sm mb-2"
                onClick={() => openSettings("styling")}
              >
                <Paintbrush className="h-4 w-4 mr-2" />
                UI Customization
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => openSettings("general")}
              >
                <Building className="h-4 w-4 mr-2" />
                Organization Info
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium">User Management</h3>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => setActiveView("administrators")}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Administrators
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium">Quick Actions</h3>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm">
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
