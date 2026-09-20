import { query,tx } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail,ok } from "@/lib/http";
import { audit } from "@/server/audit";

export async function GET(req:Request){
  try{
    await requireUser();
    const url=new URL(req.url);
    const productId=url.searchParams.get("product_id");
    const warehouseId=url.searchParams.get("warehouse_id");
    const history=url.searchParams.get("history")==="1";
    if(history && productId && warehouseId){
      const r=await query(`SELECT sm.id,sm.movement_type,sm.quantity,sm.unit_cost,sm.notes,sm.created_at,u.name user_name
        FROM stock_movements sm
        LEFT JOIN users u ON u.id=sm.user_id
        WHERE sm.product_id=$1 AND sm.warehouse_id=$2
        ORDER BY sm.id DESC LIMIT 200`,[Number(productId),Number(warehouseId)]);
      return ok(r.rows);
    }
    const r=await query(`SELECT p.id,p.sku,p.name,p.unit,w.id warehouse_id,w.name warehouse,
      COALESCE(s.quantity,0) quantity,p.min_stock
      FROM products p
      CROSS JOIN warehouses w
      LEFT JOIN stock_balances s ON s.product_id=p.id AND s.warehouse_id=w.id
      WHERE p.active=true AND w.active=true
      ORDER BY p.name,w.name`);
    return ok(r.rows);
  }catch(e){return fail(e)}
}

export async function POST(req:Request){
  try{
    const user=await requireUser(["ADMIN","MANAGER","STOCK"]);
    const d=await req.json();
    if(!d.notes || !String(d.notes).trim()) throw new Error("Informe o motivo do ajuste");
    if(d.new_quantity===undefined || d.new_quantity===null || d.new_quantity==="") throw new Error("Informe o novo saldo");
    const newQuantity=Number(d.new_quantity);
    if(!Number.isFinite(newQuantity) || newQuantity<0) throw new Error("Novo saldo inválido");
    const out=await tx(async c=>{
      const currentR=await c.query(`SELECT quantity FROM stock_balances
        WHERE product_id=$1 AND warehouse_id=$2 FOR UPDATE`,[d.product_id,d.warehouse_id]);
      const current=Number(currentR.rows[0]?.quantity??0);
      const diff=Number((newQuantity-current).toFixed(3));
      if(diff===0) throw new Error("O novo saldo é igual ao saldo atual");
      await c.query(`INSERT INTO stock_balances(product_id,warehouse_id,quantity)
        VALUES($1,$2,$3)
        ON CONFLICT(product_id,warehouse_id) DO UPDATE SET quantity=EXCLUDED.quantity`,
        [d.product_id,d.warehouse_id,newQuantity]);
      const m=await c.query(`INSERT INTO stock_movements(product_id,warehouse_id,movement_type,quantity,notes,user_id)
        VALUES($1,$2,'ADJUSTMENT',$3,$4,$5) RETURNING *`,
        [d.product_id,d.warehouse_id,diff,String(d.notes).trim(),user.id]);
      await audit(user.id,"STOCK_ADJUSTMENT","stock_movements",m.rows[0].id,{
        product_id:d.product_id,warehouse_id:d.warehouse_id,old_quantity:current,new_quantity:newQuantity,difference:diff,notes:d.notes
      },c);
      return {...m.rows[0],old_quantity:current,new_quantity:newQuantity,difference:diff};
    });
    return ok(out,201);
  }catch(e){return fail(e)}
}
