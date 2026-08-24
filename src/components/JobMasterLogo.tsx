"use client";

import { GraduationCap } from "lucide-react";

interface JobMasterLogoProps {
  className?: string;
  size?: number;
}

export default function JobMasterLogo({ className = "w-10 h-10", size = 40 }: JobMasterLogoProps) {
  return (
    <div 
      className={`${className} bg-[#FF6A00] rounded-xl flex items-center justify-center text-white shadow-md shadow-orange-500/20 select-none shrink-0 overflow-hidden`}
      style={{ width: size, height: size }}
    >
      <GraduationCap 
        className="text-white stroke-[2.4]" 
        style={{ width: `${Math.round(size * 0.6)}px`, height: `${Math.round(size * 0.6)}px` }} 
      />
    </div>
  );
}
