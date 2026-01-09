"use client";
import { AuthComponent } from "@/components/ui/sign-up";
import Image from "next/image";
// A simple placeholder logo for demonstration
const CustomLogo = () => (
  <div className="bg-white text-black rounded-md p-1.5">
    <Image src="/logo.png" alt="logo" width={50} height={50} />
  </div>
);

export default function CustomAuthDemo() {
  return <AuthComponent logo={<CustomLogo />} brandName="COCO" />;
}
