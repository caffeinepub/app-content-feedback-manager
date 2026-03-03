import React from 'react';

interface MetricsDonutChartProps {
  usedTemplates: number;
  totalTemplates: number;
  size?: number;
  strokeWidth?: number;
}

export function MetricsDonutChart({
  usedTemplates,
  totalTemplates,
  size = 64,
  strokeWidth = 8,
}: MetricsDonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = totalTemplates > 0 ? usedTemplates / totalTemplates : 0;
  const usedDash = percent * circumference;
  const availableDash = circumference - usedDash;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={0}
      />
      {/* Used portion */}
      {usedDash > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-primary"
          strokeDasharray={`${usedDash} ${availableDash}`}
          strokeDashoffset={0}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default MetricsDonutChart;
