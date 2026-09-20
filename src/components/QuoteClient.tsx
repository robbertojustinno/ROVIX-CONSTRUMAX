"use client";
import { useEffect,useMemo,useState } from "react";
import { useRouter } from "next/navigation";

type P={id:number;sku:string;barcode?:string;name:string;price:string|number};
type C={id:number;name:string};
type W={id:number;name:string};
type Item={product_id:number;name:string;warehouse_id:number;quantity:number;unit_price:number};

export default function QuoteClient(){
  const router=useRouter();
  const[products,setProducts]=useState<P[]>([]),[customers,setCustomers]=useState<C[]>([]),[warehouses,setWarehouses]=useState<W[]>([]);
  const[quotes,setQuotes]=useState<any[]>([]),[cart,setCart]=useState<Item[]>([]),[search,setSearch]=useState(""),[err,setErr]=useState("");
  const[customerId,setCustomerId]=useState(""),[warehouseId,setWarehouseId]=useState("");
  async function load(){const[q,c,w]=await Promise.all([fetch("/api/quotes"),fetch("/api/customers"),fetch("/api/warehouses")]);setQuotes(await q.json());setCustomers(await c.json());setWarehouses(await w.json())}
  useEffect(()=>{load()},[]);
  useEffect(()=>{const t=setTimeout(()=>{fetch("/api/products?q="+encodeURIComponent(search)).then(r=>r.json()).then(setProducts)},200);return()=>clearTimeout(t)},[search]);
  const total=useMemo(()=>cart.reduce((s,i)=>s+i.quantity*i.unit_price,0),[cart]);
  function add(p:P){if(!warehouseId){setErr("Selecione o depósito.");return}setCart(v=>{const x=v.find(i=>i.product_id===p.id&&i.warehouse_id===Number(warehouseId));return x?v.map(i=>i===x?{...i,quantity:i.quantity+1}:i):[...v,{product_id:p.id,name:p.name,warehouse_id:Number(warehouseId),quantity:1,unit_price:Number(p.price)}]})}
  async function save(){setErr("");const r=await fetch("/api/quotes",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({customer_id:customerId?Number(customerId):null,items:cart})});if(!r.ok){setErr((await r.json()).error);return}setCart([]);load()}
  async function convert(id:number){setErr("");const r=await fetch("/api/quotes/convert",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({quote_id:id,payment_method:"CASH"})});const d=await r.json();if(!r.ok){setErr(d.error);return}router.push("/sales/"+d.id)}
  async function remove(id:number){if(!confirm("Deseja excluir este orçamento?"))return;setErr("");const r=await fetch("/api/quotes?id="+id,{method:"DELETE"});if(!r.ok){setErr((await r.json()).error);return}load()}
  return <><h1>Orçamentos</h1><div className="card"><div className="form">
    <select className="input" title="Selecione o cliente" value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Cliente balcão</option>{customers.map(c=><option key={c.id} value={c.id}>{c.id} - {c.name}</option>)}</select>
    <select className="input" title="Selecione o depósito" value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}><option value="">Selecione o depósito</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.id} - {w.name}</option>)}</select>
    <input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto por nome, SKU ou código de barras"/>
  </div><div>{products.slice(0,8).map(p=><button className="btn" style={{margin:"6px"}} key={p.id} onClick={()=>add(p)}>{p.sku} — {p.name} — R$ {p.price}</button>)}</div>
  <table className="table"><thead><tr><th>Produto</th><th>Qtd.</th><th>Preço</th><th>Subtotal</th></tr></thead><tbody>{cart.map((i,n)=><tr key={n}><td>{i.name}</td><td><input className="input" type="number" step="0.001" value={i.quantity} onChange={e=>setCart(v=>v.map((x,j)=>j===n?{...x,quantity:Number(e.target.value)}:x))}/></td><td>{i.unit_price.toFixed(2)}</td><td>{(i.quantity*i.unit_price).toFixed(2)}</td></tr>)}</tbody></table>
  <p><b>Total: R$ {total.toFixed(2)}</b></p><button className="btn" disabled={!cart.length} onClick={save}>Salvar orçamento</button>{err&&<p>{err}</p>}</div><br/>
  <div className="card"><table className="table"><thead><tr><th>ID</th><th>Cliente</th><th>Total</th><th>Status</th><th>Venda</th><th>Ações</th></tr></thead><tbody>{quotes.map(q=><tr key={q.id}><td>{q.id}</td><td>{q.customer||"Balcão"}</td><td>{q.total}</td><td>{q.status}</td><td>{q.converted_sale_id?<a className="btn" href={"/sales/"+q.converted_sale_id}>Abrir venda #{q.converted_sale_id}</a>:"-"}</td><td>{q.status==="OPEN"&&<><button className="btn" style={{marginRight:6}} onClick={()=>convert(q.id)}>Converter em venda</button><button className="btn" onClick={()=>remove(q.id)}>Excluir</button></>}</td></tr>)}</tbody></table></div></>
}
