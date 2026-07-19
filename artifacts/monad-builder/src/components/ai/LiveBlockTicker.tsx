/**
 * LiveBlockTicker — shows live Monad block number in the Navbar.
 * Calls /api/chain/block (Node.js direct RPC fetch, no Python spawn).
 * Updates every 4s. Flashes green on new block.
 */
import { useState, useEffect, useRef } from "react";
import { Activity } from "lucide-react";

export function LiveBlockTicker() {
  const [block, setBlock] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const prevBlock = useRef<number | null>(null);

  useEffect(() => {
    let dead = false;

    async function poll() {
      try {
        const res = await fetch("/api/chain/block");
        if (!res.ok) return;
        const { blockNumber } = await res.json();
        if (!dead && blockNumber && blockNumber !== prevBlock.current) {
          prevBlock.current = blockNumber;
          setBlock(blockNumber);
          setFlash(true);
          setTimeout(() => setFlash(false), 700);
        }
      } catch {}
    }

    poll();
    const id = setInterval(poll, 4000);
    return () => { dead = true; clearInterval(id); };
  }, []);

  if (!block) return null;

  return (
    <a
      href="https://testnet.monadexplorer.com"
      target="_blank"
      rel="noopener noreferrer"
      className="hidden md:flex items-center gap-1.5 text-xs font-mono hover:opacity-80 transition-opacity"
      title="Latest Monad block — click to open Monad Explorer"
    >
      <Activity className={`w-3 h-3 transition-colors ${flash ? "text-green-400" : "text-white/20"}`} />
      <span className={`transition-colors ${flash ? "text-green-400" : "text-white/25"}`}>
        #{block.toLocaleString()}
      </span>
    </a>
  );
}
