// Shared helpers for the video scripts: project root, config, and secrets lookup.
// Secrets are read (first hit wins) from: process env → ./.env → ~/.video-studio/secrets.env
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
export const root = path.resolve(here, '..');

export const readConfig = () => JSON.parse(fs.readFileSync(path.join(root, 'video.config.json'), 'utf8'));

const parseEnv = (file) => {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => [l.split('=')[0], l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]),
  );
};

export const STUDIO_HOME = process.env.VIDEO_STUDIO_HOME || path.join(os.homedir(), '.video-studio');

export function secret(name, {required = true} = {}) {
  const v = process.env[name] || parseEnv(path.join(root, '.env'))[name] || parseEnv(path.join(STUDIO_HOME, 'secrets.env'))[name];
  if (!v && required) throw new Error(`${name} is not set. Add it to ${path.join(STUDIO_HOME, 'secrets.env')} (shared by all projects) or to this folder's .env.`);
  return v || '';
}

/** Run a command through the shell (works the same in Git Bash, PowerShell and macOS/Linux). */
export async function sh(cmd) {
  const {execSync} = await import('node:child_process');
  return execSync(cmd, {cwd: root, stdio: 'inherit'});
}
