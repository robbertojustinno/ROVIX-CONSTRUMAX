import { tx } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail,ok } from "@/lib/http";
import { audit } from "@/server/audit";

export async function POST(req:Request){
  try{
    const user=await requireUser(["ADMIN","MANAGER","CASHIER"]);
    const {quote_id,payment_method="CASH"}=await req.json();
    const result=await tx(async c=>{
      const qr=await c.query(`SELECT * FROM quotations WHERE id=$1 FOR UPDATE`,[quote_id]);
      const q=qr.rows[0];
      if(!q) throw new Error("Orçamento não encontrado");
      if(q.status!=="OPEN") throw new Error("Orçamento não está aberto");
      const items=(await c.query(`SELECT * FROM quotation_items WHERE quotation_id=$1 ORDER BY id`,[quote_id])).rows;
      if(!items.length) throw new Error("Orçamento sem itens");

      const sale=await c.query(`INSERT INTO sales(customer_id,payment_method,subtotal,discount,total,user_id)
        VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
        [q.customer_id,payment_method,q.subtotal,q.discount,q.total,user.id]);

      for(const i of items){
        const bal=await c.query(`SELECT quantity FROM stock_balances
          WHERE product_id=$1 AND warehouse_id=$2 FOR UPDATE`,[i.product_id,i.warehouse_id]);
        if(!bal.rows[0]||Number(bal.rows[0].quantity)<Number(i.quantity))
          throw new Error(`Estoque insuficiente para produto ${i.product_id}`);
        await c.query(`INSERT INTO sale_items(sale_id,product_id,warehouse_id,quantity,unit_price,subtotal)
          VALUES($1,$2,$3,$4,$5,$6)`,[sale.rows[0].id,i.product_id,i.warehouse_id,i.quantity,i.unit_price,i.subtotal]);
        await c.query(`UPDATE stock_balances SET quantity=quantity-$3
          WHERE product_id=$1 AND warehouse_id=$2`,[i.product_id,i.warehouse_id,i.quantity]);
        await c.query(`INSERT INTO stock_movements(product_id,warehouse_id,movement_type,quantity,reference_type,reference_id,user_id)
          VALUES($1,$2,'SALE',$3,'SALE',$4,$5)`,[i.product_id,i.warehouse_id,-Number(i.quantity),sale.rows[0].id,user.id]);
      }

      await c.query(`UPDATE quotations SET status='CONVERTED',converted_sale_id=$2 WHERE id=$1`,[quote_id,sale.rows[0].id]);
      await audit(user.id,"QUOTE_CONVERTED","quotations",quote_id,{sale_id:sale.rows[0].id},c);
      return sale.rows[0];
    });
    return ok(result,201);
  }catch(e){return fail(e)}
}
