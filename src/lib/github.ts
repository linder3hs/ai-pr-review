import { Octokit } from "octokit";

function getOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

export async function getUserRepos(accessToken: string) {
  const octokit = getOctokit(accessToken);
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 50,
  });
  return data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    description: repo.description,
    updated_at: repo.updated_at,
    language: repo.language,
    owner: {
      login: repo.owner.login,
      avatar_url: repo.owner.avatar_url,
    },
  }));
}

export async function getRepoPulls(
  accessToken: string,
  owner: string,
  repo: string
) {
  const octokit = getOctokit(accessToken);
  const { data } = await octokit.rest.pulls.list({
    owner,
    repo,
    state: "open",
    per_page: 30,
  });
  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    created_at: pr.created_at,
    updated_at: pr.updated_at,
    user: pr.user
      ? { login: pr.user.login, avatar_url: pr.user.avatar_url }
      : null,
    head: { ref: pr.head.ref, sha: pr.head.sha },
    base: { ref: pr.base.ref },
  }));
}

export async function getPullRequestDiff(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number
) {
  const octokit = getOctokit(accessToken);
  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
    mediaType: { format: "diff" },
  });
  return data as unknown as string;
}

export async function getPullRequestFiles(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number
) {
  const octokit = getOctokit(accessToken);
  const { data } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });
  return data.map((file) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch,
  }));
}

export async function getPullRequestDetails(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number
) {
  const octokit = getOctokit(accessToken);
  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });
  return {
    number: data.number,
    title: data.title,
    body: data.body,
    head: { sha: data.head.sha },
  };
}

export async function postReviewComments(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number,
  commitSha: string,
  comments: { path: string; line: number; body: string }[]
) {
  const octokit = getOctokit(accessToken);

  if (comments.length === 0) {
    // Post a simple approval comment
    await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      commit_id: commitSha,
      event: "COMMENT",
      body: "AI Review: No issues found. The code looks good!",
    });
    return;
  }

  await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    commit_id: commitSha,
    event: "COMMENT",
    body: `AI Review: Found ${comments.length} suggestion(s).`,
    comments: comments.map((c) => ({
      path: c.path,
      line: c.line,
      body: c.body,
      side: "RIGHT" as const,
    })),
  });
}
