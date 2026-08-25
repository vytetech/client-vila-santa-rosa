import {
  REQUIRED_SCHEMA,
  columnExists,
  createConnectionFromEnv,
  indexExists,
  tableExists,
} from './db-schema-sync.mjs'

const connection = await createConnectionFromEnv()
const failures = []

try {
  for (const [table, spec] of Object.entries(REQUIRED_SCHEMA)) {
    if (!(await tableExists(connection, table))) {
      failures.push(`${table}: missing table`)
      continue
    }
    for (const column of Object.keys(spec.columns)) {
      if (!(await columnExists(connection, table, column))) {
        failures.push(`${table}.${column}: missing column`)
      }
    }
    for (const index of spec.indexes) {
      if (!(await indexExists(connection, table, index.name))) {
        failures.push(`${table}.${index.name}: missing index`)
      }
    }
  }

  if (failures.length > 0) {
    console.error('db-validate: schema is not compatible with this application version')
    for (const failure of failures) console.error(` - ${failure}`)
    process.exit(1)
  }
  console.log('db-validate: schema compatible')
} finally {
  await connection.end()
}

