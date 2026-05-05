import React, { useState, useMemo } from 'react';
import { Plus, GripVertical, Pencil, Trash2, Calendar, Target, DollarSign, MessageSquare, Building2, Loader2, Search, Filter, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useUIStore } from '../store/uiStore';
import { DealDrawer } from './DealDrawer';
import api from '../api/axios';

// STAGES and INIT_DEALS removed - using API state

const FMT = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'T';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  return (n / 1e3).toFixed(0) + 'K';
};

const MOCK_STAGES: any[] = [
  { id: 1, name: 'Lead mới', color: '#6366f1', position: 1 },
  { id: 2, name: 'Đã liên hệ', color: '#f59e0b', position: 2 },
  { id: 3, name: 'Thương lượng', color: '#8b5cf6', position: 3 },
  { id: 4, name: 'Báo giá', color: '#3b82f6', position: 4 },
  { id: 5, name: 'Chốt hợp đồng', color: '#10b981', position: 5 },
];

const MOCK_DEALS_GROUPED: Record<number, any[]> = {
  1: [
    { id: 1, title: 'Hệ thống ERP cho ABC Technology', value: 350000000, company: 'ABC Technology', contact: 'Nguyễn Văn An', prob: 60, close: '2026-06-30', stage_id: 1, assignee: 'admin' },
    { id: 2, title: 'Phần mềm CRM cho GreenSolar', value: 85000000, company: 'GreenSolar Corp', contact: 'Trần Thị Bình', prob: 40, close: '2026-07-15', stage_id: 1, assignee: 'sale1' },
  ],
  2: [
    { id: 3, title: 'Dịch vụ Tư vấn Chuyển đổi số', value: 45000000, company: 'TechGlobal Ltd', contact: 'Lê Hoàng Chính', prob: 65, close: '2026-06-15', stage_id: 2, assignee: 'admin' },
  ],
  3: [
    { id: 4, title: 'Hệ thống POS Nhà hàng MegaStore', value: 125000000, company: 'MegaStore Vietnam', contact: 'Phạm Minh Dũng', prob: 75, close: '2026-05-31', stage_id: 3, assignee: 'sale2' },
  ],
  4: [
    { id: 5, title: 'Platform E-learning EduTech', value: 95000000, company: 'EduTech Vietnam', contact: 'Hoàng Minh Lộc', prob: 85, close: '2026-05-25', stage_id: 4, assignee: 'admin' },
  ],
  5: [
    { id: 6, title: 'Gói Bảo trì VIP - LogiTrans', value: 36000000, company: 'LogiTrans Express', contact: 'Võ Thanh Hà', prob: 100, close: '2026-05-10', stage_id: 5, assignee: 'sale1' },
  ],
};

const EMPTY_DEAL = { title: '', value: '', company: '', contact: '', prob: 50, close: '' };

export const DealsPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [stages, setStages] = useState<any[]>([]);
  const [deals, setDeals] = useState<Record<number, any[]>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [dragging, setDragging] = useState<{ id: number, fromStage: number } | null>(null);
  const [transitionModal, setTransitionModal] = useState<{ isOpen: boolean; dealId: number; toStage: number; fromStage: number; note: string } | null>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  const fetchUsers = async () => {
    try {
      const r = await api.get('/users');
      setUsers(r.data.data || []);
    } catch (e) {
      console.error("Failed to fetch users", e);
    }
  };

  const fetchStages = async () => {
    try {
      const r = await api.get('/deals/stages');
      const data = r.data.data || [];
      setStages(data.length ? data : MOCK_STAGES);
      if (!data.length) setDeals(MOCK_DEALS_GROUPED);
      else fetchDeals();
    } catch {
      setStages(MOCK_STAGES);
      setDeals(MOCK_DEALS_GROUPED);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const r = await api.get('/deals');
      const items = r.data.data?.items || [];
      if (!items.length) { setDeals(MOCK_DEALS_GROUPED); setLoading(false); return; }
      const grouped: Record<number, any[]> = {};
      items.forEach((d: any) => {
        if (!grouped[d.stage_id]) grouped[d.stage_id] = [];
        grouped[d.stage_id].push(d);
      });
      setDeals(grouped);
    } catch {
      setDeals(MOCK_DEALS_GROUPED);
    } finally { setLoading(false); }
  };

  React.useEffect(() => {
    fetchUsers();
    fetchStages();
  }, []);

  const openCreate = (stageId: number) => {
    setEditItem({ ...EMPTY_DEAL, stageId }); setShowDrawer(true);
  };

  const openEdit = (deal: any, stageId: number) => {
    setEditItem({ ...deal, stageId }); setShowDrawer(true);
  };

  const handleSave = async (data: any) => {
    if (!data.title?.trim()) { addToast('Tiêu đề deal là bắt buộc', 'error'); return; }
    try {
      if (editItem?.id) {
        await api.put(`/deals/${editItem.id}`, data);
        addToast('Đã cập nhật Deal', 'success');
      } else {
        await api.post('/deals', data);
        addToast('Đã tạo Deal mới', 'success');
      }
      fetchDeals();
      setShowDrawer(false);
    } catch { addToast('Lỗi khi lưu deal', 'error'); }
  };

  const handleDrop = (toStage: number) => {
    if (!dragging || dragging.fromStage === toStage) return;
    
    setTransitionModal({
      isOpen: true,
      dealId: dragging.id,
      fromStage: dragging.fromStage,
      toStage: toStage,
      note: ''
    });
    
    setDragging(null);
  };

  const handleConfirmTransition = async () => {
    if (!transitionModal) return;
    if (!transitionModal.note.trim()) { addToast('Vui lòng nhập ghi chú bắt buộc (Audit Trail)', 'warning'); return; }

    try {
      await api.post(`/deals/${transitionModal.dealId}/move`, { 
        stage_id: transitionModal.toStage,
        note: transitionModal.note
      });
      fetchDeals(); // Refresh
      
      const deal = deals[transitionModal.fromStage]?.find(d => d.id === transitionModal.dealId);
      if (transitionModal.toStage === 5) { // Won
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        addToast(`TUYỆT VỜI! Chúc mừng bạn đã chốt thành công deal "${deal?.title}"`, 'success');
      } else {
        addToast('Đã chuyển trạng thái & lưu Audit Log', 'success');
      }
    } catch { addToast('Lỗi khi di chuyển deal', 'error'); }
    
    setTransitionModal(null);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/deals/${deleteItem.id}`);
      fetchDeals();
      addToast('Đã xóa cơ hội bán hàng thành công', 'success');
    } catch {
      // Fallback for demo/missing API
      setDeals(prev => ({ ...prev, [deleteItem.stageId]: prev[deleteItem.stageId].filter(d => d.id !== deleteItem.id) }));
      addToast('Đã xóa cơ hội (Local/Demo Mode)', 'success');
    } finally {
      setDeleteItem(null);
    }
  };

  const confirmDelete = (deal: any, stageId: number) => {
    setDeleteItem({ ...deal, stageId });
  };

  const filteredDeals = useMemo(() => {
    const result: Record<number, any[]> = {};
    Object.keys(deals).forEach(stageIdStr => {
      const stageId = parseInt(stageIdStr);
      result[stageId] = deals[stageId].filter(deal => {
        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          if (!deal.title?.toLowerCase().includes(lowerSearch) && 
              !deal.company?.toLowerCase().includes(lowerSearch) &&
              !deal.contact?.toLowerCase().includes(lowerSearch)) {
            return false;
          }
        }
        if (filterMonth && deal.close) {
          if (!deal.close.startsWith(filterMonth)) return false;
        }
        if (filterAssignee) {
          const val = String(filterAssignee);
          if (String(deal.owner_id) !== val && deal.assignee !== val) return false;
        }
        return true;
      });
    });
    return result;
  }, [deals, searchTerm, filterMonth, filterAssignee]);

  const totalPipeline = Object.values(filteredDeals).flat().reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={24} color="var(--color-primary)" />
            Pipeline Bán hàng
          </h1>
          <p className="page-subtitle">
            {Object.values(deals).flat().length} cơ hội · Tổng dự kiến: <strong style={{ color: 'var(--color-success)', fontSize: '1.1rem' }}>{totalPipeline.toLocaleString()} đ</strong>
          </p>
        </div>
        <button className="btn primary" onClick={() => openCreate(stages[0]?.id || 1)}><Plus size={16} /> Tạo Deal Mới</button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexShrink: 0, background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ flex: '1 1 300px', minWidth: 200 }}>
          <Search size={18} className="text-light" />
          <input 
            className="form-input" 
            placeholder="Tìm theo tên deal, công ty, người liên hệ..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 150 }}>
          <Calendar size={18} className="text-light" />
          <select className="form-input" style={{ paddingLeft: '0.5rem' }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">Tất cả thời gian chốt</option>
            {Array.from({ length: 12 }).map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() + i - 2); // Show 2 months past and 9 months future
              const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              const label = `Tháng ${d.getMonth() + 1} / ${d.getFullYear()}`;
              return <option key={val} value={val}>{label}</option>;
            })}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 150 }}>
          <Users size={18} className="text-light" />
          <select className="form-input" style={{ paddingLeft: '0.5rem' }} value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
            <option value="">Tất cả Sale (Assignee)</option>
            {users.map(u => (
              <option key={u.id} value={u.id || u.full_name}>{u.full_name}</option>
            ))}
          </select>
        </div>
        <button className="btn outline sm" onClick={() => { setSearchTerm(''); setFilterMonth(''); setFilterAssignee(''); }}>
          <Filter size={14} /> Bỏ lọc
        </button>
      </div>

      {/* Transition Modal */}
      <AnimatePresence>
        {transitionModal && transitionModal.isOpen && (
          <div className="overlay-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setTransitionModal(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-xl)', padding: '1.5rem', boxShadow: 'var(--shadow-2xl)' }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cập nhật trạng thái Pipeline</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                Từ <strong>{stages.find(s => s.id === transitionModal.fromStage)?.name}</strong> 
                {' '}➔{' '}
                <strong style={{ color: stages.find(s => s.id === transitionModal.toStage)?.color }}>{stages.find(s => s.id === transitionModal.toStage)?.name}</strong>
              </p>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Ghi chú Audit Trail <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  placeholder="Ghi chú bắt buộc lý do hoặc tóm tắt trước khi chuyển bước..."
                  value={transitionModal.note}
                  onChange={e => setTransitionModal({ ...transitionModal, note: e.target.value })}
                  autoFocus
                />
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn outline" onClick={() => setTransitionModal(null)}>Hủy</button>
                <button className="btn primary" onClick={handleConfirmTransition}>Lưu cập nhật</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Kanban Board Container */}
      <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '2rem', flex: 1, alignItems: 'flex-start' }}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="spin" /></div>
        ) : stages.map(stage => {
          const stageDeals = filteredDeals[stage.id] || [];
          const total = stageDeals.reduce((s, d) => s + (d.value || 0), 0);
          const isDragOver = dragging && dragging.fromStage !== stage.id; // Could track active drag over

          return (
            <div key={stage.id}
              style={{ 
                minWidth: 320, width: 320, flexShrink: 0, 
                background: 'var(--color-surface)', 
                borderRadius: 'var(--radius-xl)', 
                border: '1px solid var(--color-border)',
                display: 'flex', flexDirection: 'column', maxHeight: '100%',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onDragOver={e => { 
                e.preventDefault(); 
                e.currentTarget.style.background = 'var(--color-primary-light)'; 
                e.currentTarget.style.border = '2px dashed var(--color-primary)';
                e.currentTarget.style.transform = 'scale(1.01)';
              }}
              onDragLeave={e => { 
                e.currentTarget.style.background = 'var(--color-surface)'; 
                e.currentTarget.style.border = '1px solid var(--color-border)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onDrop={e => { 
                e.currentTarget.style.background = 'var(--color-surface)'; 
                e.currentTarget.style.border = '1px solid var(--color-border)';
                e.currentTarget.style.transform = 'scale(1)';
                handleDrop(stage.id); 
              }}>

              {/* Column Header */}
              <div style={{ padding: '1.25rem', borderBottom: `3px solid ${stage.color}`, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>{stage.name}</h3>
                    <span style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)', padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>{stageDeals.length}</span>
                  </div>
                  <button className="btn ghost sm" onClick={() => openCreate(stage.id)} style={{ padding: '4px', color: 'var(--color-text-light)' }} title="Thêm deal vào cột này"><Plus size={18} /></button>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: 600 }}>
                  {FMT(total)} đ
                </div>
              </div>

              {/* Deal Cards Area */}
              <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <AnimatePresence>
                  {stageDeals.map(deal => (
                    <motion.div key={deal.id}
                      draggable
                      onDragStart={() => setDragging({ id: deal.id, fromStage: stage.id })}
                      onDragEnd={() => setDragging(null)}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} layout
                      style={{ 
                        background: '#ffffff', borderRadius: 'var(--radius-lg)', padding: '1.25rem', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid var(--color-border-light)', 
                        cursor: 'grab', userSelect: 'none', position: 'relative'
                      }}
                      onClick={() => openEdit(deal, stage.id)}
                      whileHover={{ y: -2, boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }}
                      whileTap={{ cursor: 'grabbing' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: 1.4, paddingRight: '1rem' }}>{deal.title}</h4>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: stage.color, fontWeight: 700, fontSize: '1rem' }}>
                          <DollarSign size={14} /> {FMT(deal.value)}
                        </div>
                        <span style={{ fontSize: '0.75rem', background: 'var(--color-bg)', color: 'var(--color-text-light)', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>{deal.prob}% win</span>
                      </div>
                      
                      <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {deal.company && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '6px' }}><Building2 size={12} /> {deal.company}</p>}
                        {deal.close && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={12} /> {deal.close}</p>}
                      </div>

                      {/* Floating actions on hover could go here, for now relying on click to open drawer */}
                      <button 
                        style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', opacity: 0.5 }}
                        onClick={(e) => { e.stopPropagation(); confirmDelete(deal, stage.id); }}
                        title="Xóa deal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      <DealDrawer 
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        deal={editItem}
        onSave={handleSave}
        stages={stages}
      />

      {/* DELETE CONFIRM MODAL */}
      <AnimatePresence>
        {deleteItem && (
          <>
            <motion.div className="overlay-backdrop" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setDeleteItem(null)} style={{ zIndex: 500 }} />
            <motion.div className="modal" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }} style={{ zIndex: 510 }}>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ width: 56, height: 56, background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Trash2 size={24} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Xóa cơ hội bán hàng?</h3>
                <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  Bạn có chắc chắn muốn xóa <strong>{deleteItem.title}</strong>?<br/>Hành động này không thể hoàn tác.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button className="btn ghost" onClick={() => setDeleteItem(null)}>Hủy bỏ</button>
                  <button className="btn danger" onClick={handleDelete}>Xóa vĩnh viễn</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
