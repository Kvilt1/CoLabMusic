import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const SONGS_JSON_PATH = path.join(REPO_ROOT, 'src', 'data', 'realSongs.json');

// Netlify deploy rejects filenames containing these characters.
const DISALLOWED_CHARS_RE = /[#?]/g;

function toSlugBase(input) {
  // Normalize and strip diacritics, then replace unsafe chars with '-'.
  // Keep a conservative set to avoid surprises across filesystems/CDNs.
  const normalized = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  return normalized
    .replace(DISALLOWED_CHARS_RE, '-')
    .replace(/[^a-zA-Z0-9._-]+/g, '-') // spaces, punctuation, emojis, etc.
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .toLowerCase();
}

function uniqueFilename(dir, filename) {
  const parsed = path.parse(filename);
  const ext = parsed.ext;
  let base = parsed.name;
  let candidate = `${base}${ext}`;
  let n = 2;
  while (fs.existsSync(path.join(dir, candidate))) {
    candidate = `${base}-${n}${ext}`;
    n += 1;
  }
  return candidate;
}

function sanitizeFileInPlace(dir, filename) {
  const hasDisallowed = DISALLOWED_CHARS_RE.test(filename);
  DISALLOWED_CHARS_RE.lastIndex = 0;
  if (!hasDisallowed) return null;

  const parsed = path.parse(filename);
  const safeBase = toSlugBase(parsed.name) || 'file';
  const safeExt = (parsed.ext || '').toLowerCase();
  const target = uniqueFilename(dir, `${safeBase}${safeExt}`);

  if (target === filename) return null;

  fs.renameSync(path.join(dir, filename), path.join(dir, target));
  return { from: filename, to: target };
}

function walkAndSanitize(rootDir) {
  /** @type {Array<{from:string,to:string}>} */
  const renames = [];

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    // Skip dot-directories like .well-known if present.
    if (entry.name.startsWith('.')) continue;

    const full = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      renames.push(...walkAndSanitize(full));
      continue;
    }
    if (!entry.isFile()) continue;

    const result = sanitizeFileInPlace(rootDir, entry.name);
    if (result) renames.push(result);
  }

  return renames;
}

function updateSongUrlsIfNeeded(renameMap) {
  if (!fs.existsSync(SONGS_JSON_PATH)) return;

  let raw;
  try {
    raw = fs.readFileSync(SONGS_JSON_PATH, 'utf8');
  } catch {
    return;
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    // If the file isn't valid JSON, don't mutate it.
    return;
  }

  if (!Array.isArray(json)) return;

  let changed = false;
  for (const song of json) {
    if (!song || typeof song !== 'object') continue;
    if (typeof song.url !== 'string') continue;

    // Expect URLs like "/music/<filename>"
    const m = song.url.match(/^\/music\/(.+)$/);
    if (!m) continue;

    const oldName = m[1];
    const newName = renameMap.get(oldName);
    if (!newName) continue;

    song.url = `/music/${newName}`;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(SONGS_JSON_PATH, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  }
}

function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.log(`[sanitize-public-filenames] No public/ directory found, skipping.`);
    return;
  }

  const renames = walkAndSanitize(PUBLIC_DIR);
  if (renames.length === 0) {
    console.log(`[sanitize-public-filenames] No disallowed filenames found in public/.`);
    return;
  }

  const renameMap = new Map(renames.map(r => [r.from, r.to]));
  updateSongUrlsIfNeeded(renameMap);

  console.log(`[sanitize-public-filenames] Renamed ${renames.length} file(s):`);
  for (const r of renames) {
    console.log(`- ${r.from} -> ${r.to}`);
  }
}

main();

