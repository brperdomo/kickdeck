import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Mail, Settings, TestTube, Globe } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface BrevoTemplate {
  id: number;
  name: string;
  subject: string;
  isActive: boolean;
  createdAt: string;
}

interface EmailProvider {
  id: number;
  providerType: string;
  providerName: string;
  settings: {
    apiKey: string;
    from: string;
  };
  isActive: boolean;
  isDefault: boolean;
}

interface TestResult {
  success: boolean;
  message: string;
  templates?: BrevoTemplate[];
  error?: string;
}

export function BrevoSetupWizard() {
  const [apiKey, setApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('support@kickdeck.io');
  const [currentStep, setCurrentStep] = useState(1);
  const [testEmail, setTestEmail] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current Brevo configuration
  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ['/api/admin/email-providers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/email-providers');
      if (!response.ok) throw new Error('Failed to fetch email providers');
      return response.json() as EmailProvider[];
    }
  });

  // Test Brevo configuration
  const testConfigMutation = useMutation({
    mutationFn: async (config: { apiKey: string; fromEmail: string }) => {
      const response = await fetch('/api/admin/brevo/test-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error('Test failed');
      return response.json() as TestResult;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Configuration Valid",
          description: `Found ${data.templates?.length || 0} Brevo templates`
        });
        setCurrentStep(2);
      } else {
        toast({
          title: "Configuration Invalid",
          description: data.message,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  // Save Brevo configuration
  const saveConfigMutation = useMutation({
    mutationFn: async (config: { apiKey: string; fromEmail: string }) => {
      const response = await fetch('/api/admin/email-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerType: 'brevo',
          providerName: 'Brevo',
          settings: {
            apiKey: config.apiKey,
            from: config.fromEmail
          },
          isActive: true,
          isDefault: true
        })
      });
      if (!response.ok) throw new Error('Failed to save configuration');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Brevo has been configured successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-providers'] });
      setCurrentStep(3);
    }
  });

  // Send test email
  const testEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/admin/brevo/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!response.ok) throw new Error('Failed to send test email');
      return response.json() as TestResult;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Test Email Sent",
          description: "Check your inbox for the test email"
        });
      } else {
        toast({
          title: "Test Email Failed",
          description: data.message,
          variant: "destructive"
        });
      }
    }
  });

  // Load existing configuration
  useEffect(() => {
    if (currentConfig && currentConfig.length > 0) {
      const brevoConfig = currentConfig.find(c => c.providerType === 'brevo');
      if (brevoConfig) {
        setApiKey(brevoConfig.settings.apiKey || '');
        setFromEmail(brevoConfig.settings.from || 'support@kickdeck.io');
      }
    }
  }, [currentConfig]);

  const handleTestConfig = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Brevo API key",
        variant: "destructive"
      });
      return;
    }

    testConfigMutation.mutate({ apiKey: apiKey.trim(), fromEmail });
  };

  const handleSaveConfig = () => {
    saveConfigMutation.mutate({ apiKey: apiKey.trim(), fromEmail });
  };

  const handleSendTestEmail = () => {
    if (!testEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address for testing",
        variant: "destructive"
      });
      return;
    }

    testEmailMutation.mutate(testEmail);
  };

  const isConfigured = currentConfig?.some(c => c.providerType === 'brevo' && c.isActive);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Brevo Email Configuration
        </CardTitle>
        <CardDescription>
          Set up Brevo for email delivery in your application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Setup
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Test
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              {isConfigured ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Brevo API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="xkeysib-xxxxxxxxxx"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Get your API key from the Brevo dashboard under SMTP & API &rarr; API Keys
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email Address</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="support@kickdeck.io"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  This email address must be verified in your Brevo account
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleTestConfig}
                  disabled={testConfigMutation.isPending}
                  variant="outline"
                >
                  {testConfigMutation.isPending ? 'Testing...' : 'Test Configuration'}
                </Button>

                <Button
                  onClick={handleSaveConfig}
                  disabled={saveConfigMutation.isPending || !apiKey.trim()}
                >
                  {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testEmail">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSendTestEmail}
                disabled={testEmailMutation.isPending || !isConfigured}
              >
                {testEmailMutation.isPending ? 'Sending...' : 'Send Test Email'}
              </Button>

              {!isConfigured && (
                <p className="text-sm text-muted-foreground">
                  Please configure Brevo first before sending test emails
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <TemplatesList />
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <StatusOverview isConfigured={isConfigured} config={currentConfig} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TemplatesList() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/admin/brevo/templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/brevo/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json() as BrevoTemplate[];
    }
  });

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No Brevo templates found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Make sure Brevo is configured and you have templates in your account
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Available Templates</h3>
      <div className="grid gap-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-muted-foreground">ID: {template.id}</p>
                </div>
                <Badge variant="outline">
                  {template.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusOverview({ isConfigured, config }: { isConfigured: boolean; config?: EmailProvider[] }) {
  const brevoConfig = config?.find(c => c.providerType === 'brevo');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {isConfigured ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-500" />
        )}
        <h3 className="text-lg font-semibold">
          {isConfigured ? 'Brevo Configured' : 'Brevo Not Configured'}
        </h3>
      </div>

      {brevoConfig && (
        <div className="space-y-2">
          <p><strong>Provider:</strong> {brevoConfig.providerName}</p>
          <p><strong>From Email:</strong> {brevoConfig.settings.from}</p>
          <p><strong>Status:</strong> {brevoConfig.isActive ? 'Active' : 'Inactive'}</p>
          <p><strong>Default:</strong> {brevoConfig.isDefault ? 'Yes' : 'No'}</p>
        </div>
      )}

      {!isConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800">Configuration Required</h4>
          <p className="text-yellow-700 text-sm mt-1">
            Please configure Brevo in the Setup tab to enable email functionality
          </p>
        </div>
      )}
    </div>
  );
}
