import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Chromium: use PW_CHROMIUM (e.g. Playwright's managed browser) or the system default.
const EXE = process.env.PW_CHROMIUM || undefined;
const APP = process.env.DEMO_URL || 'http://127.0.0.1:5173/';
const W = 1440, H = 900;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'video');

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--force-color-profile=srgb'] });
console.log('recording', APP, '->', OUT);
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  recordVideo: { dir: OUT, size: { width: W, height: H } },
});
const page = await ctx.newPage();

// ---- overlay: fake cursor, click ripple, caption bar ----
async function installOverlay() {
  await page.evaluate(() => {
    if (window.__demo) return;
    window.__demo = true;
    const cur = document.createElement('div');
    cur.id = '__cursor';
    cur.style.cssText = `position:fixed;left:-40px;top:-40px;width:22px;height:22px;z-index:2147483647;
      pointer-events:none;transition:transform .04s linear;`;
    cur.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,.6))">
      <path d="M4 2 L4 20 L9 15 L12.5 22 L15.5 20.5 L12 14 L19 14 Z" fill="#fff" stroke="#111" stroke-width="1.2"/></svg>`;
    document.body.appendChild(cur);
    const cap = document.createElement('div');
    cap.id = '__cap';
    cap.style.cssText = `position:fixed;left:50%;bottom:34px;transform:translateX(-50%) translateY(20px);
      z-index:2147483646;pointer-events:none;font-family:ui-sans-serif,system-ui,sans-serif;
      background:rgba(12,10,28,.86);color:#eae6ff;border:1px solid rgba(124,92,255,.55);
      padding:11px 22px;border-radius:999px;font-size:18px;font-weight:600;letter-spacing:.2px;
      box-shadow:0 10px 40px rgba(80,50,220,.35);opacity:0;transition:opacity .35s,transform .35s;
      max-width:80vw;text-align:center;backdrop-filter:blur(6px);`;
    document.body.appendChild(cap);
    document.addEventListener('mousemove', e => {
      cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px';
    }, true);
    window.__ripple = (x, y) => {
      const r = document.createElement('div');
      r.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:14px;height:14px;margin:-7px 0 0 -7px;
        border-radius:50%;border:2px solid #7c5cff;z-index:2147483645;pointer-events:none;
        animation:__rp .55s ease-out forwards;`;
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 600);
    };
    window.__say = (t) => {
      const c = document.getElementById('__cap');
      if (!t) { c.style.opacity = 0; c.style.transform = 'translateX(-50%) translateY(20px)'; return; }
      c.textContent = t; c.style.opacity = 1; c.style.transform = 'translateX(-50%) translateY(0)';
    };
    const st = document.createElement('style');
    st.textContent = `@keyframes __rp{from{transform:scale(1);opacity:.9}to{transform:scale(4);opacity:0}}`;
    document.head.appendChild(st);
  });
}

let mx = W / 2, my = H / 2;
const sleep = ms => page.waitForTimeout(ms);
async function say(t) { await page.evaluate(t => window.__say(t), t); }
async function moveTo(x, y, steps = 26) { await page.mouse.move(x, y, { steps }); mx = x; my = y; await sleep(120); }
async function ripple(x, y) { await page.evaluate(([x, y]) => window.__ripple(x, y), [x, y]); }

async function clickTab(label) {
  const el = page.locator(`nav.tabs button:text-is("${label}")`).first();
  await el.scrollIntoViewIfNeeded();
  const b = await el.boundingBox();
  if (!b) throw new Error('no tab ' + label);
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await moveTo(x, y);
  await ripple(x, y);
  await el.click();
  await sleep(140);
}

async function smoothScroll(toY, ms = 1400) {
  const from = await page.evaluate(() => window.scrollY);
  const steps = Math.max(12, Math.round(ms / 40));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await page.evaluate(y => window.scrollTo(0, y), from + (toY - from) * e);
    await sleep(40);
  }
}

// ---- run ----
await page.goto(APP, { waitUntil: 'networkidle', timeout: 60000 });
await sleep(2600);
await installOverlay();
await page.evaluate(() => window.scrollTo(0, 0));

await say('MonadBuilder+  ·  live on Monad');
await moveTo(W / 2, H / 2, 30);
await sleep(2200);

// BUILDER (default landing) — show the daily brief + one-tap utilities
await say('MonadBuilder HQ — your AI runs the Monad morning for you');
await sleep(2200);
await smoothScroll(650);
await sleep(1800);
await smoothScroll(1250);
await sleep(1700);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await sleep(500);

const tour = [
  ['STUDIO',  'STUDIO — describe an idea, get a deploy plan'],
  ['IDE',     'IDE — the AI builds your dApp layout'],
  ['NOMOS',   'NOMOS — agents propose, laws decide'],
  ['CODEX',   'CODEX — the live Monad ecosystem atlas'],
  ['DESK',    'DESK — paper trading under policy guardrails'],
  ['ACADEMY', 'ACADEMY — learn Monad by actually using it'],
  ['AGENT',   'AGENT — long-horizon agent, fully governed'],
  ['PLATFORM','PLATFORM — shared primitives + live market'],
  ['TERM',    'TERM — a real terminal into the engine'],
];

for (const [tab, caption] of tour) {
  await clickTab(tab);
  await say(caption);
  await sleep(2100);
  await smoothScroll(680, 1200);
  await sleep(1500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(350);
}

// back to BUILDER for the close
await clickTab('BUILDER');
await say('MonadBuilder+  ·  ship Monad dApps in minutes, not days');
await moveTo(W / 2, H / 2 - 60, 30);
await sleep(2600);
await say('');
await sleep(900);

await page.close();
const video = await page.video();
const path = await video.path();
await ctx.close();
await browser.close();
console.log('VIDEO_PATH', path);
