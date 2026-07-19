import { Router, type IRouter } from "express";

const router: IRouter = Router();

/**
 * GET /proxy/merkl?chainId=10143&status=LIVE
 * Server-side proxy for the Merkl API — avoids CORS restrictions in the browser.
 */
router.get("/proxy/merkl", async (req, res): Promise<void> => {
  const { chainId = "10143", status = "LIVE" } = req.query as Record<string, string>;
  const url = `https://api.merkl.xyz/v4/opportunities?chainId=${encodeURIComponent(chainId)}&status=${encodeURIComponent(status)}`;

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "MonadBuilder/1.0", "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    const data = await upstream.json();
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(data);
  } catch (err: any) {
    // Return empty array gracefully — UI shows preview data
    res.json([]);
  }
});

export default router;
