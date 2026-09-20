import { tx,query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail,ok } from "@/lib/http";
import { audit } from "@/server/audit";

export async function GET(){
  try{
    await requireUser();
    const r=await query(`SELECT t.*,wf.name from_warehouse,wt.name to_warehouse
      FROM stock_transfers t
      JOIN warehouses wf ON wf.id=t.from_warehouse_id
      JOIN warehouses wt ON wt.id=t.to_warehouse_id
      ORDER BY t.id DESC LIMIT 300`);
    return ok(r.rows);
  }catch(e){return fail(e)}
}

export async function POST(req:Request){
  try{
    const user=await requireUser(["ADMIN","MANAGER","STOCK"]);
    const d=await req.json();
    if(Number(d.from_warehouse_id)===Number(d.to_warehouse_id)) throw new Error("Depósitos de origem e destino devem ser diferentes");
    if(!Array.isArray(d.items)||!d.items.length) throw new Error("Transferência sem itens");
    const result=await tx(async c=>{
      const t=await c.query(`INSERT INTO stock_transfers(from_warehouse_id,to_warehouse_id,notes,user_id)
        VALUES($1,$2,$3,$4) RETURNING *`,[d.from_warehouse_id,d.to_warehouse_id,d.notes??null,user.id]);
      for(const i of d.items){
        const bal=await c.query(`SELECT quantity FROM stock_balances WHERE product_id=$1 AND warehouse_id=$2 FOR UPDATE`,[i.product_id,d.from_warehouse_id]);
        if(!bal.rows[0]||Number(bal.rows[0].quantity)<Number(i.quantity)) throw new Error(`Estoque insuficiente para produto ${i.product_id}`);
        await c.query(`UPDATE stock_balances SET quantity=quantity-$3 WHERE product_id=$1 AND warehouse_id=$2`,[i.product_id,d.from_warehouse_id,i.quantity]);
        await c.query(`INSERT INTO stock_balances(product_id,warehouse_id,quantity) VALUES($1,$2,$3)
          ON CONFLICT(product_id,warehouse_id) DO UPDATE SET quantity=stock_balances.quantity+$3`,[i.product_id,d.to_warehouse_id,i.quantity]);
        await c.query(`INSERT INTO stock_transfer_items(transfer_id,product_id,quantity) VALUES($1,$2,$3)`,[t.rows[0].id,i.product_id,i.quantity]);
        await c.query(`INSERT INTO stock_movements(product_id,warehouse_id,movement_type,quantity,reference_type,reference_id,user_id)
          VALUES($1,$2,'TRANSFER_OUT',$3,'TRANSFER',$4,$5)`,[i.product_id,d.from_warehouse_id,-Number(i.quantity),t.rows[0].id,user.id]);
        await c.query(`INSERT INTO stock_movements(product_id,warehouse_id,movement_type,quantity,reference_type,reference_id,user_id)
          VALUES($1,$2,'TRANSFER_IN',$3,'TRANSFER',$4,$5)`,[i.product_id,d.to_warehouse_id,Number(i.quantity),t.rows[0].id,user.id]);
      }
      await audit(user.id,"STOCK_TRANSFER","stock_transfers",t.rows[0].id,d,c);
      return t.rows[0];
    });
    return ok(result,201);
  }catch(e){return fail(e)}
}
