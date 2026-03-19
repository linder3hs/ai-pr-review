import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ExternalLink,
  ArrowLeft,
  FileCode,
  Github,
  Sparkles,
  MessageSquare,
  CheckCheck,
} from "lucide-react";
import { timeAgo } from "@/lib/utils/date";

const statusConfig: Record<string, { icon: React.ElementType; class: string; bg: string; label: string }> = {
  completed: { icon: CheckCircle2, class: "border-green-800/50 text-green-400", bg: "bg-green-500/5", label: "Completed" },
  failed: { icon: XCircle, class: "border-red-800/50 text-red-400", bg: "bg-red-500/5", label: "Failed" },
  in_progress: { icon: Loader2, class: "border-yellow-800/50 text-yellow-400", bg: "bg-yellow-500/5", label: "In Progress" },
  pending: { icon: Clock, class: "border-gray-700 text-gray-400", bg: "bg-gray-500/5", label: "Pending" },
};

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const review = await prisma.review.findUnique({
    where: { id, userId: session.user.id },
    include: { comments: { orderBy: { path: "asc" } } },
  });

  if (!review) notFound();

  const config = statusConfig[review.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link
            href="/reviews"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Reviews
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">
              {review.owner}/{review.repo} #{review.prNumber}
            </h1>
            <Badge
              variant="outline"
              className={`${config.class} ${config.bg} gap-1`}
            >
              <StatusIcon className={`h-3 w-3 ${review.status === "in_progress" ? "animate-spin" : ""}`} />
              {config.label}
            </Badge>
          </div>
          {review.prTitle && (
            <p className="text-gray-400 mt-1.5">{review.prTitle}</p>
          )}
        </div>
        <Link
          href={`https://github.com/${review.owner}/${review.repo}/pull/${review.prNumber}`}
          target="_blank"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 hover:border-gray-600 transition-all shrink-0"
        >
          <Github className="h-4 w-4" />
          View on GitHub
          <ExternalLink className="h-3 w-3 text-gray-500" />
        </Link>
      </div>

      {/* Summary */}
      {review.summary && (
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed">{review.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            Review Comments
          </CardTitle>
          <CardDescription>
            {review.comments.length} comment{review.comments.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {review.comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/5 border border-green-500/10 mb-4">
                <CheckCheck className="h-6 w-6 text-green-400" />
              </div>
              <p className="font-medium text-gray-300">No issues found</p>
              <p className="text-sm text-gray-500 mt-1">
                The AI review found no issues with this pull request. Great job!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {review.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between bg-gray-800/50 px-4 py-2.5 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className="h-4 w-4 text-gray-500 shrink-0" />
                      <code className="text-sm text-emerald-400 font-mono truncate">
                        {comment.path}
                      </code>
                      <Badge variant="outline" className="text-xs border-gray-700 text-gray-400 shrink-0">
                        L{comment.line}
                      </Badge>
                    </div>
                    {comment.postedToGithub ? (
                      <Badge
                        variant="outline"
                        className="text-xs border-green-800/50 text-green-400 bg-green-500/5 gap-1 shrink-0"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Posted
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs border-gray-700 text-gray-500 shrink-0"
                      >
                        Local only
                      </Badge>
                    )}
                  </div>
                  <div className="p-4 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {comment.body}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-gray-600 flex items-center gap-1.5">
        <Clock className="h-3 w-3" />
        Reviewed {timeAgo(review.createdAt)}
      </p>
    </div>
  );
}
