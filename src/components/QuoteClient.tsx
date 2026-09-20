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
  const[customerId,setCustomerId]=useState(""),[warehouseId,setWarehouseId]=useState(""),[discount,setDiscount]=useState("0"),[validUntil,setValidUntil]=useState(""),[notes,setNotes]=useState("");
  const[editingId,setEditingId]=useState<number|null>(null);

  async function load(){
    const[q,c,w]=await Promise.all([fetch("/api/quotes"),fetch("/api/customers"),fetch("/api/warehouses")]);
    setQuotes(await q.json());setCustomers(await c.json());setWarehouses(await w.json());
  }
  useEffect(()=>{load()},[]);
  useEffect(()=>{const t=setTimeout(()=>{fetch("/api/products?q="+encodeURIComponent(search)).then(r=>r.json()).then(setProducts)},200);return()=>clearTimeout(t)},[search]);

  const subtotal=useMemo(()=>cart.reduce((s,i)=>s+i.quantity*i.unit_price,0),[cart]);
  const total=Math.max(0,subtotal-Number(discount||0));

  function resetForm(){setCart([]);setCustomerId("");setWarehouseId("");setDiscount("0");setValidUntil("");setNotes("");setEditingId(null);setErr("");}

  function add(p:P){
    if(!warehouseId){setErr("Selecione o depósito.");return}
    setCart(v=>{const x=v.find(i=>i.product_id===p.id&&i.warehouse_id===Number(warehouseId));
      return x?v.map(i=>i===x?{...i,quantity:i.quantity+1}:i):[...v,{product_id:p.id,name:p.name,warehouse_id:Number(warehouseId),quantity:1,unit_price:Number(p.price)}]})
  }

  async function save(){
    setErr("");
    const body={id:editingId,customer_id:customerId?Number(customerId):null,discount:Number(discount||0),valid_until:validUntil||null,notes:notes||null,items:cart};
    const r=await fetch("/api/quotes",{method:editingId?"PUT":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    if(!r.ok){setErr((await r.json()).error);return}
    resetForm();load();
  }

  async function edit(id:number){
    setErr("");
    const r=await fetch("/api/quotes?id="+id);
    const d=await r.json();
    if(!r.ok){setErr(d.error);return}
    if(d.status!=="OPEN"){setErr("Somente orçamentos abertos podem ser editados");return}
    setEditingId(d.id);
    setCustomerId(d.customer_id?String(d.customer_id):"");
    setDiscount(String(d.discount??0));
    setValidUntil(d.valid_until?String(d.valid_until).slice(0,10):"");
    setNotes(d.notes??"");
    const items=(d.items??[]).map((i:any)=>({product_id:i.product_id,name:i.product,warehouse_id:i.warehouse_id,quantity:Number(i.quantity),unit_price:Number(i.unit_price)}));
    setCart(items);
    if(items[0])setWarehouseId(String(items[0].warehouse_id));
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function convert(id:number){setErr("");const r=await fetch("/api/quotes/convert",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({quote_id:id,payment_method:"CASH"})});const d=await r.json();if(!r.ok){setErr(d.error);return}router.push("/sales/"+d.id)}
  async function remove(id:number){if(!confirm("Deseja excluir este orçamento?"))return;setErr("");const r=await fetch("/api/quotes?id="+id,{method:"DELETE"});if(!r.ok){setErr((await r.json()).error);return}load()}

  return <><h1>Orçamentos</h1>
  <div className="card">
    {editingId&&<p><b>Editando orçamento #{editingId}</b></p>}
    <div className="form">
      <select className="input" title="Selecione o cliente" value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Cliente balcão</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select className="input" title="Selecione o depósito" value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}><option value="">Selecione o depósito</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select>
      <input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto por nome, SKU ou código de barras"/>
      <input className="input" type="number" step="0.01" min="0" value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="Desconto"/>
      <input className="input" type="date" value={validUntil} onChange={e=>setValidUntil(e.target.value)} title="Validade do orçamento"/>
      <input className="input" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Observações"/>
    </div>
    <div>{products.slice(0,8).map(p=><button className="btn" style={{margin:"6px"}} key={p.id} onClick={()=>add(p)}>{p.sku} — {p.name} — R$ {Number(p.price).toFixed(2)}</button>)}</div>
    <table className="table"><thead><tr><th>Produto</th><th>Qtd.</th><th>Preço</th><th>Subtotal</th><th></th></tr></thead><tbody>{cart.map((i,n)=><tr key={n}>
      <td>{i.name}</td>
      <td><input className="input" type="number" min="0.001" step="0.001" value={i.quantity} onChange={e=>setCart(v=>v.map((x,j)=>j===n?{...x,quantity:Number(e.target.value)}:x))}/></td>
      <td><input className="input" type="number" min="0" step="0.01" value={i.unit_price} onChange={e=>setCart(v=>v.map((x,j)=>j===n?{...x,unit_price:Number(e.target.value)}:x))}/></td>
      <td>{(i.quantity*i.unit_price).toFixed(2)}</td>
      <td><button className="btn" onClick={()=>setCart(v=>v.filter((_,j)=>j!==n))}>Remover</button></td>
    </tr>)}</tbody></table>
    <p><b>Subtotal: R$ {subtotal.toFixed(2)} | Desconto: R$ {Number(discount||0).toFixed(2)} | Total: R$ {total.toFixed(2)}</b></p>
    <button className="btn" disabled={!cart.length} onClick={save}>{editingId?"Salvar alterações":"Salvar orçamento"}</button>
    {editingId&&<button className="btn" style={{marginLeft:6}} onClick={resetForm}>Cancelar edição</button>}
    {err&&<p>{err}</p>}
  </div><br/>
  <div className="card"><table className="table"><thead><tr><th>ID</th><th>Cliente</th><th>Total</th><th>Status</th><th>Venda</th><th>Ações</th></tr></thead><tbody>{quotes.map(q=><tr key={q.id}>
    <td>{q.id}</td><td>{q.customer||"Balcão"}</td><td>{q.total}</td><td>{q.status}</td>
    <td>{q.converted_sale_id?<a className="btn" href={"/sales/"+q.converted_sale_id}>Abrir venda #{q.converted_sale_id}</a>:"-"}</td>
    <td>
      <a className="btn" style={{marginRight:6}} href={"/quotes/"+q.id+"/print"} target="_blank">Imprimir</a>
      {q.status==="OPEN"&&<><button className="btn" style={{marginRight:6}} onClick={()=>edit(q.id)}>Editar</button><button className="btn" style={{marginRight:6}} onClick={()=>convert(q.id)}>Converter em venda</button><button className="btn" onClick={()=>remove(q.id)}>Excluir</button></>}
    </td>
  </tr>)}</tbody></table></div></>
}
