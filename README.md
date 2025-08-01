# Libsql AWS Embedded Replica Bug

When using ER, UPDATE queries do not immediately update the local.db file.
The local.db file is only updated after the next "SELECT" query.

Repro:

1. `npm install`
2. `mkdir /tmp/data`
3. Edit `index.ts` and update the db name/token
4. `npm run dev`
5. Look at the remote db: `SELECT * FROM _test;` to see that the remote has new data
6. Look at local: `sqlite /tmp/data/bug.db` => `SELECT * FROM _test;`
7. Note that it is also updated.
8. Edit `index.ts` and comment out the last 2 lines in the `main` function
9. `npm run dev`, this runs the same code but without the `SELECT * FROM _test;`
10. Look at remote db, the data is updated.
11. Look at local db, the data is stale.

12. Bonus: now if you repeat `npm run dev`, the local number will always be stale by 1 compared to the remote db.

Expectation: `UPDATE` should also sync the local db.
