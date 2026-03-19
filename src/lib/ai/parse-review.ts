import type { AIReviewResponse, ReviewCommentInput } from "@/types";

export function parseReviewResponse(text: string): AIReviewResponse {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);

    const summary =
      typeof parsed.summary === "string"
        ? parsed.summary
        : "Review completed.";

    const comments: ReviewCommentInput[] = [];
    if (Array.isArray(parsed.comments)) {
      for (const c of parsed.comments) {
        if (
          typeof c.path === "string" &&
          typeof c.line === "number" &&
          typeof c.body === "string" &&
          c.path.length > 0 &&
          c.body.length > 0 &&
          c.line > 0
        ) {
          comments.push({
            path: c.path,
            line: c.line,
            body: c.body,
          });
        }
      }
    }

    return { summary, comments };
  } catch {
    // If JSON parsing fails, treat the entire response as a summary with no inline comments
    return {
      summary: text.slice(0, 1000),
      comments: [],
    };
  }
}
