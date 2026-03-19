"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Github, Loader2, ShieldCheck, GitPullRequestArrow } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  function handleSignIn() {
    setLoading(true);
    signIn("github", { callbackUrl: "/dashboard" });
  }

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <Card className="animate-slide-up w-full max-w-md border-gray-800 bg-gray-900/50 backdrop-blur-xl mx-4">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/10">
            <GitPullRequestArrow className="h-8 w-8 text-emerald-400" />
          </div>
          <CardTitle className="text-2xl text-white">
            Welcome to PR Review
          </CardTitle>
          <CardDescription className="text-gray-400 mt-2">
            Sign in with your GitHub account to get AI-powered code reviews on
            your pull requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full bg-white text-black hover:bg-gray-100 font-medium h-11"
            size="lg"
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Github className="mr-2 h-5 w-5" />
            )}
            {loading ? "Redirecting..." : "Sign in with GitHub"}
          </Button>
          <div className="flex items-start gap-2 rounded-lg bg-gray-800/30 border border-gray-800 p-3">
            <ShieldCheck className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              We only request access to your repositories to read pull requests
              and post review comments. Your API keys are encrypted at rest.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
