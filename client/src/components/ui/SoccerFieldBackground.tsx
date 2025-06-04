import { cn } from "../../lib/utils";

interface SoccerFieldBackgroundProps {
  className?: string;
}

export function SoccerFieldBackground({ className }: SoccerFieldBackgroundProps) {
  return (
    <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      <svg
        viewBox="0 0 1000 600"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Background with gradient */}
        <defs>
          <linearGradient id="grassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#2d5a27", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#1a3d16", stopOpacity: 1 }} />
          </linearGradient>
          <pattern id="grassPattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <path
              d="M0,10 l10,-10 M-2.5,2.5 l5,-5 M7.5,12.5 l5,-5"
              strokeWidth="1"
              stroke="#ffffff10"
              strokeLinecap="square"
            />
          </pattern>
        </defs>

        {/* Main field */}
        <rect width="1000" height="600" fill="url(#grassGradient)" />
        <rect width="1000" height="600" fill="url(#grassPattern)" />

        {/* Field outline */}
        <rect
          x="50"
          y="50"
          width="900"
          height="500"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.3"
        />

        {/* Center circle */}
        <circle
          cx="500"
          cy="300"
          r="91.5"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.3"
        />
        <circle
          cx="500"
          cy="300"
          r="2"
          fill="white"
          fillOpacity="0.3"
        />

        {/* Center line */}
        <line
          x1="500"
          y1="50"
          x2="500"
          y2="550"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.3"
        />

        {/* Penalty areas */}
        <rect
          x="50"
          y="175"
          width="165"
          height="250"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.3"
        />
        <rect
          x="785"
          y="175"
          width="165"
          height="250"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.3"
        />

        {/* Goal areas */}
        <rect
          x="50"
          y="225"
          width="55"
          height="150"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.3"
        />
        <rect
          x="895"
          y="225"
          width="55"
          height="150"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.3"
        />

        {/* Corner arcs */}
        {[
          [50, 50],
          [950, 50],
          [50, 550],
          [950, 550],
        ].map(([x, y], i) => (
          <path
            key={i}
            d={`M ${x} ${y} ${x === 50 ? "h" : "h-"}10 a10,10 0 0 ${
              y === 50 ? "1" : "0"
            } ${x === 50 ? "1" : "0"},${y === 50 ? "10" : "-10"}`}
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeOpacity="0.3"
          />
        ))}

        {/* Penalty spots */}
        <circle
          cx="110"
          cy="300"
          r="2"
          fill="white"
          fillOpacity="0.3"
        />
        <circle
          cx="890"
          cy="300"
          r="2"
          fill="white"
          fillOpacity="0.3"
        />

        {/* Penalty arcs */}
        <path
          d="M 215 300 a 91.5 91.5 0 0 1 0 0.01"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.3"
        />
        <path
          d="M 785 300 a 91.5 91.5 0 0 0 0 0.01"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.3"
        />
      </svg>
    </div>
  );
}
