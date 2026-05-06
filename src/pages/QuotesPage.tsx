import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Plus, Search, Download, CheckCircle2, Clock, AlertCircle,
  Eye, Trash2, Printer, X, Loader2, ArrowUpRight, TrendingUp, DollarSign,
  Pencil, Copy, Send, FileCheck, XCircle, Calendar, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { PeriodFilter, getDateRange } from '../components/ui/PeriodFilter';
import { CustomCheckbox } from '../components/ui/CustomCheckbox';
import type { Period, DateRange } from '../components/ui/PeriodFilter';
import { Pagination } from '../components/ui/Pagination';
import { QuoteEditorModal } from '../components/ui/QuoteEditorModal.tsx';
import api from '../api/axios';
import { DEV_MODE } from '../config/env';

const PAGE_SIZE = 20;

const FMT = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export const QuotesPage: React.FC = () => {
  const { addToast, showConfirm, closeConfirm } = useUIStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('this_month');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('this_month'));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editorQuote, setEditorQuote] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/quotes', { params: { from: dateRange.from, to: dateRange.to, status: statusFilter } });
      setItems(r.data.data || []);
    } catch {
      setItems([]);
      addToast('Lỗi khi tải danh sách báo giá', 'error');
    } finally {
      setLoading(false);
    }
  }, [dateRange, statusFilter]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(i => {
      const txt = `${i.quote_number} ${i.title} ${i.contact_name || ''} ${i.company_name || ''}`.toLowerCase();
      return (!q || txt.includes(q)) && (!statusFilter || i.status === statusFilter);
    });
  }, [items, search, statusFilter]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // KPIs
  const totalVal = filtered.reduce((s, i) => s + Number(i.total), 0);
  const acceptedVal = filtered.filter(i => i.status === 'accepted').reduce((s, i) => s + Number(i.total), 0);
  const sentCount = filtered.filter(i => i.status === 'sent').length;
  const convRate = items.length > 0 ? (items.filter(i => i.status === 'accepted').length / items.length) * 100 : 0;

  const STATUS_CONFIG: Record<string, { label: string; class: string; icon: React.ReactNode; color: string }> = {
    draft: { label: 'Nháp', class: 'info', icon: <Pencil size={12} />, color: '#94a3b8' },
    sent: { label: 'Đã gửi', class: 'warning', icon: <Send size={12} />, color: '#f59e0b' },
    accepted: { label: 'Đã duyệt', class: 'success', icon: <FileCheck size={12} />, color: '#10b981' },
    rejected: { label: 'Từ chối', class: 'danger', icon: <XCircle size={12} />, color: '#ef4444' },
    expired: { label: 'Hết hạn', class: 'secondary', icon: <Clock size={12} />, color: '#64748b' },
  };

  const handleOpenEditor = (quote: any = null) => {
    setEditorQuote(quote);
    setShowEditor(true);
  };

  const handleDelete = (id: number) => {
    showConfirm({
      title: 'Xóa báo giá',
      message: 'Bạn có chắc chắn muốn xóa bản báo giá này?',
      isDanger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/quotes/${id}`);
          setItems(p => p.filter(i => i.id !== id));
          addToast('Đã xóa báo giá', 'success');
        } catch {
          addToast('Lỗi khi xóa báo giá', 'error');
        }
      }
    });
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.put(`/quotes/${id}`, { status });
      setItems(p => p.map(i => i.id === id ? { ...i, status } : i));
      addToast(`Đã cập nhật trạng thái báo giá`, 'success');
    } catch {
      addToast('Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Báo giá</h1>
          <p className="page-subtitle">Tạo và theo dõi các đề xuất kinh doanh với khách hàng</p>
        </div>
        <div className="flex gap-3">
          <PeriodFilter value={period} onChange={(p, r) => { setPeriod(p); setDateRange(r); }} />
          <button className="btn outline" onClick={fetchQuotes}><RefreshCw size={18} /> Làm mới</button>
          <button className="btn primary" onClick={() => handleOpenEditor()}>
            <Plus size={18} /> Tạo báo giá mới
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-4 mb-6">
        {[
          { label: 'Tổng giá trị đề xuất', value: FMT(totalVal), icon: TrendingUp, color: '#6366f1' },
          { label: 'Giá trị đã chốt', value: FMT(acceptedVal), icon: FileCheck, color: '#10b981' },
          { label: 'Đang chờ phản hồi', value: sentCount, icon: Clock, color: '#f59e0b', sub: 'Báo giá đã gửi' },
          { label: 'Tỉ lệ chốt (Win Rate)', value: `${convRate.toFixed(1)}%`, icon: DollarSign, color: '#8b5cf6' },
        ].map((k, i) => (
          <div key={i} className="card p-5 hover-lift">
            <div className="flex justify-between items-start mb-3">
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: `${k.color}15`, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={20} />
              </div>
              <span className="text-[10px] font-black text-muted uppercase tracking-wider">{k.label}</span>
            </div>
            <div className="text-2xl font-black">{k.value}</div>
            {k.sub && <p className="text-xs text-light mt-1">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-panel mb-4">
        <div className="flex items-center gap-4">
          <div className="filter-search flex-1">
            <Search size={18} className="text-muted" />
            <input 
              placeholder="Tìm theo mã báo giá, tiêu đề hoặc khách hàng..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-2">
            {['', 'draft', 'sent', 'accepted', 'rejected', 'expired'].map(s => (
              <button 
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`btn sm ${statusFilter === s ? 'primary' : 'ghost'}`}
              >
                {s === '' ? 'Tất cả' : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="col-check">
                  <CustomCheckbox 
                    checked={selected.size === paginated.length && paginated.length > 0} 
                    onChange={() => setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map(i => i.id)))} 
                  />
                </th>
                <th>MÃ BÁO GIÁ</th>
                <th>TIÊU ĐỀ & KHÁCH HÀNG</th>
                <th>TRẠNG THÁI</th>
                <th>GIÁ TRỊ</th>
                <th>HẠN HIỆU LỰC</th>
                <th>NGÀY TẠO</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8}><div className="skeleton" style={{ height: 48, borderRadius: 8 }} /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <FileText size={48} />
                      <p className="font-bold">Không tìm thấy báo giá nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(q => (
                  <tr key={q.id} className="table-row-hover" onClick={() => handleOpenEditor(q)}>
                    <td className="col-check" onClick={e => e.stopPropagation()}>
                      <CustomCheckbox checked={selected.has(q.id)} onChange={() => {
                        const ns = new Set(selected);
                        if (ns.has(q.id)) ns.delete(q.id); else ns.add(q.id);
                        setSelected(ns);
                      }} />
                    </td>
                    <td>
                      <span className="font-black text-primary text-xs font-mono">{q.quote_number}</span>
                    </td>
                    <td>
                      <div className="font-bold text-sm">{q.title}</div>
                      <div className="text-xs text-light flex items-center gap-1 mt-0.5">
                        <ArrowUpRight size={12} /> {q.contact_name || 'Khách lẻ'} {q.company_name ? `(${q.company_name})` : ''}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_CONFIG[q.status]?.class || 'info'}`}>
                        {STATUS_CONFIG[q.status]?.icon} {STATUS_CONFIG[q.status]?.label || q.status}
                      </span>
                    </td>
                    <td>
                      <div className="font-black text-sm">{FMT(q.total)}</div>
                      <div className="text-[10px] text-muted">{q.items_count || 0} hạng mục</div>
                    </td>
                    <td>
                      <div className={`text-xs flex items-center gap-1 ${new Date(q.valid_until) < new Date() ? 'text-danger font-bold' : ''}`}>
                        <Calendar size={12} /> {fmtDate(q.valid_until)}
                      </div>
                    </td>
                    <td><span className="text-xs text-light">{fmtDate(q.created_at)}</span></td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <button className="btn-icon sm" title="Xem nhanh" onClick={() => setPreviewItem(q)}><Eye size={14} /></button>
                        <button className="btn-icon sm" title="Chỉnh sửa" onClick={() => handleOpenEditor(q)}><Pencil size={14} /></button>
                        <button className="btn-icon sm text-danger" title="Xóa" onClick={() => handleDelete(q.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {/* Editor Modal */}
      <QuoteEditorModal 
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        quote={editorQuote}
        onSuccess={() => {
          setShowEditor(false);
          fetchQuotes();
        }}
      />
    </div>
  );
};
