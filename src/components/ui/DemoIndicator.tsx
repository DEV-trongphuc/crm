import React from 'react';
import { DEV_MODE } from '../../config/env';
import { AlertCircle, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export const DemoIndicator: React.FC = () => {
  if (!DEV_MODE) return null;

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }}
      style={{
        position: 'fixed',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <div style={{
        background: 'rgba(30, 10, 60, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(124, 58, 237, 0.3)',
        padding: '6px 16px',
        borderRadius: '99px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        color: 'white'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 20,
          height: 20,
          background: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }}>
          <Terminal size={12} />
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.02em' }}>
          DEMO MODE: <span style={{ color: '#a78bfa' }}>INTERACTIVE MOCKUP ACTIVE</span>
        </span>
        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
        <AlertCircle size={14} style={{ color: 'var(--color-warning)' }} />
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
          Dữ liệu tạm thời (In-memory)
        </span>
      </div>
    </motion.div>
  );
};
