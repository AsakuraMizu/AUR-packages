import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

interface Info {
  version: string;
  sha1: string;
}

const {
  values: { pkg, channel },
} = parseArgs({
  options: {
    pkg: { type: 'string' },
    channel: { type: 'string' },
  },
});
if (!pkg || !channel) {
  throw new Error('Missing required arguments: --pkg, --channel');
}

const res = await fetch(`https://d.defold.com/${channel}/info.json`);
if (!res.ok) {
  throw new Error(`Failed to fetch ${channel} info: ${res.status}`);
}
const info = (await res.json()) as Info;
const version = `${info.version}.${info.sha1.slice(0, 7)}`;

const path = `${pkg}/PKGBUILD`;
const pkgbuild = await readFile(path, 'utf8');
let updated = pkgbuild
  .replace(/^_sha1=.*/m, `_sha1=${info.sha1}`)
  .replace(/^pkgver=.*/m, `pkgver=${version}`);
const changed = updated !== pkgbuild;
if (changed) {
  updated = updated.replace(/^pkgrel=.*/m, 'pkgrel=1');
  await writeFile(path, updated);
}

if (process.env.GITHUB_OUTPUT) {
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `version=${version}\nchanged=${changed}\n`,
  );
}
