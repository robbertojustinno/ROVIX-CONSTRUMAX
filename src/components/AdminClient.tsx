"use client";
import { useEffect,useMemo,useState } from "react";

type Ref={id:number;kind:"CATEGORY"|"BRAND"|"UNIT";code?:string;name:string};

export default function AdminClient(){
 const[refs,setRefs]=useState<Ref[]>([]),[settings,setSettings]=useState<any>({company_name:"",company_logo:""}),[err,setErr]=useState(""),[msg,setMsg]=useState("");
 const[name,setName]=useState(""),[code,setCode]=useState(""),[kind,setKind]=useState<Ref["kind"]>("CATEGORY");

 const grouped=useMemo(()=>({
  CATEGORY:refs.filter(r=>r.kind==="CATEGORY"),
  BRAND:refs.filter(r=>r.kind==="BRAND"),
  UNIT:refs.filter(r=>r.kind==="UNIT")
 }),[refs]);

 async function load(){
  const[r,s]=await Promise.all([fetch("/api/admin/references"),fetch("/api/admin/settings")]);
  const rd=await r.json(),sd=await s.json();
  if(r.ok)setRefs(rd);else setErr(rd.error);
  if(s.ok)setSettings(sd);else setErr(sd.error);
 }
 useEffect(()=>{load()},[]);

 async function addRef(){
  setErr("");setMsg("");
  const r=await fetch("/api/admin/references",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind,name,code})});
  const d=await r.json();
  if(!r.ok){setErr(d.error);return}
  setName("");setCode("");setMsg("Cadastro adicionado.");load();
 }

 async function removeRef(id:number){
  if(!confirm("Deseja inativar este cadastro?"))return;
  const r=await fetch("/api/admin/references?id="+id,{method:"DELETE"});
  if(!r.ok){setErr((await r.json()).error);return}
  load();
 }

 async function saveSettings(){
  setErr("");setMsg("");
  const r=await fetch("/api/admin/settings",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(settings)});
  const d=await r.json();
  if(!r.ok){setErr(d.error);return}
  setMsg("Configurações salvas. Recarregue a página para atualizar o menu.");
 }

 function pickLogo(file?:File){
  if(!file)return;
  if(!file.type.startsWith("image/")){setErr("Selecione um arquivo de imagem.");return}
  if(file.size>1024*1024){setErr("Use uma logo com no máximo 1 MB.");return}
  const reader=new FileReader();
  reader.onload=()=>setSettings((s:any)=>({...s,company_logo:String(reader.result)}));
  reader.readAsDataURL(file);
 }

 return <><h1>Administrativo</h1>
 {err&&<div className="card"><b>Erro:</b> {err}</div>}
 {msg&&<div className="card"><b>{msg}</b></div>}

 <div className="card">
  <h2>Identidade da empresa</h2>
  <div className="form">
   <label className="field"><span>Nome da empresa <small>Nome exibido no sistema</small></span><input className="input" value={settings.company_name||""} onChange={e=>setSettings((s:any)=>({...s,company_name:e.target.value}))}/></label>
   <label className="field"><span>Logo <small>PNG, JPG ou WEBP, até 1 MB</small></span><input className="input" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>pickLogo(e.target.files?.[0])}/></label>
   <div className="field"><span>Prévia</span>{settings.company_logo?<img src={settings.company_logo} alt="Logo" style={{maxHeight:80,maxWidth:220,objectFit:"contain",background:"#fff",padding:6,borderRadius:8}}/>:<div className="muted">Sem logo personalizada</div>}</div>
  </div>
  <div style={{marginTop:14}}>
   <button className="btn" onClick={saveSettings}>Salvar identidade</button>
   {settings.company_logo&&<button className="btn" style={{marginLeft:6}} onClick={()=>setSettings((s:any)=>({...s,company_logo:""}))}>Remover logo</button>}
  </div>
 </div><br/>

 <div className="card">
  <h2>Cadastros auxiliares</h2>
  <p className="muted">Esses cadastros alimentam as listas usadas no cadastro de Produtos.</p>
  <div className="form">
   <label className="field"><span>Tipo</span><select className="input" value={kind} onChange={e=>setKind(e.target.value as Ref["kind"])}><option value="CATEGORY">Categoria</option><option value="BRAND">Marca</option><option value="UNIT">Unidade</option></select></label>
   {kind==="UNIT"&&<label className="field"><span>Código <small>Ex.: UN, KG, M3, SACO</small></span><input className="input" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/></label>}
   <label className="field"><span>Nome</span><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder={kind==="CATEGORY"?"Ex.: Ferragens":kind==="BRAND"?"Ex.: Tigre":"Ex.: Caixa"}/></label>
  </div>
  <div style={{marginTop:14}}><button className="btn" onClick={addRef}>Adicionar</button></div>
 </div><br/>

 <div className="grid admin-grid">
  <div className="card"><h3>Categorias</h3>{grouped.CATEGORY.map(x=><div className="admin-row" key={x.id}><span>{x.name}</span><button className="btn" onClick={()=>removeRef(x.id)}>Inativar</button></div>)}</div>
  <div className="card"><h3>Marcas</h3>{grouped.BRAND.length?grouped.BRAND.map(x=><div className="admin-row" key={x.id}><span>{x.name}</span><button className="btn" onClick={()=>removeRef(x.id)}>Inativar</button></div>):<p className="muted">Nenhuma marca cadastrada.</p>}</div>
  <div className="card"><h3>Unidades</h3>{grouped.UNIT.map(x=><div className="admin-row" key={x.id}><span>{x.code?x.code+" - ":""}{x.name}</span><button className="btn" onClick={()=>removeRef(x.id)}>Inativar</button></div>)}</div>
 </div></>
}