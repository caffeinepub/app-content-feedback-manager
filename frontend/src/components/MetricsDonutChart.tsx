import React from "react";

interface MetricsDonutChartProps {
  usedTemplates: number;
  totalTemplates: number;
  size?: number;
  strokeWidth?: number;
}

export function MetricsDonutChart({
  usedTemplates,
  totalTemplates,
  size = 80,
  strokeWidth = 10,
}: MetricsDonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const percentage = totalTemplates > 0 ? (usedTemplates / totalTemplates) * 100 : 0;
  const filledLength = (percentage / 100) * circumference;
  const gapLength = circumference - filledLength;

  // Rotate so arc starts at top (12 o'clock)
  const rotation = -90;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${Math.round(percentage)}% used`}
    >
      {/* Background track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="oklch(0.25 0.04 240)"
        strokeWidth={strokeWidth}
      />
      {/* Filled arc (used) */}
      {percentage > 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#donutGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${filledLength} ${gapLength}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${center} ${center})`}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      )}
      {/* Gradient definition */}
      <defs>
        <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.55 0.2 220)" />
          <stop offset="100%" stopColor="oklch(0.68 0.2 155)" />
        </linearGradient>
      </defs>
      {/* Center text */}
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.2}
        fontWeight="bold"
        fill="oklch(0.9 0.01 240)"
      >
        {Math.round(percentage)}%
      </text>
    </svg>
  );
}
