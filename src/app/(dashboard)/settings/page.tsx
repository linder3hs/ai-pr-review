"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Brain,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  Save,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ExternalLink,
  Zap,
  CircleDot,
} from "lucide-react";

const MODELS: Record<string, { label: string; value: string; desc: string }[]> = {
  openai: [
    { label: "GPT-4o", value: "gpt-4o", desc: "Best quality, 128k context" },
    { label: "GPT-4o Mini", value: "gpt-4o-mini", desc: "Fast and affordable" },
    { label: "GPT-4 Turbo", value: "gpt-4-turbo", desc: "Previous gen, 128k context" },
  ],
  anthropic: [
    { label: "Claude Sonnet 4", value: "claude-sonnet-4-20250514", desc: "Best balance of speed and quality" },
    { label: "Claude Opus 4", value: "claude-opus-4-20250514", desc: "Most capable, 200k context" },
    { label: "Claude Haiku 4.5", value: "claude-haiku-4-5-20251001", desc: "Fastest, most affordable" },
  ],
};

const API_KEY_LINKS: Record<string, { url: string; label: string }> = {
  openai: { url: "https://platform.openai.com/api-keys", label: "Get OpenAI API key" },
  anthropic: { url: "https://console.anthropic.com/settings/keys", label: "Get Anthropic API key" },
};

export default function SettingsPage() {
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setProvider(data.provider);
        setHasApiKey(data.hasApiKey);
        setModel(data.model || "");
      }
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, string> = { provider };
      if (apiKey) body.apiKey = apiKey;
      if (model) body.model = model;

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      toast.success("Settings saved successfully");
      setHasApiKey(true);
      setApiKey("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    } finally {
      setSaving(false);
    }
  }

  const availableModels = MODELS[provider] || MODELS.openai;
  const keyLink = API_KEY_LINKS[provider] || API_KEY_LINKS.openai;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-400 mt-1">
            Configure your AI provider to power code reviews.
          </p>
        </div>
        <Card className="border-gray-800 bg-gray-900/50 max-w-2xl">
          <CardHeader>
            <Skeleton className="h-6 w-32 bg-gray-800" />
            <Skeleton className="h-4 w-64 bg-gray-800 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-20 bg-gray-800" />
              <Skeleton className="h-20 bg-gray-800 rounded-lg" />
              <Skeleton className="h-20 bg-gray-800 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 bg-gray-800" />
              <Skeleton className="h-10 bg-gray-800 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-400 mt-1">
          Configure your AI provider to power code reviews.
        </p>
      </div>

      {/* Step 1: Provider */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              1
            </span>
            Choose Provider
          </CardTitle>
          <CardDescription>
            Select which AI service will review your code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={provider} onValueChange={(val) => { setProvider(val); setModel(""); }}>
            <div
              className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                provider === "openai"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-gray-800 hover:bg-white/5 hover:border-gray-700"
              }`}
            >
              <RadioGroupItem value="openai" id="openai" />
              <Label htmlFor="openai" className="cursor-pointer flex-1">
                <span className="font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-emerald-400" />
                  OpenAI
                </span>
                <span className="block text-xs text-gray-500 mt-0.5 ml-6">
                  GPT-4o, GPT-4o-mini, and more
                </span>
              </Label>
            </div>
            <div
              className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                provider === "anthropic"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-gray-800 hover:bg-white/5 hover:border-gray-700"
              }`}
            >
              <RadioGroupItem value="anthropic" id="anthropic" />
              <Label htmlFor="anthropic" className="cursor-pointer flex-1">
                <span className="font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  Anthropic
                </span>
                <span className="block text-xs text-gray-500 mt-0.5 ml-6">
                  Claude Sonnet, Claude Opus, and more
                </span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Step 2: API Key */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              2
            </span>
            <KeyRound className="h-4 w-4 text-gray-400" />
            API Key
            {hasApiKey && (
              <Badge variant="outline" className="text-xs border-emerald-800/50 text-emerald-400 bg-emerald-500/5 ml-auto">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Your API key is encrypted (AES-256-GCM) before storage and never exposed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Input
              id="apiKey"
              type={showKey ? "text" : "password"}
              placeholder={
                hasApiKey
                  ? "Key saved — enter a new key to update"
                  : provider === "openai"
                    ? "sk-..."
                    : "sk-ant-..."
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-gray-800/50 border-gray-700 pr-10 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <ShieldCheck className="h-3 w-3" />
              Encrypted before storage
            </div>
            <a
              href={keyLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {keyLink.label}
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Model */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              3
            </span>
            <Zap className="h-4 w-4 text-gray-400" />
            Model
          </CardTitle>
          <CardDescription>
            Choose a model or leave empty for the recommended default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            {availableModels.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setModel(model === m.value ? "" : m.value)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                  model === m.value
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-gray-800 hover:bg-white/5 hover:border-gray-700"
                }`}
              >
                <CircleDot className={`h-4 w-4 shrink-0 ${model === m.value ? "text-emerald-400" : "text-gray-600"}`} />
                <div className="min-w-0">
                  <span className="text-sm font-medium">{m.label}</span>
                  <span className="block text-xs text-gray-500">{m.desc}</span>
                </div>
                {availableModels[0].value === m.value && !model && (
                  <Badge variant="outline" className="text-xs border-gray-700 text-gray-500 ml-auto shrink-0">
                    Default
                  </Badge>
                )}
              </button>
            ))}
          </div>

          <div className="pt-1">
            <Label htmlFor="customModel" className="text-xs text-gray-500">
              Or enter a custom model ID:
            </Label>
            <Input
              id="customModel"
              placeholder={`e.g. ${availableModels[0].value}`}
              value={availableModels.some((m) => m.value === model) ? "" : model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-gray-800/50 border-gray-700 mt-1.5 font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || (!apiKey && !hasApiKey)}
          className="bg-emerald-600 hover:bg-emerald-500 gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
        {hasApiKey && !apiKey && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            All configured — you&apos;re ready to review PRs
          </span>
        )}
      </div>
    </div>
  );
}
