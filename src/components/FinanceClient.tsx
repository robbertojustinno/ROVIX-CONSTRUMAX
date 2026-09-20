"use client";
import { useEffect,useState } from "react";
export default function FinanceClient(){
 const[data,setData]=useState<any>({receivables:[],payables:[]}),[err,setErr]=useState("");
 async function load(){const r=await fetch("/api/finance");const d=await r.json();if(r.ok)setData(d);else setErr(d.error)}
 useEffect(()=>{load()},[]);
 async function settle(kind:"receivable"|"payable",id:number){const r=await fetch("/api/finance",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind,id})});if(!r.ok){setErr((await r.json()).error);return}load()}
 return <><h1>Financeiro</h1>{err&&<p>{err}</p>}<div className="grid">
 <div className="card"><h3>Contas a receber</h3>{data.receivables.map((r:any)=><p key={r.id}>#{r.id} {r.party} — R$ {r.amount} — {String(r.due_date)} — {r.status} {r.installment_no?("(" + r.installment_no + "/" + r.installment_count + ")"):""} {r.status!=="PAID"&&<button className="btn" onClick={()=>settle("receivable",r.id)}>Baixar</button>}</p>)}</div>
 <div className="card"><h3>Contas a pagar</h3>{data.payables.map((r:any)=><p key={r.id}>#{r.id} {r.party} — R$ {r.amount} — {String(r.due_date)} — {r.status} {r.status!=="PAID"&&<button className="btn" onClick={()=>settle("payable",r.id)}>Baixar</button>}</p>)}</div>
 </div></>
}