"use client";

import React, { useState, useEffect } from "react";
import { User } from "lucide-react";

interface ProfileImageProps {
  src?: string;
  alt?: string;
  className?: string;
  fallbackName?: string;
  size?: number;
}

export default function ProfileImage({
  src,
  alt = "Profile Avatar",
  className = "w-10 h-10 rounded-full",
  fallbackName = "U",
  size = 40,
}: ProfileImageProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setHasError(false);

    // 1. Check local storage cache first
    let localAvatar = "";
    if (typeof window !== "undefined") {
      localAvatar = localStorage.getItem("job_master_user_avatar") || localStorage.getItem("job_master_cached_avatar") || "";
    }

    const effectiveSrc = (src && src.trim()) || localAvatar;

    if (!effectiveSrc) {
      setImageSrc("");
      return;
    }

    // 2. Save effective avatar to localStorage if it came from Google/Gmail metadata
    if (typeof window !== "undefined" && src && src.trim()) {
      try {
        localStorage.setItem("job_master_user_avatar", src.trim());
      } catch (e) {}
    }

    setImageSrc(effectiveSrc);
  }, [src]);

  // Extract initials from fallback name
  const getInitials = (name: string) => {
    if (!name) return "JM";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (!imageSrc || hasError) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-[#FF6A00] to-[#FF4E00] text-white flex items-center justify-center font-black select-none shrink-0 border border-orange-200 shadow-2xs`}
        style={{ width: size, height: size }}
        title={fallbackName}
      >
        {fallbackName ? (
          <span className="text-xs sm:text-sm font-extrabold tracking-tight">
            {getInitials(fallbackName)}
          </span>
        ) : (
          <User className="w-1/2 h-1/2" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden shrink-0 ${className}`} style={{ width: size, height: size }}>
      <img
        src={imageSrc}
        alt={alt}
        className="w-full h-full object-cover rounded-full"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
}
