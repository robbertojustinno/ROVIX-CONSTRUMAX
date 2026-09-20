import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail,ok } from "@/lib/http";
import { audit } from "@/server/audit";

export async function GET(req:Request){
  try{
    await requireUser();
    const url=new URL(req.url);
    const q=(url.searchParams.get("q")??"").trim();
    if(q){
      const like=`%${q}%`;
      const r=await query(`SELECT * FROM products
        WHERE active=true AND (name ILIKE $1 OR sku ILIKE $1 OR barcode ILIKE $1)
        ORDER BY name LIMIT 50`,[like]);
      return ok(r.rows);
    }
    return ok((await query("SELECT * FROM products ORDER BY id DESC LIMIT 500")).rows);
  }catch(e){return fail(e)}
}

export async function POST(req:Request){
  try{
    const user=await requireUser(["ADMIN","MANAGER","STOCK"]);
    const data=await req.json();
    const r=await query(`INSERT INTO products(sku,barcode,name,category,brand,unit,ncm,cest,cost,price,min_stock)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [data.sku,data.barcode,data.name,data.category,data.brand,data.unit,data.ncm,data.cest,data.cost,data.price,data.min_stock]);
    await audit(user.id,"CREATE","products",r.rows[0].id,data);
    return ok(r.rows[0],201);
  }catch(e){return fail(e)}
}
