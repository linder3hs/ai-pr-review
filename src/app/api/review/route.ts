import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import {
  getPullRequestDiff,
  getPullRequestDetails,
  postReviewComments,
} from "@/lib/github";
import { runAIReview } from "@/lib/ai/provider";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { owner, repo, pullNumber } = body;

  if (!owner || !repo || !pullNumber) {
    return NextResponse.json(
      { error: "owner, repo, and pullNumber are required" },
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
      getPullRequestDetails(session.accessToken, owner, repo, pullNumber),
      getPullRequestDiff(session.accessToken, owner, repo, pullNumber),
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
        session.accessToken,
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

    const message =
      error instanceof Error ? error.message : "Review failed unexpectedly";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
