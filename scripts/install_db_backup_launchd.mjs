#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const home = os.homedir();
const uid = typeof process.getuid === 'function' ? process.getuid() : null;
const label = 'ai.skladpro.database-backup';
const launchAgentsDir = path.join(home, 'Library', 'LaunchAgents');
const plistPath = path.join(launchAgentsDir, `${label}.plist`);
const stdoutPath = path.join(root, 'backups', 'db', 'launchd.out.log');
const stderrPath = path.join(root, 'backups', 'db', 'launchd.err.log');
const nodePath = fs.existsSync('/opt/homebrew/bin/node') ? '/opt/homebrew/bin/node' : process.execPath;
const scriptPath = path.join(root, 'scripts', 'db_backup.mjs');

function loadEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i <= 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return out;
}

function run(command, args) {
  return spawnSync(command, args, { encoding: 'utf8' });
}

const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>${label}</string>
    <key>ProgramArguments</key>
    <array>
      <string>${nodePath}</string>
      <string>${scriptPath}</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${root}</string>
    <key>StartCalendarInterval</key>
    <dict>
      <key>Hour</key>
      <integer>9</integer>
      <key>Minute</key>
      <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>${stdoutPath}</string>
    <key>StandardErrorPath</key>
    <string>${stderrPath}</string>
    <key>RunAtLoad</key>
    <false/>
  </dict>
</plist>
`;

fs.mkdirSync(path.dirname(stdoutPath), { recursive: true });
fs.mkdirSync(launchAgentsDir, { recursive: true });
fs.writeFileSync(plistPath, plist, 'utf8');

if (uid != null) {
  run('launchctl', ['bootout', `gui/${uid}`, plistPath]);
  const bootstrap = run('launchctl', ['bootstrap', `gui/${uid}`, plistPath]);
  if (bootstrap.status !== 0) {
    console.error(bootstrap.stderr || bootstrap.stdout || 'launchctl bootstrap failed');
    process.exit(1);
  }
  run('launchctl', ['enable', `gui/${uid}/${label}`]);
}

const env = { ...process.env, ...loadEnv(path.join(root, '.env.local')) };
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  await supabase.from('app_settings').upsert({
    key: 'database_backup_schedule',
    value: 'Ежедневно в 09:00 (Europe/Moscow) через launchd',
  });
}

console.log(`LAUNCHD_INSTALLED: ${plistPath}`);
console.log(`LAUNCHD_LABEL: ${label}`);
