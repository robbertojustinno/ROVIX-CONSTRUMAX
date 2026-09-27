import { tx } from "@/lib/db";
import { requireMobileDevice } from "@/lib/mobile-auth";
import { ok,fail } from "@/lib/http";
import { audit } from "@/server/audit";

export async function POST(req:Request){
 try{
  const device=await requireMobileDevice();
  const d=await req.json();
  if(!d.product_id||!d.warehouse_id)throw new Error("Selecione produto e depósito");
  if(!String(d.notes||"").trim())throw new Error("Informe o motivo do ajuste");
  const newQuantity=Number(d.new_quantity);
  if(!Number.isFinite(newQuantity)||newQuantity<0)throw new Error("Novo saldo inválido");
  const out=await tx(async c=>{
    const cur=await c.query("SELECT quantity FROM stock_balances WHERE product_id=$1 AND warehouse_id=$2 FOR UPDATE",[d.product_id,d.warehouse_id]);
    const current=Number(cur.rows[0]?.quantity??0),diff=Number((newQuantity-current).toFixed(3));
    if(diff===0)throw new Error("O novo saldo é igual ao saldo atual");
    await c.query(`INSERT INTO stock_balances(product_id,warehouse_id,quantity) VALUES($1,$2,$3)
      ON CONFLICT(product_id,warehouse_id) DO UPDATE SET quantity=EXCLUDED.quantity`,[d.product_id,d.warehouse_id,newQuantity]);
    const m=await c.query(`INSERT INTO stock_movements(product_id,warehouse_id,movement_type,quantity,notes,user_id)
      VALUES($1,$2,'ADJUSTMENT',$3,$4,NULL) RETURNING *`,[d.product_id,d.warehouse_id,diff,String(d.notes).trim()]);
    await audit(null,"MOBILE_STOCK_ADJUSTMENT","stock_movements",m.rows[0].id,{device_id:device.device_id,device_name:device.name,old_quantity:current,new_quantity:newQuantity,difference:diff,notes:d.notes},c);
    return {...m.rows[0],old_quantity:current,new_quantity:newQuantity,difference:diff};
  });
  return ok(out,201);
 }catch(e){return fail(e)}
}
