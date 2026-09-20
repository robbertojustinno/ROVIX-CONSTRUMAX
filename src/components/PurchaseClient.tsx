"use client";
import { useEffect,useState } from "react";
export default function PurchaseClient(){
 const[rows,setRows]=useState<any[]>([]),[suppliers,setSuppliers]=useState<any[]>([]),[warehouses,setWarehouses]=useState<any[]>([]),[products,setProducts]=useState<any[]>([]),[err,setErr]=useState("");
 async function load(){
  const[r,s,w,p]=await Promise.all([fetch("/api/purchases"),fetch("/api/suppliers"),fetch("/api/warehouses"),fetch("/api/products")]);
  const rd=await r.json();if(r.ok)setRows(rd);else setErr(rd.error);
  setSuppliers(await s.json());setWarehouses(await w.json());setProducts(await p.json());
 }
 useEffect(()=>{load()},[]);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();const f=new FormData(e.currentTarget);
  const body={supplier_id:Number(f.get("supplier_id")),warehouse_id:Number(f.get("warehouse_id")),invoice_number:f.get("invoice_number"),due_date:f.get("due_date")||null,items:[{product_id:Number(f.get("product_id")),quantity:Number(f.get("quantity")),unit_cost:Number(f.get("unit_cost"))}]};
  const r=await fetch("/api/purchases",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  if(r.ok){e.currentTarget.reset();load()}else setErr((await r.json()).error)
 }
 return <><h1>Compras / Recebimento</h1><div className="card"><p className="muted">Selecione fornecedor, depósito e produto pelas listas abaixo.</p>
 <form className="form" onSubmit={submit}>
  <select className="input" name="supplier_id" title="Lista de fornecedores" required><option value="">Selecione o fornecedor</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.id} - {s.name}</option>)}</select>
  <select className="input" name="warehouse_id" title="Lista de depósitos" required><option value="">Selecione o depósito</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.id} - {w.name}</option>)}</select>
  <input className="input" name="invoice_number" placeholder="NF / Documento"/>
  <select className="input" name="product_id" title="Lista de produtos" required><option value="">Selecione o produto</option>{products.map(p=><option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}</select>
  <input className="input" name="quantity" type="number" step="0.001" placeholder="Quantidade" required/>
  <input className="input" name="unit_cost" type="number" step="0.01" placeholder="Custo unitário" required/>
  <input className="input" name="due_date" type="date"/>
  <button className="btn">Receber compra</button>
 </form>{err&&<p>{err}</p>}</div><br/>
 <div className="card"><table className="table"><thead><tr><th>ID</th><th>Fornecedor</th><th>Depósito</th><th>NF</th><th>Total</th><th>Status</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.supplier}</td><td>{r.warehouse}</td><td>{r.invoice_number}</td><td>{r.total}</td><td>{r.status}</td></tr>)}</tbody></table></div></>
}