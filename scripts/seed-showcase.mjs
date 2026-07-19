/**
 * Seeds the MonadBuilder+ Protocol showcase project — the recursive demo.
 * Run: node scripts/seed-showcase.mjs
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const SHOWCASE_COMPONENTS = [
  {
    id: "showcase_hero",
    type: "hero-section",
    props: {
      title: "MonadBuilder+ Protocol",
      subtitle: "No-code dApp builder. THESIS OS governance. Deployed on Monad Testnet by the app itself."
    },
    order: 0
  },
  {
    id: "showcase_wallet",
    type: "wallet-connect",
    props: {
      label: "Connect Wallet",
      chainId: 10143,
      rpcUrl: "https://testnet-rpc.monad.xyz",
      networkName: "Monad Testnet"
    },
    order: 1
  },
  {
    id: "showcase_stats",
    type: "stats-row",
    props: { items: 3, chainId: 10143 },
    order: 2
  },
  {
    id: "showcase_swap",
    type: "token-swap",
    props: {
      fromToken: "USDC",
      toToken: "MON",
      chainId: 10143,
      rpcUrl: "https://testnet-rpc.monad.xyz"
    },
    order: 3
  },
  {
    id: "showcase_merkl",
    type: "merkl-rewards",
    props: {
      chainId: 10143,
      title: "Earn Rewards for Building",
      merklUrl: "https://app.merkl.xyz"
    },
    order: 4
  },
  {
    id: "showcase_dao",
    type: "dao-vote",
    props: {
      title: "THESIS Proposal #001 — Enable Community Governance",
      chainId: 10143
    },
    order: 5
  },
  {
    id: "showcase_txfeed",
    type: "transaction-feed",
    props: {
      title: "Live Deployments",
      limit: 5,
      explorerUrl: "https://testnet.monadexplorer.com"
    },
    order: 6
  },
  {
    id: "showcase_cta",
    type: "button",
    props: { label: "Start Building Your dApp →", variant: "primary" },
    order: 7
  }
];

const slug = "monadbuilder-protocol";

const result = await pool.query(
  `INSERT INTO projects (name, description, components, theme, status, "publishedSlug", "createdAt", "updatedAt")
   VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, NOW(), NOW())
   ON CONFLICT DO NOTHING
   RETURNING id`,
  [
    "MonadBuilder+ Protocol",
    "The no-code dApp builder that deploys itself on Monad Testnet. Built with MonadBuilder+. Governed by THESIS OS. A recursive proof of concept.",
    JSON.stringify(SHOWCASE_COMPONENTS),
    JSON.stringify({ primaryColor: "#836EF9", backgroundColor: "#0a0a0f", fontFamily: "Inter" }),
    "published",
    slug
  ]
);

if (result.rows[0]) {
  console.log("✅ Showcase project created — ID:", result.rows[0].id);
  console.log("   Preview: /preview/" + result.rows[0].id);
  console.log("   Builder: /builder/" + result.rows[0].id);
} else {
  // Already exists — find it
  const existing = await pool.query(
    `SELECT id FROM projects WHERE name = 'MonadBuilder+ Protocol' LIMIT 1`
  );
  if (existing.rows[0]) {
    console.log("ℹ️  Already exists — ID:", existing.rows[0].id);
    console.log("   Preview: /preview/" + existing.rows[0].id);
    console.log("   Builder: /builder/" + existing.rows[0].id);
  }
}

await pool.end();
