export function buildReviewPrompt(
  prTitle: string,
  prBody: string | null,
  diff: string,
  truncationNote?: string
) {
  const system = `You are an expert code reviewer. Your job is to analyze pull request diffs and provide actionable, constructive feedback.

RULES:
1. Focus on: bugs, security issues, performance problems, code quality, and maintainability.
2. Be concise and specific. Reference the exact file and line number.
3. Do NOT comment on formatting or style unless it impacts readability significantly.
4. If the code looks good, say so.
5. Provide your response as valid JSON with the following structure:

{
  "summary": "A brief 1-3 sentence summary of the overall PR quality and key findings.",
  "comments": [
    {
      "path": "src/example/file.ts",
      "line": 42,
      "body": "Your review comment in markdown. Be specific about the issue and suggest a fix."
    }
  ]
}

IMPORTANT:
- "path" must be the exact file path from the diff header (after "b/")
- "line" must be a line number that exists in the NEW version of the file (right side of the diff, lines starting with "+" or unchanged lines)
- If no issues are found, return an empty comments array
- Return ONLY the JSON object, no markdown fences or extra text`;

  let userPrompt = `## Pull Request: ${prTitle}

${prBody ? `### Description\n${prBody}\n` : ""}`;

  if (truncationNote) {
    userPrompt += `### Notice\n${truncationNote}\n\n`;
  }

  userPrompt += `### Diff
\`\`\`diff
${diff}
\`\`\`

Please review this pull request and provide your feedback as JSON.`;

  return { system, user: userPrompt };
}
