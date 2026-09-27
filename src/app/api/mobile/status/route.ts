import { query } from "@/lib/db";
import { ok,fail } from "@/lib/http";
export async function GET(){
 try{
  const r=await query("SELECT value FROM app_settings WHERE key='mobile_enabled'");
  const enabled=r.rows[0]?.value!=="false";
  return ok({service:"ROVIX CONSTRUMAX Mobile",available:enabled,schema_version:1,app_version:"1.3.0",internet_required:false});
 }catch(e){return fail(e)}
}
