"use client";

import { useEffect, useMemo, useState } from "react";

const CLOUDS = [
  { x: 6, y: 28, w: 48, h: 26, blur: 30, opacity: 0.5, duration: 46 },
  { x: 48, y: 12, w: 56, h: 30, blur: 40, opacity: 0.38, duration: 62 },
  { x: 22, y: 42, w: 66, h: 34, blur: 48, opacity: 0.45, duration: 78 },
  { x: 64, y: 34, w: 42, h: 24, blur: 32, opacity: 0.35, duration: 54 },
  { x: 8, y: 56, w: 52, h: 28, blur: 44, opacity: 0.3, duration: 90 },
];

function getSky(hour: number) {
  const isNight = hour < 6 || hour >= 20;
  const isEvening = hour >= 17.5 && hour < 20;

  if (isNight) {
    return {
      gradient:
        "linear-gradient(180deg,#070b15 0%,#0a1020 22%,#0d1426 40%,#10131f 58%,#171826 100%)",
      cloud: "rgba(86,100,130,0.34)",
      text: "rgba(248,250,252,0.96)",
      mutedText: "rgba(232,236,245,0.68)",
      sunOpacity: 0,
      moonOpacity: 1,
    };
  }

  if (isEvening) {
    return {
      gradient:
        "linear-gradient(180deg,#7b1c36 0%,#a7292f 22%,#c3312c 40%,#e7452d 58%,#f8ddc6 100%)",
      cloud: "rgba(255,255,255,0.36)",
      text: "rgba(248,250,252,0.96)",
      mutedText: "rgba(248,250,252,0.72)",
      sunOpacity: 0.8,
      moonOpacity: 0,
    };
  }

  return {
    gradient:
      "linear-gradient(180deg,#4b7fd4 0%,#6a9be3 22%,#7caef6 40%,#a6c9f3 58%,#e9f2fb 78%,#ffffff 100%)",
    cloud: "rgba(255,255,255,0.5)",
    text: "rgba(18,20,26,0.94)",
    mutedText: "rgba(22,25,32,0.64)",
    sunOpacity: 0.9,
    moonOpacity: 0,
  };
}

export function ShiftHomeBackground() {
  const [hour, setHour] = useState(13);

  useEffect(() => {
    function syncToLocalTime() {
      const now = new Date();
      setHour(now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600);
    }

    syncToLocalTime();
    const timer = window.setInterval(syncToLocalTime, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const sky = useMemo(() => getSky(hour), [hour]);

  useEffect(() => {
    document.documentElement.style.setProperty("--shift-home-text", sky.text);
    document.documentElement.style.setProperty(
      "--shift-home-muted",
      sky.mutedText,
    );
    return () => {
      document.documentElement.style.removeProperty("--shift-home-text");
      document.documentElement.style.removeProperty("--shift-home-muted");
    };
  }, [sky.mutedText, sky.text]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{ background: sky.gradient }}
      />

      <div
        className="absolute top-[18%] left-[78%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000"
        style={{ opacity: sky.sunOpacity }}
      >
        <div className="absolute top-1/2 left-1/2 size-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,247,214,0.9)_0%,transparent_62%)] opacity-55 lg:size-[680px]" />
        <div className="relative size-24 rounded-full bg-[radial-gradient(circle,#fff_0%,#fff0ca_48%,transparent_78%)] blur-[2px] lg:size-32" />
      </div>

      <div
        className="absolute top-[18%] left-[78%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000"
        style={{ opacity: sky.moonOpacity }}
      >
        <div className="absolute top-1/2 left-1/2 size-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,243,230,0.22)_0%,transparent_60%)]" />
        <div className="size-16 rounded-full bg-[radial-gradient(circle_at_38%_38%,#fdfbf2_0%,#e7e2d2_55%,#ccc6b4_100%)] shadow-[0_0_50px_14px_rgba(245,243,230,0.35)] lg:size-20" />
      </div>

      {CLOUDS.map((cloud, index) => (
        <div
          key={`${cloud.x}-${cloud.y}`}
          className="absolute rounded-full"
          style={{
            left: `${cloud.x}%`,
            top: `${cloud.y}%`,
            width: `${cloud.w}%`,
            height: `${cloud.h}%`,
            background: `radial-gradient(ellipse at center,${sky.cloud} 0%,transparent 70%)`,
            filter: `blur(${cloud.blur}px)`,
            opacity: cloud.opacity,
            animation: `shiftbrief-sky-drift ${cloud.duration}s ease-in-out ${index * -8}s infinite alternate`,
          }}
        />
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_75%_12%,rgba(255,255,255,0.16)_0%,transparent_58%),radial-gradient(80%_60%_at_10%_85%,rgba(15,23,42,0.16)_0%,transparent_64%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_60%,rgba(0,0,0,0.06)_100%)]" />
    </div>
  );
}
