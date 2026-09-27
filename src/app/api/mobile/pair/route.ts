import crypto from "node:crypto";
import { query,tx } from "@/lib/db";
import { ok,fail } from "@/lib/http";
import { mobileDigest,newMobileToken,setMobileDeviceCookie } from "@/lib/mobile-auth";

export async function POST(req:Request){
 try{
  const d=await req.json();
  const code=String(d.code||d.pairing_token||"").trim();
  const name=String(d.device_name||"Celular CONSTRUMAX").trim().slice(0,120);
  if(!/^\d{6}$/.test(code))throw new Error("Código de pareamento inválido");
  const state=(await query("SELECT * FROM mobile_pair_state WHERE id=1")).rows[0];
  const now=Date.now(), exp=state?.expires_at?new Date(state.expires_at).getTime():0;
  if(!state?.code_hash||!exp||exp<now)throw new Error("Código de pareamento inválido ou expirado");
  const expected=Buffer.from(String(state.code_hash),"hex"),got=Buffer.from(mobileDigest(code),"hex");
  if(expected.length!==got.length||!crypto.timingSafeEqual(expected,got)){
    const attempts=Number(state.attempts||0)+1;
    if(attempts>=5){
      await query("UPDATE mobile_pair_codes SET invalidated_at=now() WHERE code_hash=$1 AND used_at IS NULL",[state.code_hash]);
      await query("UPDATE mobile_pair_state SET code_hash=NULL,expires_at=NULL,attempts=0 WHERE id=1");
      throw new Error("Limite de tentativas atingido. Gere novo código no PC");
    }
    await query("UPDATE mobile_pair_state SET attempts=$1 WHERE id=1",[attempts]);
    throw new Error("Código de pareamento inválido. Tentativa "+attempts+" de 5");
  }
  const deviceId=crypto.randomUUID(),token=newMobileToken();
  const ip=(req.headers.get("x-forwarded-for")||"").split(",")[0].trim()||null;
  await tx(async db=>{
    await db.query("INSERT INTO mobile_devices(device_id,name,token_hash,paired_at,last_seen_at,last_ip) VALUES($1,$2,$3,now(),now(),$4)",[deviceId,name,mobileDigest(token),ip]);
    await db.query("UPDATE mobile_pair_codes SET used_at=now() WHERE code_hash=$1",[state.code_hash]);
    await db.query("UPDATE mobile_pair_state SET code_hash=NULL,expires_at=NULL,attempts=0 WHERE id=1");
  });
  await setMobileDeviceCookie(deviceId,token);
  return ok({device_id:deviceId,paired:true});
 }catch(e){return fail(e)}
}
