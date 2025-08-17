import React from "react";

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl">
      {/* Rotating Ring */}
      <div className="relative mb-6">
        <svg
          className="animate-avax-rotate"
          width="112"
          height="112"
          viewBox="0 0 112 112"
          aria-hidden="true"
        >
          <circle cx="56" cy="56" r="50" fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth="4" />
          <path
            d="M56 6 A50 50 0 0 1 106 56"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        {/* AVAX Triangle */}
        <svg
          className="absolute inset-0 m-auto animate-avax-pulse"
          width="88"
          height="88"
          viewBox="0 0 100 100"
          role="img"
          aria-label="Loading"
        >
          <defs>
            <linearGradient id="avaxGrad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
            </linearGradient>
          </defs>
          <polygon
            points="50,12 90,85 10,85"
            fill="url(#avaxGrad)"
            opacity="0.95"
          />
          <polygon
            points="50,28 77,80 23,80"
            fill="hsl(var(--background))"
            opacity="0.9"
          />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">Loading</p>
        <p className="mt-1 text-lg font-semibold gradient-text">Avalanche experience</p>
      </div>
    </div>
  );
};

export default Loader;
