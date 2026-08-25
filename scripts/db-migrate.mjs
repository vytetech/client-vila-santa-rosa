import {
  REQUIRED_SCHEMA,
  createConnectionFromEnv,
  dedupeBlockedDates,
  ensureColumn,
  ensureIndex,
  normalizeSettingsValue,
} from './db-schema-sync.mjs'

const MIGRATION_ID = '0001_production_schema_sync'
const connection = await createConnectionFromEnv()

try {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
      \`id\` VARCHAR(128) NOT NULL,
      \`appliedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await connection.beginTransaction()

  for (const [table, spec] of Object.entries(REQUIRED_SCHEMA)) {
    await connection.query(spec.create)
    for (const [column, definition] of Object.entries(spec.columns)) {
      if (await ensureColumn(connection, table, column, definition)) {
        console.log(`db-migrate: added ${table}.${column}`)
      }
    }
    if (table === 'settings' && (await normalizeSettingsValue(connection))) {
      console.log('db-migrate: normalized settings.value as TEXT NOT NULL')
    }
    if (table === 'blocked_dates') {
      const count = await dedupeBlockedDates(connection)
      if (count > 0) console.log(`db-migrate: deduped ${count} blocked date keys`)
    }
    for (const index of spec.indexes) {
      if (await ensureIndex(connection, table, index)) {
        console.log(`db-migrate: added ${table}.${index.name}`)
      }
    }
  }

  await connection.execute(
    'INSERT INTO `schema_migrations` (`id`) VALUES (?) ON DUPLICATE KEY UPDATE `id` = `id`',
    [MIGRATION_ID],
  )
  await connection.commit()
  console.log(`db-migrate: ${MIGRATION_ID} applied`)
} catch (error) {
  await connection.rollback().catch(() => undefined)
  throw error
} finally {
  await connection.end()
}

