# Libsql AWS Embedded Replica Bug

When using ER, queries inside a transaction will return `undefined`

Repro:

1. `npm install`
2. `mkdir /tmp/data`
3. Edit `index.ts` and update the db name/token
4. `npm run dev`

Note that the final output (which uses embedded replica inside a transaction) is `undefined`
