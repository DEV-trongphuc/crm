import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export const GlobalConfirmModal: React.FC = () => {
  const { confirmModal, closeConfirm } = useUIStore();
  const { isOpen, title, message, confirmText = 'Xác nhận', cancelText = 'Hủy', isDanger, impactInfo, requireWordMatch, onConfirm, onCancel } = confirmModal;
  const [matchInput, setMatchInput] = React.useState('');

  React.useEffect(() => {
    if (isOpen) setMatchInput('');
  }, [isOpen]);

  if (!isOpen) return null;

  const isLocked = requireWordMatch && matchInput !== requireWordMatch;

  const handleConfirm = () => {
    if (isLocked) return;
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
            background: 'var(--color-surface)', width: '100%', maxWidth: '420px',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-2xl)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(124, 58, 237, 0.1)',
              color: isDanger ? '#ef4444' : '#7c3aed',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {isDanger ? <AlertTriangle size={24} /> : <Info size={24} />}
            </div>
            
            <div style={{ flex: 1, paddingTop: '0.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                {title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                {message}
              </p>

              {impactInfo && (
                <div style={{ 
                  background: 'rgba(245, 158, 11, 0.08)', 
                  border: '1px solid rgba(245, 158, 11, 0.2)', 
                  padding: '0.75rem', 
                  borderRadius: '12px',
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '1rem'
                }}>
                  <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 600 }}>{impactInfo}</span>
                </div>
              )}

              {requireWordMatch && (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
                    Nhập <span style={{ color: 'var(--color-danger)' }}>"{requireWordMatch}"</span> để xác nhận
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`Nhập ${requireWordMatch}...`}
                    value={matchInput}
                    onChange={(e) => setMatchInput(e.target.value)}
                    style={{ 
                      textAlign: 'center', 
                      letterSpacing: '0.1em', 
                      fontWeight: 800,
                      borderColor: matchInput === requireWordMatch ? 'var(--color-success)' : 'var(--color-border)'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div style={{ 
            padding: '1.25rem 1.5rem', background: 'var(--color-bg)',
            borderTop: '1px solid var(--color-border)', display: 'flex', 
            justifyContent: 'flex-end', gap: '0.75rem'
          }}>
            <button 
              className="btn secondary sm"
              onClick={handleCancel}
              style={{ fontWeight: 600 }}
            >
              {cancelText}
            </button>
            <button 
              className={`btn ${isDanger ? 'danger' : 'primary'} sm`}
              onClick={handleConfirm}
              disabled={isLocked}
              style={{ 
                minWidth: '100px', 
                opacity: isLocked ? 0.5 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer'
              }}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>

  );
};
