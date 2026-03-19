import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  Github,
  Cpu,
  ShieldCheck,
  ArrowRight,
  GitPullRequestArrow,
  LogIn,
  KeyRound,
  MousePointerClick,
  MessageSquareCode,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

const features = [
  {
    icon: Github,
    title: "GitHub Integration",
    desc: "Connect your GitHub account with OAuth. Access your repositories and pull requests seamlessly.",
    color: "emerald",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    icon: Cpu,
    title: "Multi-Provider AI",
    desc: "Use your own API key from OpenAI or Anthropic. Choose the model that works best for your needs.",
    color: "cyan",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
  },
  {
    icon: ShieldCheck,
    title: "Secure by Design",
    desc: "API keys encrypted with AES-256-GCM. Your credentials are safe. Fully open source for transparency.",
    color: "purple",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
  },
];

const steps = [
  { icon: LogIn, title: "Sign In", desc: "Connect your GitHub account" },
  { icon: KeyRound, title: "Configure AI", desc: "Add your OpenAI or Anthropic key" },
  { icon: MousePointerClick, title: "Select PR", desc: "Choose a pull request to review" },
  { icon: MessageSquareCode, title: "Get Review", desc: "AI posts comments on your PR" },
];

export default async function HomePage() {
  const session = await auth();
  const isAuthenticated = !!session?.user;
  const user = session?.user;

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />
      <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl animate-glow-pulse pointer-events-none" style={{ animationDelay: "2s" }} />

      {/* Header */}
      <header className="relative border-b border-gray-800/50 bg-gray-950/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <GitPullRequestArrow className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="font-semibold text-lg">PR Review</span>
          </div>

          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 rounded-lg border border-gray-700 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 hover:border-gray-600 transition-all"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="h-5 w-5 rounded-full"
                />
              ) : (
                <LayoutDashboard className="h-3.5 w-3.5" />
              )}
              {user?.name || "Dashboard"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 hover:border-gray-600 transition-all"
            >
              Sign In
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center pt-24 sm:pt-32 pb-16 text-center">
          <div className="animate-fade-in inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-400 mb-8">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Open Source
          </div>

          <h1 className="animate-slide-up text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl leading-[1.1]">
            AI-Powered{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent bg-[length:200%_auto]">
              Code Reviews
            </span>{" "}
            for Your PRs
          </h1>

          <p className="animate-slide-up delay-200 mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
            Connect your GitHub account, choose your AI provider, and get
            instant, intelligent code reviews on every pull request.
          </p>

          <div className="animate-slide-up delay-300 mt-10 flex flex-col sm:flex-row gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
              >
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
              >
                Get Started
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
            <Link
              href="https://github.com"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 hover:border-gray-600 hover:bg-white/5 px-8 py-3 text-sm font-medium transition-all"
            >
              <Github className="h-4 w-4" />
              View Source
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-16">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`animate-slide-up delay-${(i + 3) * 100} rounded-xl border border-gray-800 bg-gray-900/30 p-6 card-hover`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconBg} mb-4`}>
                  <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <div className="py-16 sm:py-24 text-center">
          <h2 className="text-3xl font-bold mb-4 animate-slide-up">How It Works</h2>
          <p className="text-gray-500 mb-16 animate-slide-up delay-100">Four simple steps to better code reviews</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
            {steps.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={`animate-slide-up delay-${(i + 2) * 100} relative flex flex-col items-center`}>
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-[calc(50%+28px)] w-[calc(100%-56px)] border-t border-dashed border-gray-700">
                      <ChevronRight className="absolute -right-2 -top-2 h-4 w-4 text-gray-600" />
                    </div>
                  )}
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-gray-800/50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <GitPullRequestArrow className="h-4 w-4 text-gray-600" />
            <span>PR Review</span>
          </div>
          <p>Open source. Built with Next.js, Tailwind CSS, and AI.</p>
        </div>
      </footer>
    </div>
  );
}
