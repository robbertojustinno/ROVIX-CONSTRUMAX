import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail,ok } from "@/lib/http";
import { audit } from "@/server/audit";

export async function GET(){
  try{
    await requireUser();
    const r=await query("SELECT key,value FROM app_settings");
    return ok(Object.fromEntries(r.rows.map((x:any)=>[x.key,x.value??""])));
  }catch(e){return fail(e)}
}

export async function PUT(req:Request){
  try{
    const user=await requireUser(["ADMIN"]);
    const d=await req.json();
    const allowed=["company_name","company_logo"];
    for(const key of allowed){
      if(d[key]!==undefined){
        const value=String(d[key]??"");
        if(key==="company_logo" && value.length>1500000) throw new Error("Logo muito grande. Use imagem menor que 1 MB.");
        await query(`INSERT INTO app_settings(key,value,updated_at) VALUES($1,$2,now())
          ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()`,[key,value]);
      }
    }
    await audit(user.id,"SETTINGS_UPDATE","app_settings","company",allowed.reduce((o:any,k)=>{if(d[k]!==undefined)o[k]=k==="company_logo"?"[imagem]":d[k];return o},{}));
    return ok({ok:true});
  }catch(e){return fail(e)}
}
