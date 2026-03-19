import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerAccessToken } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import {
  getPullRequestDiff,
  getPullRequestDetails,
  postReviewComments,
} from "@/lib/github";
import { runAIReview } from "@/lib/ai/provider";
import { rateLimit } from "@/lib/rate-limit";

const GITHUB_NAME_RE = /^[a-zA-Z0-9._-]+$/;

// Max 10 reviews per user per 10 minutes
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit per user
  const { allowed, resetIn } = rateLimit(
    `review:${session.user.id}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW
  );
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many reviews. Try again in ${Math.ceil(resetIn / 60000)} minute(s).` },
      { status: 429 }
    );
  }

  const accessToken = await getServerAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { owner, repo, pullNumber } = body;

  // Validate inputs
  if (!owner || !repo || !pullNumber) {
    return NextResponse.json(
      { error: "owner, repo, and pullNumber are required" },
      { status: 400 }
    );
  }

  if (
    typeof owner !== "string" ||
    typeof repo !== "string" ||
    typeof pullNumber !== "number" ||
    !Number.isInteger(pullNumber) ||
    pullNumber < 1
  ) {
    return NextResponse.json(
      { error: "Invalid input types" },
      { status: 400 }
    );
  }

  if (!GITHUB_NAME_RE.test(owner) || !GITHUB_NAME_RE.test(repo) || owner.length > 100 || repo.length > 100) {
    return NextResponse.json(
      { error: "Invalid owner or repo name" },
      { status: 400 }
    );
  }

  // Check AI settings
  const aiSettings = await prisma.aiSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!aiSettings?.encryptedApiKey) {
    return NextResponse.json(
      {
        error:
          "Please configure your AI provider and API key in Settings first.",
      },
      { status: 400 }
    );
  }

  // Create review record
  const review = await prisma.review.create({
    data: {
      owner,
      repo,
      prNumber: pullNumber,
      status: "in_progress",
      userId: session.user.id,
    },
  });

  try {
    // Fetch PR details and diff
    const [prDetails, diff] = await Promise.all([
      getPullRequestDetails(accessToken, owner, repo, pullNumber),
      getPullRequestDiff(accessToken, owner, repo, pullNumber),
    ]);

    // Update review with PR title and diff
    await prisma.review.update({
      where: { id: review.id },
      data: {
        prTitle: prDetails.title,
        diff: diff.slice(0, 50000), // limit stored diff size
      },
    });

    // Run AI review
    const apiKey = decrypt(aiSettings.encryptedApiKey);
    const aiResult = await runAIReview(
      aiSettings.provider,
      apiKey,
      aiSettings.model,
      prDetails.title,
      prDetails.body,
      diff
    );

    // Save comments to DB
    if (aiResult.comments.length > 0) {
      await prisma.reviewComment.createMany({
        data: aiResult.comments.map((c) => ({
          path: c.path,
          line: c.line,
          body: c.body,
          reviewId: review.id,
        })),
      });
    }

    // Post review to GitHub
    try {
      await postReviewComments(
        accessToken,
        owner,
        repo,
        pullNumber,
        prDetails.head.sha,
        aiResult.comments
      );

      // Mark comments as posted
      if (aiResult.comments.length > 0) {
        await prisma.reviewComment.updateMany({
          where: { reviewId: review.id },
          data: { postedToGithub: true },
        });
      }
    } catch (ghError) {
      console.error("Failed to post review to GitHub:", ghError);
      // Continue - we still have the review saved locally
    }

    // Build summary with truncation notice if applicable
    let summary = aiResult.summary;
    if (aiResult.wasTruncated) {
      summary += `\n\n---\n_Note: This PR was too large to review in full. ${aiResult.includedFiles} of ${aiResult.totalFiles} files were analyzed (${aiResult.skippedFiles} omitted due to size limits). Lock files and generated files are automatically excluded._`;
    }

    // Update review status
    await prisma.review.update({
      where: { id: review.id },
      data: {
        status: "completed",
        summary,
      },
    });

    const updatedReview = await prisma.review.findUnique({
      where: { id: review.id },
      include: { comments: true },
    });

    return NextResponse.json({
      ...updatedReview,
      wasTruncated: aiResult.wasTruncated,
      includedFiles: aiResult.includedFiles,
      totalFiles: aiResult.totalFiles,
    });
  } catch (error) {
    console.error("Review failed:", error);
    await prisma.review.update({
      where: { id: review.id },
      data: { status: "failed" },
    });

    return NextResponse.json(
      { error: "Review failed. Please check your AI provider settings and try again." },
      { status: 500 }
    );
  }
}
