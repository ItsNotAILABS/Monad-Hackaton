/**
 * GitHub OAuth — Sign in with GitHub inside MonadBuilder+.
 *
 * Setup a GitHub OAuth App:
 *   Homepage URL: https://monados.medinatechlabs.net
 *   Callback URL: https://monados.medinatechlabs.net/api/auth/github/callback
 *
 * Configure GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, APP_BASE_URL, and
 * SESSION_SECRET through the active deployment secret store. Production is
 * Cloudflare-first; no Replit secret dependency is assumed.
 */
import { Router, Request, Response } from "express";

const router = Router();

const GITHUB_CLIENT_ID = process.env["GITHUB_CLIENT_ID"] ?? "";
const GITHUB_CLIENT_SECRET = process.env["GITHUB_CLIENT_SECRET"] ?? process.env["GITHUB_CLIENT_SECRETS"] ?? "";
const APP_BASE_URL = process.env["APP_BASE_URL"] ?? "https://monados.medinatechlabs.net";
const GITHUB_REDIRECT_URI = `${APP_BASE_URL}/api/auth/github/callback`;

type GitHubUser = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
};

type GitHubEmail = {
  email?: string;
  primary?: boolean;
};

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      login: string;
      name: string;
      avatarUrl: string;
      email: string | null;
    };
    oauthState?: string;
  }
}

function randomState() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

router.get("/github", (req: Request, res: Response): void => {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    res.status(503).json({
      error: "GitHub OAuth not configured",
      required: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "SESSION_SECRET"],
    });
    return;
  }

  const state = randomState();
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: "read:user user:email",
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get("/github/callback", async (req: Request, res: Response): Promise<void> => {
  const { code, state } = req.query as { code?: string; state?: string };

  if (!code) {
    res.redirect(`${APP_BASE_URL}/?auth=error&reason=no_code`);
    return;
  }

  if (!state || state !== req.session.oauthState) {
    res.redirect(`${APP_BASE_URL}/?auth=error&reason=state_mismatch`);
    return;
  }

  delete req.session.oauthState;

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI,
      }),
    });
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };

    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      res.redirect(`${APP_BASE_URL}/?auth=error&reason=token_exchange`);
      return;
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "MonadBuilder+",
      },
    });
    if (!userRes.ok) {
      res.redirect(`${APP_BASE_URL}/?auth=error&reason=user_fetch`);
      return;
    }
    const ghUser = (await userRes.json()) as GitHubUser;

    let email = ghUser.email;
    if (!email) {
      try {
        const emailRes = await fetch("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "MonadBuilder+" },
        });
        if (emailRes.ok) {
          const emailPayload: unknown = await emailRes.json();
          const emails = Array.isArray(emailPayload) ? (emailPayload as GitHubEmail[]) : [];
          email = emails.find((entry) => entry.primary)?.email ?? null;
        }
      } catch {
        email = null;
      }
    }

    req.session.user = {
      id: ghUser.id,
      login: ghUser.login,
      name: ghUser.name ?? ghUser.login,
      avatarUrl: ghUser.avatar_url,
      email,
    };

    res.redirect(`${APP_BASE_URL}/dashboard?auth=success&user=${encodeURIComponent(ghUser.login)}`);
  } catch {
    res.redirect(`${APP_BASE_URL}/?auth=error&reason=server`);
  }
});

router.get("/me", (req: Request, res: Response): void => {
  const user = req.session.user;
  if (!user) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json({ authenticated: true, user });
});

router.post("/logout", (req: Request, res: Response): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export { router as authRouter };
