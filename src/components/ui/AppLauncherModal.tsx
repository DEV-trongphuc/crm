import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, X, LayoutGrid } from 'lucide-react';

interface NavItem {
  to: string;
  icon: any;
  label: string;
}

interface AppLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
}

export const AppLauncherModal: React.FC<AppLauncherModalProps> = ({ isOpen, onClose, items }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearch('');
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (to: string) => {
    navigate(to);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="overlay-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ zIndex: 1000 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-40%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-40%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '900px',
              maxWidth: 'calc(100vw - 2rem)',
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '32px',
              boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
              zIndex: 1001,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header / Search */}
            <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '16px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}>
                  <img src="/LOGO.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Trình khởi chạy</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Truy cập nhanh các chức năng hệ thống</p>
                </div>
                <button onClick={onClose} style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm kiếm chức năng..."
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem 0.875rem 3rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'white',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                />
              </div>
            </div>

            {/* Grid Area */}
            <div style={{ padding: '1.5rem 2.5rem 2.5rem', maxHeight: '70vh', overflowY: 'auto' }} className="no-scrollbar">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1.25rem' }}>
                {filteredItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.to}
                      whileHover={{ y: -4, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelect(item.to)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        padding: '1.25rem 0.75rem',
                        borderRadius: '20px',
                        background: 'white',
                        border: '1px solid rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{ 
                        width: 44, 
                        height: 44, 
                        borderRadius: '14px', 
                        background: 'linear-gradient(135deg, var(--color-primary), #4f46e5)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                      }}>
                        <Icon size={22} />
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', textAlign: 'center' }}>{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
              
              {filteredItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                  <Search size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>Không tìm thấy chức năng nào phù hợp</p>
                </div>
              )}
            </div>
            
            <div style={{ padding: '1rem 2rem', background: 'rgba(0,0,0,0.02)', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Nhấn ESC để đóng nhanh</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
