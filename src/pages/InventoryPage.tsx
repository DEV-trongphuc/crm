import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Edit, Trash2, LayoutGrid, List, Search, 
  Filter, History, Share, Clock, CheckCircle, AlertTriangle, 
  ChevronDown, DollarSign, CalendarDays, Layers, ArrowRight,
  TrendingDown, TrendingUp, MoreHorizontal, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import { PurchaseOrdersTab } from '../components/PurchaseOrdersTab';
import api from '../api/axios';
import { useDebounce } from '../hooks/useDebounce';
import { Pagination } from '../components/ui/Pagination';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useMockStore } from '../store/mockStore';
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

  const { showConfirm, addToast } = useUIStore();

  useEffect(() => {
    fetchBatches();
  }, [page, debouncedSearch, statusFilter, sortBy]);

  useEffect(() => {
    fetchGlobalLogs();
    fetchReceivers();
  }, []);

  const fetchReceivers = async () => {
    try {
      const res = await api.get('/contacts');
      if (res.data?.data) {
        setReceivers(res.data.data.map((c: any) => ({ 
          value: String(c.id), 
          label: `${c.first_name} ${c.last_name || ''}`.trim(),
          sublabel: c.phone || c.email || '',
          avatar: c.avatar_url
        })));
      }
    } catch (err) {}
  };

  const fetchBatches = async () => {
    if (DEV_MODE) {
      const state = useMockStore.getState();
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
      // Logic for batch logs from mock store if available
      setLogs([]); 
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
      // Mock global logs could be derived from activities or just static
      setGlobalLogs([]);
      return;
    }
    try {
      const res = await api.get('/inventory/global-logs');
      if (res.data.success) setGlobalLogs(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

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

  const stats = {
    totalValue: summary.capital_value || 0,
    totalBatches: total,
    lowStock: batches.filter(b => b.current_qty > 0 && b.current_qty <= 5).length, // Keep client-side for "low stock" if not in summary
    outOfStock: summary.out_of_stock || 0,
    expiringSoon: batches.filter(b => b.expiry_date && new Date(b.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && b.current_qty > 0).length
  };

  return (
    <div className="page-container anim-fade-up">
      <div className="page-header mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Package size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Kho & Lô hàng</h1>
            <p className="text-slate-500 text-sm">Quản lý nhập kho, theo dõi lô hàng và lịch sử biến động.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6">
            <div style={{ display: 'flex', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '4px', height: '44px' }}>
              <button 
                style={{ padding: '0 16px', height: '36px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 700, background: activeTab === 'batches' ? 'var(--color-primary-light)' : 'transparent', color: activeTab === 'batches' ? 'var(--color-primary)' : 'var(--color-text-muted)', transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}
                onClick={() => setActiveTab('batches')}
              >
                Danh sách lô
              </button>
              <button 
                style={{ padding: '0 16px', height: '36px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 700, background: activeTab === 'history' ? 'var(--color-primary-light)' : 'transparent', color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--color-text-muted)', transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}
                onClick={() => setActiveTab('history')}
              >
                Lịch sử biến động
              </button>
              <button 
                style={{ padding: '0 16px', height: '36px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 700, background: activeTab === 'purchase_orders' ? 'var(--color-primary-light)' : 'transparent', color: activeTab === 'purchase_orders' ? 'var(--color-primary)' : 'var(--color-text-muted)', transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}
                onClick={() => setActiveTab('purchase_orders')}
              >
                Đơn nhập hàng
              </button>
            </div>
            <div style={{ width: '1px', height: '32px', background: 'var(--color-border)' }} />
            <div style={{ display: 'flex', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '4px', height: '44px' }}>
              <button 
                title="Danh sách"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: viewMode === 'list' ? 'var(--color-primary-light)' : 'transparent', color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-muted)', transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </button>
              <button 
                title="Lưới thẻ"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: viewMode === 'card' ? 'var(--color-primary-light)' : 'transparent', color: viewMode === 'card' ? 'var(--color-primary)' : 'var(--color-text-muted)', transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}
                onClick={() => setViewMode('card')}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
          <div style={{ width: '1px', height: '32px', background: 'var(--color-border)', margin: '0 8px' }} />
          <button 
            className="btn primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={() => {
              console.log('Button clicked: setting tab to purchase_orders and showPOModal to true');
              setActiveTab('purchase_orders');
              setShowPOModal(true);
            }}
          >
            <Plus size={18} /> Tạo đơn nhập hàng
          </button>
        </div>
      </div>

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
            className="mb-6 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900">Cảnh báo vận hành kho</h4>
                <p className="text-xs text-amber-700 mt-1">
                  Có <strong>{stats.lowStock}</strong> lô hàng sắp hết và <strong>{stats.expiringSoon}</strong> lô hàng sắp hết hạn trong 30 ngày tới. Vui lòng kiểm tra và lên kế hoạch nhập hàng hoặc xả kho.
                </p>
              </div>
              <button 
                onClick={() => setStatusFilter('low_stock')}
                className="px-4 py-2 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-50 transition-colors"
              >
                Xem ngay →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <div className="filter-search" style={{ flex: 1, minWidth: '300px' }}>
          <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
          <input 
            placeholder="Tìm theo tên sản phẩm, SKU hoặc mã lô..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="animate-spin mb-4"><Package size={40} /></div>
          <p>Đang tải dữ liệu kho...</p>
        </div>
      ) : activeTab === 'history' ? (
        <div className="card-panel overflow-hidden anim-fade-up">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Lịch sử biến động toàn kho</h3>
            <p className="text-xs text-slate-400">Ghi nhận mọi giao dịch nhập, xuất và bán hàng</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Thời gian</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Sản phẩm / Lô</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Loại</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Biến động</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Lý do</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {globalLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{log.product_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">#{log.batch_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      {log.action_type === 'IMPORT' ? (
                        <span className="badge badge-success">Nhập kho</span>
                      ) : log.action_type === 'SALE' ? (
                        <span className="badge badge-primary">Bán hàng</span>
                      ) : log.action_type === 'EXPORT_INTERNAL' ? (
                        <span className="badge badge-warning">Xuất nội bộ</span>
                      ) : (
                        <span className="badge badge-info">Điều chỉnh</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-right font-black ${log.qty_change > 0 ? 'text-success' : 'text-danger'}`}>
                      {log.qty_change > 0 ? '+' : ''}{log.qty_change}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{log.reason}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{log.creator_name}</td>
                  </tr>
                ))}
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
            <div className="card-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Lô hàng & SKU</th>
                      <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Ngày nhập / HSD</th>
                      <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>Giá vốn</th>
                      <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>Tồn kho</th>
                      <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Trạng thái</th>
                      <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map((b, i) => {
                      const isNewDate = i === 0 || b.import_date !== filteredBatches[i-1].import_date;
                      return (
                        <React.Fragment key={b.id}>
                          {isNewDate && (
                            <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                              <td colSpan={6} style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border-light)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  <CalendarDays size={14} />
                                  Nhập ngày: {new Date(b.import_date).toLocaleDateString('vi-VN')}
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr className="group" style={{ transition: 'background-color 0.2s', borderBottom: '1px solid var(--color-border-light)' }}>
                            <td style={{ padding: '0.875rem 0.75rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{b.product_name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <span style={{ fontSize: '10px', background: 'var(--color-surface)', color: 'var(--color-text-muted)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)', fontFamily: 'monospace', textTransform: 'uppercase' }}>{b.sku || 'No SKU'}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 500 }}>#{b.batch_code}</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.875rem 0.75rem' }}>
                              <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', fontWeight: 500 }}>{b.import_date}</div>
                              {b.expiry_date && (
                                <div style={{ fontSize: '0.75rem', marginTop: '4px', fontWeight: 500, color: new Date(b.expiry_date) < new Date() ? 'var(--color-danger)' : 'var(--color-text-light)' }}>
                                  HSD: {b.expiry_date}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '0.875rem 0.75rem', textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{b.import_price.toLocaleString()} đ</div>
                              <div className="table-wrap" style={{ border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-lg)', maxHeight: '300px' }}>{b.unit}</div>
                            </td>
                            <td style={{ padding: '0.875rem 0.75rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: b.current_qty <= 5 ? 'var(--color-danger)' : 'var(--color-text)' }}>
                                  {b.current_qty} / {b.initial_qty}
                                </div>
                                <div style={{ width: '64px', height: '6px', background: 'var(--color-border)', borderRadius: 'var(--radius-full)', marginTop: '6px', overflow: 'hidden' }}>
                                  <div 
                                    style={{ height: '100%', borderRadius: 'var(--radius-full)', background: b.current_qty <= 5 ? 'var(--color-danger)' : 'var(--color-primary)', width: `${Math.min((b.current_qty / b.initial_qty) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '0.875rem 0.75rem' }}>
                              {b.current_qty <= 0 ? (
                                <span className="badge badge-danger">Hết hàng</span>
                              ) : b.current_qty <= 5 ? (
                                <span className="badge badge-warning">Sắp hết</span>
                              ) : (
                                <span className="badge badge-success">Còn hàng</span>
                              )}
                            </td>
                            <td style={{ padding: '0.875rem 0.75rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', opacity: 0, transition: 'opacity 0.2s' }} className="group-hover-visible">
                                <button 
                                  className="p-2 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors text-slate-400"
                                  title="Xuất nội bộ (Hỏng/Tặng)"
                                  onClick={() => {
                                    setSelectedBatch(b);
                                    setExportForm({ qty: '', reason: 'Hàng tặng/Quà tặng', receiver_id: '' });
                                    setShowExportModal(true);
                                  }}
                                >
                                  <Share size={16} />
                                </button>
                                <button 
                                  className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-slate-400"
                                  title="Lịch sử lô hàng"
                                  onClick={() => {
                                    setSelectedBatch(b);
                                    fetchBatchLogs(b.id);
                                    setShowHistoryModal(true);
                                  }}
                                >
                                  <History size={16} />
                                </button>
                                <button 
                                  className="p-2 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors text-slate-400"
                                  title="Điều chỉnh tồn kho"
                                  onClick={() => {
                                    setSelectedBatch(b);
                                    setAdjustForm({ new_qty: String(b.current_qty), reason: 'Điều chỉnh kiểm kho' });
                                    setShowAdjustModal(true);
                                  }}
                                >
                                  <Edit size={16} />
                                </button>
                                {b.current_qty <= 0 && (
                                  <button 
                                    className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors text-slate-400"
                                    title="Lưu trữ lô hàng"
                                    onClick={() => archiveBatch(b.id)}
                                  >
                                    <Trash2 size={16} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBatches.map(b => (
                <motion.div 
                  key={b.id}
                  layout
                  className={`card-panel group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-t-4 ${b.current_qty <= 0 ? 'border-danger' : b.current_qty <= 5 ? 'border-warning' : 'border-primary'}`}
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 line-clamp-1">{b.product_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase">{b.sku || 'No SKU'}</span>
                          <span className="text-xs text-slate-400 font-medium">#{b.batch_code}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-lg font-black text-slate-700">{b.import_price.toLocaleString()} đ</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{b.unit}</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tồn kho hiện tại</span>
                        <span className={`text-sm font-black ${b.current_qty <= 5 ? 'text-danger' : 'text-slate-700'}`}>
                          {b.current_qty} <span className="text-slate-400 font-medium">/ {b.initial_qty}</span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${b.current_qty <= 5 ? 'bg-danger' : 'bg-gradient-to-r from-primary to-blue-500'}`}
                          style={{ width: `${Math.min((b.current_qty / b.initial_qty) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <CalendarDays size={14} className="text-slate-400" />
                        <div className="text-xs font-medium">Nhập: <span className="text-slate-700">{b.import_date}</span></div>
                      </div>
                      {b.expiry_date && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock size={14} className={new Date(b.expiry_date) < new Date() ? 'text-danger' : 'text-slate-400'} />
                          <div className="text-xs font-medium">HSD: <span className={new Date(b.expiry_date) < new Date() ? 'text-danger font-bold' : 'text-slate-700'}>{b.expiry_date}</span></div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => { setSelectedBatch(b); setExportForm({ qty: '', reason: 'Hàng tặng/Quà tặng', receiver_id: '' }); setShowExportModal(true); }}
                        className="flex-1 h-9 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 flex items-center justify-center gap-2 text-xs font-bold transition-colors"
                      >
                        <Share size={14} /> Xuất nội bộ
                      </button>
                      <button 
                        onClick={() => { setSelectedBatch(b); fetchBatchLogs(b.id); setShowHistoryModal(true); }}
                        className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-colors"
                        title="Lịch sử"
                      >
                        <History size={16} />
                      </button>
                      <button 
                        onClick={() => { setSelectedBatch(b); setAdjustForm({ new_qty: String(b.current_qty), reason: 'Điều chỉnh kiểm kho' }); setShowAdjustModal(true); }}
                        className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors"
                        title="Điều chỉnh"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
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
