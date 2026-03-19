import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  MessageSquare,
  FileSearch,
  History,
  GitFork,
  ArrowRight,
} from "lucide-react";
import { timeAgo } from "@/lib/utils/date";

const statusConfig: Record<string, { icon: React.ElementType; class: string; bg: string }> = {
  completed: { icon: CheckCircle2, class: "border-green-800/50 text-green-400", bg: "bg-green-500/5" },
  failed: { icon: XCircle, class: "border-red-800/50 text-red-400", bg: "bg-red-500/5" },
  in_progress: { icon: Loader2, class: "border-yellow-800/50 text-yellow-400", bg: "bg-yellow-500/5" },
  pending: { icon: Clock, class: "border-gray-700 text-gray-400", bg: "bg-gray-500/5" },
};

export default async function ReviewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { comments: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6 text-gray-400" />
          Review History
        </h1>
        <p className="text-gray-400 mt-1">
          Past AI reviews across your repositories.
        </p>
      </div>

      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-lg">All Reviews</CardTitle>
          <CardDescription>
            {reviews.length} review{reviews.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-800/50 border border-gray-700/50 mb-4">
                <FileSearch className="h-7 w-7 text-gray-500" />
              </div>
              <p className="font-medium text-gray-400">No reviews yet</p>
              <p className="text-sm text-gray-600 mt-1 mb-6">
                Go to the Dashboard to run your first AI review on a PR.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 text-sm font-medium transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <GitFork className="h-3.5 w-3.5" />
                      Repository
                    </span>
                  </TableHead>
                  <TableHead className="text-gray-400">PR</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Comments
                    </span>
                  </TableHead>
                  <TableHead className="text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Date
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => {
                  const config = statusConfig[review.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <TableRow
                      key={review.id}
                      className="border-gray-800 hover:bg-white/[0.03] transition-colors"
                    >
                      <TableCell className="font-medium text-gray-300">
                        {review.owner}/{review.repo}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/review/${review.id}`}
                          className="text-emerald-400 hover:text-emerald-300 hover:underline underline-offset-4 transition-colors"
                        >
                          #{review.prNumber}{" "}
                          {review.prTitle && (
                            <span className="text-gray-400">- {review.prTitle}</span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${config.class} ${config.bg} gap-1`}
                        >
                          <StatusIcon className={`h-3 w-3 ${review.status === "in_progress" ? "animate-spin" : ""}`} />
                          {review.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-gray-400">
                          <MessageSquare className="h-3.5 w-3.5 text-gray-600" />
                          {review._count.comments}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {timeAgo(review.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
