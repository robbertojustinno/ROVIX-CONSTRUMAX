import os from "node:os";
import { requireUser } from "@/lib/auth";
import { ok,fail } from "@/lib/http";
import QRCode from "qrcode";

function privateIpv4(){
  const nets=os.networkInterfaces();
  const candidates:string[]=[];
  for(const entries of Object.values(nets)){
    for(const n of entries??[]){
      if(n.family!=="IPv4" || n.internal) continue;
      const ip=n.address;
      if(ip.startsWith("169.254.")) continue;
      candidates.push(ip);
    }
  }
  const preferred=candidates.find(ip=>ip.startsWith("192.168."))||
    candidates.find(ip=>ip.startsWith("10."))||
    candidates.find(ip=>/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip))||
    candidates[0]||"";
  return preferred;
}

export async function GET(req:Request){
  try{
    await requireUser(["ADMIN"]);
    const host=req.headers.get("host")||"";
    const port=host.includes(":")?host.split(":").pop():"3131";
    const ip=privateIpv4();
    const url=ip?("http://"+ip+":"+port+"/mobile"):"";
    const qr=url?await QRCode.toDataURL(url,{margin:1,width:260}):"";
    return ok({
      ip,
      port,
      url,
      qr,
      note:"O celular deve estar na mesma rede local/Wi-Fi do computador do CONSTRUMAX."
    });
  }catch(e){return fail(e)}
}
