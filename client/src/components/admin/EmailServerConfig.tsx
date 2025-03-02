
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const emailConfigSchema = z.object({
  host: z.string().min(1, "SMTP host is required"),
  port: z.coerce.number().int().positive("Port must be a positive number"),
  secure: z.boolean().default(true),
  auth: z.object({
    user: z.string().min(1, "Username is required"),
    pass: z.string().min(1, "Password is required"),
  }),
  senderEmail: z.string().email("Must be a valid email address"),
  senderName: z.string().optional(),
});

type EmailServerConfig = z.infer<typeof emailConfigSchema>;

export function EmailServerConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [secure, setSecure] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const { data: emailConfig, isLoading } = useQuery({
    queryKey: ['emailServerConfig'],
    queryFn: async () => {
      const response = await fetch('/api/admin/email-config');
      if (!response.ok) {
        throw new Error('Failed to fetch email server configuration');
      }
      return response.json() as Promise<EmailServerConfig>;
    },
    onSuccess: (data) => {
      if (data) {
        setHost(data.host || "");
        setPort(data.port?.toString() || "587");
        setSecure(data.secure ?? true);
        setUsername(data.auth?.user || "");
        setPassword(data.auth?.pass || "");
        setSenderEmail(data.senderEmail || "");
        setSenderName(data.senderName || "");
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (config: EmailServerConfig) => {
      const response = await fetch('/api/admin/email-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Failed to update email configuration: ${await response.text()}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailServerConfig'] });
      toast({
        title: "Success",
        description: "Email server configuration saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save email configuration",
        variant: "destructive",
      });
    }
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (config: EmailServerConfig) => {
      setIsTestingConnection(true);
      const response = await fetch('/api/admin/email-config/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Connection test failed: ${await response.text()}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email server connection test successful",
      });
      setIsTestingConnection(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Connection test failed",
        variant: "destructive",
      });
      setIsTestingConnection(false);
    }
  });

  const handleSave = () => {
    try {
      const config: EmailServerConfig = {
        host,
        port: parseInt(port),
        secure,
        auth: {
          user: username,
          pass: password,
        },
        senderEmail,
        senderName
      };
      
      emailConfigSchema.parse(config);
      updateMutation.mutate(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid email configuration",
          variant: "destructive",
        });
      }
    }
  };

  const handleTestConnection = () => {
    try {
      const config: EmailServerConfig = {
        host,
        port: parseInt(port),
        secure,
        auth: {
          user: username,
          pass: password,
        },
        senderEmail,
        senderName
      };
      
      emailConfigSchema.parse(config);
      testConnectionMutation.mutate(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid email configuration",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Server Configuration</CardTitle>
        <CardDescription>Configure your production SMTP server settings for sending emails</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">SMTP Host</Label>
              <Input
                id="host"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="e.g., smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">SMTP Port</Label>
              <Input
                id="port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="e.g., 587"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="secure"
              checked={secure}
              onCheckedChange={setSecure}
            />
            <Label htmlFor="secure">Use secure connection (TLS/SSL)</Label>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Authentication</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="SMTP username or email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="SMTP password"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sender Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sender-email">Sender Email</Label>
                <Input
                  id="sender-email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="noreply@yourdomain.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender-name">Sender Name</Label>
                <Input
                  id="sender-name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Your Organization Name"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={isTestingConnection || updateMutation.isPending}
            >
              {isTestingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateMutation.isPending || isTestingConnection}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
