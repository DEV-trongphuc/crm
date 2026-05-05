import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '1rem', 
  borderRadius = 'var(--radius-md)',
  className = '',
  style = {} 
}) => {
  return (
    <div 
      className={`skeleton ${className}`} 
      style={{ 
        width, 
        height, 
        borderRadius,
        ...style 
      }} 
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '1rem' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} height="1.25rem" width={`${Math.random() * 50 + 50}%`} />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="card" style={{ padding: '1.5rem' }}>
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
      <Skeleton width={48} height={48} borderRadius="12px" />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height="1rem" style={{ marginBottom: '0.5rem' }} />
        <Skeleton width="40%" height="0.75rem" />
      </div>
    </div>
    <Skeleton width="100%" height="0.75rem" style={{ marginBottom: '0.5rem' }} />
    <Skeleton width="80%" height="0.75rem" />
  </div>
);
