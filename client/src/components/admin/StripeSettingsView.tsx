import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Eye,
  EyeOff,
  Check,
  Trash2,
  Zap,
  Loader2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  TestTube2,
} from "lucide-react";

interface StripeStatus {
  configured: boolean;
  source: "organization" | "platform" | "none";
  secretKeyPreview: string | null;
  publishableKeyPreview: string | null;
  webhookConfigured: boolean;
  testMode: boolean | null;
}

export function StripeSettingsView() {
  const [secretKey, setSecretKey] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [testMode, setTestMode] = useState(true);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showPublishableKey, setShowPublishableKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    livemode?: boolean;
  } | null>(null);
  const { toast } = useToast();

  // Load Stripe status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/organization-settings/stripe-status", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch Stripe status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeys = async () => {
    if (!secretKey.trim()) {
      toast({
        title: "Secret key required",
        description: "Please enter your Stripe secret key.",
        variant: "destructive",
      });
      return;
    }
    if (!publishableKey.trim()) {
      toast({
        title: "Publishable key required",
        description: "Please enter your Stripe publishable key.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      setTestResult(null);
      const res = await fetch("/api/admin/organization-settings/stripe-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          secretKey: secretKey.trim(),
          publishableKey: publishableKey.trim(),
          webhookSecret: webhookSecret.trim() || undefined,
          testMode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Stripe keys saved",
          description: `Keys saved securely (${data.secretKeyPreview}).`,
        });
        setSecretKey("");
        setPublishableKey("");
        setWebhookSecret("");
        await fetchStatus();
      } else {
        let errMsg = `Server error (${res.status})`;
        try {
          const err = await res.json();
          errMsg = err.error || err.details || errMsg;
        } catch {
          // Response wasn't JSON — use status text
          errMsg = `${res.status} ${res.statusText}`;
        }
        toast({
          title: "Failed to save",
          description: errMsg,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Stripe key save error:", error);
      toast({
        title: "Error",
        description: error?.message || "Network error saving Stripe keys.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const body = secretKey.trim()
        ? { secretKey: secretKey.trim() }
        : {};
      const res = await fetch(
        "/api/admin/organization-settings/stripe-keys/test",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: data.success,
          message: data.success
            ? `Connection successful — ${data.livemode ? "live" : "test"} mode key is valid!`
            : data.error || "Test failed",
          livemode: data.livemode,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Network error testing the Stripe key.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRemoveKeys = async () => {
    try {
      setRemoving(true);
      setTestResult(null);
      const res = await fetch("/api/admin/organization-settings/stripe-keys", {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast({
          title: "Stripe keys removed",
          description:
            "Payment features will use environment defaults or be disabled until new keys are added.",
        });
        await fetchStatus();
      } else {
        toast({
          title: "Error",
          description: "Failed to remove the Stripe keys.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error removing Stripe keys.",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isConfigured = status?.configured === true;
  const sourceLabel =
    status?.source === "organization"
      ? "Organization Keys"
      : status?.source === "platform"
        ? "Platform Default"
        : "Not Configured";

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold">Payment Configuration</h3>
        <p className="text-muted-foreground text-sm">
          Configure your Stripe API keys to enable payment processing for team
          registrations and tournament payouts.
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isConfigured
                    ? "bg-green-500/10 text-green-500"
                    : "bg-gray-500/10 text-gray-400"
                }`}
              >
                {isConfigured ? (
                  <ShieldCheck className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">
                    {isConfigured
                      ? "Stripe Payments Active"
                      : "Stripe Payments Disabled"}
                  </span>
                  <Badge
                    variant={isConfigured ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {sourceLabel}
                  </Badge>
                  {status?.testMode !== null && isConfigured && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        status?.testMode
                          ? "border-yellow-500/50 text-yellow-600"
                          : "border-green-500/50 text-green-600"
                      }`}
                    >
                      {status?.testMode ? (
                        <>
                          <TestTube2 className="h-3 w-3 mr-1" />
                          Test Mode
                        </>
                      ) : (
                        "Live Mode"
                      )}
                    </Badge>
                  )}
                </div>
                {status?.secretKeyPreview && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Secret:{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {status.secretKeyPreview}
                    </code>
                  </p>
                )}
                {status?.publishableKeyPreview && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Publishable:{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {status.publishableKeyPreview}
                    </code>
                  </p>
                )}
                {isConfigured && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Webhook:{" "}
                    <span
                      className={
                        status?.webhookConfigured
                          ? "text-green-600"
                          : "text-yellow-600"
                      }
                    >
                      {status?.webhookConfigured
                        ? "Configured"
                        : "Not configured"}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {isConfigured && status?.source === "organization" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveKeys}
                disabled={removing}
              >
                {removing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                Remove Keys
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Key Input */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Test Mode Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Test Mode</Label>
              <p className="text-xs text-muted-foreground">
                Enable test mode to use Stripe's test environment (sk_test_ / pk_test_ keys)
              </p>
            </div>
            <Switch checked={testMode} onCheckedChange={setTestMode} />
          </div>

          {/* Secret Key */}
          <div>
            <Label htmlFor="stripe-secret-key" className="text-sm font-medium">
              Secret Key
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Your Stripe secret key — encrypted before storage.
            </p>
            <div className="relative">
              <Input
                id="stripe-secret-key"
                type={showSecretKey ? "text" : "password"}
                placeholder={testMode ? "sk_test_..." : "sk_live_..."}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecretKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Publishable Key */}
          <div>
            <Label
              htmlFor="stripe-publishable-key"
              className="text-sm font-medium"
            >
              Publishable Key
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Your Stripe publishable key — used client-side for payment forms.
            </p>
            <div className="relative">
              <Input
                id="stripe-publishable-key"
                type={showPublishableKey ? "text" : "password"}
                placeholder={testMode ? "pk_test_..." : "pk_live_..."}
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPublishableKey(!showPublishableKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPublishableKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Webhook Secret */}
          <div>
            <Label
              htmlFor="stripe-webhook-secret"
              className="text-sm font-medium"
            >
              Webhook Secret{" "}
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Your Stripe webhook signing secret for verifying incoming events.
            </p>
            <div className="relative">
              <Input
                id="stripe-webhook-secret"
                type={showWebhookSecret ? "text" : "password"}
                placeholder="whsec_..."
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showWebhookSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSaveKeys}
              disabled={saving || (!secretKey.trim() && !publishableKey.trim())}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Save Keys
            </Button>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Zap className="h-4 w-4 mr-1" />
              )}
              Test Connection
            </Button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md ${
                testResult.success
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              {testResult.success ? (
                <Check className="h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              )}
              {testResult.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>How to get API keys:</strong> Visit{" "}
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  dashboard.stripe.com/apikeys
                  <ExternalLink className="h-3 w-3" />
                </a>{" "}
                to find or create your Stripe API keys.
              </p>
              <p>
                <strong>Test vs Live:</strong> Use test mode keys (sk_test_ /
                pk_test_) during development. Switch to live keys (sk_live_ /
                pk_live_) for production. Test mode allows simulated payments
                without real charges.
              </p>
              <p>
                <strong>Webhook setup:</strong> For real-time payment
                notifications, configure a webhook endpoint in your Stripe
                dashboard pointing to your app's{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  /api/payments/webhook
                </code>{" "}
                URL.
              </p>
              <p>
                <strong>Security:</strong> All keys are encrypted with
                AES-256-GCM before storage. Secret keys are never exposed in API
                responses or logs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
