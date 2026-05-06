import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Users, Building2, Briefcase, ArrowRight, Loader2, Phone, Mail, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface SearchResult {
  contacts?: any[];
  companies?: any[];
  deals?: any[];
}

export const GlobalSearchModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults({}); return; }
    setLoading(true);
    try {
      const r = await api.get('/search', { params: { q } });
      setResults(r.data.data || {});
    } catch {
      setResults({});
      // Optional: could show toast, but global search usually fails silently to avoid spam.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const goTo = (path: string) => { navigate(path); onClose(); };

  const hasResults = Object.values(results).some((arr: any) => arr?.length > 0);

  return (
    <>
      <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -20 }}
        transition={{ duration: 0.18 }}
        style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 640, maxWidth: 'calc(100vw - 2rem)', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)', zIndex: 600, overflow: 'hidden' }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          {loading ? <Loader2 size={18} className="spin" style={{ color: 'var(--color-primary)', flexShrink: 0 }} /> : <Search size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />}
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm khách hàng, deal, công ty..."
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '1rem', outline: 'none', color: 'var(--color-text)' }}
          />
          {query && <button onClick={() => setQuery('')} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>}
          <kbd style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '2px 6px' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 460, overflowY: 'auto' }}>
          {/* Suggestions (empty state) */}
          {!query && (
            <div style={{ padding: '1.5rem 1.25rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Tìm kiếm gợi ý</p>
              {['Nguyễn Văn An', 'Deal ERP', 'ABC Tech', 'Quá hạn hôm nay'].map(s => (
                <button key={s} onClick={() => setQuery(s)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)', fontSize: '0.875rem', textAlign: 'left' }}>
                  <Search size={14} style={{ flexShrink: 0 }} /> {s}
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !loading && !hasResults && (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Search size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.875rem' }}>Không tìm thấy kết quả cho "<strong>{query}</strong>"</p>
            </div>
          )}

          {/* Results grouped */}
          {results.contacts && results.contacts.length > 0 && (
            <ResultGroup icon={<Users size={14} />} label="Khách hàng" color="#3b82f6">
              {results.contacts.slice(0, 4).map((c: any) => (
                <ResultItem 
                  key={c.id} 
                  title={`${c.first_name} ${c.last_name}`} 
                  subtitle={c.email || c.phone || ''} 
                  onClick={() => goTo('/contacts')} 
                  actions={[
                    { icon: <Phone size={12} />, label: 'Gọi điện', onClick: () => window.location.href = `tel:${c.phone}` },
                    { icon: <Mail size={12} />, label: 'Gửi Email', onClick: () => window.location.href = `mailto:${c.email}` },
                    { icon: <Plus size={12} />, label: 'Tạo Deal', onClick: () => goTo('/deals') }
                  ]}
                />
              ))}
            </ResultGroup>
          )}
          {results.companies && results.companies.length > 0 && (
            <ResultGroup icon={<Building2 size={14} />} label="Công ty" color="#8b5cf6">
              {results.companies.slice(0, 3).map((c: any) => (
                <ResultItem 
                  key={c.id} 
                  title={c.name} 
                  subtitle={c.industry || c.city || ''} 
                  onClick={() => goTo('/companies')} 
                  actions={[
                    { icon: <Plus size={12} />, label: 'Tạo Deal', onClick: () => goTo('/deals') }
                  ]}
                />
              ))}
            </ResultGroup>
          )}
          {results.deals && results.deals.length > 0 && (
            <ResultGroup icon={<Briefcase size={14} />} label="Deals" color="#10b981">
              {results.deals.slice(0, 3).map((d: any) => (
                <ResultItem 
                  key={d.id} 
                  title={d.title} 
                  subtitle={`${Number(d.value || 0).toLocaleString('vi-VN')} đ`} 
                  onClick={() => goTo('/deals')} 
                />
              ))}
            </ResultGroup>
          )}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          <span>↵ Mở</span><span>↑↓ Điều hướng</span><span>ESC Đóng</span>
        </div>
      </motion.div>
    </>
  );
};

const ResultGroup: React.FC<{ icon: React.ReactNode; label: string; color: string; children: React.ReactNode }> = ({ icon, label, color, children }) => (
  <div style={{ padding: '0.75rem 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1.25rem 0.5rem', color, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {icon} {label}
    </div>
    {children}
  </div>
);

const ResultItem: React.FC<{ 
  title: string; 
  subtitle: string; 
  onClick: () => void;
  actions?: { icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void }[]
}> = ({ title, subtitle, onClick, actions }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        width: '100%', 
        padding: '0.625rem 1.25rem', 
        background: isHovered ? 'var(--color-bg)' : 'none', 
        border: 'none', 
        cursor: 'pointer', 
        textAlign: 'left',
        transition: 'background 0.15s ease'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '1px' }}>{title}</p>
        {subtitle && <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isHovered && actions && actions.map((action, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            className="btn-icon sm"
            style={{ borderRadius: '8px', width: '28px', height: '28px' }}
            onClick={(e) => { e.stopPropagation(); action.onClick(e); }}
            title={action.label}
          >
            {action.icon}
          </motion.div>
        ))}
        <ArrowRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0, opacity: isHovered ? 1 : 0.4, transition: 'opacity 0.2s' }} />
      </div>
    </button>
  );
};
