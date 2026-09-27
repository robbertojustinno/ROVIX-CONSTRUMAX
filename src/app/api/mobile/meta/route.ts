import { query } from "@/lib/db";
import { requireMobileDevice } from "@/lib/mobile-auth";
import { ok,fail } from "@/lib/http";
export async function GET(){
 try{
  await requireMobileDevice();
  const [refs,warehouses]=await Promise.all([
    query("SELECT id,kind,code,name FROM reference_values WHERE active=true ORDER BY kind,name"),
    query("SELECT id,name FROM warehouses WHERE active=true ORDER BY name")
  ]);
  return ok({references:refs.rows,warehouses:warehouses.rows});
 }catch(e){return fail(e)}
}
