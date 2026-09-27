"use client";
import { useEffect,useRef,useState } from "react";

type Ref={id:number;kind:string;code?:string;name:string};
type Warehouse={id:number;name:string;active:boolean};
type Product={id:number;sku:string;barcode?:string;name:string;category?:string;brand?:string;unit:string;cost:number|string;price:number|string;min_stock:number|string};

export default function MobileClient({userName,role}:{userName:string;role:string}){
 const[tab,setTab]=useState<"search"|"product"|"stock">("search");
 const[refs,setRefs]=useState<Ref[]>([]),[warehouses,setWarehouses]=useState<Warehouse[]>([]);
 const[query,setQuery]=useState(""),[results,setResults]=useState<Product[]>([]);
 const[msg,setMsg]=useState(""),[err,setErr]=useState("");
 const[scanOpen,setScanOpen]=useState(false);
 const videoRef=useRef<HTMLVideoElement|null>(null);
 const streamRef=useRef<MediaStream|null>(null);
 const[form,setForm]=useState<any>({sku:"",barcode:"",name:"",category:"",brand:"",unit:"UN",cost:"0",price:"0",min_stock:"0"});
 const[stock,setStock]=useState<any>({product_id:"",warehouse_id:"",new_quantity:"",notes:"Inventário físico"});

 const categories=refs.filter(r=>r.kind==="CATEGORY");
 const brands=refs.filter(r=>r.kind==="BRAND");
 const units=refs.filter(r=>r.kind==="UNIT");

 useEffect(()=>{Promise.all([fetch("/api/admin/references"),fetch("/api/warehouses")]).then(async([a,b])=>{
   if(a.ok)setRefs(await a.json());
   if(b.ok)setWarehouses((await b.json()).filter((x:Warehouse)=>x.active!==false));
 });return()=>stopScan()},[]);

 useEffect(()=>{const t=setTimeout(async()=>{if(!query.trim()){setResults([]);return}const r=await fetch("/api/products?q="+encodeURIComponent(query));if(r.ok)setResults(await r.json())},250);return()=>clearTimeout(t)},[query]);

 function setF(k:string,v:any){setForm((f:any)=>({...f,[k]:v}))}
 function clear(){setErr("");setMsg("")}

 async function saveProduct(){
  clear();
  if(!form.sku.trim()||!form.name.trim()||!form.unit){setErr("Informe SKU, descrição e unidade.");return}
  const r=await fetch("/api/products",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
  const d=await r.json();
  if(!r.ok){setErr(d.error);return}
  setMsg("Produto cadastrado com sucesso.");
  setForm({sku:"",barcode:"",name:"",category:"",brand:"",unit:"UN",cost:"0",price:"0",min_stock:"0"});
 }

 async function saveStock(){
  clear();
  const r=await fetch("/api/stock",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
    product_id:Number(stock.product_id),warehouse_id:Number(stock.warehouse_id),new_quantity:Number(stock.new_quantity),notes:stock.notes
  })});
  const d=await r.json();
  if(!r.ok){setErr(d.error);return}
  setMsg("Estoque atualizado. Diferença: "+Number(d.difference).toFixed(3));
  setStock((s:any)=>({...s,new_quantity:""}));
 }

 async function startScan(target:"search"|"barcode"){
  clear();
  const BD=(window as any).BarcodeDetector;
  if(!BD){setErr("Leitura pela câmera não é suportada neste navegador. Digite o código manualmente.");return}
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}});
    streamRef.current=stream;setScanOpen(true);
    setTimeout(async()=>{
      const video=videoRef.current;if(!video)return;
      video.srcObject=stream;await video.play();
      const detector=new BD({formats:["ean_13","ean_8","code_128","upc_a","upc_e","qr_code"]});
      const timer=setInterval(async()=>{
        try{
          const codes=await detector.detect(video);
          if(codes?.[0]?.rawValue){
            const code=String(codes[0].rawValue);
            if(target==="search"){setQuery(code);setTab("search")}else setF("barcode",code);
            clearInterval(timer);stopScan();setMsg("Código lido: "+code);
          }
        }catch{}
        if(!streamRef.current)clearInterval(timer);
      },500);
    },100);
  }catch{setErr("Não foi possível acessar a câmera. Verifique a permissão do navegador.");}
 }

 function stopScan(){
  streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;setScanOpen(false);
 }

 return <main className="mobile-wrap">
   <header className="mobile-head"><div><b>ROVIX CONSTRUMAX</b><small>{userName} · {role}</small></div><a className="btn" href="/dashboard">PC</a></header>
   <nav className="mobile-tabs">
    <button className={tab==="search"?"active":""} onClick={()=>setTab("search")}>Consultar</button>
    <button className={tab==="product"?"active":""} onClick={()=>setTab("product")}>Cadastrar</button>
    <button className={tab==="stock"?"active":""} onClick={()=>setTab("stock")}>Estoque</button>
   </nav>
   {err&&<div className="mobile-alert error">{err}</div>}{msg&&<div className="mobile-alert ok">{msg}</div>}

   {scanOpen&&<div className="mobile-scan"><video ref={videoRef} playsInline/><button className="btn" onClick={stopScan}>Cancelar câmera</button></div>}

   {tab==="search"&&<section className="mobile-card">
     <h2>Consultar produto</h2>
     <div className="mobile-inline"><input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nome, SKU ou código de barras"/><button className="btn" onClick={()=>startScan("search")}>📷 Ler</button></div>
     <div className="mobile-results">{results.map(p=><article key={p.id}><b>{p.name}</b><span>{p.sku} · {p.unit}</span><strong>R$ {Number(p.price).toFixed(2)}</strong><small>{p.barcode?"Código: "+p.barcode:"Sem código de barras"}</small></article>)}</div>
   </section>}

   {tab==="product"&&<section className="mobile-card">
     <h2>Cadastrar produto</h2>
     <label className="field"><span>SKU</span><input className="input" value={form.sku} onChange={e=>setF("sku",e.target.value)}/></label>
     <label className="field"><span>Código de barras</span><div className="mobile-inline"><input className="input" value={form.barcode} onChange={e=>setF("barcode",e.target.value)}/><button className="btn" onClick={()=>startScan("barcode")}>📷 Ler</button></div></label>
     <label className="field"><span>Descrição</span><input className="input" value={form.name} onChange={e=>setF("name",e.target.value)}/></label>
     <label className="field"><span>Categoria</span><select className="input" value={form.category} onChange={e=>setF("category",e.target.value)}><option value="">Selecione</option>{categories.map(x=><option key={x.id}>{x.name}</option>)}</select></label>
     <label className="field"><span>Marca</span><select className="input" value={form.brand} onChange={e=>setF("brand",e.target.value)}><option value="">Selecione</option>{brands.map(x=><option key={x.id}>{x.name}</option>)}</select></label>
     <label className="field"><span>Unidade</span><select className="input" value={form.unit} onChange={e=>setF("unit",e.target.value)}>{units.map(x=><option key={x.id} value={x.code||x.name}>{x.code?x.code+" - ":""}{x.name}</option>)}</select></label>
     <div className="mobile-two"><label className="field"><span>Custo</span><input className="input" type="number" step="0.01" value={form.cost} onChange={e=>setF("cost",e.target.value)}/></label><label className="field"><span>Preço</span><input className="input" type="number" step="0.01" value={form.price} onChange={e=>setF("price",e.target.value)}/></label></div>
     <label className="field"><span>Estoque mínimo</span><input className="input" type="number" step="0.001" value={form.min_stock} onChange={e=>setF("min_stock",e.target.value)}/></label>
     <button className="btn mobile-primary" onClick={saveProduct}>Salvar produto</button>
   </section>}

   {tab==="stock"&&<section className="mobile-card">
     <h2>Ajustar estoque</h2>
     <label className="field"><span>Produto</span><select className="input" value={stock.product_id} onChange={e=>setStock((s:any)=>({...s,product_id:e.target.value}))}><option value="">Selecione</option>{results.map(p=><option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}</select></label>
     <label className="field"><span>Buscar produto</span><input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Digite nome, SKU ou código"/></label>
     <label className="field"><span>Depósito</span><select className="input" value={stock.warehouse_id} onChange={e=>setStock((s:any)=>({...s,warehouse_id:e.target.value}))}><option value="">Selecione</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
     <label className="field"><span>Novo saldo físico</span><input className="input" type="number" step="0.001" min="0" value={stock.new_quantity} onChange={e=>setStock((s:any)=>({...s,new_quantity:e.target.value}))}/></label>
     <label className="field"><span>Motivo</span><select className="input" value={stock.notes} onChange={e=>setStock((s:any)=>({...s,notes:e.target.value}))}><option>Inventário físico</option><option>Correção de lançamento</option><option>Avaria / perda</option><option>Devolução</option><option>Outro</option></select></label>
     <button className="btn mobile-primary" onClick={saveStock}>Confirmar ajuste</button>
   </section>}
 </main>
}
