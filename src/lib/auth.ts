import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
export type Role="ADMIN"|"MANAGER"|"CASHIER"|"STOCK"|"VIEWER";
export type SessionUser={id:number;name:string;email:string;role:Role};
const COOKIE="rovix_session";
function secret(){const v=process.env.JWT_SECRET;if(!v||v.length<24)throw new Error("JWT_SECRET não configurado ou muito curto");return v;}
export function signSession(user:SessionUser){return jwt.sign(user,secret(),{expiresIn:"8h"});}
export async function setSession(token:string){(await cookies()).set(COOKIE,token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:28800});}
export async function clearSession(){(await cookies()).delete(COOKIE);}
export async function currentUser():Promise<SessionUser|null>{const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;try{return jwt.verify(token,secret()) as SessionUser}catch{return null}}
export async function requireUser(roles?:Role[]){const user=await currentUser();if(!user)throw new Error("UNAUTHORIZED");if(roles&&!roles.includes(user.role))throw new Error("FORBIDDEN");return user;}
