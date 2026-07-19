/**
 * GitHub OAuth — Sign in with GitHub inside MonadBuilder+.
 *
 * Setup: Create a GitHub OAuth App at https://github.com/settings/applications/new
 *   Homepage URL:    https://monados.medinatechlabs.net
 *   Callback URL:    https://monados.medinatechlabs.net/api/auth/github/callback
 * Then set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Replit Secrets.
 *
 * Session stored in a signed cookie (SESSION_SECRET required).
 */
import { Router, Request, Response } from "express";

const router = Router();

const GITHUB_CLIENT_ID = process.env["GITHUB_CLIENT_ID"] ?? "";
const GITHUB_CLIENT_SECRET = process.env["GITHUB_CLIENT_SECRETS"] ?? "";
const APP_BASE_URL = process.env["APP_BASE_URL"] ?? "https://monados.medinatechlabs.net";
const GITHUB_REDIRECT_URI = `${APP_BASE_URL}/api/auth/github/callback`;

// Session augmentation
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

// ── GET /api/auth/github ──────────────────────────────────────────────────────
router.get("/github", (req: Request, res: Response): void => {
  if (!GITHUB_CLIENT_ID) {
    res.status(503).json({ error: "GitHub OAuth not configured — set GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET in Replit Secrets" });
    return;
  }

  const state = randomState();
  (req.session as any).oauthState = state;

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: "read:user user:email",
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// ── GET /api/auth/github/callback ─────────────────────────────────────────────
router.get("/github/callback", async (req: Request, res: Response): Promise<void> => {
  const { code, state } = req.query as { code?: string; state?: string };

  if (!code) {
    res.redirect(`${APP_BASE_URL}/?auth=error&reason=no_code`);
    return;
  }

  // CSRF check
  if (state !== (req.session as any).oauthState) {
    res.redirect(`${APP_BASE_URL}/?auth=error&reason=state_mismatch`);
    return;
  }

  try {
    // Exchange code for token
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
    const tokenData: any = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      res.redirect(`${APP_BASE_URL}/?auth=error&reason=token_exchange`);
      return;
    }

    // Fetch GitHub user
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "MonadBuilder+",
      },
    });
    const ghUser: any = await userRes.json();

    // Fetch primary email if not public
    let email = ghUser.email as string | null;
    if (!email) {
      try {
        const emailRes = await fetch("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "MonadBuilder+" },
        });
        const emails: any[] = await emailRes.json();
        email = emails.find((e: any) => e.primary)?.email ?? null;
      } catch {}
    }

    (req.session as any).user = {
      id: ghUser.id,
      login: ghUser.login,
      name: ghUser.name ?? ghUser.login,
      avatarUrl: ghUser.avatar_url,
      email,
    };

    res.redirect(`${APP_BASE_URL}/dashboard?auth=success&user=${encodeURIComponent(ghUser.login)}`);
  } catch (err) {
    res.redirect(`${APP_BASE_URL}/?auth=error&reason=server`);
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", (req: Request, res: Response): void => {
  const user = (req.session as any)?.user;
  if (!user) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json({ authenticated: true, user });
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post("/logout", (req: Request, res: Response): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export { router as authRouter };
