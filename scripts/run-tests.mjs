import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

for (const folder of ['tests', 'database/tests']) {
  for (const file of readdirSync(folder).filter(name => name.endsWith('.cjs')).sort()) {
    const result = spawnSync(process.execPath, [`${folder}/${file}`], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
  }
}
