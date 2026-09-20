import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";

loadEnvConfig(process.cwd());

async function main(){
  const { pool } = await import("../src/lib/db");
  const hash=await bcrypt.hash("Rovix@123",12);
  await pool.query(`INSERT INTO users(name,email,password_hash,role) VALUES('Administrador Rovix','admin@rovix.local',$1,'ADMIN') ON CONFLICT(email) DO NOTHING`,[hash]);
  await pool.query(`INSERT INTO warehouses(name,code,address) VALUES('Depósito Principal','DP01','Loja principal') ON CONFLICT(code) DO NOTHING`);
  const units=[['Cimento CP II 50kg','CIM-001','SACO',32.90,39.90],['Areia lavada m³','ARE-001','M3',110,150],['Tubo PVC 25mm 6m','PVC-025','BARRA',18.5,27.9]];
  for(const [name,sku,unit,cost,price] of units)
    await pool.query(`INSERT INTO products(name,sku,unit,cost,price,min_stock) VALUES($1,$2,$3,$4,$5,5) ON CONFLICT(sku) DO NOTHING`,[name,sku,unit,cost,price]);
  console.log("Seed concluído: admin@rovix.local / Rovix@123");
  await pool.end();
}
main().catch(e=>{console.error(e);process.exit(1)});
