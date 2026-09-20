import Link from "next/link";import { currentUser } from "@/lib/auth";import { redirect } from "next/navigation";
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
export default async function AppShell({children}:{children:React.ReactNode}){const user=await currentUser();if(!user)redirect("/login");return <div className="shell"><aside className="sidebar"><div className="brand">ROVIX CONSTRUMAX</div><div className="tag">Gestão para materiais de construção</div><nav className="nav">{items.map(([n,h])=><Link key={h} href={h}>{n}</Link>)}</nav></aside><main className="main"><div className="top"><div><b>{user.name}</b><div className="muted">{user.role}</div></div><form action="/api/auth/logout" method="post"><button className="btn">Sair</button></form></div>{children}</main></div>}