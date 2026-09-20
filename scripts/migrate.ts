import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main(){
  const { pool } = await import("../src/lib/db");
  const dir=path.join(process.cwd(),"db/migrations");
  const files=fs.readdirSync(dir).filter(f=>f.endsWith(".sql")).sort();
  for(const file of files){
    console.log("Aplicando",file);
    await pool.query(fs.readFileSync(path.join(dir,file),"utf8"));
  }
  console.log("Migrações concluídas.");
  await pool.end();
}
main().catch(e=>{console.error(e);process.exit(1)});
