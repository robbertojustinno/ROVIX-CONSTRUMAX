"use client";
import { useEffect,useState } from "react";
export default function DeliveryClient(){
 const[rows,setRows]=useState<any[]>([]),[sales,setSales]=useState<any[]>([]),[customers,setCustomers]=useState<any[]>([]),[err,setErr]=useState("");
 async function load(){
  const[d,s,c]=await Promise.all([fetch("/api/deliveries"),fetch("/api/sales"),fetch("/api/customers")]);
  const dd=await d.json();if(d.ok)setRows(dd);else setErr(dd.error);
  setSales(await s.json());setCustomers(await c.json());
 }
 useEffect(()=>{load()},[]);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();const f=new FormData(e.currentTarget);
  const body={sale_id:f.get("sale_id")?Number(f.get("sale_id")):null,customer_id:f.get("customer_id")?Number(f.get("customer_id")):null,address:f.get("address"),scheduled_date:f.get("scheduled_date")||null,driver:f.get("driver"),vehicle:f.get("vehicle"),freight:Number(f.get("freight")||0),status:f.get("status")||"PENDING",notes:f.get("notes")};
  const r=await fetch("/api/deliveries",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  if(r.ok){e.currentTarget.reset();load()}else setErr((await r.json()).error)
 }
 return <><h1>Entregas</h1><div className="card"><form className="form" onSubmit={submit}>
  <select className="input" name="sale_id" title="Lista de vendas"><option value="">Venda (opcional)</option>{sales.map(s=><option key={s.id} value={s.id}>Venda #{s.id} - {s.customer||"Balcão"} - R$ {s.total}</option>)}</select>
  <select className="input" name="customer_id" title="Lista de clientes"><option value="">Cliente (opcional)</option>{customers.map(c=><option key={c.id} value={c.id}>{c.id} - {c.name}</option>)}</select>
  <input className="input" name="address" placeholder="Endereço" required/>
  <input className="input" name="scheduled_date" type="date"/>
  <input className="input" name="driver" placeholder="Motorista"/>
  <input className="input" name="vehicle" placeholder="Veículo"/>
  <input className="input" name="freight" type="number" step="0.01" placeholder="Frete"/>
  <select className="input" name="status"><option value="PENDING">Pendente</option><option value="SCHEDULED">Agendada</option><option value="IN_TRANSIT">Em trânsito</option><option value="DELIVERED">Entregue</option></select>
  <input className="input" name="notes" placeholder="Observação"/>
  <button className="btn">Salvar entrega</button>
 </form>{err&&<p>{err}</p>}</div><br/>
 <div className="card"><table className="table"><thead><tr><th>ID</th><th>Venda</th><th>Endereço</th><th>Data</th><th>Motorista</th><th>Status</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.sale_id||"-"}</td><td>{r.address}</td><td>{String(r.scheduled_date||"")}</td><td>{r.driver||""}</td><td>{r.status}</td></tr>)}</tbody></table></div></>
}