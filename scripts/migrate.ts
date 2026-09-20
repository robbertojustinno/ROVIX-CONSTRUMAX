import fs from "node:fs";import path from "node:path";import { pool } from "../src/lib/db";
async function main(){const file=path.join(process.cwd(),"db/migrations/001_init.sql");await pool.query(fs.readFileSync(file,"utf8"));console.log("Migração concluída.");await pool.end()}main().catch(e=>{console.error(e);process.exit(1)});
