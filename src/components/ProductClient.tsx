"use client";
import { useEffect,useMemo,useState } from "react";

type Ref={id:number;kind:string;code?:string;name:string};
type Product={id:number;sku:string;barcode?:string;name:string;category?:string;brand?:string;unit:string;ncm?:string;cest?:string;cost:number|string;price:number|string;min_stock:number|string;active:boolean};

const empty={id:0,sku:"",barcode:"",name:"",category:"",brand:"",unit:"",ncm:"",cest:"",cost:"0",price:"0",min_stock:"0",active:true};

export default function ProductClient(){
 const[rows,setRows]=useState<Product[]>([]),[refs,setRefs]=useState<Ref[]>([]),[form,setForm]=useState<any>(empty),[err,setErr]=useState("");
 const editing=!!form.id;
 const categories=useMemo(()=>refs.filter(r=>r.kind==="CATEGORY"),[refs]);
 const brands=useMemo(()=>refs.filter(r=>r.kind==="BRAND"),[refs]);
 const units=useMemo(()=>refs.filter(r=>r.kind==="UNIT"),[refs]);

 async function load(){
  const[p,r]=await Promise.all([fetch("/api/products?include_inactive=1"),fetch("/api/admin/references")]);
  const pd=await p.json();const rd=await r.json();
  if(p.ok)setRows(pd);else setErr(pd.error);
  if(r.ok)setRefs(rd);
 }
 useEffect(()=>{load()},[]);

 function set(name:string,value:any){setForm((f:any)=>({...f,[name]:value}))}
 function edit(p:Product){setForm({...p,cost:String(p.cost??0),price:String(p.price??0),min_stock:String(p.min_stock??0)});window.scrollTo({top:0,behavior:"smooth"})}
 function cancel(){setForm(empty);setErr("")}

 async function save(e:React.FormEvent){
  e.preventDefault();setErr("");
  const body={...form,cost:Number(form.cost||0),price:Number(form.price||0),min_stock:Number(form.min_stock||0)};
  const r=await fetch("/api/products",{method:editing?"PUT":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  const d=await r.json();
  if(!r.ok){setErr(d.error);return}
  cancel();load();
 }

 async function toggle(p:Product){
  const action=p.active?"inativar":"reativar";
  if(!confirm("Deseja "+action+" este produto?"))return;
  const r=await fetch("/api/products",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({...p,active:!p.active})});
  if(!r.ok){setErr((await r.json()).error);return}
  load();
 }

 return <><h1>Produtos</h1>
 <div className="card">
  <form onSubmit={save}>
   <div className="form">
    <label className="field"><span>SKU <small>Código interno do produto</small></span><input className="input" value={form.sku} onChange={e=>set("sku",e.target.value)} required/></label>
    <label className="field"><span>Código de barras <small>EAN/GTIN, se existir</small></span><input className="input" value={form.barcode??""} onChange={e=>set("barcode",e.target.value)}/></label>
    <label className="field"><span>Descrição <small>Nome comercial do produto</small></span><input className="input" value={form.name} onChange={e=>set("name",e.target.value)} required/></label>

    <label className="field"><span>Categoria <small>Grupo do produto</small></span><select className="input" value={form.category??""} onChange={e=>set("category",e.target.value)}><option value="">Selecione</option>{categories.map(x=><option key={x.id} value={x.name}>{x.name}</option>)}</select></label>
    <label className="field"><span>Marca <small>Fabricante ou marca comercial</small></span><select className="input" value={form.brand??""} onChange={e=>set("brand",e.target.value)}><option value="">Selecione</option>{brands.map(x=><option key={x.id} value={x.name}>{x.name}</option>)}</select></label>
    <label className="field"><span>Unidade de venda <small>UN, saco, caixa, kg, m³...</small></span><select className="input" value={form.unit??""} onChange={e=>set("unit",e.target.value)} required><option value="">Selecione</option>{units.map(x=><option key={x.id} value={x.code||x.name}>{x.code?x.code+" - ":""}{x.name}</option>)}</select></label>

    <label className="field"><span>NCM <small>Classificação fiscal da mercadoria</small></span><input className="input" value={form.ncm??""} onChange={e=>set("ncm",e.target.value)}/></label>
    <label className="field"><span>CEST <small>Código fiscal para produtos sujeitos à ST, quando aplicável</small></span><input className="input" value={form.cest??""} onChange={e=>set("cest",e.target.value)}/></label>
    <label className="field"><span>Custo <small>Valor pago pela loja</small></span><input className="input" type="number" step="0.01" min="0" value={form.cost} onChange={e=>set("cost",e.target.value)}/></label>

    <label className="field"><span>Preço de venda <small>Valor cobrado do cliente</small></span><input className="input" type="number" step="0.01" min="0" value={form.price} onChange={e=>set("price",e.target.value)}/></label>
    <label className="field"><span>Estoque mínimo <small>Gera alerta de reposição</small></span><input className="input" type="number" step="0.001" min="0" value={form.min_stock} onChange={e=>set("min_stock",e.target.value)}/></label>
   </div>
   <div style={{marginTop:14}}>
    <button className="btn">{editing?"Salvar alterações":"Cadastrar produto"}</button>
    {editing&&<button type="button" className="btn" style={{marginLeft:6}} onClick={cancel}>Cancelar</button>}
   </div>
   {err&&<p>{err}</p>}
  </form>
 </div><br/>

 <div className="card"><table className="table"><thead><tr><th>SKU</th><th>Produto</th><th>Categoria</th><th>Marca</th><th>Un.</th><th>Preço</th><th>Status</th><th>Ações</th></tr></thead><tbody>
  {rows.map(p=><tr key={p.id} style={{opacity:p.active?1:.55}}><td>{p.sku}</td><td>{p.name}</td><td>{p.category||"-"}</td><td>{p.brand||"-"}</td><td>{p.unit}</td><td>R$ {Number(p.price).toFixed(2)}</td><td>{p.active?"Ativo":"Inativo"}</td><td><button className="btn" style={{marginRight:6}} onClick={()=>edit(p)}>Editar</button><button className="btn" onClick={()=>toggle(p)}>{p.active?"Inativar":"Reativar"}</button></td></tr>)}
 </tbody></table></div></>
}