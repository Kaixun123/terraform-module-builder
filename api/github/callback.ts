import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.redirect('/github-callback.html?github_error=missing_code');
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json() as { access_token?: string; error?: string };

    if (data.error || !data.access_token) {
      return res.redirect(`/github-callback.html?github_error=${encodeURIComponent(data.error ?? 'unknown')}`);
    }

    return res.redirect(`/github-callback.html?github_token=${encodeURIComponent(data.access_token)}`);
  } catch {
    return res.redirect('/github-callback.html?github_error=exchange_failed');
  }
}
