import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail,ok } from "@/lib/http";
import { audit } from "@/server/audit";

const kinds=["CATEGORY","BRAND","UNIT"];

export async function GET(){
  try{
    await requireUser();
    const r=await query("SELECT * FROM reference_values WHERE active=true ORDER BY kind,name");
    return ok(r.rows);
  }catch(e){return fail(e)}
}

export async function POST(req:Request){
  try{
    const user=await requireUser(["ADMIN"]);
    const d=await req.json();
    if(!kinds.includes(d.kind)) throw new Error("Tipo de cadastro inválido");
    if(!String(d.name??"").trim()) throw new Error("Informe o nome");
    const r=await query(`INSERT INTO reference_values(kind,code,name)
      VALUES($1,$2,$3) RETURNING *`,
      [d.kind,String(d.code??"").trim()||null,String(d.name).trim()]);
    await audit(user.id,"REFERENCE_CREATE","reference_values",r.rows[0].id,d);
    return ok(r.rows[0],201);
  }catch(e){return fail(e)}
}

export async function DELETE(req:Request){
  try{
    const user=await requireUser(["ADMIN"]);
    const id=Number(new URL(req.url).searchParams.get("id"));
    if(!id) throw new Error("Cadastro inválido");
    const r=await query("UPDATE reference_values SET active=false WHERE id=$1 RETURNING *",[id]);
    if(!r.rows[0]) throw new Error("Cadastro não encontrado");
    await audit(user.id,"REFERENCE_DISABLE","reference_values",id,{});
    return ok(r.rows[0]);
  }catch(e){return fail(e)}
}
