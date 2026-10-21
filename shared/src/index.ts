import { getDb } from './db';

const conn = getDb();    

const response = conn
  .prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name;
    `)
  .all();

console.log(response)