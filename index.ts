import { type LibSQLDatabase, drizzle } from 'drizzle-orm/libsql'
import { type Client, type Config, createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'


const DB_PATH = '/tmp/data/local.db'
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

  // A non Embedded Replica
  // Query works for normal and transactions
  const normalDb = await getNormalClient()
  const normalResults = await normalDb.run(sql`SELECT 1;`)
  console.log('Normal DB query: ', normalResults.rows[0])
  await normalDb.transaction(async tx => {
    const tResult = await tx.run(sql`SELECT 1;`)
    console.log('Normal DB query inside transaction: ', tResult.rows[0])
  })



  // Embedded Replica
  // Query only works for normal queries and returns undefined for transactions
  const embeddedClient = await getEmbeddedReplicaClient()
  const result = await embeddedClient.run(sql`SELECT 2;`)
  console.log('ER DB query:', result.rows[0])
  await embeddedClient.transaction(async tx => {
    const tResult = await tx.run(sql`SELECT 2;`)
    console.log('ER DB query inside transaction: ', tResult.rows[0])
  })
}

main()