import * as fs from 'fs';
import * as path from 'path';

describe('migration conventions (directory-wide)', () => {
  const migrationsDir = __dirname;
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'))
    .sort();

  function getMigrationName(file: string): string {
    const source = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const nameMatch = source.match(/name\s*=\s*'([^']+)'/);
    if (!nameMatch) {
      throw new Error(`${file}: missing "name = '...'" property`);
    }
    return nameMatch[1];
  }

  it('finds at least one migration to validate', () => {
    expect(migrationFiles.length).toBeGreaterThan(0);
  });

  it('every migration class name ends with a valid 13-digit JS timestamp', () => {
    for (const file of migrationFiles) {
      const migrationName = getMigrationName(file);
      // Mirrors typeorm/migration/MigrationExecutor.getMigrations():
      // the last 13 chars of the name must parse as an epoch timestamp.
      const timestamp = parseInt(migrationName.substr(-13), 10);
      if (!timestamp || Number.isNaN(timestamp)) {
        throw new Error(
          `${file}: migration name '${migrationName}' does not end with a valid timestamp (last 13 chars would be '${migrationName.slice(-13)}'). Use a JS epoch-ms suffix, e.g. ClassName${Date.now()}`,
        );
      }
    }
  });

  it('migration timestamps are unique and never run out of date order', () => {
    // TypeORM runs migrations sorted by their epoch timestamp. So a migration
    // with an older/smaller timestamp than a previous one would execute in
    // the past, before migrations that were already applied.
    const migrations = migrationFiles.map((file) => ({
      file,
      datePrefix: Number(file.slice(0, 8)), // e.g. "20260813-*.ts"
      timestamp: parseInt(getMigrationName(file).substr(-13), 10),
    }));

    const timestamps = migrations.map((m) => m.timestamp);
    const unique = new Set(timestamps);
    if (unique.size !== timestamps.length) {
      throw new Error(
        `duplicate migration timestamp found in ${migrationFiles.join(', ')}`,
      );
    }

    const inRunOrder = [...migrations].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
    let previousDate = 0;
    for (const m of inRunOrder) {
      if (m.datePrefix < previousDate) {
        throw new Error(
          `migration ${m.file} (ts ${m.timestamp}) runs before an older-dated file; bump its class timestamp suffix so it runs last`,
        );
      }
      previousDate = m.datePrefix;
    }
  });
});
