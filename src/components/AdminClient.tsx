"use client";
import { useEffect,useMemo,useState } from "react";

type Ref={id:number;kind:"CATEGORY"|"BRAND"|"UNIT";code?:string;name:string};

export default function AdminClient(){
 const[refs,setRefs]=useState<Ref[]>([]),[settings,setSettings]=useState<any>({company_name:"",company_logo:"",mobile_enabled:"true"}),[mobileInfo,setMobileInfo]=useState<any>(null),[pairing,setPairing]=useState<any>(null),[selectedHost,setSelectedHost]=useState(""),[err,setErr]=useState(""),[msg,setMsg]=useState("");
 const[name,setName]=useState(""),[code,setCode]=useState(""),[kind,setKind]=useState<Ref["kind"]>("CATEGORY");

 const grouped=useMemo(()=>({
  CATEGORY:refs.filter(r=>r.kind==="CATEGORY"),
  BRAND:refs.filter(r=>r.kind==="BRAND"),
  UNIT:refs.filter(r=>r.kind==="UNIT")
 }),[refs]);

 async function load(){
  const[r,s,m]=await Promise.all([fetch("/api/admin/references"),fetch("/api/admin/settings"),fetch("/api/admin/mobile-info")]);
  const rd=await r.json(),sd=await s.json(),md=await m.json();
  if(r.ok)setRefs(rd);else setErr(rd.error);
  if(s.ok)setSettings(sd);else setErr(sd.error);
  if(m.ok){setMobileInfo(md);setSelectedHost((x:string)=>x||md.selected_host||md.candidates?.[0]?.ip||"");}
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

 async function generatePairing(){
  setErr("");setMsg("");
  if(!selectedHost){setErr("Selecione o IP da rede usada pelo celular.");return}
  const r=await fetch("/api/admin/mobile-info",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({host:selectedHost})});
  const d=await r.json();if(!r.ok){setErr(d.error);return}
  setPairing(d);setMsg("Código de pareamento gerado. Ele expira em 5 minutos e só pode ser usado uma vez.");
 }
 async function cancelPairing(){
  await fetch("/api/admin/mobile-info",{method:"DELETE"});
  setPairing(null);setMsg("Pareamento cancelado.");
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
  <h2>Módulo Mobile</h2>
  <p className="muted">Pareamento local no mesmo padrão do ALMOX_DVAPRO: escolha a interface correta, gere um código de 6 dígitos e autorize o aparelho.</p>
  <div className="form">
   <label className="field"><span>Acesso Mobile</span><select className="input" value={String(settings.mobile_enabled??"true")} onChange={e=>setSettings((s:any)=>({...s,mobile_enabled:e.target.value}))}><option value="true">Habilitado</option><option value="false">Desabilitado</option></select></label>
   <label className="field"><span>Rede/IP do celular <small>Escolha a interface que está na mesma rede Wi-Fi/LAN do celular.</small></span><select className="input" value={selectedHost} onChange={e=>setSelectedHost(e.target.value)}><option value="">Selecione</option>{(mobileInfo?.candidates||[]).map((x:any)=><option key={x.name+"-"+x.ip} value={x.ip}>{x.name} — {x.ip}</option>)}</select></label>
   <div className="field"><span>Porta</span><input className="input" value={mobileInfo?.port||""} readOnly/></div>
  </div>
  <div style={{marginTop:14,display:"flex",gap:8,flexWrap:"wrap"}}>
   <button className="btn" onClick={saveSettings}>Salvar configuração</button>
   <button className="btn" onClick={generatePairing}>PAREAR NOVO DISPOSITIVO</button>
   {pairing&&<button className="btn" onClick={cancelPairing}>Cancelar código</button>}
  </div>
  {pairing&&<div className="mobile-admin-box">
    <div>
      <b>CÓDIGO DE PAREAMENTO</b>
      <div className="mobile-pair-display">{String(pairing.code).slice(0,3)} {String(pairing.code).slice(3)}</div>
      <div className="mobile-url">{pairing.host}:{pairing.port}</div>
      <div className="muted">Validade: 5 minutos · uso único</div>
      <div className="muted">No celular, leia o QR ou abra o endereço e informe este código.</div>
    </div>
    {pairing.qr&&<img src={pairing.qr} alt="QR Code de pareamento" className="mobile-qr"/>}
  </div>}
  {!!mobileInfo?.devices?.length&&<div style={{marginTop:18}}><h3>Dispositivos autorizados</h3>{mobileInfo.devices.map((d:any)=><div className="admin-row" key={d.device_id}><span><b>{d.name}</b><small style={{display:"block"}}>{d.device_id} · {d.active?"ATIVO":"BLOQUEADO"}</small></span><span className="muted">{d.last_seen_at?"Último acesso: "+new Date(d.last_seen_at).toLocaleString("pt-BR"):"Nunca acessou"}</span></div>)}</div>}
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