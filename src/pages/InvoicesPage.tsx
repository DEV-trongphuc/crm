import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Plus, Search, Download, CheckCircle2, Clock, AlertCircle,
  Eye, Trash2, Printer, X, Loader2, ArrowUpRight, TrendingUp, DollarSign,
  Pencil, Copy, Send, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { PeriodFilter, getDateRange } from '../components/ui/PeriodFilter';
import { CustomCheckbox } from '../components/ui/CustomCheckbox';
import type { Period, DateRange } from '../components/ui/PeriodFilter';
import { Pagination } from '../components/ui/Pagination';
import api from '../api/axios';
import { DEV_MODE } from '../config/env';
import { useMockStore } from '../store/mockStore';

const PAGE_SIZE = 50;

const MOCK_INVOICES: any[] = [];

const FMT = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const InvoicesPage: React.FC = () => {
  const { addToast, showConfirm, closeConfirm } = useUIStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('this_month');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('this_month'));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total_rev: 0, paid_amt: 0, pending_amt: 0, overdue_amt: 0 });

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    if (DEV_MODE) { 
      const all = useMockStore.getState().invoices;
      setItems(all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)); 
      setTotal(all.length);
      setLoading(false); 
      return; 
    }
    try {
      const params: any = { 
        page, 
        limit: PAGE_SIZE, 
        from: dateRange.from, 
        to: dateRange.to, 
        status: statusFilter,
        search: search
      };
      const r = await api.get('/invoices', { params });
      const data = r.data.data;
      setItems(data.items || []);
      setTotal(data.total || 0);
      setSummary(data.summary || { total_rev: 0, paid_amt: 0, pending_amt: 0, overdue_amt: 0 });
    } catch {
      setItems([]);
      setTotal(0);
      addToast('Không thể kết nối với máy chủ Backend', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, dateRange, statusFilter, search]);

  useEffect(() => { fetchInvoices(); setPage(1); }, [fetchInvoices]);

  // ESC key to close modals
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (previewItem) setPreviewItem(null);
      else if (deleteItem) setDeleteItem(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [previewItem, deleteItem]);

  // Client-side items match server-paginated data

  // KPIs from server summary
  const totalRev = Number(summary.total_rev);
  const paidAmt = Number(summary.paid_amt);
  const pendingAmt = Number(summary.pending_amt);
  const overdueAmt = Number(summary.overdue_amt);

  const STATUS_CONFIG: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
    paid: { label: 'Đã thanh toán', class: 'success', icon: <CheckCircle2 size={11} /> },
    pending: { label: 'Chờ thanh toán', class: 'warning', icon: <Clock size={11} /> },
    overdue: { label: 'Quá hạn', class: 'danger', icon: <AlertCircle size={11} /> },
  };

  const toggleSelect = (id: number) => setSelected(prev => {
    const ns = new Set(prev);
    if (ns.has(id)) ns.delete(id);
    else ns.add(id);
    return ns;
  });
  const allSelected = items.length > 0 && items.every(i => selected.has(i.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map(i => i.id)));

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/invoices/${deleteItem.id}`);
      setItems(prev => prev.filter(i => i.id !== deleteItem.id));
      addToast('Đã xóa hóa đơn', 'success');
    } catch (e: any) {
      addToast(e.response?.data?.message || 'Không thể xóa hóa đơn do lỗi mạng', 'error');
    } finally {
      setDeleteItem(null);
    }
  };

  const handleMarkPaid = (inv: any) => {
    showConfirm({
      title: 'Xác nhận thanh toán',
      message: `Đánh dấu hóa đơn ${inv.invoice_number} đã được thanh toán đầy đủ?`,
      confirmText: 'Xác nhận',
      onConfirm: async () => {
        try {
          await api.post(`/invoices/${inv.id}/pay`);
          setItems(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i));
          addToast(`Đã cập nhật ${inv.invoice_number} thành Đã thanh toán`, 'success');
        } catch (e: any) {
          addToast(e.response?.data?.message || 'Không thể cập nhật trạng thái', 'error');
        }
        closeConfirm();
      }
    });
  };

  const handleSendReminder = (inv: any) => {
    showConfirm({
      title: 'Gửi thông báo',
      message: `Hệ thống sẽ gửi email/Zalo nhắc nhở hóa đơn đến ${inv.contact_name}. Bạn có chắc chắn?`,
      confirmText: 'Gửi ngay',
      onConfirm: () => {
        addToast(`Đã gửi nhắc nhở đến ${inv.contact_name}`, 'success');
        closeConfirm();
      }
    });
  };

  const exportCSV = () => {
    const headers = ['Mã HĐ', 'Khách hàng', 'Công ty', 'Nội dung', 'Tổng tiền', 'Ngày lập', 'Đến hạn', 'Trạng thái'];
    const rows = items.map(i => [
      i.invoice_number, i.contact_name, i.company_name, i.title, i.total, i.issue_date, i.due_date, i.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `danh_sach_hoa_don_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    addToast('Đã xuất file CSV thành công', 'success');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Quản lý giao dịch tài chính và trạng thái thanh toán</p>
        </div>
        <div className="flex gap-2">
          <PeriodFilter value={period} onChange={(p, r) => { setPeriod(p); setDateRange(r); setPage(1); }} />
          <button className="btn secondary" onClick={exportCSV}><Download size={16} /> Xuất CSV</button>
          <button className="btn primary" onClick={() => useUIStore.getState().setShowPOS(true)}><Plus size={16} /> Tạo hóa đơn</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Tổng doanh thu', value: FMT(totalRev), icon: TrendingUp, color: '#7c3aed', sub: `${items.length} hóa đơn` },
          { label: 'Đã thu hồi', value: FMT(paidAmt), icon: CheckCircle2, color: '#10b981', sub: `${items.filter(i => i.status === 'paid').length} đã thanh toán` },
          { label: 'Chờ thanh toán', value: FMT(pendingAmt), icon: Clock, color: '#f59e0b', sub: `${items.filter(i => i.status === 'pending').length} hóa đơn đang đợi` },
          { label: 'Nợ quá hạn', value: FMT(overdueAmt), icon: AlertCircle, color: '#ef4444', sub: `${items.filter(i => i.status === 'overdue').length} hóa đơn quá hạn` },
        ].map((k, i) => (
          <motion.div key={i} className="stat-kpi" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div className="stat-kpi__header">
              <div className="stat-kpi__icon" style={{ background: `${k.color}12`, color: k.color }}><k.icon size={16} /></div>
              <div className="stat-kpi__label">{k.label}</div>
            </div>
            {loading ? <div className="skeleton" style={{ height: 38, width: '85%', borderRadius: 6, marginBottom: 12 }} />
              : <div className="stat-kpi__value">{k.value}</div>}
            <div className="stat-kpi__sub">{k.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { key: '', label: 'Tất cả', count: items.length },
          { key: 'paid', label: 'Đã thanh toán', count: items.filter(i => i.status === 'paid').length },
          { key: 'pending', label: 'Chờ thanh toán', count: items.filter(i => i.status === 'pending').length },
          { key: 'overdue', label: 'Quá hạn', count: items.filter(i => i.status === 'overdue').length },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            style={{ padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s', border: '1.5px solid', borderColor: statusFilter === tab.key ? 'var(--color-primary)' : 'var(--color-border)', background: statusFilter === tab.key ? 'var(--color-primary-light)' : 'var(--color-surface)', color: statusFilter === tab.key ? 'var(--color-primary)' : 'var(--color-text-light)' }}>
            {tab.label} <span style={{ marginLeft: '4px', opacity: 0.75 }}>({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: '0.875rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div className="filter-search" style={{ flex: 1 }}>
          <Search size={15} style={{ color: 'var(--color-text-muted)' }} />
          <input placeholder="Tìm mã hóa đơn, khách hàng, công ty..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {search && <button onClick={() => setSearch('')}><X size={13} /></button>}
        </div>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <button className="btn outline sm"><Printer size={13} /> In {selected.size} HĐ</button>
            <button className="btn danger sm" onClick={() => { setItems(p => p.filter(i => !selected.has(i.id))); setSelected(new Set()); addToast(`Đã xóa ${selected.size} hóa đơn`, 'success'); }}>
              <Trash2 size={13} /> Xóa {selected.size}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'visible' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="col-check"><CustomCheckbox checked={allSelected} onChange={toggleAll} /></th>
                <th>MÃ HÓA ĐƠN</th>
                <th>KHÁCH HÀNG</th>
                <th>NỘI DUNG</th>
                <th>SỐ TIỀN</th>
                <th>NGÀY LẬP</th>
                <th>ĐẾN HẠN</th>
                <th>TRẠNG THÁI</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 9 }).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 20, borderRadius: 4 }} /></td>)}</tr>
              ))}
              <AnimatePresence>
                {!loading && items.map(inv => {
                  const sc = STATUS_CONFIG[inv.status] || { label: inv.status, class: 'info', icon: null };
                  const isOverdue = inv.status === 'overdue';
                  return (
                    <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ background: isOverdue ? 'rgba(239,68,68,0.02)' : undefined }}>
                      <td className="col-check" onClick={e => e.stopPropagation()}>
                        <CustomCheckbox checked={selected.has(inv.id)} onChange={() => toggleSelect(inv.id)} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.8125rem', fontFamily: 'monospace' }}>{inv.invoice_number}</span>
                          {inv.is_inventory_deducted === 1 && (
                          <Package size={12} style={{ color: 'var(--color-success)' }} />
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inv.contact_name || 'Khách lẻ'}</div>
                        {inv.company_name && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{inv.company_name}</div>}
                      </td>
                      <td><span style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)' }}>{inv.title}</span></td>
                      <td><span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{FMT(inv.total)}</span></td>
                      <td><span style={{ fontSize: '0.8125rem' }}>{fmtDate(inv.issue_date)}</span></td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: isOverdue ? 'var(--color-danger)' : 'var(--color-text-light)', fontWeight: isOverdue ? 700 : 400 }}>
                          {fmtDate(inv.due_date)}
                        </span>
                      </td>
                      <td><span className={`badge ${sc.class}`}>{sc.icon} {sc.label}</span></td>
                      <td>
                        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn-icon sm" title="Xem nhanh" onClick={() => setPreviewItem(inv)}><Eye size={14} /></button>
                          {inv.status !== 'paid' && (
                            <button className="btn-icon sm" title="Đánh dấu đã thanh toán" onClick={() => handleMarkPaid(inv)} style={{ color: 'var(--color-success)' }}><CheckCircle2 size={14} /></button>
                          )}
                          <button className="btn-icon sm" title="Gửi nhắc nhở" onClick={() => handleSendReminder(inv)} style={{ color: 'var(--color-primary)' }}><Send size={14} /></button>
                          <button className="btn-icon sm text-danger" title="Xóa" onClick={() => setDeleteItem(inv)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {!loading && items.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Không có hóa đơn nào trong kỳ này</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} showSizeChanger onPageSizeChange={() => setPage(1)} />
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteItem && (
          <>
            <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteItem(null)} style={{ zIndex: 300 }} />
            <motion.div className="modal-sheet" style={{ position: 'fixed', top: '50%', left: '50%', width: 380, zIndex: 310, textAlign: 'center', padding: '2rem' }}
              initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }} exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }}>
              <div style={{ width: 56, height: 56, background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><Trash2 size={24} /></div>
              <h3 style={{ fontWeight: 700 }}>Xóa hóa đơn {deleteItem.invoice_number}?</h3>
              <p style={{ color: 'var(--color-text-light)', margin: '0.5rem 0 1.5rem', fontSize: '0.875rem' }}>Thao tác này không thể hoàn tác.</p>
              <div className="flex gap-3" style={{ justifyContent: 'center' }}>
                <button className="btn secondary" onClick={() => setDeleteItem(null)}>Hủy</button>
                <button className="btn danger" onClick={handleDelete}><Trash2 size={14} /> Xóa</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <>
            <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewItem(null)} style={{ zIndex: 300 }} />
            <motion.div
              className="modal"
              style={{ position: 'fixed', top: '50%', left: '50%', width: '90%', maxWidth: 700, maxHeight: '90vh', overflow: 'auto', zIndex: 310, padding: 0, borderRadius: 'var(--radius-2xl)' }}
              initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }} exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }}
            >
              <div style={{ padding: '2rem', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>INVOICE</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Mã số: {previewItem.invoice_number}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ fontWeight: 700 }}>{useAuthStore.getState().user?.tenant_name || 'CRM System'}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Hà Nội, Việt Nam</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', padding: '1.5rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)' }}>
                  <div>
                    <p className="text-xs text-light mb-1 uppercase tracking-wider font-bold">Khách hàng</p>
                    <p style={{ fontWeight: 700 }}>{previewItem.contact_name}</p>
                    <p className="text-sm text-light">{previewItem.company_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-light mb-1 uppercase tracking-wider font-bold">Chi tiết</p>
                    <p className="text-sm">Ngày lập: <strong>{fmtDate(previewItem.issue_date)}</strong></p>
                    <p className="text-sm">Hạn thanh toán: <strong>{fmtDate(previewItem.due_date)}</strong></p>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 0' }}>MÔ TẢ DỊCH VỤ</th>
                      <th style={{ textAlign: 'right', padding: '12px 0' }}>SỐ TIỀN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '16px 0' }}>
                        <p style={{ fontWeight: 600 }}>{previewItem.title}</p>
                        <p className="text-xs text-light">Dịch vụ cung cấp trọn gói theo hợp đồng</p>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{FMT(previewItem.total)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--color-border)' }}>
                       <td style={{ padding: '8px 0', fontSize: '0.875rem' }}>Phí vận chuyển ({previewItem.shipping_customer_pay ? 'Khách trả' : 'Shop trả'})</td>
                       <td style={{ textAlign: 'right', fontWeight: 600 }}>{FMT(previewItem.shipping_fee || 0)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '16px 0', fontWeight: 700, fontSize: '1.1rem' }}>TỔNG CỘNG</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-primary)' }}>{FMT(previewItem.total)}</td>
                    </tr>
                  </tfoot>
                </table>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                  <button className="btn ghost" onClick={() => setPreviewItem(null)}>Đóng</button>
                  <button className="btn outline" onClick={() => window.print()}><Printer size={16} /> In Hóa Đơn</button>
                  <button className="btn primary" onClick={() => addToast(`Đã gửi hóa đơn tới ${previewItem.contact_name}`, 'success')}><Send size={16} /> Gửi Khách Hàng</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
