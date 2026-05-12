import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Edit, Trash2, LayoutGrid, List, Search, 
  Filter, History, Share, Clock, CheckCircle, AlertTriangle, 
  ChevronDown, DollarSign, CalendarDays, Layers, ArrowRight,
  TrendingDown, TrendingUp, MoreHorizontal, X, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import { PurchaseOrdersTab } from '../components/PurchaseOrdersTab';
import api from '../api/axios';
import { useDebounce } from '../hooks/useDebounce';
import { Pagination } from '../components/ui/Pagination';
import { CustomSelect } from '../components/ui/CustomSelect';
import { ImportExportModal } from '../components/ui/ImportExportModal';
import { useMockStore, getFilteredMockState } from '../store/mockStore';
import { DEV_MODE } from '../config/env';

const PAGE_SIZE = 20;

interface Batch {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  category: string;
  unit: string;
  supplier_name: string;
  batch_code: string;
  import_date: string;
  expiry_date: string | null;
  import_price: number;
  initial_qty: number;
  current_qty: number;
  notes: string | null;
  status: 'active' | 'archived';
}

interface InventoryLog {
  id: number;
  batch_id: number;
  action_type: 'IMPORT' | 'SALE' | 'EXPORT_INTERNAL' | 'ADJUST' | 'RETURN';
  qty_change: number;
  reason: string;
  creator_name: string;
  created_at: string;
}

export default function InventoryPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'batches' | 'history' | 'purchase_orders'>('batches');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [globalLogs, setGlobalLogs] = useState<(InventoryLog & { product_name: string, batch_code: string })[]>([]);
  const [summary, setSummary] = useState({ total_items: 0, out_of_stock: 0, capital_value: 0 });
  
  const [exportForm, setExportForm] = useState({ qty: '', reason: 'Hàng tặng/Quà tặng', receiver_id: '' });
  const [adjustForm, setAdjustForm] = useState({ new_qty: '', reason: 'Điều chỉnh kiểm kho' });
  const [receivers, setReceivers] = useState<{value: string, label: string, sublabel?: string, avatar?: string}[]>([]);

  const { showConfirm, addToast, closeConfirm } = useUIStore();


  const fetchReceivers = async () => {
    try {
      const res = await api.get('/contacts');
      const raw = res.data?.data;
      const list = Array.isArray(raw) ? raw : (raw?.items || []);
      setReceivers(list.map((c: any) => ({
        value: String(c.id),
        label: `${c.first_name} ${c.last_name || ''}`.trim(),
        sublabel: c.phone || c.email || '',
        avatar: c.avatar_url
      })));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBatches = async () => {
    if (DEV_MODE) {
      const state = getFilteredMockState();
      let list = [...state.batches];

      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase();
        list = list.filter(b => b.product_name.toLowerCase().includes(s) || b.sku?.toLowerCase().includes(s) || b.batch_code.toLowerCase().includes(s));
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'in_stock') list = list.filter(b => b.current_qty > 0);
        else if (statusFilter === 'out_of_stock') list = list.filter(b => b.current_qty <= 0);
        else if (statusFilter === 'low_stock') list = list.filter(b => b.current_qty > 0 && b.current_qty <= 5);
      }

      setBatches(list);
      setTotal(list.length);
      // Mock summary
      setSummary({
        total_items: list.reduce((acc, b) => acc + b.current_qty, 0),
        out_of_stock: list.filter(b => b.current_qty <= 0).length,
        capital_value: list.reduce((acc, b) => acc + (b.current_qty * b.import_price), 0)
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    // Always fetch from API
    try {
      const params: any = { 
        page, 
        limit: PAGE_SIZE, 
        search: debouncedSearch,
        stock_status: statusFilter === 'all' ? '' : statusFilter,
        sort: sortBy.split('_')[0],
        order: sortBy.split('_')[1] === 'desc' ? 'DESC' : 'ASC'
      };
      const res = await api.get('/inventory', { params });
      const data = res.data.data;
      setBatches(data.items || []);
      setTotal(data.total || 0);
      if (data.summary) setSummary(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchLogs = async (batchId: number) => {
    if (DEV_MODE) {
      const state = getFilteredMockState();
      setLogs(state.inventory_logs.filter((l: any) => l.batch_id === batchId) as any);
      return;
    }
    try {
      const res = await api.get(`/inventory/logs/${batchId}`);
      if (res.data.success) setLogs(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGlobalLogs = async () => {
    if (DEV_MODE) {
      const state = getFilteredMockState();
      setGlobalLogs(state.inventory_logs as any);
      return;
    }
    try {
      const res = await api.get('/inventory/global-logs');
      if (res.data.success) setGlobalLogs(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [page, debouncedSearch, statusFilter, sortBy]);

  useEffect(() => {
    fetchGlobalLogs();
    fetchReceivers();
  }, []);

  const archiveBatch = (id: number) => {
    showConfirm(
      'Lưu trữ lô hàng', 
      'Bạn có chắc chắn muốn lưu trữ lô hàng này? Lô hàng sẽ không còn xuất hiện trong danh sách hoạt động.',
      async () => {
        try {
          const res = await api.post(`/inventory/archive/${id}`);
          if (res.data.success) {
            addToast('Đã lưu trữ lô hàng', 'success');
            fetchBatches();
          }
          closeConfirm();
        } catch (err) {
          addToast('Không thể kết nối máy chủ', 'error');
        }
      }
    );
  };

  const handleInternalExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    
    try {
      const res = await api.post('/inventory/export', {
        batch_id: selectedBatch.id,
        qty: Number(exportForm.qty),
        reason: exportForm.reason,
        receiver_id: exportForm.receiver_id || null
      });
      if (res.data.success) {
        addToast('Đã xuất kho nội bộ thành công', 'success');
        setShowExportModal(false);
        fetchBatches();
      } else {
        addToast(res.data.message, 'error');
      }
    } catch (err) {
      addToast('Không thể kết nối máy chủ', 'error');
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    
    try {
      const res = await api.post('/inventory/adjust', {
        batch_id: selectedBatch.id,
        new_qty: Number(adjustForm.new_qty),
        reason: adjustForm.reason
      });
      if (res.data.success) {
        addToast('Đã điều chỉnh tồn kho thành công', 'success');
        setShowAdjustModal(false);
        fetchBatches();
      } else {
        addToast(res.data.message, 'error');
      }
    } catch (err) {
      addToast('Không thể kết nối máy chủ', 'error');
    }
  };

  const filteredBatches = batches;

  const [now] = useState(() => Date.now());

  const stats = {
    totalValue: summary.capital_value || 0,
    totalBatches: total,
    lowStock: batches.filter(b => b.current_qty > 0 && b.current_qty <= 5).length, // Keep client-side for "low stock" if not in summary
    outOfStock: summary.out_of_stock || 0,
    expiringSoon: batches.filter(b => b.expiry_date && new Date(b.expiry_date) <= new Date(now + 30 * 24 * 60 * 60 * 1000) && b.current_qty > 0).length
  };

  return (
    <div className="page-container anim-fade-up">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Kho &amp; Lô hàng</h1>
          <p className="page-subtitle">Quản lý nhập kho, theo dõi lô hàng và lịch sử biến động.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '4px' }}>
            <button style={{ padding: '0 14px', height: '34px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 700, background: activeTab === 'batches' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'batches' ? 'white' : 'var(--color-text-muted)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }} onClick={() => setActiveTab('batches')}>Danh sách lô</button>
            <button style={{ padding: '0 14px', height: '34px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 700, background: activeTab === 'history' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'history' ? 'white' : 'var(--color-text-muted)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }} onClick={() => setActiveTab('history')}>Lịch sử biến động</button>
            <button style={{ padding: '0 14px', height: '34px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 700, background: activeTab === 'purchase_orders' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'purchase_orders' ? 'white' : 'var(--color-text-muted)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }} onClick={() => setActiveTab('purchase_orders')}>Đơn nhập hàng</button>
          </div>
          <div style={{ width: '1px', height: '28px', background: 'var(--color-border)' }} />
          <button className="btn outline" onClick={() => setShowImportExport(true)}><Download size={16} /> Nhập/Xuất</button>
          <button className="btn primary" onClick={() => { setActiveTab('purchase_orders'); setShowPOModal(true); }}><Plus size={16} /> Tạo đơn nhập hàng</button>
        </div>
      </div>

      <ImportExportModal 
        isOpen={showImportExport} 
        onClose={() => setShowImportExport(false)} 
        entityName={activeTab === 'batches' ? 'Kho hàng' : 'Sản phẩm'}
        onExport={() => {
            const type = activeTab === 'batches' ? 'inventory' : 'product';
            window.open(`${api.defaults.baseURL}/export?type=${type}&token=${localStorage.getItem('token')}`, '_blank');
        }}
      />

      {/* Always mounted so header button can open modal from any tab */}
      <div style={{ display: activeTab === 'purchase_orders' ? 'block' : 'none' }}>
        <PurchaseOrdersTab showModal={showPOModal} setShowModal={setShowPOModal} />
      </div>

      {activeTab !== 'purchase_orders' && (
        <>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Tổng vốn tồn kho', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(stats.totalValue), icon: DollarSign, color: 'var(--color-primary)', sub: `${stats.totalBatches} lô hàng đang quản lý` },
              { label: 'Số lô hàng', value: String(stats.totalBatches), icon: Layers, color: '#3b82f6', sub: `${batches.filter(b => b.current_qty > 0).length} lô còn hàng` },
              { label: 'Sắp hết hàng', value: String(stats.lowStock), icon: AlertTriangle, color: 'var(--color-warning)', sub: 'Dưới 5 sản phẩm' },
              { label: 'Sắp hết hạn (30d)', value: String(stats.expiringSoon), icon: Clock, color: 'var(--color-danger)', sub: 'Cần xử lý sớm' },
            ].map((k, i) => (
              <motion.div key={i} className="stat-kpi" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <div className="stat-kpi__header">
                  <div className="stat-kpi__icon" style={{ background: `${k.color}15`, color: k.color }}>
                    <k.icon size={16} />
                  </div>
                  <div className="stat-kpi__label">{k.label}</div>
                </div>
                {loading ? <div className="skeleton" style={{ height: 36, width: '85%', borderRadius: 6, marginBottom: 12 }} />
                  : <div className="stat-kpi__value">{k.value}</div>}
                <div className="stat-kpi__sub">{k.sub}</div>
              </motion.div>
            ))}
          </div>

      {/* Critical Alerts */}
      <AnimatePresence>
        {(stats.lowStock > 0 || stats.expiringSoon > 0) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            style={{ marginBottom: '1.5rem', overflow: 'hidden' }}
          >
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-xl)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--color-warning)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
                <AlertTriangle size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#92400e', margin: 0, marginBottom: 2 }}>Cảnh báo vận hành kho</h4>
                <p style={{ fontSize: '0.8125rem', color: '#b45309', margin: 0, lineHeight: 1.5 }}>
                  Có <strong>{stats.lowStock}</strong> lô hàng sắp hết và <strong>{stats.expiringSoon}</strong> lô hàng sắp hết hạn trong 30 ngày tới. Vui lòng kiểm tra và lên kế hoạch nhập hàng hoặc xả kho.
                </p>
              </div>
              <button 
                onClick={() => setStatusFilter('low_stock')}
                style={{ padding: '6px 16px', background: 'white', border: '1px solid rgba(245,158,11,0.35)', color: '#b45309', fontSize: '0.8125rem', fontWeight: 700, borderRadius: 'var(--radius-lg)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Xem ngay →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--color-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <div className="filter-search" style={{ flex: 1, minWidth: 0 }}>
          <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
          <input 
            placeholder="Tìm theo tên sản phẩm, SKU hoặc mã lô..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{ width: 160 }}>
            <CustomSelect
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'in_stock', label: 'Còn hàng' },
                { value: 'low_stock', label: 'Sắp hết hàng' },
                { value: 'out_of_stock', label: 'Đã hết hàng' }
              ]}
              value={statusFilter}
              onChange={(val) => { setStatusFilter(String(val)); setPage(1); }}
            />
          </div>
          <div style={{ width: 150 }}>
            <CustomSelect
              options={[
                { value: 'date_desc', label: 'Mới nhất trước' },
                { value: 'date_asc', label: 'Cũ nhất trước' },
                { value: 'qty_desc', label: 'Tồn kho giảm dần' },
                { value: 'qty_asc', label: 'Tồn kho tăng dần' }
              ]}
              value={sortBy}
              onChange={(val) => { setSortBy(String(val)); setPage(1); }}
            />
          </div>
          <div style={{ width: '1px', height: 24, background: 'var(--color-border)' }} />
          <div style={{ display: 'flex', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
            <button title="Danh sách" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: viewMode === 'list' ? 'var(--color-surface)' : 'transparent', color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }} onClick={() => setViewMode('list')}><List size={16} /></button>
            <button title="Lưới thẻ" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: viewMode === 'card' ? 'var(--color-surface)' : 'transparent', color: viewMode === 'card' ? 'var(--color-primary)' : 'var(--color-text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }} onClick={() => setViewMode('card')}><LayoutGrid size={16} /></button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'var(--color-text-muted)' }}>
          <div className="spinner" style={{ marginBottom: '1rem' }} />
          <p style={{ fontSize: '0.875rem' }}>Đang tải dữ liệu kho...</p>
        </div>
      ) : activeTab === 'history' ? (
        <div style={{ background: 'var(--color-surface)', borderRadius: '20px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {/* Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg)' }}>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)', margin: 0 }}>Lịch sử biến động toàn kho</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Ghi nhận mọi giao dịch nhập, xuất và bán hàng</p>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', background: 'var(--color-border)', padding: '4px 12px', borderRadius: '99px' }}>
              {globalLogs.length} giao dịch
            </span>
          </div>
          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)' }}>
                  {['Thời gian', 'Sản phẩm / Lô', 'Loại giao dịch', 'Biến động', 'Lý do', 'Người thực hiện'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1.25rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid var(--color-border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {globalLogs.map((log, i) => {
                  const isIn = log.qty_change > 0;
                  const typeConfig = log.action_type === 'IMPORT'
                    ? { label: 'Nhập kho', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' }
                    : log.action_type === 'SALE'
                    ? { label: 'Bán hàng', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' }
                    : log.action_type === 'EXPORT_INTERNAL'
                    ? { label: 'Xuất nội bộ', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' }
                    : { label: 'Điều chỉnh', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' };
                  return (
                    <tr key={log.id}
                      style={{ borderBottom: '1px solid var(--color-border-light)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.875rem 1.25rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>{new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '2px' }}>{new Date(log.created_at).toLocaleDateString('vi-VN')}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>{log.product_name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', marginTop: '3px', fontWeight: 600 }}>#{log.batch_code}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', fontWeight: 800, color: typeConfig.color, background: typeConfig.bg, border: `1px solid ${typeConfig.border}`, padding: '4px 10px', borderRadius: '99px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: typeConfig.color, display: 'inline-block' }} />
                          {typeConfig.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', fontWeight: 900, color: isIn ? '#10b981' : '#ef4444', background: isIn ? '#ecfdf5' : '#fef2f2', padding: '5px 12px', borderRadius: '10px' }}>
                          <span style={{ fontSize: '1rem' }}>{isIn ? '↑' : '↓'}</span>
                          {isIn ? '+' : ''}{log.qty_change}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.8rem', color: 'var(--color-text)', fontWeight: 600, maxWidth: '180px' }}>{log.reason}</td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                            {log.creator_name?.charAt(0)}
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>{log.creator_name}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', minHeight: '400px', width: '100%' }}>
          <div style={{ flex: 1, background: 'var(--color-surface)', padding: '4rem', borderRadius: 'var(--radius-2xl)', border: '2px dashed var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: '96px', height: '96px', background: 'var(--color-bg)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
              <Package size={48} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.5rem' }}>Không tìm thấy lô hàng nào</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '2rem', lineHeight: 1.5 }}>
              Thử thay đổi bộ lọc, tìm kiếm bằng từ khóa khác hoặc kiểm tra lại điều kiện.
            </p>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg)' }}>
                      <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid var(--color-border)' }}>Lô hàng & SKU</th>
                      <th style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid var(--color-border)' }}>Ngày nhập / HSD</th>
                      <th style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid var(--color-border)', textAlign: 'right' }}>Giá vốn</th>
                      <th style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid var(--color-border)', textAlign: 'center' }}>Tồn kho</th>
                      <th style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid var(--color-border)' }}>Trạng thái</th>
                      <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid var(--color-border)', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map((b, i) => {
                      const isNewDate = i === 0 || b.import_date !== filteredBatches[i-1].import_date;
                      const pct = b.initial_qty > 0 ? Math.min((b.current_qty / b.initial_qty) * 100, 100) : 0;
                      const catColor = b.category === 'Hardware' ? { bg: '#eff6ff', text: '#3b82f6' } :
                        b.category === 'Network' ? { bg: '#f0fdf4', text: '#10b981' } :
                        b.category === 'Software' ? { bg: '#fdf4ff', text: '#a855f7' } :
                        b.category === 'Security' ? { bg: '#fff7ed', text: '#f97316' } :
                        { bg: '#f8fafc', text: '#64748b' };
                      return (
                        <React.Fragment key={b.id}>
                          {isNewDate && (
                            <tr>
                              <td colSpan={6} style={{ padding: '0.5rem 1.25rem', background: 'linear-gradient(90deg, rgba(124,58,237,0.06) 0%, transparent 100%)', borderTop: '1px solid var(--color-border-light)', borderBottom: '1px solid var(--color-border-light)', borderLeft: '3px solid var(--color-primary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                  <CalendarDays size={12} />
                                  Nhập ngày: {new Date(b.import_date).toLocaleDateString('vi-VN')}
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr
                            className="group"
                            style={{ borderBottom: '1px solid var(--color-border-light)', transition: 'background 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.03)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding: '0.875rem 1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {b.category && (
                                  <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 7px', borderRadius: '6px', background: catColor.bg, color: catColor.text, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {b.category}
                                  </span>
                                )}
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>{b.product_name}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                    <span style={{ fontSize: '0.65rem', background: 'var(--color-bg)', color: 'var(--color-text-muted)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--color-border)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{b.sku || 'No SKU'}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>#{b.batch_code}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '0.875rem 1rem' }}>
                              <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', fontWeight: 600 }}>{new Date(b.import_date).toLocaleDateString('vi-VN')}</div>
                              {b.expiry_date && (
                                <div style={{ fontSize: '0.7rem', marginTop: '3px', fontWeight: 600, color: new Date(b.expiry_date) < new Date() ? 'var(--color-danger)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={10} /> HSD: {new Date(b.expiry_date).toLocaleDateString('vi-VN')}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>{b.import_price.toLocaleString()} đ</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2, fontWeight: 600 }}>{b.unit}</div>
                            </td>
                            <td style={{ padding: '0.875rem 1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: b.current_qty <= 5 ? 'var(--color-danger)' : 'var(--color-text)' }}>
                                  {b.current_qty} <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>/ {b.initial_qty}</span>
                                </div>
                                <div style={{ width: '80px', height: '7px', background: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', borderRadius: '99px', background: pct <= 10 ? 'linear-gradient(90deg,#ef4444,#f97316)' : pct <= 30 ? 'linear-gradient(90deg,#f59e0b,#eab308)' : 'linear-gradient(90deg,#7c3aed,#6366f1)', width: `${pct}%`, transition: 'width 0.5s ease' }} />
                                </div>
                                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>{pct.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.875rem 1rem' }}>
                              {b.current_qty <= 0 ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', background: '#fef2f2', padding: '4px 10px', borderRadius: '99px', border: '1px solid #fecaca' }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} /> Hết hàng
                                </span>
                              ) : b.current_qty <= 5 ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', background: '#fffbeb', padding: '4px 10px', borderRadius: '99px', border: '1px solid #fde68a' }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} /> Sắp hết
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '99px', border: '1px solid #a7f3d0' }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Còn hàng
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                              <div className="group-hover-visible" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '3px', opacity: 0, transition: 'opacity 0.2s', boxShadow: 'var(--shadow-sm)' }}>
                                <button
                                  title="Xuất nội bộ"
                                  onClick={() => { setSelectedBatch(b); setExportForm({ qty: '', reason: 'Hàng tặng/Quà tặng', receiver_id: '' }); setShowExportModal(true); }}
                                  style={{ width: 30, height: 30, borderRadius: '7px', border: 'none', background: 'transparent', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#fffbeb')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <Share size={14} />
                                </button>
                                <button
                                  title="Lịch sử lô hàng"
                                  onClick={() => { setSelectedBatch(b); fetchBatchLogs(b.id); setShowHistoryModal(true); }}
                                  style={{ width: 30, height: 30, borderRadius: '7px', border: 'none', background: 'transparent', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <History size={14} />
                                </button>
                                <button
                                  title="Điều chỉnh tồn kho"
                                  onClick={() => { setSelectedBatch(b); setAdjustForm({ new_qty: String(b.current_qty), reason: 'Điều chỉnh kiểm kho' }); setShowAdjustModal(true); }}
                                  style={{ width: 30, height: 30, borderRadius: '7px', border: 'none', background: 'transparent', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#f5f3ff')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <Edit size={14} />
                                </button>
                                {b.current_qty <= 0 && (
                                  <button
                                    title="Lưu trữ lô hàng"
                                    onClick={() => archiveBatch(b.id)}
                                    style={{ width: 30, height: 30, borderRadius: '7px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {filteredBatches.map(b => {
                const pct = b.initial_qty > 0 ? Math.min((b.current_qty / b.initial_qty) * 100, 100) : 0;
                const catColor = b.category === 'Hardware' ? { bg: 'linear-gradient(135deg,#3b82f6,#6366f1)', chip: '#eff6ff', chipText: '#3b82f6' } :
                  b.category === 'Network' ? { bg: 'linear-gradient(135deg,#10b981,#059669)', chip: '#f0fdf4', chipText: '#10b981' } :
                  b.category === 'Software' ? { bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', chip: '#fdf4ff', chipText: '#8b5cf6' } :
                  b.category === 'Security' ? { bg: 'linear-gradient(135deg,#f97316,#ef4444)', chip: '#fff7ed', chipText: '#f97316' } :
                  b.category === 'AV' ? { bg: 'linear-gradient(135deg,#ec4899,#8b5cf6)', chip: '#fdf2f8', chipText: '#ec4899' } :
                  { bg: 'linear-gradient(135deg,#64748b,#475569)', chip: '#f8fafc', chipText: '#64748b' };
                const statusStyle = b.current_qty <= 0
                  ? { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444', label: 'Hết hàng' }
                  : b.current_qty <= 5
                  ? { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', label: 'Sắp hết' }
                  : { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', dot: '#10b981', label: 'Còn hàng' };

                return (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'var(--color-surface)',
                      borderRadius: '16px',
                      border: '1px solid var(--color-border)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; }}
                  >
                    {/* Gradient Header */}
                    <div style={{ background: catColor.bg, padding: '1.125rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                          {b.category || 'General'}
                        </div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {b.product_name}
                        </h3>
                      </div>
                      {/* Stock Ring */}
                      <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0, marginLeft: '12px' }}>
                        <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                          <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="4"
                            strokeDasharray={`${2 * Math.PI * 19}`}
                            strokeDashoffset={`${2 * Math.PI * 19 * (1 - pct / 100)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900, color: '#fff' }}>
                          {pct.toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                      {/* SKU + Batch */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '5px', background: catColor.chip, color: catColor.chipText, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                          {b.sku || 'NO-SKU'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>#{b.batch_code}</span>
                      </div>

                      {/* Stock info */}
                      <div style={{ background: 'var(--color-bg)', borderRadius: '12px', padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tồn kho</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 900, color: b.current_qty <= 5 ? '#ef4444' : 'var(--color-text)' }}>
                            {b.current_qty}<span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}> / {b.initial_qty} {b.unit}</span>
                          </span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '99px', transition: 'width 0.6s ease',
                            background: pct <= 10 ? 'linear-gradient(90deg,#ef4444,#f97316)' : pct <= 30 ? 'linear-gradient(90deg,#f59e0b,#eab308)' : catColor.bg,
                            width: `${pct}%`
                          }} />
                        </div>
                      </div>

                      {/* Meta info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          <CalendarDays size={12} /> {new Date(b.import_date).toLocaleDateString('vi-VN')}
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 700, color: statusStyle.color, background: statusStyle.bg, padding: '3px 9px', borderRadius: '99px', border: `1px solid ${statusStyle.border}` }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusStyle.dot, display: 'inline-block' }} />
                          {statusStyle.label}
                        </span>
                      </div>

                      {/* Price */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border-light)' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Giá vốn</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--color-text)' }}>{b.import_price.toLocaleString()} đ</span>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--color-border-light)', display: 'flex', gap: '6px', background: 'var(--color-bg)' }}>
                      <button
                        onClick={() => { setSelectedBatch(b); setExportForm({ qty: '', reason: 'Hàng tặng/Quà tặng', receiver_id: '' }); setShowExportModal(true); }}
                        style={{ flex: 1, height: 36, borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: '#f59e0b', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fffbeb'; (e.currentTarget as HTMLElement).style.borderColor = '#fde68a'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}
                      >
                        <Share size={13} /> Xuất kho
                      </button>
                      <button
                        onClick={() => { setSelectedBatch(b); fetchBatchLogs(b.id); setShowHistoryModal(true); }}
                        title="Lịch sử"
                        style={{ width: 36, height: 36, borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#eff6ff'; (e.currentTarget as HTMLElement).style.borderColor = '#bfdbfe'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}
                      >
                        <History size={14} />
                      </button>
                      <button
                        onClick={() => { setSelectedBatch(b); setAdjustForm({ new_qty: String(b.current_qty), reason: 'Điều chỉnh kiểm kho' }); setShowAdjustModal(true); }}
                        title="Điều chỉnh"
                        style={{ width: 36, height: 36, borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f5f3ff'; (e.currentTarget as HTMLElement).style.borderColor = '#ddd6fe'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <Pagination 
              total={total} 
              page={page} 
              pageSize={PAGE_SIZE} 
              onChange={setPage} 
            />
          </div>
        </>
      )}

      {/* Internal Export Modal */}
      <AnimatePresence>
        {showExportModal && selectedBatch && (
          <div className="overlay-backdrop" style={{ zIndex: 9999 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="modal-sheet"
              style={{ width: '100%', maxWidth: '480px' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '12px', background: '#fef3c715', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fde68a' }}>
                    <Share size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Xuất kho nội bộ</h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>#{selectedBatch.batch_code} — {selectedBatch.product_name}</p>
                  </div>
                </div>
                <button className="btn-icon sm" onClick={() => setShowExportModal(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleInternalExport}>
                <div className="p-6 space-y-4">
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                    <div className="text-xs text-amber-700 leading-relaxed">
                      Bạn đang xuất hàng cho mục đích phi thương mại (Quà tặng, hư hỏng...). Thao tác này sẽ trừ tồn kho và ghi nhận vào chi phí vận hành.
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tồn hiện tại</div>
                      <div className="text-lg font-black text-slate-700">{selectedBatch.current_qty} {selectedBatch.unit}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Giá vốn lô</div>
                      <div className="text-lg font-black text-slate-700">{selectedBatch.import_price.toLocaleString()} đ</div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số lượng xuất <span className="text-danger">*</span></label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      min="1" 
                      max={selectedBatch.current_qty}
                      value={exportForm.qty}
                      onChange={e => setExportForm({...exportForm, qty: e.target.value})}
                      placeholder="Nhập số lượng..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Lý do xuất</label>
                    <CustomSelect 
                      options={[
                        { value: 'Hàng tặng/Quà tặng', label: 'Hàng tặng/Quà tặng' },
                        { value: 'Hư hỏng/Bể vỡ', label: 'Hư hỏng/Bể vỡ' },
                        { value: 'Hao hụt/Mất lạc', label: 'Hao hụt/Mất lạc' },
                        { value: 'Hàng mẫu/Tester', label: 'Hàng mẫu/Tester' },
                        { value: 'Tiêu dùng nội bộ', label: 'Tiêu dùng nội bộ' }
                      ]}
                      value={exportForm.reason}
                      onChange={val => setExportForm({...exportForm, reason: String(val)})}
                    />
                  </div>

                  <AnimatePresence>
                    {exportForm.reason === 'Hàng tặng/Quà tặng' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="form-group">
                        <label className="form-label" style={{ color: 'var(--color-primary)' }}>Người nhận (Ghi nhận chi phí CRM)</label>
                        <CustomSelect 
                          options={receivers.map(r => ({ ...r, label: r.label }))}
                          value={exportForm.receiver_id}
                          onChange={val => setExportForm({...exportForm, receiver_id: String(val)})}
                          placeholder="-- Bỏ qua hoặc Chọn khách hàng nhận --"
                          searchable
                          showAvatars
                        />
                        <p className="text-xs text-muted mt-2">Chi phí (giá vốn × số lượng) sẽ được tính vào mục chi phí của khách hàng này nếu bạn chọn.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn outline" onClick={() => setShowExportModal(false)}>Hủy bỏ</button>
                  <button type="submit" className="btn primary" style={{ minWidth: '140px' }}>Xác nhận xuất</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Adjust Modal */}
      <AnimatePresence>
        {showAdjustModal && selectedBatch && (
          <div className="overlay-backdrop" style={{ zIndex: 9999 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="modal-sheet"
              style={{ width: '100%', maxWidth: '460px' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Điều chỉnh tồn kho</h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Lô #{selectedBatch.batch_code} — {selectedBatch.product_name}</p>
                  </div>
                </div>
                <button className="btn-icon sm" onClick={() => setShowAdjustModal(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleAdjust}>
                <div className="p-6 space-y-4">
                  <div className="form-group">
                    <label className="form-label">Số lượng thực tế mới <span className="text-danger">*</span></label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      min="0"
                      value={adjustForm.new_qty}
                      onChange={e => setAdjustForm({...adjustForm, new_qty: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ghi chú điều chỉnh</label>
                    <textarea 
                      className="form-control" 
                      rows={3}
                      value={adjustForm.reason}
                      onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})}
                      placeholder="Lý do điều chỉnh (Kiểm kho định kỳ...)"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn outline" onClick={() => setShowAdjustModal(false)}>Hủy bỏ</button>
                  <button type="submit" className="btn primary" style={{ minWidth: '140px' }}>Lưu thay đổi</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && selectedBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <History size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Lịch sử lô hàng</h2>
                    <p className="text-sm text-slate-400">Chi tiết mọi biến động của lô #{selectedBatch.batch_code}</p>
                  </div>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">Không có dữ liệu lịch sử</div>
                ) : (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-100">
                    {logs.map((log) => (
                      <div key={log.id} className="relative pl-12">
                        <div className={`absolute left-2.5 top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10 ${
                          log.action_type === 'IMPORT' ? 'bg-success' :
                          log.action_type === 'SALE' ? 'bg-primary' :
                          log.action_type === 'EXPORT_INTERNAL' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-slate-700">{log.reason}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(log.created_at).toLocaleString('vi-VN')}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">Thay đổi:</span>
                              <span className={`font-black ${log.qty_change > 0 ? 'text-success' : 'text-danger'}`}>
                                {log.qty_change > 0 ? '+' : ''}{log.qty_change} {selectedBatch.unit}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">Thực hiện:</span>
                              <span className="font-bold text-slate-600">{log.creator_name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-6 bg-slate-50 text-right">
                <button onClick={() => setShowHistoryModal(false)} className="px-6 h-10 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition-colors">Đóng</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}
