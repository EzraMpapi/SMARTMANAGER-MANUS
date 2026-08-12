import React from "react";

export function AnimatedGoldMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
      <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C9A96E" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#D4B87F" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#C9A96E" stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <g stroke="url(#gold-grad)" strokeWidth="1.2" fill="none" filter="url(#glow)">
          <path className="animate-pulse" d="M0,50 Q400,150 800,80 T1600,120" />
          <path className="animate-pulse" style={{ animationDuration: "6s" }} d="M0,150 Q500,280 1000,180 T2000,220" />
          <path className="animate-pulse" style={{ animationDuration: "8s" }} d="M0,250 Q350,80 900,300 T1800,150" />
          <circle cx="250" cy="80" r="4" fill="#C9A96E" className="animate-ping" />
          <circle cx="750" cy="180" r="3" fill="#C9A96E" className="animate-ping" style={{ animationDuration: "4s" }} />
          <circle cx="1200" cy="120" r="4" fill="#C9A96E" className="animate-ping" style={{ animationDuration: "5s" }} />
        </g>
      </svg>
    </div>
  );
}
