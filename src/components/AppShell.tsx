import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

const items=[
 ["Dashboard","/dashboard"],
 ["PDV / Vendas","/sales"],
 ["Orçamentos","/quotes"],
 ["Produtos","/products"],
 ["Estoque","/stock"],
 ["Transferências","/transfers"],
 ["Compras","/purchases"],
 ["Fornecedores","/suppliers"],
 ["Clientes","/customers"],
 ["Depósitos","/warehouses"],
 ["Financeiro","/finance"],
 ["Entregas","/deliveries"]
];

async function branding(){
 try{
  const r=await query<any>("SELECT key,value FROM app_settings WHERE key IN ('company_name','company_logo')");
  const map=Object.fromEntries(r.rows.map((x:any)=>[x.key,x.value??""]));
  return {name:map.company_name||"ROVIX CONSTRUMAX",logo:map.company_logo||""};
 }catch{
  return {name:"ROVIX CONSTRUMAX",logo:""};
 }
}

export default async function AppShell({children}:{children:React.ReactNode}){
 const user=await currentUser();
 if(!user)redirect("/login");
 const brand=await branding();
 const nav=user.role==="ADMIN"?[...items,["Administrativo","/admin"]]:items;
 return <div className="shell">
  <aside className="sidebar">
   {brand.logo&&<img className="sidebar-logo" src={brand.logo} alt="Logo"/>}
   <div className="brand">{brand.name}</div>
   <div className="tag">Gestão para materiais de construção</div>
   <nav className="nav">{nav.map(([n,h])=><Link key={h} href={h}>{n}</Link>)}</nav>
  </aside>
  <main className="main">
   <div className="top"><div><b>{user.name}</b><div className="muted">{user.role}</div></div><form action="/api/auth/logout" method="post"><button className="btn">Sair</button></form></div>
   {children}
  </main>
 </div>
}