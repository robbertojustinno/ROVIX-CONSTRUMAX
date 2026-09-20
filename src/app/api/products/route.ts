import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail,ok } from "@/lib/http";
import { audit } from "@/server/audit";

export async function GET(req:Request){
  try{
    await requireUser();
    const url=new URL(req.url);
    const q=(url.searchParams.get("q")??"").trim();
    const includeInactive=url.searchParams.get("include_inactive")==="1";
    if(q){
      const like=`%${q}%`;
      const r=await query(`SELECT * FROM products
        WHERE (${includeInactive ? "true" : "active=true"}) AND (name ILIKE $1 OR sku ILIKE $1 OR barcode ILIKE $1)
        ORDER BY name LIMIT 50`,[like]);
      return ok(r.rows);
    }
    const sql=includeInactive
      ?"SELECT * FROM products ORDER BY id DESC LIMIT 500"
      :"SELECT * FROM products WHERE active=true ORDER BY id DESC LIMIT 500";
    return ok((await query(sql)).rows);
  }catch(e){return fail(e)}
}

export async function POST(req:Request){
  try{
    const user=await requireUser(["ADMIN","MANAGER","STOCK"]);
    const d=await req.json();
    const r=await query(`INSERT INTO products(sku,barcode,name,category,brand,unit,ncm,cest,cost,price,min_stock)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [d.sku,d.barcode||null,d.name,d.category||null,d.brand||null,d.unit,d.ncm||null,d.cest||null,Number(d.cost||0),Number(d.price||0),Number(d.min_stock||0)]);
    await audit(user.id,"PRODUCT_CREATE","products",r.rows[0].id,d);
    return ok(r.rows[0],201);
  }catch(e){return fail(e)}
}

export async function PUT(req:Request){
  try{
    const user=await requireUser(["ADMIN","MANAGER","STOCK"]);
    const d=await req.json();
    if(!d.id) throw new Error("Produto inválido");
    const r=await query(`UPDATE products SET sku=$2,barcode=$3,name=$4,category=$5,brand=$6,unit=$7,ncm=$8,cest=$9,cost=$10,price=$11,min_stock=$12,active=$13
      WHERE id=$1 RETURNING *`,
      [d.id,d.sku,d.barcode||null,d.name,d.category||null,d.brand||null,d.unit,d.ncm||null,d.cest||null,Number(d.cost||0),Number(d.price||0),Number(d.min_stock||0),d.active!==false]);
    if(!r.rows[0]) throw new Error("Produto não encontrado");
    await audit(user.id,"PRODUCT_UPDATE","products",d.id,d);
    return ok(r.rows[0]);
  }catch(e){return fail(e)}
}
