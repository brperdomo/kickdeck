/**
 * BrevoSetupWizard — Consolidated Brevo admin UI
 *
 * Three tabs:
 *   1. Connection  — API status, from email, test connection
 *   2. Template Mapping — map KickDeck email types → Brevo templates
 *   3. Test — send a test email via any Brevo template
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plug,
  LayoutList,
  TestTube,
  Send,
  Eye,
  EyeOff,
  Info,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BrevoTemplate {
  id: number;
  name: string;
  subject: string;
  isActive: boolean;
  createdAt: string;
}

interface EmailTemplate {
  id: number;
  name: string;
  type: string;
  subject: string;
  description: string | null;
  content: string | null;
  senderEmail: string | null;
  isActive: boolean;
  brevoTemplateId: number | null;
}

/* ------------------------------------------------------------------ */
/*  Template metadata: when it fires + what variables it receives      */
/* ------------------------------------------------------------------ */

const TEMPLATE_META: Record<string, { trigger: string; variables: string[] }> = {
  welcome: {
    trigger: 'User registers a new account',
    variables: ['firstName', 'lastName', 'email', 'username', 'loginLink'],
  },
  admin_welcome: {
    trigger: 'Admin creates a new administrator',
    variables: ['firstName', 'lastName', 'email', 'loginUrl', 'role'],
  },
  password_reset: {
    trigger: 'User requests "Forgot Password"',
    variables: ['username', 'resetUrl', 'expiryHours'],
  },
  registration_confirmation: {
    trigger: 'Team submits registration (setup intent / card-on-file flow)',
    variables: ['firstName', 'teamName', 'eventName', 'division', 'ageGroup', 'registrationDate', 'submittedDate', 'EVENT_ADMIN_EMAIL', 'loginLink'],
  },
  registration_under_review: {
    trigger: 'Team registration is pending admin review',
    variables: ['firstName', 'teamName', 'eventName', 'division', 'ageGroup', 'registrationDate', 'submittedDate', 'EVENT_ADMIN_EMAIL', 'loginLink'],
  },
  registration_receipt: {
    trigger: 'Team registers with immediate payment',
    variables: ['firstName', 'teamName', 'eventName', 'totalAmount', 'paymentStatus', 'registrationDate', 'submittedDate', 'EVENT_ADMIN_EMAIL', 'loginLink'],
  },
  payment_confirmation: {
    trigger: 'Admin manually confirms a payment',
    variables: ['firstName', 'teamName', 'eventName', 'registrationDate', 'submittedDate', 'amount', 'division', 'ageGroup', 'paymentId', 'status', 'EVENT_ADMIN_EMAIL'],
  },
  payment_completion_notification: {
    trigger: 'Admin sends payment completion link to team',
    variables: ['teamName', 'eventName', 'division', 'ageGroup', 'totalAmount', 'paymentLink', 'EVENT_ADMIN_EMAIL'],
  },
  payment_refunded: {
    trigger: 'Admin processes a refund for a team',
    variables: ['firstName', 'teamName', 'eventName', 'totalAmount', 'EVENT_ADMIN_EMAIL', 'loginLink'],
  },
  team_approved: {
    trigger: 'Admin approves a team registration',
    variables: ['firstName', 'teamName', 'eventName', 'division', 'ageGroup', 'registrationDate', 'submittedDate', 'notes', 'EVENT_ADMIN_EMAIL', 'loginLink'],
  },
  team_approved_with_payment: {
    trigger: 'Team auto-approved after successful Stripe payment',
    variables: ['firstName', 'teamName', 'eventName', 'registrationDate', 'submittedDate', 'totalAmount', 'cardBrand', 'cardLastFour', 'EVENT_ADMIN_EMAIL', 'loginLink'],
  },
  team_rejected: {
    trigger: 'Admin rejects a team registration',
    variables: ['firstName', 'teamName', 'eventName', 'division', 'ageGroup', 'registrationDate', 'submittedDate', 'notes', 'EVENT_ADMIN_EMAIL'],
  },
  team_waitlisted: {
    trigger: 'Admin waitlists a team registration',
    variables: ['firstName', 'teamName', 'eventName', 'division', 'ageGroup', 'registrationDate', 'submittedDate', 'notes', 'EVENT_ADMIN_EMAIL'],
  },
  team_withdrawn: {
    trigger: 'Admin withdraws a team',
    variables: ['firstName', 'teamName', 'eventName', 'division', 'ageGroup', 'registrationDate', 'submittedDate', 'notes', 'EVENT_ADMIN_EMAIL'],
  },
  team_status_update: {
    trigger: 'Generic team status change notification',
    variables: ['firstName', 'teamName', 'eventName', 'status', 'notes', 'EVENT_ADMIN_EMAIL', 'loginLink'],
  },
  newsletter_confirmation: {
    trigger: 'User subscribes to newsletter',
    variables: ['firstName', 'email', 'appUrl', 'loginLink'],
  },
};

interface BrevoSettings {
  apiKeySet: boolean;
  apiKeyValid: boolean;
  provider: {
    id: number;
    name: string;
    isDefault: boolean;
    settings: Record<string, any>;
  } | null;
  templatesWithBrevo: {
    id: number;
    name: string;
    type: string;
    isActive: boolean;
    brevoTemplateId: string | null;
  }[];
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function BrevoSetupWizard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [previewType, setPreviewType] = useState<string | null>(null);

  /* ── Queries ─────────────────────────────────────────────────────── */

  // Brevo connection settings (API key status, provider info)
  const {
    data: settings,
    isLoading: isLoadingSettings,
  } = useQuery<BrevoSettings>({
    queryKey: ['brevo-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/brevo/settings', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch Brevo settings');
      return res.json();
    },
  });

  // All Brevo templates (fetched from Brevo API)
  const {
    data: brevoTemplates,
    isLoading: isLoadingTemplates,
    refetch: refetchTemplates,
    error: templatesError,
  } = useQuery<BrevoTemplate[]>({
    queryKey: ['brevo-templates'],
    queryFn: async () => {
      const res = await fetch('/api/admin/brevo/templates', { credentials: 'include' });
      if (res.status === 401) throw new Error('Authentication required. Please log in as an admin.');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}: Failed to fetch Brevo templates`);
      }
      return res.json();
    },
    retry: false,
  });

  // KickDeck email templates + their Brevo mapping
  const {
    data: emailTemplates,
    isLoading: isLoadingEmailTemplates,
    error: emailTemplatesError,
  } = useQuery<EmailTemplate[]>({
    queryKey: ['email-templates-with-mappings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/brevo/template-mappings', { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.details || err.error || `HTTP ${res.status}: Failed to fetch email template mappings`);
      }
      return res.json();
    },
    retry: false,
  });

  /* ── Mutations ───────────────────────────────────────────────────── */

  // Map a Brevo template to a KickDeck email type
  const mapTemplateMutation = useMutation({
    mutationFn: async ({ templateType, brevoTemplateId }: { templateType: string; brevoTemplateId: number | null }) => {
      const res = await fetch('/api/admin/brevo/template-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ templateType, brevoTemplateId }),
      });
      if (!res.ok) throw new Error('Failed to update template mapping');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Mapping updated', description: 'Brevo template mapping saved.' });
      queryClient.invalidateQueries({ queryKey: ['email-templates-with-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['brevo-settings'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Mapping failed', description: err.message, variant: 'destructive' });
    },
  });

  // Send test email via a Brevo template
  const testTemplateMutation = useMutation({
    mutationFn: async ({ templateId, recipientEmail }: { templateId: string; recipientEmail: string }) => {
      const res = await fetch('/api/admin/brevo/test-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          templateId: Number(templateId),
          recipientEmail,
          testData: {
            firstName: 'Test',
            lastName: 'User',
            email: recipientEmail,
            loginLink: `${window.location.origin}/login`,
            role: 'Test User',
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to send test email');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Test email sent', description: `Check ${testEmail} for the test email.` });
    },
    onError: (err: Error) => {
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    },
  });

  /* ── Helpers ─────────────────────────────────────────────────────── */

  const handleMapTemplate = (templateType: string, brevoId: string | null) => {
    const id = brevoId === 'none' || brevoId === null ? null : Number(brevoId);
    mapTemplateMutation.mutate({ templateType, brevoTemplateId: id });
  };

  const getTemplateNameById = (id: number) => {
    const t = brevoTemplates?.find((t) => t.id === id);
    return t ? t.name : `Template #${id}`;
  };

  const handleSendTestEmail = () => {
    if (!testEmail) {
      toast({ title: 'Email required', description: 'Enter a recipient email address.', variant: 'destructive' });
      return;
    }
    if (!selectedTemplateId) {
      toast({ title: 'Template required', description: 'Select a template to test.', variant: 'destructive' });
      return;
    }
    testTemplateMutation.mutate({ templateId: selectedTemplateId, recipientEmail: testEmail });
  };

  const mappedCount = emailTemplates?.filter((t) => t.brevoTemplateId !== null).length ?? 0;

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <Tabs defaultValue="connection" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="connection" className="flex items-center gap-2">
          <Plug className="h-4 w-4" />
          Connection
        </TabsTrigger>
        <TabsTrigger value="templates" className="flex items-center gap-2">
          <LayoutList className="h-4 w-4" />
          Template Mapping
        </TabsTrigger>
        <TabsTrigger value="test" className="flex items-center gap-2">
          <TestTube className="h-4 w-4" />
          Test
        </TabsTrigger>
      </TabsList>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TAB 1: Connection                                          */}
      {/* ════════════════════════════════════════════════════════════ */}
      <TabsContent value="connection">
        <Card>
          <CardHeader>
            <CardTitle>Brevo Connection</CardTitle>
            <CardDescription>
              View your Brevo integration status. The API key is managed through environment variables.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSettings ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-5">
                {/* API key badge */}
                <div className="flex items-center gap-3">
                  <Label className="w-36 text-sm">API Key</Label>
                  {settings?.apiKeySet ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      Not Set
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-2">
                    Managed via <code className="px-1 py-0.5 rounded bg-muted text-xs">BREVO_API_KEY</code> env variable
                  </span>
                </div>

                {/* Provider name */}
                {settings?.provider && (
                  <>
                    <div className="flex items-center gap-3">
                      <Label className="w-36 text-sm">Provider</Label>
                      <span className="text-sm">{settings.provider.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Label className="w-36 text-sm">Default Provider</Label>
                      <span className="text-sm">{settings.provider.isDefault ? 'Yes' : 'No'}</span>
                    </div>
                  </>
                )}

                {/* Mapped templates count */}
                <div className="flex items-center gap-3">
                  <Label className="w-36 text-sm">Mapped Templates</Label>
                  <span className="text-sm">
                    {mappedCount} of {emailTemplates?.length ?? '...'} email types mapped
                  </span>
                </div>

                {!settings?.provider && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                    <strong>No provider found.</strong> Make sure the BREVO_API_KEY environment variable is set
                    and a Brevo provider record exists in the database.
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              To update the API key, set <code className="px-1 py-0.5 rounded bg-muted text-xs">BREVO_API_KEY</code> in
              your environment and redeploy.
            </p>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TAB 2: Template Mapping                                    */}
      {/* ════════════════════════════════════════════════════════════ */}
      <TabsContent value="templates">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Template Mapping</CardTitle>
                <CardDescription className="mt-1">
                  Map each KickDeck email type to a Brevo template. Emails will be sent via Brevo's
                  dynamic template engine when mapped.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchTemplates()}
                disabled={isLoadingTemplates}
              >
                {isLoadingTemplates ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Error banners */}
            {templatesError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-6 text-sm">
                <div className="flex items-start gap-2 text-red-300">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Error loading Brevo templates</p>
                    <p className="mt-1 text-red-400">{(templatesError as Error).message}</p>
                  </div>
                </div>
              </div>
            )}
            {emailTemplatesError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-6 text-sm">
                <div className="flex items-start gap-2 text-red-300">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Error loading email template types</p>
                    <p className="mt-1 text-red-400">{(emailTemplatesError as Error).message}</p>
                  </div>
                </div>
              </div>
            )}

            {isLoadingTemplates || isLoadingEmailTemplates ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !brevoTemplates || brevoTemplates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
                <p className="text-muted-foreground">
                  No Brevo templates found. Create templates in your Brevo account first.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => refetchTemplates()}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {emailTemplates?.map((tmpl) => {
                  const meta = TEMPLATE_META[tmpl.type];
                  const isPreviewOpen = previewType === tmpl.type;

                  return (
                    <div
                      key={tmpl.id}
                      className="rounded-lg border border-border/50 bg-card/50 p-4 transition-colors"
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{tmpl.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Type: <code className="px-1 py-0.5 rounded bg-muted text-xs">{tmpl.type}</code>
                            {tmpl.senderEmail && (
                              <span className="ml-2">
                                &middot; From: <code className="px-1 py-0.5 rounded bg-muted text-xs">{tmpl.senderEmail}</code>
                              </span>
                            )}
                          </p>
                        </div>
                        {tmpl.brevoTemplateId ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Mapped
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30">
                            <AlertCircle className="h-3.5 w-3.5 mr-1" />
                            Not Mapped
                          </Badge>
                        )}
                      </div>

                      {/* Trigger + subject info */}
                      {meta && (
                        <div className="rounded-md bg-muted/50 border border-border/30 p-3 mb-3 space-y-1.5">
                          <div className="flex items-start gap-2 text-xs">
                            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-400" />
                            <span><strong className="text-blue-400">Trigger:</strong> {meta.trigger}</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs">
                            <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                            <span><strong>Subject:</strong> <code className="text-xs">{tmpl.subject}</code></span>
                          </div>
                          <div className="flex items-start gap-2 text-xs flex-wrap">
                            <span className="shrink-0 text-muted-foreground font-medium">Variables:</span>
                            <span className="flex flex-wrap gap-1">
                              {meta.variables.map((v) => (
                                <code key={v} className="px-1.5 py-0.5 rounded bg-muted text-[11px] border border-border/50">
                                  {'{{'}params.{v}{'}}'}
                                </code>
                              ))}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Brevo mapping dropdown */}
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <Label htmlFor={`brevo-${tmpl.id}`} className="text-xs mb-1.5 block text-muted-foreground">
                            Brevo Template
                          </Label>
                          <Select
                            value={tmpl.brevoTemplateId ? String(tmpl.brevoTemplateId) : 'none'}
                            onValueChange={(val) => handleMapTemplate(tmpl.type, val)}
                          >
                            <SelectTrigger id={`brevo-${tmpl.id}`}>
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None (use fallback HTML)</SelectItem>
                              {brevoTemplates.map((bt) => (
                                <SelectItem key={bt.id} value={String(bt.id)}>
                                  {bt.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {tmpl.brevoTemplateId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => handleMapTemplate(tmpl.type, null)}
                          >
                            Remove
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewType(isPreviewOpen ? null : tmpl.type)}
                        >
                          {isPreviewOpen ? (
                            <><EyeOff className="h-4 w-4 mr-1" /> Hide Preview</>
                          ) : (
                            <><Eye className="h-4 w-4 mr-1" /> Preview Fallback</>
                          )}
                        </Button>
                      </div>

                      {tmpl.brevoTemplateId && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Currently mapped to: <strong>{getTemplateNameById(tmpl.brevoTemplateId)}</strong>
                        </p>
                      )}

                      {/* Expandable HTML preview */}
                      {isPreviewOpen && (
                        <div className="mt-3 rounded-lg border border-border/50 overflow-hidden">
                          <div className="bg-muted/30 px-3 py-2 text-xs font-medium border-b border-border/50 flex items-center justify-between">
                            <span>Fallback HTML Template (used when no Brevo template is mapped)</span>
                          </div>
                          {tmpl.content && tmpl.content !== '<p>{{content}}</p>' ? (
                            <iframe
                              srcDoc={tmpl.content}
                              title={`Preview: ${tmpl.name}`}
                              className="w-full bg-white"
                              style={{ height: '450px', border: 'none' }}
                              sandbox=""
                            />
                          ) : (
                            <div className="p-6 text-center text-sm text-muted-foreground">
                              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-400" />
                              <p>No fallback HTML content. This template will use a generic placeholder if not mapped to Brevo.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TAB 3: Test                                                */}
      {/* ════════════════════════════════════════════════════════════ */}
      <TabsContent value="test">
        <Card>
          <CardHeader>
            <CardTitle>Test Brevo Templates</CardTitle>
            <CardDescription>
              Send a test email using any Brevo template to verify it renders correctly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTemplates ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !brevoTemplates || brevoTemplates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
                <p className="text-muted-foreground">
                  No Brevo templates available. Create templates in Brevo first.
                </p>
              </div>
            ) : (
              <div className="space-y-5 max-w-md">
                <div>
                  <Label htmlFor="test-template" className="mb-1.5 block">
                    Template
                  </Label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger id="test-template">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {brevoTemplates.map((bt) => (
                        <SelectItem key={bt.id} value={String(bt.id)}>
                          {bt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="test-email" className="mb-1.5 block">
                    Recipient Email
                  </Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="you@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSendTestEmail}
                  disabled={!selectedTemplateId || !testEmail || testTemplateMutation.isPending}
                >
                  {testTemplateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Test Email
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Test emails include sample data (name, login link, etc.) so you can preview the template.
            </p>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
