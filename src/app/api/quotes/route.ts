import { tx,query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail,ok } from "@/lib/http";
import { audit } from "@/server/audit";

export async function GET(req:Request){
  try{
    await requireUser();
    const id=Number(new URL(req.url).searchParams.get("id")||0);
    if(id){
      const q=await query(`SELECT q.*,c.name customer,c.document customer_document,c.phone customer_phone,c.email customer_email,c.address customer_address,u.name seller
        FROM quotations q
        LEFT JOIN customers c ON c.id=q.customer_id
        LEFT JOIN users u ON u.id=q.user_id
        WHERE q.id=$1`,[id]);
      if(!q.rows[0]) throw new Error("Orçamento não encontrado");
      const items=await query(`SELECT qi.*,p.sku,p.name product,p.unit,w.name warehouse
        FROM quotation_items qi
        JOIN products p ON p.id=qi.product_id
        JOIN warehouses w ON w.id=qi.warehouse_id
        WHERE qi.quotation_id=$1 ORDER BY qi.id`,[id]);
      return ok({...q.rows[0],items:items.rows});
    }
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

export async function PUT(req:Request){
  try{
    const user=await requireUser(["ADMIN","MANAGER","CASHIER"]);
    const d=await req.json();
    const id=Number(d.id);
    if(!id) throw new Error("Orçamento inválido");
    if(!Array.isArray(d.items)||!d.items.length) throw new Error("Orçamento sem itens");
    const result=await tx(async c=>{
      const current=await c.query("SELECT id,status FROM quotations WHERE id=$1 FOR UPDATE",[id]);
      if(!current.rows[0]) throw new Error("Orçamento não encontrado");
      if(current.rows[0].status!=="OPEN") throw new Error("Somente orçamentos abertos podem ser editados");
      let subtotal=0;
      for(const i of d.items) subtotal+=Number(i.quantity)*Number(i.unit_price);
      const discount=Number(d.discount??0);
      const total=subtotal-discount;
      if(total<0) throw new Error("Total inválido");
      await c.query(`UPDATE quotations SET customer_id=$2,subtotal=$3,discount=$4,total=$5,valid_until=$6,notes=$7
        WHERE id=$1`,[id,d.customer_id??null,subtotal,discount,total,d.valid_until??null,d.notes??null]);
      await c.query("DELETE FROM quotation_items WHERE quotation_id=$1",[id]);
      for(const i of d.items){
        await c.query(`INSERT INTO quotation_items(quotation_id,product_id,warehouse_id,quantity,unit_price,subtotal)
          VALUES($1,$2,$3,$4,$5,$6)`,
          [id,i.product_id,i.warehouse_id,i.quantity,i.unit_price,Number(i.quantity)*Number(i.unit_price)]);
      }
      await audit(user.id,"QUOTE_UPDATED","quotations",id,d,c);
      return (await c.query("SELECT * FROM quotations WHERE id=$1",[id])).rows[0];
    });
    return ok(result);
  }catch(e){return fail(e)}
}

export async function DELETE(req:Request){
  try{
    const user=await requireUser(["ADMIN","MANAGER","CASHIER"]);
    const id=Number(new URL(req.url).searchParams.get("id"));
    if(!id) throw new Error("Orçamento inválido");
    const result=await tx(async c=>{
      const current=await c.query("SELECT id,status FROM quotations WHERE id=$1 FOR UPDATE",[id]);
      if(!current.rows[0]) throw new Error("Orçamento não encontrado");
      if(current.rows[0].status!=="OPEN") throw new Error("Somente orçamentos abertos podem ser excluídos");
      await c.query("DELETE FROM quotation_items WHERE quotation_id=$1",[id]);
      await c.query("DELETE FROM quotations WHERE id=$1",[id]);
      await audit(user.id,"QUOTE_DELETED","quotations",id,{},c);
      return {ok:true};
    });
    return ok(result);
  }catch(e){return fail(e)}
}
