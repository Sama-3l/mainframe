import { initializeDatabase } from './app';
import { env } from '../config/env'

initializeDatabase();

console.log("TABLE CREATED");

console.log(env);