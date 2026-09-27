import { query } from "@/lib/db";
import { requireMobileDevice } from "@/lib/mobile-auth";
import { ok,fail } from "@/lib/http";
import { audit } from "@/server/audit";

export async function GET(req:Request){
 try{
  await requireMobileDevice();
  const u=new URL(req.url),q=(u.searchParams.get("q")||"").trim();
  if(!q)return ok([]);
  const like="%"+q+"%";
  const r=await query("SELECT id,sku,barcode,name,category,brand,unit,cost,price,min_stock FROM products WHERE active=true AND (name ILIKE $1 OR sku ILIKE $1 OR barcode ILIKE $1) ORDER BY name LIMIT 50",[like]);
  return ok(r.rows);
 }catch(e){return fail(e)}
}

export async function POST(req:Request){
 try{
  const device=await requireMobileDevice();
  const d=await req.json();
  if(!String(d.sku||"").trim()||!String(d.name||"").trim()||!String(d.unit||"").trim())throw new Error("Informe SKU, descrição e unidade");
  const r=await query(`INSERT INTO products(sku,barcode,name,category,brand,unit,ncm,cest,cost,price,min_stock)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,[
    String(d.sku).trim(),d.barcode||null,String(d.name).trim(),d.category||null,d.brand||null,String(d.unit).trim(),
    d.ncm||null,d.cest||null,Number(d.cost||0),Number(d.price||0),Number(d.min_stock||0)
  ]);
  await audit(null,"MOBILE_PRODUCT_CREATE","products",r.rows[0].id,{device_id:device.device_id,device_name:device.name});
  return ok(r.rows[0],201);
 }catch(e){return fail(e)}
}
