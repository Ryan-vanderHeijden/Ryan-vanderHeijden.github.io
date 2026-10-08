// Make the web masters for the gallery from the full-resolution renders.
//
// Each src/content/gallery/*.md names its render in an `original:` frontmatter line.
// This writes src/assets/gallery/<slug>.webp at MAX_WIDTH, which Astro then resizes
// into the responsive sizes it serves. The 4K PNGs stay out of git.
//
//   npm run import-images                 # renders from ~/projects/backgrounds/out
//   RENDERS=/some/dir npm run import-images
//   npm run import-images -- --force      # redo files that already exist

import { readdir, readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const RENDERS = process.env.RENDERS ?? path.join(homedir(), 'projects/backgrounds/out');
const CONTENT = 'src/content/gallery';
const OUT = 'src/assets/gallery';
const MAX_WIDTH = 2560;
const QUALITY = 90;
const force = process.argv.includes('--force');

const exists = (p) => stat(p).then(() => true, () => false);

for (const name of (await readdir(CONTENT)).filter((f) => f.endsWith('.md')).sort()) {
  const text = await readFile(path.join(CONTENT, name), 'utf8');
  const original = text.match(/^original:\s*["']?([^"'\n]+?)["']?\s*$/m)?.[1];
  if (!original) continue;

  const slug = name.replace(/\.md$/, '');
  const src = path.join(RENDERS, original);
  const dest = path.join(OUT, `${slug}.webp`);
  if (!force && (await exists(dest))) continue;
  if (!(await exists(src))) {
    console.warn(`skip ${slug}: ${src} not found`);
    continue;
  }

  const info = await sharp(src)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY, smartSubsample: true })
    .toFile(dest);
  console.log(`${slug}: ${info.width}x${info.height}, ${(info.size / 1e6).toFixed(2)} MB`);
}
