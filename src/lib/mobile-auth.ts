import crypto from "node:crypto";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

const COOKIE="rovix_mobile_device";
export function mobileDigest(v:string){return crypto.createHash("sha256").update(v).digest("hex")}
export function newMobileToken(){return crypto.randomBytes(32).toString("base64url")}

export async function setMobileDeviceCookie(deviceId:string,token:string){
  (await cookies()).set(COOKIE,deviceId+"."+token,{httpOnly:true,sameSite:"lax",secure:false,path:"/",maxAge:60*60*24*180});
}
export async function clearMobileDeviceCookie(){(await cookies()).delete(COOKIE)}
export async function currentMobileDevice(){
  const raw=(await cookies()).get(COOKIE)?.value;
  if(!raw)return null;
  const dot=raw.indexOf("."); if(dot<1)return null;
  const deviceId=raw.slice(0,dot),token=raw.slice(dot+1);
  const r=await query("SELECT * FROM mobile_devices WHERE device_id=$1 AND active=true",[deviceId]);
  const d=r.rows[0]; if(!d)return null;
  const a=Buffer.from(String(d.token_hash),"hex"),b=Buffer.from(mobileDigest(token),"hex");
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
  await query("UPDATE mobile_devices SET last_seen_at=now() WHERE device_id=$1",[deviceId]);
  return d;
}
export async function requireMobileDevice(){const d=await currentMobileDevice();if(!d)throw new Error("UNAUTHORIZED");return d}
