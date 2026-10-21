import { getDb } from '../modules/db';

const conn = getDb();    

const response = conn
  .prepare("SELECT * FROM server_settings")
  .all();

console.log(response)