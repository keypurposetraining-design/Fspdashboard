import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

assert(process.argv[2], 'Pass the directory containing the isolated @electric-sql/pglite package');
for (const name of ['run-enrollment-check.mjs', 'activity-log-permissions.mjs', 'full-migrations.mjs']) {
  const result = spawnSync(process.execPath, [`database/tests/${name}`, process.argv[2]], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
