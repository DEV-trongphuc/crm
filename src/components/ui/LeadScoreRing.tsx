import React from 'react';

interface LeadScoreRingProps {
  score: number;   // 0-100
  size?: number;
  showLabel?: boolean;
}

export const LeadScoreRing: React.FC<LeadScoreRingProps> = ({ score, size = 52, showLabel = true }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  // Color gradient based on score
  const color =
    score >= 80 ? '#10b981' :
    score >= 60 ? '#f59e0b' :
    score >= 40 ? '#3b82f6' :
    score >= 20 ? '#8b5cf6' : '#ef4444';

  const label =
    score >= 80 ? 'Nóng' :
    score >= 60 ? 'Ấm' :
    score >= 40 ? 'Bình' :
    score >= 20 ? 'Nguội' : 'Lạnh';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }} title={`Lead Score: ${score}/100 — ${label}`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={5}
        />
        {/* Score ring */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      {showLabel && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          lineHeight: 1,
        }}>
          <span style={{ fontSize: size < 44 ? '0.6rem' : '0.75rem', fontWeight: 800, color }}>{score}</span>
        </div>
      )}
    </div>
  );
};
