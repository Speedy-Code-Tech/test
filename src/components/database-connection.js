import pkg from "pg";
const { Pool } = pkg;
import { config } from "dotenv";
config();
const pool = new Pool({
  user: process.env.db_User,
  host: process.env.db_host,
  database: process.env.db_Database,
  password: process.env.db_Password,
  port: process.env.db_Port,
});

const init = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS users
        (id SERIAL PRIMARY KEY, "displayName" TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,type TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE) `
  );
  await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    message TEXT NOT NULL,
    room TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
`); 
};
init();
export default pool;
