"use client";
import { useEffect,useState } from "react";
export default function StockClient(){
 const[rows,setRows]=useState<any[]>([]),[products,setProducts]=useState<any[]>([]),[warehouses,setWarehouses]=useState<any[]>([]),[err,setErr]=useState("");
 async function load(){const[r,p,w]=await Promise.all([fetch("/api/stock"),fetch("/api/products"),fetch("/api/warehouses")]);const d=await r.json();if(r.ok)setRows(d);else setErr(d.error);setProducts(await p.json());setWarehouses(await w.json())}
 useEffect(()=>{load()},[]);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const body={product_id:Number(f.get("product_id")),warehouse_id:Number(f.get("warehouse_id")),quantity:Number(f.get("quantity")),movement_type:"ADJUSTMENT",notes:f.get("notes")};const r=await fetch("/api/stock",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});if(r.ok){e.currentTarget.reset();load()}else setErr((await r.json()).error)}
 return <><h1>Estoque</h1><div className="card"><form className="form" onSubmit={submit}>
 <select className="input" name="product_id" title="Lista de produtos" required><option value="">Selecione o produto</option>{products.map(p=><option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}</select>
 <select className="input" name="warehouse_id" title="Lista de depósitos" required><option value="">Selecione o depósito</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.id} - {w.name}</option>)}</select>
 <input className="input" name="quantity" type="number" step="0.001" placeholder="Ajuste (+/-)" required/>
 <input className="input" name="notes" placeholder="Motivo"/>
 <button className="btn">Lançar ajuste</button></form>{err&&<p>{err}</p>}</div><br/>
 <div className="card"><table className="table"><thead><tr><th>SKU</th><th>Produto</th><th>Un.</th><th>Depósito</th><th>Saldo</th><th>Mínimo</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td>{r.sku}</td><td>{r.name}</td><td>{r.unit}</td><td>{r.warehouse}</td><td>{r.quantity}</td><td>{r.min_stock}</td></tr>)}</tbody></table></div></>
}