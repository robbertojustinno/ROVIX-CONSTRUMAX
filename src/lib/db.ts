import { Pool, PoolClient, QueryResultRow } from "pg";
const globalForDb = globalThis as unknown as { rovixPool?: Pool };
export const pool = globalForDb.rovixPool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") globalForDb.rovixPool = pool;
export async function query<T extends QueryResultRow = QueryResultRow>(text:string, params:unknown[]=[]){ return pool.query<T>(text, params); }
export async function tx<T>(fn:(client:PoolClient)=>Promise<T>):Promise<T>{ const client=await pool.connect(); try{ await client.query("BEGIN"); const out=await fn(client); await client.query("COMMIT"); return out; }catch(e){ await client.query("ROLLBACK"); throw e; }finally{ client.release(); } }
