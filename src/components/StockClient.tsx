"use client";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";

export default function StockClient(){
 const router=useRouter();
 const[rows,setRows]=useState<any[]>([]),[err,setErr]=useState(""),[selected,setSelected]=useState<any|null>(null),[history,setHistory]=useState<any[]>([]),[mode,setMode]=useState<"adjust"|"history"|null>(null);
 const[newQty,setNewQty]=useState(""),[reason,setReason]=useState("");

 async function load(){
  const r=await fetch("/api/stock");
  const d=await r.json();
  if(r.ok)setRows(d);else setErr(d.error);
 }
 useEffect(()=>{load()},[]);

 function openAdjust(r:any){
  setSelected(r);setMode("adjust");setNewQty(String(r.quantity));setReason("");setErr("");
 }

 async function openHistory(r:any){
  setSelected(r);setMode("history");setErr("");
  const res=await fetch("/api/stock?history=1&product_id="+r.id+"&warehouse_id="+r.warehouse_id);
  const d=await res.json();
  if(res.ok)setHistory(d);else setErr(d.error);
 }

 async function saveAdjust(){
  if(!selected)return;
  setErr("");
  const res=await fetch("/api/stock",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
   product_id:selected.id,warehouse_id:selected.warehouse_id,new_quantity:Number(newQty),notes:reason
  })});
  const d=await res.json();
  if(!res.ok){setErr(d.error);return}
  setMode(null);setSelected(null);setNewQty("");setReason("");await load();
 }

 return <><h1>Estoque</h1>
 <div className="card"><p className="muted">O saldo não é editado diretamente. Use <b>Ajustar</b> para informar o novo saldo físico; o CONSTRUMAX registra automaticamente a diferença, usuário, data e motivo.</p></div><br/>

 {mode==="adjust"&&selected&&<div className="card">
  <h3>Ajustar saldo</h3>
  <p><b>Produto:</b> {selected.sku} - {selected.name}</p>
  <p><b>Depósito:</b> {selected.warehouse}</p>
  <p><b>Saldo atual:</b> {Number(selected.quantity).toFixed(3)} {selected.unit}</p>
  <div className="form">
   <input className="input" type="number" min="0" step="0.001" value={newQty} onChange={e=>setNewQty(e.target.value)} placeholder="Novo saldo físico"/>
   <select className="input" value={reason} onChange={e=>setReason(e.target.value)}>
    <option value="">Selecione o motivo</option>
    <option value="Inventário físico">Inventário físico</option>
    <option value="Correção de lançamento">Correção de lançamento</option>
    <option value="Avaria / perda">Avaria / perda</option>
    <option value="Devolução">Devolução</option>
    <option value="Outro">Outro</option>
   </select>
  </div>
  <p><b>Diferença a registrar:</b> {(Number(newQty||0)-Number(selected.quantity)).toFixed(3)} {selected.unit}</p>
  <button className="btn" onClick={saveAdjust}>Confirmar ajuste</button>{" "}
  <button className="btn" onClick={()=>setMode(null)}>Cancelar</button>
  {err&&<p>{err}</p>}
 </div>}

 {mode==="history"&&selected&&<div className="card">
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
   <div><h3>Histórico de estoque</h3><p>{selected.sku} - {selected.name} | {selected.warehouse}</p></div>
   <button className="btn" onClick={()=>setMode(null)}>Fechar</button>
  </div>
  <table className="table"><thead><tr><th>Data</th><th>Tipo</th><th>Movimento</th><th>Motivo</th><th>Usuário</th></tr></thead><tbody>
   {history.map(h=><tr key={h.id}><td>{new Date(h.created_at).toLocaleString("pt-BR")}</td><td>{h.movement_type}</td><td>{Number(h.quantity).toFixed(3)}</td><td>{h.notes||"-"}</td><td>{h.user_name||"-"}</td></tr>)}
  </tbody></table>
  {err&&<p>{err}</p>}
 </div>}

 <br/>
 <div className="card"><table className="table"><thead><tr><th>SKU</th><th>Produto</th><th>Un.</th><th>Depósito</th><th>Saldo</th><th>Mínimo</th><th>Ações</th></tr></thead><tbody>
  {rows.map((r,i)=><tr key={i}><td>{r.sku}</td><td>{r.name}</td><td>{r.unit}</td><td>{r.warehouse}</td><td>{r.quantity}</td><td>{r.min_stock}</td><td>
   <button className="btn" style={{marginRight:6}} onClick={()=>openAdjust(r)}>Ajustar</button>
   <button className="btn" style={{marginRight:6}} onClick={()=>openHistory(r)}>Histórico</button>
   <button className="btn" onClick={()=>router.push("/transfers")}>Transferir</button>
  </td></tr>)}
 </tbody></table></div></>
}