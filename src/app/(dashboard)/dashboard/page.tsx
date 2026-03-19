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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  GitFork,
  GitPullRequestArrow,
  Lock,
  Loader2,
  Sparkles,
  GitBranch,
  User,
  Clock,
  Inbox,
  BookOpen,
  FileCode,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { timeAgo } from "@/lib/utils/date";
import type { GitHubRepo, GitHubPullRequest } from "@/types";

interface ReviewComment {
  id: string;
  path: string;
  line: number;
  body: string;
  postedToGithub: boolean;
}

interface ReviewResult {
  id: string;
  summary: string | null;
  comments: ReviewComment[];
  wasTruncated?: boolean;
  includedFiles?: number;
  totalFiles?: number;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-400",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-400",
  Rust: "bg-orange-400",
  Go: "bg-cyan-400",
  Java: "bg-red-400",
  Ruby: "bg-red-500",
  PHP: "bg-purple-400",
  C: "bg-gray-400",
  "C++": "bg-pink-400",
  "C#": "bg-green-500",
  Swift: "bg-orange-500",
  Kotlin: "bg-purple-500",
  Dart: "bg-cyan-500",
  HTML: "bg-orange-300",
  CSS: "bg-blue-300",
  Shell: "bg-green-300",
  Vue: "bg-emerald-400",
};

export default function DashboardPage() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [pulls, setPulls] = useState<GitHubPullRequest[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingPulls, setLoadingPulls] = useState(false);
  const [reviewingPR, setReviewingPR] = useState<number | null>(null);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  useEffect(() => {
    fetchRepos();
  }, []);

  async function fetchRepos() {
    try {
      const res = await fetch("/api/github/repos");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRepos(data);
    } catch {
      toast.error("Failed to load repositories");
    } finally {
      setLoadingRepos(false);
    }
  }

  async function selectRepo(repo: GitHubRepo) {
    setSelectedRepo(repo);
    setPulls([]);
    setLoadingPulls(true);
    try {
      const res = await fetch(
        `/api/github/pulls?owner=${repo.owner.login}&repo=${repo.name}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPulls(data);
    } catch {
      toast.error("Failed to load pull requests");
    } finally {
      setLoadingPulls(false);
    }
  }

  async function triggerReview(pr: GitHubPullRequest) {
    if (!selectedRepo) return;
    setReviewingPR(pr.number);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          pullNumber: pr.number,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Review failed");
        return;
      }
      setReviewResult(data);
      setShowReviewDialog(true);
    } catch {
      toast.error("Failed to trigger review");
    } finally {
      setReviewingPR(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Dashboard
        </h1>
        <p className="text-gray-400 mt-1">
          Select a repository and review pull requests with AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repositories */}
        <Card className="lg:col-span-1 border-gray-800 bg-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitFork className="h-4 w-4 text-gray-400" />
              Repositories
            </CardTitle>
            <CardDescription>Your GitHub repositories</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {loadingRepos ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-3/4 bg-gray-800" />
                      <Skeleton className="h-3 w-1/2 bg-gray-800" />
                    </div>
                  ))}
                </div>
              ) : repos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <BookOpen className="h-10 w-10 text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400 font-medium">No repositories found</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Make sure your GitHub account has repositories.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800/50">
                  {repos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => selectRepo(repo)}
                      className={`w-full text-left px-4 py-3 transition-all ${
                        selectedRepo?.id === repo.id
                          ? "bg-emerald-500/5 border-l-2 border-l-emerald-500"
                          : "hover:bg-white/5 border-l-2 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {repo.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {repo.private && (
                            <Lock className="h-3 w-3 text-gray-500" />
                          )}
                        </div>
                      </div>
                      {repo.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {repo.description}
                        </p>
                      )}
                      {repo.language && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className={`inline-block h-2.5 w-2.5 rounded-full ${
                              LANG_COLORS[repo.language] || "bg-gray-500"
                            }`}
                          />
                          <span className="text-xs text-gray-500">
                            {repo.language}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Pull Requests */}
        <Card className="lg:col-span-2 border-gray-800 bg-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitPullRequestArrow className="h-4 w-4 text-gray-400" />
              {selectedRepo
                ? `Pull Requests`
                : "Pull Requests"}
            </CardTitle>
            <CardDescription>
              {selectedRepo
                ? (
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-400 font-medium">{selectedRepo.full_name}</span>
                    <span className="mx-1">-</span>
                    Open pull requests ready for AI review
                  </span>
                )
                : "Select a repository to see its pull requests"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedRepo ? (
              <div className="flex items-center justify-center h-[500px] text-gray-500">
                <div className="text-center animate-fade-in">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-800/50 border border-gray-700/50">
                    <Inbox className="h-7 w-7 text-gray-500" />
                  </div>
                  <p className="font-medium text-gray-400">No repository selected</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose a repository from the list to see its PRs
                  </p>
                </div>
              </div>
            ) : loadingPulls ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-gray-800 bg-gray-800/30 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-12 bg-gray-700 rounded-full" />
                      <Skeleton className="h-4 w-2/3 bg-gray-700" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-3 w-20 bg-gray-800" />
                      <Skeleton className="h-3 w-32 bg-gray-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pulls.length === 0 ? (
              <div className="flex items-center justify-center h-[500px] text-gray-500">
                <div className="text-center animate-fade-in">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-800/50 border border-gray-700/50">
                    <GitPullRequestArrow className="h-7 w-7 text-gray-500" />
                  </div>
                  <p className="font-medium text-gray-400">No open pull requests</p>
                  <p className="text-sm text-gray-600 mt-1">
                    This repository has no open PRs to review.
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[540px]">
                <div className="space-y-3">
                  {pulls.map((pr, i) => (
                    <div
                      key={pr.number}
                      className={`animate-slide-up rounded-lg border border-gray-800 bg-gray-800/30 p-4 hover:bg-gray-800/50 hover:border-gray-700 transition-all`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs border-emerald-800/50 text-emerald-400 bg-emerald-500/5 shrink-0"
                            >
                              #{pr.number}
                            </Badge>
                            <h3 className="font-medium text-sm truncate">
                              {pr.title}
                            </h3>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            {pr.user && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {pr.user.login}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <GitBranch className="h-3 w-3" />
                              {pr.head.ref}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeAgo(pr.created_at)}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => triggerReview(pr)}
                          disabled={reviewingPR !== null}
                          className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-sm shadow-emerald-500/10"
                        >
                          {reviewingPR === pr.number ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Reviewing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              AI Review
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Results Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-2xl bg-gray-900 border-gray-800 max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              AI Review Complete
            </DialogTitle>
            <DialogDescription>
              {reviewResult?.comments.length
                ? `${reviewResult.comments.length} comment(s) posted to GitHub`
                : "No issues found in this pull request"}
              {reviewResult?.wasTruncated && (
                <span className="block text-amber-400 mt-1 text-xs">
                  {reviewResult.includedFiles} of {reviewResult.totalFiles} files analyzed (PR too large for full review)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-4 px-4 max-h-[60vh]">
            <div className="space-y-4">
              {/* Summary */}
              {reviewResult?.summary && (
                <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-4">
                  <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Summary
                  </h4>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {reviewResult.summary}
                  </p>
                </div>
              )}

              {/* Comments */}
              {reviewResult?.comments && reviewResult.comments.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="h-3.5 w-3.5" />
                    Comments ({reviewResult.comments.length})
                  </h4>
                  {reviewResult.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-lg border border-gray-800 bg-gray-800/20 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge
                            variant="outline"
                            className="text-xs border-gray-700 text-gray-400 bg-gray-800/50 font-mono shrink-0"
                          >
                            L{comment.line}
                          </Badge>
                          <span className="text-xs text-emerald-400 font-mono truncate">
                            {comment.path}
                          </span>
                        </div>
                        {comment.postedToGithub && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {comment.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : reviewResult ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                  <p className="text-sm text-gray-400 font-medium">
                    No issues found
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    The code looks good! No comments were generated.
                  </p>
                </div>
              ) : null}
            </div>
          </ScrollArea>

          <DialogFooter>
            {reviewResult?.id && (
              <a
                href={`/review/${reviewResult.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-400 transition-colors mr-auto"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View full review
              </a>
            )}
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
              className="border-gray-700 hover:bg-gray-800"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
