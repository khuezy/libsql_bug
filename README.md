# Libsql AWS Embedded Replica Bug

When using ER, UPDATE queries do not immediately update the local.db file.
The local.db file is only updated after the next "SELECT" query.

Repro:

1. `npm install`
2. `mkdir /tmp/data`
3. Edit `index.ts` and update the db name/token
4. `npm run dev`

5. Bonus: now if you repeat `npm run dev`, the local number will always be stale by 1 compared to the remote db.

Expectation: `UPDATE` should also sync the local db.
