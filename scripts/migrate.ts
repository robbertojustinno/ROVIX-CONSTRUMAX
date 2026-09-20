import fs from "node:fs";
import path from "node:path";
import { pool } from "../src/lib/db";

async function main(){
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
