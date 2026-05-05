import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, LifeBuoy, AlertCircle, Clock, X, Save } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { TicketDrawer } from './TicketDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { DEV_MODE } from '../config/env';
import { useMockStore } from '../store/mockStore';
import { Skeleton, TableSkeleton } from '../components/ui/Skeleton';

const MOCK_TICKETS: any[] = [];

const TICKET_STATUSES = [
  { id: 'open', label: 'Mới mở', color: '#3b82f6' },
  { id: 'in_progress', label: 'Đang xử lý', color: '#f59e0b' },
  { id: 'waiting', label: 'Chờ phản hồi', color: '#8b5cf6' },
  { id: 'urgent', label: 'Khẩn cấp', color: '#ef4444' },
  { id: 'resolved', label: 'Đã giải quyết', color: '#10b981' },
];

const PRIORITIES = [
  { id: 'low', label: 'Thấp', color: '#10b981' },
  { id: 'medium', label: 'Trung bình', color: '#3b82f6' },
  { id: 'high', label: 'Cao', color: '#f59e0b' },
  { id: 'urgent', label: 'Khẩn cấp', color: '#ef4444' },
];

export const TicketsPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ subject: '', priority: 'medium', customer_name: '', description: '' });
  const [loading, setLoading] = useState(true);

  const [now] = useState(() => Date.now());

  const fetchTickets = async () => {
    setLoading(true);
    if (DEV_MODE) {
      setTickets(MOCK_TICKETS);
      setLoading(false);
      return;
    }
    try {
      const r = await api.get('/tickets');
      const items = r.data.data?.items || r.data.data || [];
      setTickets(items);
    } catch {
      setTickets([]);
      addToast('Không thể kết nối với máy chủ Backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (DEV_MODE) {
      setTickets(useMockStore.getState().tickets);
      setLoading(false);
      return;
    }
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.customer_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [tickets, search, filterStatus]);

  const handleUpdate = async (updated: any) => {
    try {
      await api.put(`/tickets/${updated.id}`, updated);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (e: any) {
      addToast(e.response?.data?.message || 'Không thể cập nhật Ticket', 'error');
    }
  };

  const handleCreateTicket = async () => {
    if (!createForm.subject || !createForm.customer_name) {
      addToast('Vui lòng nhập tiêu đề và tên khách hàng', 'error');
      return;
    }
    const payload = {
      subject: createForm.subject,
      status: 'open',
      priority: createForm.priority,
      customer_name: createForm.customer_name,
      description: createForm.description
    };
    try {
      const r = await api.post('/tickets', payload);
      const newTicket = r.data.data || { ...payload, id: Date.now(), assignee_name: 'Admin', created_at: new Date().toISOString(), due_date: new Date(Date.now() + 86400000).toISOString() };
      setTickets([newTicket, ...tickets]);
      setShowCreateModal(false);
      setCreateForm({ subject: '', priority: 'medium', customer_name: '', description: '' });
      addToast('Đã tạo Ticket thành công', 'success');
    } catch (e: any) {
      addToast(e.response?.data?.message || 'Không thể tạo Ticket do lỗi mạng', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LifeBuoy size={28} color="var(--color-primary)" />
            Hỗ trợ / Khiếu nại (Tickets)
          </h1>
          <p className="page-subtitle">Quản lý các yêu cầu hỗ trợ và khiếu nại từ khách hàng</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Tạo Ticket
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
          <div className="filter-search" style={{ flex: 1 }}>
            <Search size={18} className="text-light" />
            <input className="form-input" placeholder="Tìm theo ID, tiêu đề, tên khách hàng..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-input" style={{ width: '180px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            {TICKET_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-bg)', padding: '4px', borderRadius: '8px' }}>
          <button className={`btn ghost sm ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`} onClick={() => setViewMode('list')}>List</button>
          <button className={`btn ghost sm ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`} onClick={() => setViewMode('kanban')}>Kanban</button>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <TableSkeleton rows={8} cols={6} />
        </div>
      ) : viewMode === 'list' ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-light)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>Mã & Tiêu đề</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-light)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>Khách hàng</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-light)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>Phụ trách</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-light)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>Độ ưu tiên</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-light)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>Trạng thái</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-light)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>SLA (Hạn chót)</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map(t => (
                <motion.tr 
                  key={t.id} 
                  whileHover={{ backgroundColor: 'var(--color-bg)' }}
                  onClick={() => setSelectedTicket(t)}
                  style={{ borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <AlertCircle size={16} color={PRIORITIES.find(p => p.id === t.priority)?.color} style={{ marginTop: '2px' }} />
                      <div>
                        <p style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.9rem', marginBottom: '2px' }}>{t.subject}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600 }}>#{t.id} • Tạo: {new Date(t.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>{t.customer_name}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="avatar-placeholder sm" style={{ width: 24, height: 24, fontSize: '0.6rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>{t.assignee_name[0]}</div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t.assignee_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge" style={{ background: PRIORITIES.find(p => p.id === t.priority)?.color + '20', color: PRIORITIES.find(p => p.id === t.priority)?.color }}>
                      {PRIORITIES.find(p => p.id === t.priority)?.label}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge" style={{ background: TICKET_STATUSES.find(p => p.id === t.status)?.color + '20', color: TICKET_STATUSES.find(p => p.id === t.status)?.color }}>
                      {TICKET_STATUSES.find(p => p.id === t.status)?.label}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600, color: new Date(t.due_date).getTime() < now ? 'var(--color-danger)' : 'var(--color-text)' }}>
                    {new Date(t.due_date).toLocaleDateString('vi-VN')}
                  </td>
                </motion.tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Không tìm thấy Ticket nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', minHeight: '600px' }}>
          {TICKET_STATUSES.map(col => {
            const colTickets = filteredTickets.filter(t => t.status === col.id);
            return (
              <div key={col.id} style={{ flex: '0 0 300px', background: 'var(--color-bg)', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '0.9rem', color: col.color }}>{col.label}</h3>
                  <span style={{ background: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid var(--color-border)' }}>{colTickets.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {colTickets.map(t => (
                    <motion.div 
                      key={t.id} 
                      layout
                      whileHover={{ y: -2 }}
                      onClick={() => setSelectedTicket(t)}
                      style={{ background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', borderLeft: `3px solid ${PRIORITIES.find(p => p.id === t.priority)?.color}` }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>#{t.id}</span>
                        <div className="avatar-placeholder sm" title={t.assignee_name} style={{ width: 20, height: 20, fontSize: '0.6rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>{t.assignee_name[0]}</div>
                      </div>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>{t.subject}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600 }}>{t.customer_name}</span>
                        <span style={{ fontSize: '0.7rem', color: new Date(t.due_date).getTime() < Date.now() ? 'var(--color-danger)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {new Date(t.due_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {colTickets.length === 0 && (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.8rem', border: '1px dashed var(--color-border)', borderRadius: '12px' }}>Kéo thả ticket vào đây</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TicketDrawer
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        ticket={selectedTicket}
        onUpdate={handleUpdate}
      />

      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} style={{ zIndex: 300 }} />
            <motion.div className="modal-sheet" style={{ position: 'fixed', top: '50%', left: '50%', width: 500, maxWidth: 'calc(100vw - 2rem)', zIndex: 310 }}
              initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }} exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Tạo Ticket Hỗ trợ mới</h3>
                <button onClick={() => setShowCreateModal(false)} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tên khách hàng *</label>
                  <input className="form-input" placeholder="VD: Công ty TNHH ABC..." value={createForm.customer_name} onChange={e => setCreateForm({...createForm, customer_name: e.target.value})} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Tiêu đề vấn đề (Subject) *</label>
                  <input className="form-input" placeholder="Tóm tắt ngắn gọn vấn đề khách gặp phải" value={createForm.subject} onChange={e => setCreateForm({...createForm, subject: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Độ ưu tiên</label>
                  <select className="form-input" value={createForm.priority} onChange={e => setCreateForm({...createForm, priority: e.target.value})}>
                    {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả chi tiết</label>
                  <textarea className="form-input" placeholder="Nhập chi tiết về lỗi hoặc yêu cầu hỗ trợ..." rows={4} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} style={{ resize: 'none' }} />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                <button className="btn outline" onClick={() => setShowCreateModal(false)}>Hủy bỏ</button>
                <button className="btn primary" onClick={handleCreateTicket}><Save size={14} /> Tạo Ticket</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
