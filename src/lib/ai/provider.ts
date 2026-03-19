import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { buildReviewPrompt } from "./review-prompt";
import { parseReviewResponse } from "./parse-review";
import { truncateDiff } from "./truncate-diff";
import type { AIReviewResponse } from "@/types";

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
};

export interface ReviewResult extends AIReviewResponse {
  wasTruncated: boolean;
  includedFiles: number;
  totalFiles: number;
  skippedFiles: number;
}

export async function runAIReview(
  provider: string,
  apiKey: string,
  model: string | null,
  prTitle: string,
  prBody: string | null,
  diff: string
): Promise<ReviewResult> {
  const modelId = model || DEFAULT_MODELS[provider] || DEFAULT_MODELS.openai;

  // Truncate diff to fit model context window
  const truncateResult = truncateDiff(diff, modelId);

  let aiModel;
  if (provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey });
    aiModel = anthropic(modelId);
  } else {
    const openai = createOpenAI({ apiKey });
    aiModel = openai(modelId);
  }

  const { system, user } = buildReviewPrompt(
    prTitle,
    prBody,
    truncateResult.diff,
    truncateResult.wasTruncated
      ? `Note: This PR has ${truncateResult.totalFiles} files but only ${truncateResult.includedFiles} could be included due to size limits. ${truncateResult.skippedFiles} file(s) were omitted.`
      : undefined
  );

  const { text } = await generateText({
    model: aiModel,
    system,
    prompt: user,
    maxOutputTokens: 4096,
  });

  const parsed = parseReviewResponse(text);

  return {
    ...parsed,
    wasTruncated: truncateResult.wasTruncated,
    includedFiles: truncateResult.includedFiles,
    totalFiles: truncateResult.totalFiles,
    skippedFiles: truncateResult.skippedFiles,
  };
}
