import Link from "next/link";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function SaleDetail({params}:{params:Promise<{id:string}>}){
  await requireUser();
  const {id}=await params;
  const saleR=await query<any>(`SELECT s.*,c.name customer,u.name seller
    FROM sales s
    LEFT JOIN customers c ON c.id=s.customer_id
    LEFT JOIN users u ON u.id=s.user_id
    WHERE s.id=$1`,[Number(id)]);
  const sale=saleR.rows[0];
  if(!sale) notFound();
  const items=(await query<any>(`SELECT si.*,p.sku,p.name product,w.name warehouse
    FROM sale_items si
    JOIN products p ON p.id=si.product_id
    JOIN warehouses w ON w.id=si.warehouse_id
    WHERE si.sale_id=$1 ORDER BY si.id`,[sale.id])).rows;
  return <><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h1>Venda #{sale.id}</h1><Link className="btn" href="/sales">Voltar para vendas</Link></div>
  <div className="card"><div className="grid">
   <div><b>Cliente</b><p>{sale.customer||"Balcão"}</p></div>
   <div><b>Pagamento</b><p>{sale.payment_method}</p></div>
   <div><b>Vendedor</b><p>{sale.seller}</p></div>
   <div><b>Status</b><p>{sale.status}</p></div>
  </div>
  <p><b>Subtotal:</b> R$ {Number(sale.subtotal).toFixed(2)} &nbsp; <b>Desconto:</b> R$ {Number(sale.discount).toFixed(2)} &nbsp; <b>Total:</b> R$ {Number(sale.total).toFixed(2)}</p></div><br/>
  <div className="card"><h3>Itens</h3><table className="table"><thead><tr><th>SKU</th><th>Produto</th><th>Depósito</th><th>Qtd.</th><th>Preço</th><th>Subtotal</th></tr></thead><tbody>{items.map((i:any)=><tr key={i.id}><td>{i.sku}</td><td>{i.product}</td><td>{i.warehouse}</td><td>{i.quantity}</td><td>{Number(i.unit_price).toFixed(2)}</td><td>{Number(i.subtotal).toFixed(2)}</td></tr>)}</tbody></table></div></>
}