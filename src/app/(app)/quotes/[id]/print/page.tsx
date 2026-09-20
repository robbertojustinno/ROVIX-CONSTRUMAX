import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";

export default async function QuotePrint({params}:{params:Promise<{id:string}>}){
  await requireUser();
  const {id}=await params;
  const qR=await query<any>(`SELECT q.*,c.name customer,c.document customer_document,c.phone customer_phone,c.email customer_email,c.address customer_address,u.name seller
    FROM quotations q
    LEFT JOIN customers c ON c.id=q.customer_id
    LEFT JOIN users u ON u.id=q.user_id
    WHERE q.id=$1`,[Number(id)]);
  const q=qR.rows[0];
  if(!q) notFound();

  const items=(await query<any>(`SELECT qi.*,p.sku,p.name product,p.unit,w.name warehouse
    FROM quotation_items qi
    JOIN products p ON p.id=qi.product_id
    JOIN warehouses w ON w.id=qi.warehouse_id
    WHERE qi.quotation_id=$1 ORDER BY qi.id`,[q.id])).rows;

  return <div className="print-page">
    <div className="no-print" style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
      <a className="btn" href="/quotes">Voltar</a>
      <PrintButton/>
    </div>

    <div className="print-header">
      <div>
        <h1 style={{margin:0}}>ROVIX CONSTRUMAX</h1>
        <div>Orçamento de materiais</div>
      </div>
      <div style={{textAlign:"right"}}>
        <h2 style={{margin:0}}>ORÇAMENTO #{q.id}</h2>
        <div>Data: {new Date(q.created_at).toLocaleDateString("pt-BR")}</div>
        <div>Validade: {q.valid_until?new Date(q.valid_until).toLocaleDateString("pt-BR",{timeZone:"UTC"}):"Não informada"}</div>
      </div>
    </div>

    <div className="print-box">
      <h3>Cliente</h3>
      <div><b>Nome:</b> {q.customer||"Cliente balcão"}</div>
      {q.customer_document&&<div><b>Documento:</b> {q.customer_document}</div>}
      {q.customer_phone&&<div><b>Telefone:</b> {q.customer_phone}</div>}
      {q.customer_email&&<div><b>E-mail:</b> {q.customer_email}</div>}
      {q.customer_address&&<div><b>Endereço:</b> {q.customer_address}</div>}
    </div>

    <table className="table print-table">
      <thead><tr><th>SKU</th><th>Produto</th><th>Un.</th><th>Qtd.</th><th>Preço unit.</th><th>Subtotal</th></tr></thead>
      <tbody>{items.map((i:any)=><tr key={i.id}>
        <td>{i.sku}</td><td>{i.product}</td><td>{i.unit}</td><td>{Number(i.quantity).toFixed(3)}</td><td>R$ {Number(i.unit_price).toFixed(2)}</td><td>R$ {Number(i.subtotal).toFixed(2)}</td>
      </tr>)}</tbody>
    </table>

    <div className="print-totals">
      <div>Subtotal: <b>R$ {Number(q.subtotal).toFixed(2)}</b></div>
      <div>Desconto: <b>R$ {Number(q.discount).toFixed(2)}</b></div>
      <div className="grand-total">Total: <b>R$ {Number(q.total).toFixed(2)}</b></div>
    </div>

    {q.notes&&<div className="print-box"><h3>Observações</h3><div>{q.notes}</div></div>}

    <div className="print-footer">
      <div>Vendedor: {q.seller||"-"}</div>
      <div>Status: {q.status}</div>
    </div>
  </div>
}