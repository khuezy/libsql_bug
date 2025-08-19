import { type LibSQLDatabase, drizzle } from 'drizzle-orm/libsql'
import { type Client, type Config, createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import assert from 'node:assert'
const DB_PATH = '/tmp/data/bug.db'
const SYNC_URL = ''
const AUTH_TOKEN = ''


async function getNormalClient() {
  const normalClient = createClient({
    url: SYNC_URL,
    authToken: AUTH_TOKEN,
  })

  const normalDb = drizzle({
    client: normalClient
  })
  return normalDb
}

async function getEmbeddedReplicaClient() {
  const erClient = createClient({
    url: `file://${DB_PATH}`,
    syncUrl: SYNC_URL,
    authToken: AUTH_TOKEN,
    syncInterval: 60
  })
  // await erClient.sync()
  const erDB = drizzle({
    client: erClient
  })
  return erDB
}

async function main() {

  // Create `_test` table
  const normalDb = await getNormalClient()
  await normalDb.run(sql`
    CREATE TABLE IF NOT EXISTS _test (
      id INTEGER PRIMARY KEY,
      number INTEGER
    );
  `);


  // Embedded Replica client is having issues...
  const embeddedClient = await getEmbeddedReplicaClient()

  // First we insert a base record
  await embeddedClient.run(sql`INSERT into _test(id, number) values(1, 1) ON CONFLICT(id) DO UPDATE SET number = 1;`)

  // Update the row, set `number` to 2
  await embeddedClient.run(sql`UPDATE _test set number = 2;`)

  // Query row, it should get the updated value
  // Turso should sync the values on read (lazy)
  const select = await embeddedClient.run(sql`SELECT * from _test;`)
  console.log('SELECT returns latest value: ', select.rows[0])
  assert.equal(select.rows[0].number, 2, 'Value should be 2')

  // Run the update inside a transaction
  await embeddedClient.transaction(async tx => {
    return tx.run('UPDATE _test set number = 9;')
  })

  // Query the row, it should get the updated value but it doesn't
  const selectAfterTxn = await embeddedClient.run(sql`SELECT * from _test;`)
  console.log('SELECT returns latest value: ', selectAfterTxn.rows[0])
  assert.equal(select.rows[0].number, 9, `Value should be 9 but got ${select.rows[0].number}`)
}

main()