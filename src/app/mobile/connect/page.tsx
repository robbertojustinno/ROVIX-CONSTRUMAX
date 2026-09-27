"use client";
import { useEffect,useState } from "react";
import { useRouter,useSearchParams } from "next/navigation";

export default function MobileConnect(){
 const router=useRouter(),sp=useSearchParams();
 const[code,setCode]=useState(sp.get("code")||"");
 const[name,setName]=useState("Celular CONSTRUMAX");
 const[status,setStatus]=useState<"checking"|"ok"|"fail">("checking");
 const[busy,setBusy]=useState(false),[err,setErr]=useState("");
 useEffect(()=>{fetch("/api/mobile/status").then(r=>r.ok?r.json():Promise.reject()).then(d=>setStatus(d.available?"ok":"fail")).catch(()=>setStatus("fail"))},[]);
 async function pair(){
  if(busy)return;setBusy(true);setErr("");
  try{
   const s=await fetch("/api/mobile/status");if(!s.ok)throw new Error("Servidor não encontrado");
   const r=await fetch("/api/mobile/pair",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({code,device_name:name})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Falha no pareamento");
   router.replace("/mobile");router.refresh();
  }catch(e:any){setErr(e?.message||"Falha no pareamento")}finally{setBusy(false)}
 }
 return <main className="mobile-wrap"><section className="mobile-card">
  <h1>Conectar ao CONSTRUMAX</h1>
  <p className="muted">Use o código de 6 dígitos mostrado no computador. O código expira em 5 minutos e funciona uma única vez.</p>
  <div className={"mobile-alert "+(status==="ok"?"ok":"error")}>{status==="checking"?"Testando servidor...":status==="ok"?"SERVIDOR ENCONTRADO":"SERVIDOR NÃO ENCONTRADO"}</div>
  <label className="field"><span>Nome deste aparelho</span><input className="input" value={name} onChange={e=>setName(e.target.value)}/></label>
  <label className="field"><span>Código de pareamento</span><input className="input mobile-pair-code" inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000"/></label>
  {err&&<div className="mobile-alert error">{err}</div>}
  <button className="btn mobile-primary" disabled={busy||code.length!==6||status!=="ok"} onClick={pair}>{busy?"Pareando...":"TESTAR CONEXÃO E PAREAR"}</button>
 </section></main>
}
