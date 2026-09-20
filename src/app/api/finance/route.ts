import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail,ok } from "@/lib/http";
import { audit } from "@/server/audit";

export async function GET(){
  try{
    await requireUser(["ADMIN","MANAGER","CASHIER"]);
    const [r,p]=await Promise.all([
      query(`SELECT r.*,c.name party FROM receivables r LEFT JOIN customers c ON c.id=r.customer_id ORDER BY due_date`),
      query(`SELECT p.*,s.name party FROM payables p LEFT JOIN suppliers s ON s.id=p.supplier_id ORDER BY due_date`)
    ]);
    return ok({receivables:r.rows,payables:p.rows});
  }catch(e){return fail(e)}
}

export async function POST(req:Request){
  try{
    const user=await requireUser(["ADMIN","MANAGER","CASHIER"]);
    const d=await req.json();
    if(!["receivable","payable"].includes(d.kind)) throw new Error("Tipo financeiro inválido");
    const table=d.kind==="receivable"?"receivables":"payables";
    const r=await query(`UPDATE ${table} SET status='PAID',paid_at=now() WHERE id=$1 AND status<>'PAID' RETURNING *`,[d.id]);
    if(!r.rows[0]) throw new Error("Título não encontrado ou já baixado");
    await audit(user.id,"FINANCE_SETTLE",table,d.id,{kind:d.kind});
    return ok(r.rows[0]);
  }catch(e){return fail(e)}
}
