import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import MobileClient from "@/components/MobileClient";

export default async function MobilePage(){
  const user=await currentUser();
  if(!user) redirect("/login?next=/mobile");
  const r=await query("SELECT value FROM app_settings WHERE key='mobile_enabled'");
  const enabled=r.rows[0]?.value!=="false";
  if(!enabled && user.role!=="ADMIN") return <div className="mobile-wrap"><div className="card"><h2>Módulo Mobile desativado</h2><p>Solicite ao administrador para habilitar o acesso pelo celular.</p></div></div>;
  return <MobileClient userName={user.name} role={user.role}/>;
}
