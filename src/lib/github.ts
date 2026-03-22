import type { GitHubUser } from '../stores/githubStore';

const GITHUB_API = 'https://api.github.com';

function apiHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export async function getAuthenticatedUser(token: string): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: apiHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch GitHub user');
  return res.json() as Promise<GitHubUser>;
}

export interface CreatePRParams {
  token: string;
  owner: string;
  repo: string;
  directory: string;         // path prefix inside the repo, e.g. "terraform"
  baseBranch: string;
  newBranch: string;
  title: string;
  body: string;
  files: { path: string; content: string }[];
}

export interface PRResult {
  url: string;
  number: number;
}

export async function createPullRequest(params: CreatePRParams): Promise<PRResult> {
  const { token, owner, repo, directory, baseBranch, newBranch, title, body, files } = params;
  const h = apiHeaders(token);
  const base = `${GITHUB_API}/repos/${owner}/${repo}`;

  // 1. Get the SHA of the tip of the base branch
  const refRes = await fetch(`${base}/git/ref/heads/${baseBranch}`, { headers: h });
  if (!refRes.ok) {
    throw new Error(`Branch "${baseBranch}" not found in ${owner}/${repo}`);
  }
  const refData = await refRes.json() as { object: { sha: string } };
  const baseSha: string = refData.object.sha;

  // 2. Get the tree SHA from that commit
  const commitRes = await fetch(`${base}/git/commits/${baseSha}`, { headers: h });
  if (!commitRes.ok) throw new Error('Failed to fetch base commit');
  const commitData = await commitRes.json() as { tree: { sha: string } };
  const baseTreeSha: string = commitData.tree.sha;

  // 3. Create a blob for each file
  const prefix = directory ? `${directory.replace(/\/$/, '')}/` : '';
  const treeItems = await Promise.all(
    files.map(async (file) => {
      const blobRes = await fetch(`${base}/git/blobs`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ content: file.content, encoding: 'utf-8' }),
      });
      if (!blobRes.ok) throw new Error(`Failed to create blob for ${file.path}`);
      const blob = await blobRes.json() as { sha: string };
      return {
        path: `${prefix}${file.path}`,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha,
      };
    })
  );

  // 4. Create a new git tree on top of the base tree
  const treeRes = await fetch(`${base}/git/trees`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  });
  if (!treeRes.ok) throw new Error('Failed to create git tree');
  const treeData = await treeRes.json() as { sha: string };

  // 5. Create a commit pointing at the new tree
  const newCommitRes = await fetch(`${base}/git/commits`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      message: title,
      tree: treeData.sha,
      parents: [baseSha],
    }),
  });
  if (!newCommitRes.ok) throw new Error('Failed to create commit');
  const newCommit = await newCommitRes.json() as { sha: string };

  // 6. Create the new branch pointing at the commit
  const branchRes = await fetch(`${base}/git/refs`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: newCommit.sha }),
  });
  if (!branchRes.ok) {
    const err = await branchRes.json() as { message?: string };
    throw new Error(err.message ?? 'Failed to create branch');
  }

  // 7. Open the pull request
  const prRes = await fetch(`${base}/pulls`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ title, body, head: newBranch, base: baseBranch }),
  });
  if (!prRes.ok) {
    const err = await prRes.json() as { message?: string };
    throw new Error(err.message ?? 'Failed to create pull request');
  }
  const pr = await prRes.json() as { html_url: string; number: number };
  return { url: pr.html_url, number: pr.number };
}
