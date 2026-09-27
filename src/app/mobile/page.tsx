import { currentMobileDevice } from "@/lib/mobile-auth";
import { redirect } from "next/navigation";
import MobileClient from "@/components/MobileClient";

export default async function MobilePage(){
  const device=await currentMobileDevice();
  if(!device) redirect("/mobile/connect");
  return <MobileClient userName={device.name} role="DISPOSITIVO PAREADO"/>;
}
