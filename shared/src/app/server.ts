import { getDb } from '../modules/db';

const conn = getDb();    

const response = conn.exec(`
        SELECT *
        FROM server_settings
    `
)

console.log(response)