import os from "node:os";
import crypto from "node:crypto";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok,fail } from "@/lib/http";
import { mobileDigest } from "@/lib/mobile-auth";

function lanCandidates(){
  const out:{name:string;ip:string;preferred:boolean}[]=[];
  const skip=/virtualbox|vmware|hyper-v|vethernet|docker|wsl|tailscale|loopback|bluetooth/i;
  for(const [name,entries] of Object.entries(os.networkInterfaces())){
    if(skip.test(name))continue;
    for(const n of entries??[]){
      if(n.family!=="IPv4"||n.internal)continue;
      const ip=n.address;
      if(ip.startsWith("169.254.")||ip==="0.0.0.0"||ip.startsWith("127."))continue;
      const priv=ip.startsWith("10.")||ip.startsWith("192.168.")||/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);
      if(!priv)continue;
      const preferred=/wi-?fi|wireless|wlan|ethernet/i.test(name);
      out.push({name,ip,preferred});
    }
  }
  return out.sort((a,b)=>Number(b.preferred)-Number(a.preferred)||a.name.localeCompare(b.name));
}
export async function GET(req:Request){
  try{
    await requireUser(["ADMIN"]);
    const host=req.headers.get("host")||"";
    const port=Number(host.split(":").pop()||3131);
    const state=(await query("SELECT selected_host,expires_at FROM mobile_pair_state WHERE id=1")).rows[0]||{};
    const devices=(await query("SELECT device_id,name,active,paired_at,last_seen_at,last_ip FROM mobile_devices ORDER BY paired_at DESC LIMIT 50")).rows;
    return ok({candidates:lanCandidates(),port,selected_host:state.selected_host||"",expires_at:state.expires_at||null,devices});
  }catch(e){return fail(e)}
}

export async function POST(req:Request){
  try{
    await requireUser(["ADMIN"]);
    const d=await req.json();
    const host=String(d.host||"").trim();
    const candidates=lanCandidates();
    if(!candidates.some(x=>x.ip===host))throw new Error("Selecione um IPv4 LAN listado pelo sistema");
    const current=(await query("SELECT code_hash FROM mobile_pair_state WHERE id=1")).rows[0]?.code_hash;
    if(current)await query("UPDATE mobile_pair_codes SET invalidated_at=now() WHERE code_hash=$1 AND used_at IS NULL",[current]);
    let code="";
    for(let i=0;i<20;i++){
      code=String(crypto.randomInt(100000,1000000));
      const h=mobileDigest(code);
      const exists=(await query("SELECT 1 FROM mobile_pair_codes WHERE code_hash=$1",[h])).rowCount;
      if(!exists)break;
    }
    const codeHash=mobileDigest(code);
    const expires=new Date(Date.now()+5*60*1000);
    await query("INSERT INTO mobile_pair_codes(code_hash,expires_at) VALUES($1,$2)",[codeHash,expires]);
    await query("UPDATE mobile_pair_state SET code_hash=$1,expires_at=$2,attempts=0,selected_host=$3,updated_at=now() WHERE id=1",[codeHash,expires,host]);
    const appHost=req.headers.get("host")||("127.0.0.1:"+String(d.port||3131));
    const port=Number(appHost.split(":").pop()||3131);
    const url="http://"+host+":"+port+"/mobile/connect?code="+encodeURIComponent(code);
    const qr=await QRCode.toDataURL(url,{margin:1,width:320});
    return ok({host,port,code,expires_at:expires.toISOString(),qr,url});
  }catch(e){return fail(e)}
}

export async function DELETE(){
  try{
    await requireUser(["ADMIN"]);
    const current=(await query("SELECT code_hash FROM mobile_pair_state WHERE id=1")).rows[0]?.code_hash;
    if(current)await query("UPDATE mobile_pair_codes SET invalidated_at=now() WHERE code_hash=$1 AND used_at IS NULL",[current]);
    await query("UPDATE mobile_pair_state SET code_hash=NULL,expires_at=NULL,attempts=0,updated_at=now() WHERE id=1");
    return ok({ok:true});
  }catch(e){return fail(e)}
}
