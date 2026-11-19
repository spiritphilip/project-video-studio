// Screen capture: real app screens for the videos, signed in as the right role, at video-friendly sizes.
// Usage: node scripts/capture.mjs [capture.json] [--only=name1,name2]
// Needs Playwright once: `npm i -D playwright && npx playwright install chromium`
// (or reuse the host project's Playwright: run with NODE_PATH=../node_modules).
//
// capture.json:
// {
//   "baseUrl": "http://localhost:3000",
//   "auth": {                                   // optional, one entry per role
//     "member": {"storageState": "auth/member.json"},          // saved Playwright login state, or
//     "admin":  {"script": "scripts/capture-auth.mjs"}         // module exporting default async (page, role, baseUrl) => {}
//   },
//   "hide": ["#cookie-banner", ".intercom-launcher"],           // hidden on every shot
//   "shots": [
//     {"name": "dashboard-desktop", "path": "/dashboard", "as": "member", "device": "desktop"},
//     {"name": "wallet-mobile", "path": "/wallet", "as": "member", "device": "mobile", "waitFor": "text=Balance",
//      "actions": [{"click": "text=Add funds"}, {"wait": 600}], "fullPage": false}
//   ]
// }
// device: desktop = 1920×1080 @1x, mobile = 390×844 @2x (matches the kit's <Browser> and <Phone> frames).
import fs from 'node:fs';
import path from 'node:path';
import {root} from './lib.mjs';

const file = path.resolve(root, process.argv.find((a, i) => i > 1 && !a.startsWith('--')) ?? 'capture.json');
const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean);
const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
let chromium;
try { ({chromium} = await import('playwright')); } catch { ({chromium} = await import('@playwright/test')); }

const DEVICES = {
  desktop: {viewport: {width: 1920, height: 1080}, deviceScaleFactor: 1},
  mobile: {viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true},
};
const outDir = path.join(root, 'public', 'screens');
fs.mkdirSync(outDir, {recursive: true});
const browser = await chromium.launch();
const contexts = {};

async function context(role, device) {
  const k = `${role ?? 'anon'}:${device}`;
  if (contexts[k]) return contexts[k];
  const a = role ? spec.auth?.[role] : null;
  const ctx = await browser.newContext({...DEVICES[device], colorScheme: spec.colorScheme ?? 'dark', storageState: a?.storageState ? path.resolve(root, a.storageState) : undefined});
  if (a?.script) {
    const {default: login} = await import(new URL(`file:///${path.resolve(root, a.script).replace(/\\/g, '/')}`).href);
    const p = await ctx.newPage();
    await login(p, role, spec.baseUrl);
    await p.close();
  }
  return (contexts[k] = ctx);
}

for (const s of spec.shots) {
  if (only.length && !only.includes(s.name)) continue;
  const ctx = await context(s.as, s.device ?? 'desktop');
  const page = await ctx.newPage();
  await page.goto(new URL(s.path, spec.baseUrl).href, {waitUntil: 'networkidle'}).catch(() => {});
  if (s.waitFor) await page.waitForSelector(s.waitFor, {timeout: 20000}).catch(() => console.warn('  waitFor timed out:', s.waitFor));
  for (const act of s.actions ?? []) {
    if (act.click) await page.click(act.click);
    if (act.fill) await page.fill(act.fill[0], act.fill[1]);
    if (act.scroll) await page.mouse.wheel(0, act.scroll);
    if (act.wait) await page.waitForTimeout(act.wait);
  }
  const hide = [...(spec.hide ?? []), ...(s.hide ?? [])];
  if (hide.length) await page.addStyleTag({content: `${hide.join(',')}{visibility:hidden!important}`});
  await page.waitForTimeout(s.settle ?? 800);
  const out = path.join(outDir, `${s.name}.png`);
  await page.screenshot({path: out, fullPage: !!s.fullPage});
  console.log('captured', s.name.padEnd(28), s.as ?? 'anon', s.device ?? 'desktop');
  await page.close();
}
await browser.close();
