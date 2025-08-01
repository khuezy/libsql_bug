import { type LibSQLDatabase, drizzle } from 'drizzle-orm/libsql'
import { type Client, type Config, createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'


const DB_PATH = '/tmp/data/bug.db'
const SYNC_URL = 'libsql://<db>.aws-us-east-1.turso.io'
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
  await erClient.sync()
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

  // First we insert a base record, subsequent inserts will be no op
  const insert = await embeddedClient.run(sql`INSERT into _test(id, number) values(1, 1) ON CONFLICT(id) DO NOTHING RETURNING *;`)

  // Then update "number" by one each time
  const update = await embeddedClient.run(sql`UPDATE _test set number = number + 1  RETURNING *`)
  console.log('UPDATE returns updated value: ', update.rows[0])

  // Finally query the table. With this query, turso client update the local `/tmp/data/bug.db`
  // ATTN: comment the next two lines out and rerun the script... 
  //       Without this query, the local client never gets updated.
  const query = await embeddedClient.run(sql`SELECT * FROM _test;`)
  console.log('SELECT result: ', query.rows[0])
}

main()