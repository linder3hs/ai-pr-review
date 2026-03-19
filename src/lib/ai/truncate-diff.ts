/**
 * Truncates a unified diff to fit within a character budget.
 *
 * Strategy:
 * 1. Split diff into per-file chunks
 * 2. Filter out low-value files (lock files, generated, binaries)
 * 3. Prioritize source code files
 * 4. Truncate individual large files if needed
 * 5. Include as many files as fit within the budget
 */

// Files that rarely need review
const SKIP_PATTERNS = [
  /^package-lock\.json$/,
  /^yarn\.lock$/,
  /^pnpm-lock\.yaml$/,
  /^Gemfile\.lock$/,
  /^Cargo\.lock$/,
  /^poetry\.lock$/,
  /^composer\.lock$/,
  /^go\.sum$/,
  /\.min\.(js|css)$/,
  /\.map$/,
  /\.snap$/,
  /^\.next\//,
  /^dist\//,
  /^build\//,
  /^node_modules\//,
  /\.generated\./,
  /\/generated\//,
  /\.pb\.go$/,
  /\.svg$/,
  /\.ico$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.eot$/,
];

interface FileDiff {
  path: string;
  content: string;
  priority: number; // lower = more important
}

function getFilePath(header: string): string {
  // Extract path from "diff --git a/path b/path" or "--- a/path" lines
  const match = header.match(/^diff --git a\/.+ b\/(.+)$/m);
  return match ? match[1] : "unknown";
}

function shouldSkip(path: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(path));
}

function getFilePriority(path: string): number {
  // Lower number = higher priority (reviewed first)
  if (/\.(ts|tsx|js|jsx)$/.test(path)) return 1;
  if (/\.(py|rb|go|rs|java|kt|swift|c|cpp|cs)$/.test(path)) return 1;
  if (/\.(sql|graphql|proto)$/.test(path)) return 2;
  if (/\.(yaml|yml|toml|json)$/.test(path)) return 3;
  if (/\.(md|txt|rst)$/.test(path)) return 5;
  if (/\.(css|scss|less)$/.test(path)) return 4;
  if (/\.(html|xml)$/.test(path)) return 4;
  if (/Dockerfile|Makefile|\.env/.test(path)) return 3;
  return 4;
}

function splitDiffIntoFiles(diff: string): FileDiff[] {
  const files: FileDiff[] = [];
  const chunks = diff.split(/(?=^diff --git )/m);

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed || !trimmed.startsWith("diff --git")) continue;

    const path = getFilePath(trimmed);
    if (shouldSkip(path)) continue;

    files.push({
      path,
      content: trimmed,
      priority: getFilePriority(path),
    });
  }

  // Sort by priority (most important first)
  files.sort((a, b) => a.priority - b.priority);
  return files;
}

function truncateFileDiff(fileDiff: string, maxChars: number): string {
  if (fileDiff.length <= maxChars) return fileDiff;

  const lines = fileDiff.split("\n");
  const result: string[] = [];
  let charCount = 0;

  for (const line of lines) {
    if (charCount + line.length + 1 > maxChars) {
      result.push(
        `\n... (file truncated, ${fileDiff.length - charCount} chars remaining) ...`
      );
      break;
    }
    result.push(line);
    charCount += line.length + 1;
  }

  return result.join("\n");
}

export interface TruncateResult {
  diff: string;
  totalFiles: number;
  includedFiles: number;
  skippedFiles: number;
  wasTruncated: boolean;
}

/**
 * Character budget per model (approximate, leaving room for system prompt + output).
 * These are conservative estimates at ~3.5 chars per token.
 */
const MODEL_CHAR_LIMITS: Record<string, number> = {
  "gpt-4o": 350000, // 128k tokens
  "gpt-4o-mini": 350000,
  "gpt-4-turbo": 350000,
  "claude-sonnet-4-20250514": 500000, // 200k tokens
  "claude-opus-4-20250514": 500000,
};

const DEFAULT_CHAR_LIMIT = 200000; // ~57k tokens, safe for most models
const MAX_SINGLE_FILE_CHARS = 50000; // cap individual files

export function truncateDiff(
  diff: string,
  modelId?: string | null
): TruncateResult {
  const charLimit = modelId
    ? MODEL_CHAR_LIMITS[modelId] || DEFAULT_CHAR_LIMIT
    : DEFAULT_CHAR_LIMIT;

  // If diff fits, return as-is
  if (diff.length <= charLimit) {
    const files = splitDiffIntoFiles(diff);
    return {
      diff,
      totalFiles: files.length,
      includedFiles: files.length,
      skippedFiles: 0,
      wasTruncated: false,
    };
  }

  const files = splitDiffIntoFiles(diff);
  const totalFiles = files.length;
  const included: string[] = [];
  let currentSize = 0;
  let includedCount = 0;

  for (const file of files) {
    // Cap individual large files
    const fileContent = truncateFileDiff(file.content, MAX_SINGLE_FILE_CHARS);

    if (currentSize + fileContent.length > charLimit) {
      // Try to fit a truncated version
      const remaining = charLimit - currentSize;
      if (remaining > 2000) {
        // Only include if we can fit a meaningful chunk
        included.push(truncateFileDiff(file.content, remaining));
        includedCount++;
      }
      break;
    }

    included.push(fileContent);
    currentSize += fileContent.length;
    includedCount++;
  }

  const skippedCount = totalFiles - includedCount;
  let truncatedDiff = included.join("\n\n");

  if (skippedCount > 0) {
    truncatedDiff += `\n\n... (${skippedCount} file(s) omitted due to size limits) ...`;
  }

  return {
    diff: truncatedDiff,
    totalFiles,
    includedFiles: includedCount,
    skippedFiles: skippedCount,
    wasTruncated: true,
  };
}
