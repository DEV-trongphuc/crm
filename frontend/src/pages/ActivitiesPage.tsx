import React, { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle2, Clock, Phone, Mail, Users, Calendar, AlignLeft, X, Loader2, Pencil, Trash2, RefreshCw, Link2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '../components/ui/Pagination';
import api from '../api/axios';

const PAGE_SIZE = 50;

const MOCK_ACTIVITIES: any[] = [
  { id: 1, type: 'call', subject: 'Gọi tư vấn triển khai ERP cho ABC Technology', status: 'done', priority: 'high', due_date: '2026-05-05T09:00:00', creator_name: 'Admin', related_type: 'contact', related_name: 'Nguyễn Văn An' },
  { id: 2, type: 'meeting', subject: 'Demo sản phẩm CRM cho GreenSolar Corp', status: 'planned', priority: 'high', due_date: '2026-05-07T14:00:00', creator_name: 'Sales Manager', related_type: 'company', related_name: 'GreenSolar Corp' },
  { id: 3, type: 'email', subject: 'Gửi báo giá dịch vụ tư vấn Q2/2026', status: 'done', priority: 'medium', due_date: '2026-05-04T11:00:00', creator_name: 'Admin', related_type: 'contact', related_name: 'Trần Thị Bình' },
  { id: 4, type: 'task', subject: 'Chuẩn bị tài liệu demo POS nhà hàng', status: 'planned', priority: 'medium', due_date: '2026-05-06T08:00:00', creator_name: 'Sales', related_type: null, related_name: null },
  { id: 5, type: 'note', subject: 'Ghi chú cuộc hữp chiến lược Q2 với Ban Giám đốc', status: 'done', priority: 'low', due_date: null, creator_name: 'Admin', related_type: null, related_name: null },
  { id: 6, type: 'call', subject: 'Follow-up sau demo sản phẩm với TechGlobal Ltd', status: 'planned', priority: 'high', due_date: '2026-05-08T10:00:00', creator_name: 'Sales Manager', related_type: 'company', related_name: 'TechGlobal Ltd' },
  { id: 7, type: 'email', subject: 'Gửi hợp đồng bảo trì cho Retail Pro Group', status: 'done', priority: 'medium', due_date: '2026-05-03T16:00:00', creator_name: 'Admin', related_type: 'company', related_name: 'Retail Pro Group' },
  { id: 8, type: 'meeting', subject: 'Kick-off dự án ERP với MegaStore Vietnam', status: 'planned', priority: 'high', due_date: '2026-05-10T09:00:00', creator_name: 'PM', related_type: 'company', related_name: 'MegaStore Vietnam' },
];

const TYPES = ['call', 'email', 'meeting', 'task', 'note'];
const T_LABEL: Record<string, string> = { call: 'Cuộc gọi', email: 'Email', meeting: 'Cuộc họp', task: 'Task', note: 'Ghi chú' };
const T_ICON: Record<string, React.ReactNode> = {
  call: <Phone size={14} />, email: <Mail size={14} />, meeting: <Users size={14} />,
  task: <CheckCircle2 size={14} />, note: <AlignLeft size={14} />
};
const T_COLOR: Record<string, string> = { call: '#3b82f6', email: '#8b5cf6', meeting: '#10b981', task: '#f59e0b', note: '#6b7280' };

const EMPTY = { type: 'call', subject: '', status: 'planned', priority: 'medium', due_date: '', related_type: '', related_id: '' };

const fmtDate = (d: string | null) => {
  if (!d) return null;
  const dt = new Date(d);
  const now = new Date();
  const diffMs = dt.getTime() - now.getTime();
  const diffH = Math.round(diffMs / 3600000);
  if (Math.abs(diffH) < 1) return 'Trong giờ này';
  if (diffH < 0 && diffH > -24) return `${Math.abs(diffH)}h trước`;
  if (diffH > 0 && diffH < 24) return `Còn ${diffH}h`;
  return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const ActivitiesPage: React.FC = () => {
  const { addToast, showConfirm } = useUIStore();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      const r = await api.get('/activities', { params });
      const data = r.data.data?.items || r.data.data || [];
      if (data.length === 0) { setItems(MOCK_ACTIVITIES); setTotal(MOCK_ACTIVITIES.length); }
      else { setItems(data); setTotal(r.data.data?.total || data.length); }
    } catch {
      setItems(MOCK_ACTIVITIES); setTotal(MOCK_ACTIVITIES.length);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const openCreate = () => { setEditItem(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (a: any) => { setEditItem(a); setForm({ ...a, due_date: a.due_date ? a.due_date.slice(0, 16) : '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.subject.trim()) { addToast('Nhập tiêu đề hoạt động', 'error'); return; }
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/activities/${editItem.id}`, form);
        addToast('Đã cập nhật hoạt động', 'success');
      } else {
        await api.post('/activities', form);
        addToast('Đã thêm hoạt động', 'success');
      }
      setShowModal(false);
      fetchActivities();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Lỗi khi lưu hoạt động', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (item: any) => {
    const newStatus = item.status === 'done' ? 'planned' : 'done';
    try {
      await api.put(`/activities/${item.id}`, { status: newStatus, done_at: newStatus === 'done' ? new Date().toISOString() : null });
      setItems(prev => prev.map(a => a.id === item.id ? { ...a, status: newStatus } : a));
    } catch {
      addToast('Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  const handleDelete = async (act: any) => {
    showConfirm(
      'Xóa hoạt động?',
      `Bạn có chắc chắn muốn xóa vĩnh viễn "${act.subject}"?`,
      async () => {
        try {
          await api.delete(`/activities/${act.id}`);
          addToast('Đã xóa hoạt động thành công', 'success');
          fetchActivities();
        } catch {
          addToast('Lỗi khi xóa hoạt động (Demo Mode)', 'error');
          setItems(prev => prev.filter(a => a.id !== act.id));
        }
      }
    );
  };

  const navigateToRelated = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.related_type || !item.related_id) return;
    const paths: Record<string, string> = { contact: '/contacts', company: '/companies', deal: '/deals' };
    if (paths[item.related_type]) navigate(paths[item.related_type]);
  };

  const doneCount = items.filter(a => a.status === 'done').length;
  const counts = TYPES.reduce((acc, t) => ({ ...acc, [t]: items.filter(a => a.type === t).length }), {} as Record<string, number>);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hoạt động & Lịch</h1>
          <p className="page-subtitle">{loading ? '...' : `${doneCount}/${total} đã hoàn thành`}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn outline sm" onClick={fetchActivities}><RefreshCw size={14} /></button>
          <button className="btn primary" onClick={openCreate}><Plus size={16} /> Thêm hoạt động</button>
        </div>
      </div>

      {/* Quick filter chips */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '4px' }}>
        {TYPES.map(t => (
          <button key={t} onClick={() => setFilterType(filterType === t ? '' : t)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: filterType === t ? T_COLOR[t] : 'var(--color-surface)', color: filterType === t ? 'white' : 'var(--color-text)', border: `1px solid ${filterType === t ? T_COLOR[t] : 'var(--color-border)'}`, borderRadius: 'var(--radius-full)', fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.2s', cursor: 'pointer' }}>
            <span style={{ color: filterType === t ? 'white' : T_COLOR[t] }}>{T_ICON[t]}</span>
            {T_LABEL[t]} <span style={{ opacity: 0.75 }}>({counts[t] || 0})</span>
          </button>
        ))}
        <button onClick={() => setFilterStatus(filterStatus === 'done' ? '' : 'done')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: filterStatus === 'done' ? 'var(--color-success)' : 'var(--color-surface)', color: filterStatus === 'done' ? 'white' : 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer' }}>
          <CheckCircle2 size={14} /> Đã xong
        </button>
      </div>

      {/* Skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      )}

      {/* Activities list */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <AnimatePresence>
            {items.filter(act => !search || act.subject.toLowerCase().includes(search.toLowerCase())).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(act => (
              <motion.div key={act.id} className="card"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} layout
                style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', opacity: act.status === 'done' ? 0.65 : 1 }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: T_COLOR[act.type] + '18', color: T_COLOR[act.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {T_ICON[act.type]}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', textDecoration: act.status === 'done' ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {act.subject}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{act.user_name || 'Bạn'}</span>
                    {act.due_date && (
                      <span style={{ fontSize: '0.75rem', color: new Date(act.due_date) < new Date() && act.status !== 'done' ? 'var(--color-danger)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} />{fmtDate(act.due_date)}
                      </span>
                    )}
                    <span className={`badge ${act.priority === 'high' ? 'danger' : act.priority === 'medium' ? 'warning' : 'info'}`}>
                      {act.priority === 'high' ? 'Cao' : act.priority === 'medium' ? 'TB' : 'Thấp'}
                    </span>
                    {act.related_type && (
                      <button onClick={e => navigateToRelated(act, e)}
                        style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Link2 size={11} />{act.related_type} #{act.related_id}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <button onClick={() => toggleDone(act)}
                    style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${act.status === 'done' ? 'var(--color-success)' : 'var(--color-border)'}`, background: act.status === 'done' ? 'var(--color-success)' : 'transparent', color: act.status === 'done' ? 'white' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <CheckCircle2 size={14} />
                  </button>
                  <button className="btn ghost sm" onClick={() => openEdit(act)}><Pencil size={13} /></button>
                  <button className="btn ghost sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(act)}><Trash2 size={13} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <div className="empty-state card">
              <Calendar size={40} />
              <h3>Không có hoạt động</h3>
              <p>Thêm hoạt động mới để bắt đầu theo dõi công việc</p>
              <button className="btn primary" style={{ marginTop: '1rem' }} onClick={openCreate}><Plus size={16} /> Thêm hoạt động</button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && items.length > PAGE_SIZE && (
        <div className="card" style={{ marginTop: '0.5rem' }}>
          <Pagination total={items.filter(act => !search || act.subject.toLowerCase().includes(search.toLowerCase())).length} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !saving && setShowModal(false)} />
            <motion.div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '520px', maxWidth: 'calc(100vw - 2rem)', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)', zIndex: 300 }}
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontWeight: 700 }}>{editItem ? 'Sửa hoạt động' : 'Thêm hoạt động'}</h3>
                <button onClick={() => setShowModal(false)} style={{ color: 'var(--color-text-muted)' }}><X size={18} /></button>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Type selector */}
                <div className="form-group">
                  <label className="form-label">Loại hoạt động</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {TYPES.map(t => (
                      <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                        style={{ padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-md)', border: `2px solid ${form.type === t ? T_COLOR[t] : 'var(--color-border)'}`, background: form.type === t ? T_COLOR[t] + '15' : 'transparent', color: form.type === t ? T_COLOR[t] : 'var(--color-text-light)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {T_ICON[t]} {T_LABEL[t]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tiêu đề *</label>
                  <input className="form-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Nội dung hoạt động..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Thời gian</label>
                    <input className="form-input" type="datetime-local" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ưu tiên</label>
                    <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Liên kết đến</label>
                    <select className="form-input" value={form.related_type} onChange={e => setForm({ ...form, related_type: e.target.value, related_id: '' })}>
                      <option value="">Không có</option>
                      <option value="contact">Khách hàng</option>
                      <option value="deal">Deal</option>
                      <option value="company">Công ty</option>
                    </select>
                  </div>
                  {form.related_type && (
                    <div className="form-group">
                      <label className="form-label">ID {form.related_type}</label>
                      <input className="form-input" type="number" placeholder="VD: 1" value={form.related_id} onChange={e => setForm({ ...form, related_id: e.target.value })} />
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1.25rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
                <button className="btn secondary" onClick={() => setShowModal(false)} disabled={saving}>Hủy</button>
                <button className="btn primary" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 size={14} className="spin" />}{editItem ? 'Lưu' : 'Thêm'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
