"use client";
import { useEffect,useState } from "react";
export default function TransferClient(){
 const[products,setProducts]=useState<any[]>([]),[warehouses,setWarehouses]=useState<any[]>([]),[rows,setRows]=useState<any[]>([]),[err,setErr]=useState("");
 const[from,setFrom]=useState(""),[to,setTo]=useState(""),[product,setProduct]=useState(""),[qty,setQty]=useState("1");
 async function load(){const[p,w,t]=await Promise.all([fetch("/api/products"),fetch("/api/warehouses"),fetch("/api/transfers")]);setProducts(await p.json());setWarehouses(await w.json());setRows(await t.json())}
 useEffect(()=>{load()},[]);
 async function submit(){setErr("");const r=await fetch("/api/transfers",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({from_warehouse_id:Number(from),to_warehouse_id:Number(to),items:[{product_id:Number(product),quantity:Number(qty)}]})});if(!r.ok){setErr((await r.json()).error);return}load()}
 return <><h1>Transferências entre depósitos</h1><div className="card"><div className="form">
  <select className="input" value={from} onChange={e=>setFrom(e.target.value)}><option value="">Origem</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select>
  <select className="input" value={to} onChange={e=>setTo(e.target.value)}><option value="">Destino</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select>
  <select className="input" value={product} onChange={e=>setProduct(e.target.value)}><option value="">Produto</option>{products.map(p=><option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}</select>
  <input className="input" type="number" step="0.001" value={qty} onChange={e=>setQty(e.target.value)} placeholder="Quantidade"/>
  <button className="btn" onClick={submit}>Transferir</button>
 </div>{err&&<p>{err}</p>}</div><br/><div className="card"><table className="table"><thead><tr><th>ID</th><th>Origem</th><th>Destino</th><th>Status</th><th>Data</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.from_warehouse}</td><td>{r.to_warehouse}</td><td>{r.status}</td><td>{String(r.created_at)}</td></tr>)}</tbody></table></div></>
}
