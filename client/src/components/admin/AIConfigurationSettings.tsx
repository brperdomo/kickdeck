import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  Eye,
  EyeOff,
  Check,
  Trash2,
  Zap,
  Loader2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface AIStatus {
  configured: boolean;
  source: "organization" | "platform" | "none";
  preview: string | null;
}

export function AIConfigurationSettings() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const { toast } = useToast();

  // Load AI status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/organization-settings/ai-status", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch AI status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API key required",
        description: "Please enter your OpenAI API key.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      setTestResult(null);
      const res = await fetch("/api/admin/organization-settings/ai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: "API key saved",
          description: `Key saved securely (${data.preview}).`,
        });
        setApiKey("");
        await fetchStatus();
      } else {
        const err = await res.json();
        toast({
          title: "Failed to save",
          description: err.error || "Could not save the API key.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error saving API key.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestKey = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const body = apiKey.trim()
        ? { apiKey: apiKey.trim() }
        : {};
      const res = await fetch(
        "/api/admin/organization-settings/ai-key/test",
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
            ? "Connection successful — your key is valid!"
            : data.error || "Test failed",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Network error testing the API key.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRemoveKey = async () => {
    try {
      setRemoving(true);
      setTestResult(null);
      const res = await fetch("/api/admin/organization-settings/ai-key", {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast({
          title: "API key removed",
          description: "AI features will be disabled until a new key is added.",
        });
        await fetchStatus();
      } else {
        toast({
          title: "Error",
          description: "Failed to remove the API key.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error removing API key.",
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
      ? "Organization Key"
      : status?.source === "platform"
        ? "Platform Default"
        : "Not Configured";

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold">AI Configuration</h3>
        <p className="text-muted-foreground text-sm">
          Configure your OpenAI API key to enable AI-powered features like the
          Help Center chatbot and scheduling assistant.
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
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {isConfigured ? "AI Features Active" : "AI Features Disabled"}
                  </span>
                  <Badge
                    variant={isConfigured ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {sourceLabel}
                  </Badge>
                </div>
                {status?.preview && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Key: <code className="text-xs bg-muted px-1 py-0.5 rounded">{status.preview}</code>
                  </p>
                )}
              </div>
            </div>

            {isConfigured && status?.source === "organization" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveKey}
                disabled={removing}
              >
                {removing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                Remove Key
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Key Input */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="openai-key" className="text-sm font-medium">
              OpenAI API Key
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Enter your OpenAI API key. It will be encrypted before storage —
              we never store plaintext keys.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="openai-key"
                  type={showKey ? "text" : "password"}
                  placeholder="sk-proj-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveKey} disabled={saving || !apiKey.trim()}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Save Key
            </Button>
            <Button
              variant="outline"
              onClick={handleTestKey}
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
            <Brain className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>How to get an API key:</strong> Visit{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  platform.openai.com/api-keys
                  <ExternalLink className="h-3 w-3" />
                </a>{" "}
                to create a new API key in your OpenAI account.
              </p>
              <p>
                <strong>Recommended model:</strong> KickDeck uses GPT-4o for
                scheduling assistance and GPT-4o-mini for the help center
                chatbot. Ensure your OpenAI account has access to these models.
              </p>
              <p>
                <strong>Cost:</strong> OpenAI charges per token used. Typical
                tournament management usage costs $1–5/month depending on
                volume. You can set spending limits in your OpenAI dashboard.
              </p>
              <p>
                <strong>Security:</strong> Your API key is encrypted with
                AES-256-GCM before storage. It is never exposed in API responses
                or logs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
