import { parseArgs } from 'node:util';
import { ofetch } from 'ofetch';
import { setOutput } from '@actions/core';

interface Info {
  version: string;
  sha1: string;
}

const update = async (pkg: string, channel: string) => {
  const pkgbuild = await Bun.file(`${pkg}/PKGBUILD`).text();

  const info = await ofetch<Info>(`https://d.defold.com/${channel}/info.json`);
  const version = `${info.version}.${info.sha1.slice(0, 7)}`;

  await Bun.write(
    `${pkg}/PKGBUILD`,
    pkgbuild
      .replace(/_sha1=.*/, `_sha1=${info.sha1}`)
      .replace(/pkgver=.*/, `pkgver=${version}`)
      .replace(/pkgrel=.*/, 'pkgrel=1'),
  );

  setOutput('version', version);
};

const { values: args } = parseArgs({
  args: Bun.argv,
  options: {
    pkg: { type: 'string' },
    channel: { type: 'string' },
  },
  allowPositionals: true,
});
if (args.pkg && args.channel) {
  update(args.pkg, args.channel);
} else {
  throw new Error('Missing required arguments: --pkg, --channel');
}
