import { tx,query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail,ok } from "@/lib/http";
import { audit } from "@/server/audit";

export async function GET(){
  try{
    await requireUser();
    const r=await query(`SELECT q.*,c.name customer,u.name seller
      FROM quotations q
      LEFT JOIN customers c ON c.id=q.customer_id
      LEFT JOIN users u ON u.id=q.user_id
      ORDER BY q.id DESC LIMIT 300`);
    return ok(r.rows);
  }catch(e){return fail(e)}
}

export async function POST(req:Request){
  try{
    const user=await requireUser(["ADMIN","MANAGER","CASHIER"]);
    const d=await req.json();
    if(!Array.isArray(d.items)||!d.items.length) throw new Error("Orçamento sem itens");
    const result=await tx(async c=>{
      let subtotal=0;
      for(const i of d.items) subtotal+=Number(i.quantity)*Number(i.unit_price);
      const discount=Number(d.discount??0);
      const total=subtotal-discount;
      if(total<0) throw new Error("Total inválido");
      const q=await c.query(`INSERT INTO quotations(customer_id,subtotal,discount,total,valid_until,notes,user_id)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [d.customer_id??null,subtotal,discount,total,d.valid_until??null,d.notes??null,user.id]);
      for(const i of d.items){
        await c.query(`INSERT INTO quotation_items(quotation_id,product_id,warehouse_id,quantity,unit_price,subtotal)
          VALUES($1,$2,$3,$4,$5,$6)`,
          [q.rows[0].id,i.product_id,i.warehouse_id,i.quantity,i.unit_price,Number(i.quantity)*Number(i.unit_price)]);
      }
      await audit(user.id,"QUOTE_CREATED","quotations",q.rows[0].id,d,c);
      return q.rows[0];
    });
    return ok(result,201);
  }catch(e){return fail(e)}
}
