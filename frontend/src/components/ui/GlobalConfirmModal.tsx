import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export const GlobalConfirmModal: React.FC = () => {
  const { confirmModal, closeConfirm } = useUIStore();
  const { isOpen, title, message, confirmText = 'Xác nhận', cancelText = 'Hủy', isDanger, onConfirm, onCancel } = confirmModal;

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    closeConfirm();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeConfirm();
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }} onClick={handleCancel}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--color-surface)', width: '100%', maxWidth: '400px',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-2xl)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: isDanger ? 'var(--color-danger-light)' : 'var(--color-primary-light)',
              color: isDanger ? 'var(--color-danger)' : 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {isDanger ? <AlertTriangle size={24} /> : <Info size={24} />}
            </div>
            
            <div style={{ flex: 1, paddingTop: '0.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                {title}
              </h3>
              <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                {message}
              </p>
            </div>
          </div>

          {/* Footer actions */}
          <div style={{ 
            padding: '1rem 1.5rem', background: 'var(--color-background)',
            borderTop: '1px solid var(--color-border)', display: 'flex', 
            justifyContent: 'flex-end', gap: '0.75rem'
          }}>
            <button 
              onClick={handleCancel}
              style={{
                padding: '0.625rem 1rem', borderRadius: 'var(--radius-md)',
                background: 'transparent', border: '1px solid var(--color-border)',
                color: 'var(--color-text)', fontWeight: 600, fontSize: '0.875rem',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {cancelText}
            </button>
            <button 
              onClick={handleConfirm}
              style={{
                padding: '0.625rem 1rem', borderRadius: 'var(--radius-md)',
                background: isDanger ? 'var(--color-danger)' : 'var(--color-primary)', 
                border: 'none', color: '#fff', fontWeight: 600, fontSize: '0.875rem',
                cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
