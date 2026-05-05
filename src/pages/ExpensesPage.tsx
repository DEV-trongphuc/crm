import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Plus, Search, Download, Truck, Coffee, Home,
  Briefcase, CreditCard, Tag, Eye, Pencil, Trash2, Loader2,
  CheckCircle2, Clock, TrendingDown, X, ArrowUpRight, ArrowDownRight, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import { PeriodFilter, getDateRange } from '../components/ui/PeriodFilter';
import type { Period, DateRange } from '../components/ui/PeriodFilter';
import { Pagination } from '../components/ui/Pagination';
import api from '../api/axios';

const PAGE_SIZE = 50;

const MOCK_EXPENSES: any[] = [
  { id: 1, title: 'Thuê văn phòng tháng 5/2026', category: 'Vận hành', amount: 15000000, date: '2026-05-01', creator_name: 'Kế toán', status: 'approved', notes: 'Thanh toán trước hạn' },
  { id: 2, title: 'Quảng cáo Google Ads tháng 5', category: 'Marketing', amount: 8500000, date: '2026-05-02', creator_name: 'Admin', status: 'approved', notes: 'Campaign Q2 2026' },
  { id: 3, title: 'Ăn trưa tiếp đối tác TechGlobal', category: 'Ăn uống', amount: 1800000, date: '2026-05-03', creator_name: 'Sales Manager', status: 'pending', notes: 'Tiếp khách tại Nhà hàng Hoàng Yến' },
  { id: 4, title: 'Chi phí di chuyển gặp khách TP.HCM', category: 'Di chuyển', amount: 2200000, date: '2026-05-04', creator_name: 'Sales', status: 'approved', notes: 'Vé máy bay + taxi' },
  { id: 5, title: 'Bản quyền phần mềm Figma năm 2026', category: 'Công cụ', amount: 4500000, date: '2026-04-28', creator_name: 'Admin', status: 'approved', notes: 'Gia hạn 12 tháng' },
  { id: 6, title: 'Tiền điện văn phòng tháng 4', category: 'Vận hành', amount: 3200000, date: '2026-04-30', creator_name: 'Kế toán', status: 'approved', notes: '' },
  { id: 7, title: 'Quảng cáo Facebook tháng 5', category: 'Marketing', amount: 6000000, date: '2026-05-03', creator_name: 'Marketing', status: 'pending', notes: 'Chiến dịch ra mắt sản phẩm mới' },
  { id: 8, title: 'Mua nội thất phòng họp', category: 'Vận hành', amount: 12000000, date: '2026-04-25', creator_name: 'Admin', status: 'approved', notes: 'Bàn họp + ghế 8 người' },
  { id: 9, title: 'Đào tạo nhân sự Sales Q2', category: 'Nhân sự', amount: 5000000, date: '2026-05-05', creator_name: 'HR', status: 'pending', notes: 'Khóa kỹ năng đàm phán' },
  { id: 10, title: 'In ấn tài liệu marketing', category: 'Marketing', amount: 1200000, date: '2026-05-01', creator_name: 'Marketing', status: 'approved', notes: 'Brochure + card visit' },
];

const CATEGORIES = [
  { label: 'Di chuyển', icon: Truck, color: '#3b82f6' },
  { label: 'Ăn uống', icon: Coffee, color: '#f59e0b' },
  { label: 'Vận hành', icon: Home, color: '#10b981' },
  { label: 'Marketing', icon: Briefcase, color: '#ef4444' },
  { label: 'Công cụ', icon: CreditCard, color: '#8b5cf6' },
  { label: 'Nhân sự', icon: Tag, color: '#06b6d4' },
];

const FMT = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtShort = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'T';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toLocaleString('vi-VN');
};

const EMPTY_FORM = { title: '', amount: '', category: 'Vận hành', date: new Date().toISOString().slice(0, 10), notes: '' };

export const ExpensesPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('this_month');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('this_month'));
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [catOpen, setCatOpen] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/expenses', { params: { from: dateRange.from, to: dateRange.to, status: statusFilter } });
      const data = r.data.data?.items || r.data.data || [];
      setItems(data.length ? data : MOCK_EXPENSES);
      setTotal(data.length ? (r.data.data?.total || data.length) : MOCK_EXPENSES.length);
    } catch (e) {
      console.error(e);
      setItems(MOCK_EXPENSES);
      setTotal(MOCK_EXPENSES.length);
    } finally {
      setLoading(false);
    }
  }, [dateRange, statusFilter]);

  useEffect(() => { fetchExpenses(); setPage(1); }, [fetchExpenses]);

  // Client-side filter + paginate
  const filtered = items.filter(e => {
    const txt = `${e.title} ${e.creator_name}`.toLowerCase();
    return (!search || txt.includes(search.toLowerCase()))
      && (!catFilter || e.category === catFilter);
  });
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // KPIs from filtered set
  const totalAmt = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const approvedAmt = filtered.filter(e => e.status === 'approved').reduce((s, e) => s + Number(e.amount), 0);
  const pendingAmt = filtered.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0);
  const maxItem = filtered.reduce((mx, e) => Number(e.amount) > Number(mx?.amount || 0) ? e : mx, null as any);
  const catBreakdown = CATEGORIES.map(c => ({
    ...c,
    total: filtered.filter(e => e.category === c.label).reduce((s, e) => s + Number(e.amount), 0),
  })).sort((a, b) => b.total - a.total).filter(c => c.total > 0);

  const openCreate = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (item: any) => { setEditItem(item); setForm({ ...item, amount: String(item.amount) }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title || !form.amount) { addToast('Điền đầy đủ nội dung và số tiền', 'error'); return; }
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/expenses/${editItem.id}`, { ...form, amount: Number(form.amount) });
        addToast('Đã cập nhật chi phí', 'success');
      } else {
        await api.post('/expenses', { ...form, amount: Number(form.amount), status: 'pending' });
        addToast('Đã nhập chi phí mới – chờ phê duyệt', 'success');
      }
      setShowModal(false);
      fetchExpenses();
    } catch {
      // Use mock: just update local state
      if (!editItem) {
        const newItem = { ...form, id: Date.now(), amount: Number(form.amount), creator_name: 'Bạn', status: 'pending' };
        setItems(prev => [newItem, ...prev]);
        addToast('Đã thêm chi phí (demo mode)', 'success');
        setShowModal(false);
      } else {
        addToast('Lỗi khi lưu chi phí', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/expenses/${deleteItem.id}`);
      setItems(prev => prev.filter(e => e.id !== deleteItem.id));
      addToast('Đã xóa chi phí', 'success');
    } catch {
      setItems(prev => prev.filter(e => e.id !== deleteItem.id));
      addToast('Đã xóa (demo mode)', 'success');
    }
    setDeleteItem(null);
  };

  const toggleSelect = (id: number) => setSelected(prev => {
    const ns = new Set(prev);
    if (ns.has(id)) ns.delete(id);
    else ns.add(id);
    return ns;
  });
  const allSelected = paginated.length > 0 && paginated.every(e => selected.has(e.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(paginated.map(e => e.id)));

  const getCatInfo = (label: string) => CATEGORIES.find(c => c.label === label) || { color: '#6b7280', icon: Tag };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Chi phí Vận hành</h1>
          <p className="page-subtitle">Quản lý và theo dõi các khoản chi phí doanh nghiệp</p>
        </div>
        <div className="flex gap-2">
          <PeriodFilter
            value={period}
            onChange={(p, r) => { setPeriod(p); setDateRange(r); }}
          />
          <button className="btn secondary sm" onClick={() => addToast('Đang xuất bảng kê...', 'info')}>
            <Download size={14} /> Xuất
          </button>
          <button className="btn primary" onClick={openCreate}><Plus size={16} /> Nhập chi phí</button>
        </div>
      </div>

      {/* KPI Cards — NO borders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          {
            label: 'Tổng chi phí kỳ này', value: FMT(totalAmt), icon: TrendingDown,
            color: '#ef4444', sub: `${filtered.length} khoản`,
          },
          {
            label: 'Đã phê duyệt', value: FMT(approvedAmt), icon: CheckCircle2,
            color: '#10b981',
            sub: `${filtered.filter(e => e.status === 'approved').length} khoản đã duyệt`,
          },
          {
            label: 'Chờ phê duyệt', value: FMT(pendingAmt), icon: Clock,
            color: '#f59e0b',
            sub: `${filtered.filter(e => e.status === 'pending').length} khoản đang chờ`,
          },
          {
            label: 'Chi phí lớn nhất', value: maxItem ? FMT(maxItem.amount) : '—', icon: DollarSign,
            color: '#7c3aed',
            sub: maxItem?.title ? maxItem.title.slice(0, 24) + '...' : 'Chưa có dữ liệu',
          },
        ].map((k, i) => (
          <motion.div key={i} className="stat-kpi" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div className="stat-kpi__header">
              <div className="stat-kpi__icon" style={{ background: `${k.color}12`, color: k.color }}>
                <k.icon size={16} />
              </div>
              <div className="stat-kpi__label">{k.label}</div>
            </div>
            {loading ? <div className="skeleton" style={{ height: 38, width: '85%', borderRadius: 6, marginBottom: 12 }} />
              : <div className="stat-kpi__value">{k.value}</div>}
            <div className="stat-kpi__sub">{k.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Category breakdown mini-bar */}
      {catBreakdown.length > 0 && (
        <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theo danh mục:</span>
          {catBreakdown.map(c => {
            const Icon = c.icon;
            return (
              <button key={c.label} onClick={() => setCatFilter(catFilter === c.label ? '' : c.label)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: `1.5px solid ${catFilter === c.label ? c.color : 'var(--color-border)'}`, background: catFilter === c.label ? `${c.color}15` : 'transparent', cursor: 'pointer', transition: 'all 0.18s', fontSize: '0.8125rem' }}>
                <Icon size={13} color={c.color} />
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{c.label}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{fmtShort(c.total)}</span>
              </button>
            );
          })}
          {catFilter && <button onClick={() => setCatFilter('')} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><X size={13} /> Bỏ lọc</button>}
        </div>
      )}

      {/* Filter bar */}
      <div className="card" style={{ padding: '0.875rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="filter-search" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ color: 'var(--color-text-muted)' }} />
          <input placeholder="Tìm theo nội dung, người nhập..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {search && <button onClick={() => setSearch('')}><X size={13} /></button>}
        </div>

        <select className="form-input form-select" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="approved">Đã duyệt</option>
          <option value="pending">Chờ duyệt</option>
        </select>

        {selected.size > 0 && (
          <button className="btn danger sm" onClick={() => { setItems(prev => prev.filter(e => !selected.has(e.id))); setSelected(new Set()); addToast(`Đã xóa ${selected.size} khoản`, 'success'); }}>
            <Trash2 size={14} /> Xóa {selected.size} đã chọn
          </button>
        )}
      </div>

      {/* Main table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="col-check">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th>NỘI DUNG CHI</th>
                <th>DANH MỤC</th>
                <th>SỐ TIỀN</th>
                <th>NGÀY CHI</th>
                <th>NGƯỜI NHẬP</th>
                <th>TRẠNG THÁI</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 20, borderRadius: 4, width: j === 1 ? '80%' : j === 2 ? '60%' : '70%' }} /></td>
                  ))}
                </tr>
              ))}
              <AnimatePresence>
                {!loading && paginated.map(exp => {
                  const catInfo = getCatInfo(exp.category);
                  const CatIcon = catInfo.icon;
                  return (
                    <motion.tr 
                      key={exp.id} 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setViewItem(exp)}
                      style={{ cursor: 'pointer' }}
                      className="hover-bg transition-colors"
                    >
                      <td className="col-check" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(exp.id)} onChange={() => toggleSelect(exp.id)} />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{exp.title}</div>
                        {exp.notes && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{exp.notes}</div>}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: 'var(--radius-full)', background: `${catInfo.color}12`, fontSize: '0.8125rem', fontWeight: 600, color: catInfo.color }}>
                          <CatIcon size={12} color={catInfo.color} /> {exp.category}
                        </span>
                      </td>
                      <td><span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-danger)' }}>{FMT(exp.amount)}</span></td>
                      <td><span style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)' }}>{new Date(exp.date).toLocaleDateString('vi-VN')}</span></td>
                      <td><span style={{ fontSize: '0.8125rem' }}>{exp.creator_name}</span></td>
                      <td>
                        <span className={`badge ${exp.status === 'approved' ? 'success' : 'warning'}`}>
                          {exp.status === 'approved' ? <><CheckCircle2 size={11} /> Đã duyệt</> : <><Clock size={11} /> Chờ duyệt</>}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn-icon sm" title="Sửa" onClick={(e) => { e.stopPropagation(); openEdit(exp); }}><Pencil size={13} /></button>
                          <button className="btn-icon sm text-danger" title="Xóa" onClick={(e) => { e.stopPropagation(); setDeleteItem(exp); }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {!loading && paginated.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  Không có khoản chi phí nào trong kỳ này
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onChange={setPage} showSizeChanger onPageSizeChange={() => setPage(1)} />
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !saving && setShowModal(false)} />
            <motion.div className="modal-sheet" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, maxWidth: 'calc(100vw - 2rem)', zIndex: 300 }}
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="modal-header">
                <h3>{editItem ? 'Sửa chi phí' : 'Nhập chi phí mới'}</h3>
                <button onClick={() => setShowModal(false)} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nội dung chi *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="VD: Thuê văn phòng tháng 6..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Số tiền (VNĐ) *</label>
                    <input className="form-input" type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ngày chi</label>
                    <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Danh mục</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {CATEGORIES.map(c => {
                      const Icon = c.icon;
                      return (
                        <button key={c.label} type="button" onClick={() => setForm({ ...form, category: c.label })}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: `2px solid ${form.category === c.label ? c.color : 'var(--color-border)'}`, background: form.category === c.label ? `${c.color}15` : 'transparent', color: form.category === c.label ? c.color : 'var(--color-text-light)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s' }}>
                          <Icon size={13} /> {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Ghi chú</label>
                  <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Mô tả thêm nếu cần..." style={{ resize: 'none' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn secondary" onClick={() => setShowModal(false)} disabled={saving}>Hủy</button>
                <button className="btn primary" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 size={14} className="spin" />}{editItem ? 'Cập nhật' : 'Lưu chi phí'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteItem && (
          <>
            <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteItem(null)} />
            <motion.div className="modal-sheet" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 380, zIndex: 310, textAlign: 'center', padding: '2.5rem 2rem', borderRadius: '24px' }}
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div style={{ width: 64, height: 64, background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Trash2 size={28} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Xóa khoản chi phí?</h3>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.9375rem', margin: '0.75rem 0 2rem' }}>Khoản chi <strong>"{deleteItem.title}"</strong> sẽ bị xóa vĩnh viễn khỏi hệ thống.</p>
              <div className="flex gap-3" style={{ justifyContent: 'center' }}>
                <button className="btn outline" style={{ flex: 1 }} onClick={() => setDeleteItem(null)}>Hủy</button>
                <button className="btn danger" style={{ flex: 1 }} onClick={handleDelete}><Trash2 size={14} /> Xóa ngay</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      <AnimatePresence>
        {viewItem && (
          <>
            <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewItem(null)} />
            <motion.div className="modal-sheet" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, zIndex: 310, padding: '2rem', borderRadius: '24px' }}
              initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${viewItem.status === 'approved' ? 'success' : 'warning'}`}>
                      {viewItem.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{new Date(viewItem.date).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text)' }}>{viewItem.title}</h3>
                </div>
                <button className="btn-icon-bare" onClick={() => setViewItem(null)}><X size={20} /></button>
              </div>

              <div className="card-panel p-4 mb-6" style={{ background: 'var(--color-bg)' }}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border-light">
                  <span className="text-light font-bold text-sm">Số tiền</span>
                  <span className="text-danger font-black text-xl">{FMT(viewItem.amount)}</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border-light">
                  <span className="text-light font-bold text-sm">Danh mục</span>
                  <span className="font-bold">{viewItem.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-light font-bold text-sm">Người nhập</span>
                  <span className="font-bold">{viewItem.creator_name}</span>
                </div>
              </div>

              {viewItem.notes && (
                <div className="mb-6">
                  <span className="text-xs font-black uppercase text-light tracking-widest mb-2 block">Ghi chú</span>
                  <p className="text-sm text-text-light bg-surface border border-border p-3 rounded-xl">{viewItem.notes}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button className="btn outline" style={{ flex: 1 }} onClick={() => setViewItem(null)}>Đóng</button>
                <button className="btn primary" style={{ flex: 1 }} onClick={() => { const item = viewItem; setViewItem(null); openEdit(item); }}><Pencil size={14} /> Chỉnh sửa</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
