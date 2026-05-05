import React, { useState, useMemo, useEffect } from 'react';
import { Plus, GripVertical, Pencil, Trash2, Calendar, Target, DollarSign, MessageSquare, Building2, Loader2, Search, Filter, Users, User, CheckCircle2, Phone, Mail, LayoutGrid, List, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useUIStore } from '../store/uiStore';
import { CustomerProfileDrawer } from './CustomerProfileDrawer';
import { CompanyDrawer } from './CompanyDrawer';
import api from '../api/axios';
import { CustomSelect } from '../components/ui/CustomSelect';

const FMT = (n: number) => {
  if (!n) return '0 đ';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'T';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  return (n / 1e3).toFixed(0) + 'K';
};

export const DealsPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [pipelineView, setPipelineView] = useState<'contacts' | 'companies'>('contacts');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeStageFilter, setActiveStageFilter] = useState<string | number>('all');
  const [stages, setStages] = useState<any[]>([]);
  const [items, setItems] = useState<Record<number, any[]>>({});
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drawers
  const [showContactDrawer, setShowContactDrawer] = useState(false);
  const [showCompanyDrawer, setShowCompanyDrawer] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  
  const [dragging, setDragging] = useState<{ id: number, fromStage: number } | null>(null);
  const [transitionModal, setTransitionModal] = useState<{ isOpen: boolean; itemId: number; toStage: number; fromStage: number; note: string } | null>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilterType, setDateFilterType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterStage, setFilterStage] = useState('');
  
  // Temp states for Filter Panel
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [tempDateType, setTempDateType] = useState('');
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');
  const [tempAssignee, setTempAssignee] = useState('');
  const [tempStage, setTempStage] = useState('');
  
  const [activeFilterPill, setActiveFilterPill] = useState<string>('');

  const fetchUsers = async () => {
    try {
      const r = await api.get('/users');
      setAllUsers(r.data.data || []);
    } catch (e) {
      console.error("Failed to fetch users", e);
    }
  };

  const fetchStages = async () => {
    try {
      const r = await api.get('/pipeline-stages');
      setStages(r.data.data || []);
    } catch {
      setStages([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = pipelineView === 'contacts' ? '/contacts' : '/companies';
      const r = await api.get(endpoint);
      const dataItems = r.data.data?.items || [];
      const grouped: Record<number, any[]> = {};
      dataItems.forEach((d: any) => {
        const sid = d.stage_id || stages[0]?.id;
        if (!grouped[sid]) grouped[sid] = [];
        grouped[sid].push(d);
      });
      setItems(grouped);
    } catch {
      setItems({});
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchUsers();
    fetchStages().then(() => fetchData());
  }, [pipelineView]);

  useEffect(() => {
    if (stages.length > 0) fetchData();
  }, [stages, pipelineView]);

  // Update a single item in the local items state without a full refetch
  const updateItemLocally = (updated: any) => {
    setItems(prev => {
      const next: Record<number, any[]> = {};
      Object.keys(prev).forEach(sid => {
        next[sid as any] = (prev[sid as any] || []).map((it: any) =>
          it.id === updated.id ? { ...it, ...updated } : it
        );
      });
      return next;
    });
  };

  const handleDrop = (toStage: number) => {
    if (!dragging || dragging.fromStage === toStage) return;
    setTransitionModal({
      isOpen: true,
      itemId: dragging.id,
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
      const endpoint = pipelineView === 'contacts' ? `/contacts/${transitionModal.itemId}/stage` : `/companies/${transitionModal.itemId}/stage`;
      await api.patch(endpoint, { 
        stage_id: transitionModal.toStage,
        note: transitionModal.note
      });
      fetchData(); // Refresh
      
      const item = items[transitionModal.fromStage]?.find(d => d.id === transitionModal.itemId);
      const toStage = stages.find(s => s.id === transitionModal.toStage);
      if (toStage?.is_won) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        addToast(`TUYỆT VỜI! Chúc mừng bạn đã chốt thành công "${pipelineView === 'contacts' ? item?.first_name : item?.name}"`, 'success');
      } else {
        addToast('Đã chuyển trạng thái & lưu Audit Log', 'success');
      }
    } catch { addToast('Lỗi khi di chuyển thẻ', 'error'); }
    
    setTransitionModal(null);
  };

  const filteredItems = useMemo(() => {
    const result: Record<string, any[]> = {};
    Object.keys(items).forEach(stageIdStr => {
      const stageItems = items[stageIdStr as any] || [];
      result[stageIdStr] = stageItems.filter(item => {
        // Text Search
        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          const nameMatch = pipelineView === 'contacts' 
            ? `${item.first_name || ''} ${item.last_name || ''} ${item.email || ''}`.toLowerCase().includes(lowerSearch)
            : `${item.name || ''} ${item.email || ''}`.toLowerCase().includes(lowerSearch);
          
          if (!nameMatch) return false;
        }
        // Date Filter (using updated_at as proxy for pipeline move time)
        const dateToCheck = item.updated_at || item.created_at;
        if (dateToCheck) {
          const itemDate = dateToCheck.split(' ')[0]; // YYYY-MM-DD
          if (dateFilterType && dateFilterType !== 'custom') {
            if (!itemDate.startsWith(dateFilterType)) return false;
          } else if (dateFilterType === 'custom') {
            if (filterDateFrom && itemDate < filterDateFrom) return false;
            if (filterDateTo && itemDate > filterDateTo) return false;
          }
        }
        // Assignee Filter
        if (filterAssignee) {
          const val = String(filterAssignee);
          if (String(item.owner_id) !== val) return false;
        }
        // Stage Filter
        if (filterStage) {
          if (String(item.stage_id) !== String(filterStage)) return false;
        }
        return true;
      });
    });
    return result;
  }, [items, searchTerm, dateFilterType, filterDateFrom, filterDateTo, filterAssignee, filterStage, pipelineView]);

  const totalRevenue = Object.values(filteredItems).flat().reduce((sum, d) => sum + (Number(d.expected_revenue) || 0), 0);

  const filterPills = [
    { id: '', label: 'Tất cả' },
    { id: 'my', label: 'Của tôi' },
    { id: 'recent', label: 'Tương tác gần đây' },
    { id: 'won', label: 'Đã chốt' }
  ];

  const handlePillClick = (id: string) => {
    setActiveFilterPill(id);
    if (id === 'my') {
       // logic to filter by current user
       setFilterAssignee('1'); // Assuming '1' is the current user ID for demo, usually from auth store
    } else {
       setFilterAssignee('');
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={24} color="var(--color-primary)" />
            Pipeline {pipelineView === 'contacts' ? 'Khách hàng' : 'Doanh nghiệp'}
          </h1>
          <p className="page-subtitle">
            {Object.values(items).flat().length} thẻ · Tổng dự kiến: <strong style={{ color: 'var(--color-success)', fontSize: '1.1rem' }}>{FMT(totalRevenue)}</strong>
          </p>
        </div>
        <div style={{ flex: 1 }} />

        {/* Kanban vs List Toggle */}
        <div style={{ display: 'flex', background: 'var(--color-bg)', padding: '4px', borderRadius: 'var(--radius-lg)', marginRight: '1rem' }}>
          <button 
            className={`btn ${viewMode === 'kanban' ? 'primary' : 'ghost'} sm`} 
            style={{ borderRadius: 'var(--radius-md)', padding: '6px 10px' }}
            onClick={() => setViewMode('kanban')}
            title="Dạng bảng (Kanban)"
          ><LayoutGrid size={18}/></button>
          <button 
            className={`btn ${viewMode === 'list' ? 'primary' : 'ghost'} sm`} 
            style={{ borderRadius: 'var(--radius-md)', padding: '6px 10px' }}
            onClick={() => setViewMode('list')}
            title="Dạng danh sách"
          ><List size={18}/></button>
        </div>

        {/* Toggle View */}
        <div style={{ display: 'flex', background: 'var(--color-bg)', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
          <button 
            className={`btn ${pipelineView === 'contacts' ? 'primary' : 'ghost'} sm`} 
            style={{ borderRadius: 'var(--radius-md)' }}
            onClick={() => setPipelineView('contacts')}
          >
            <User size={16} /> Khách hàng
          </button>
          <button 
            className={`btn ${pipelineView === 'companies' ? 'primary' : 'ghost'} sm`} 
            style={{ borderRadius: 'var(--radius-md)' }}
            onClick={() => setPipelineView('companies')}
          >
            <Building2 size={16} /> Doanh nghiệp
          </button>
        </div>
      </div>

      {/* Filter Bar with CSS Alignment Fixes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', flexShrink: 0, background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* SEARCH INPUT ALIGNMENT FIX */}
          <div className="search-wrap" style={{ flex: '1 1 300px', minWidth: 200, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} className="text-light" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
            <input 
              className="form-input" 
              style={{ paddingLeft: '38px', width: '100%' }}
              placeholder={pipelineView === 'contacts' ? "Tìm theo tên khách hàng, email, sđt..." : "Tìm theo tên doanh nghiệp, mã số thuế..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button className={`btn ${showFilterPanel ? 'primary' : 'outline'}`} onClick={() => {
            if (!showFilterPanel) {
              setTempDateType(dateFilterType); setTempDateFrom(filterDateFrom); setTempDateTo(filterDateTo);
              setTempAssignee(filterAssignee); setTempStage(filterStage);
            }
            setShowFilterPanel(!showFilterPanel);
          }}>
            <Filter size={16} /> Bộ lọc nâng cao {(dateFilterType || filterAssignee || filterStage) ? '(Đang bật)' : ''}
          </button>
          
          {(dateFilterType || filterAssignee || filterStage || activeFilterPill) && (
            <button className="btn ghost sm" onClick={() => { setSearchTerm(''); setDateFilterType(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterAssignee(''); setFilterStage(''); setActiveFilterPill(''); setShowFilterPanel(false); }}>
              Bỏ lọc
            </button>
          )}
        </div>

        {/* The Filter Panel */}
        <AnimatePresence>
          {showFilterPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1rem', marginTop: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                 {/* Khung thời gian */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Thời gian chuyển Pipeline</label>
                    <CustomSelect options={[
                       {value: '', label: 'Tất cả thời gian'},
                       ...Array.from({ length: 6 }).map((_, i) => {
                         const d = new Date(); d.setMonth(d.getMonth() - i);
                         const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                         return { value: val, label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}` };
                       }),
                       {value: 'custom', label: 'Tùy chỉnh (Từ ngày - Đến ngày)...'}
                    ]} value={tempDateType} onChange={v => setTempDateType(v as string)} />
                    {tempDateType === 'custom' && (
                       <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                         <input type="date" className="form-input" style={{ width: '100%' }} value={tempDateFrom} onChange={e => setTempDateFrom(e.target.value)} title="Từ ngày" />
                         <span style={{ alignSelf: 'center', fontWeight: 600, color: 'var(--color-text-light)' }}>-</span>
                         <input type="date" className="form-input" style={{ width: '100%' }} value={tempDateTo} onChange={e => setTempDateTo(e.target.value)} title="Đến ngày" />
                       </div>
                    )}
                 </div>

                 {/* Phụ trách */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Sale phụ trách (Owner)</label>
                    <CustomSelect options={[
                       {value: '', label: 'Tất cả Sale'},
                       ...allUsers.map(u => ({value: String(u.id), label: u.full_name}))
                    ]} value={tempAssignee} onChange={v => setTempAssignee(v as string)} searchable />
                 </div>

                 {/* Giai đoạn */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Giai đoạn Pipeline</label>
                    <CustomSelect options={[
                       {value: '', label: 'Tất cả giai đoạn'},
                       ...stages.map(s => ({value: String(s.id), label: s.name}))
                    ]} value={tempStage} onChange={v => setTempStage(v as string)} />
                 </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                 <button className="btn outline" onClick={() => setShowFilterPanel(false)}>Hủy</button>
                 <button className="btn primary" onClick={() => {
                    setDateFilterType(tempDateType); setFilterDateFrom(tempDateFrom); setFilterDateTo(tempDateTo);
                    setFilterAssignee(tempAssignee); setFilterStage(tempStage); setActiveFilterPill('');
                    setShowFilterPanel(false);
                 }}>Áp dụng Lọc</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Quick Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {filterPills.map(pill => (
            <button
              key={pill.id}
              onClick={() => handlePillClick(pill.id)}
              style={{
                padding: '6px 16px',
                borderRadius: '99px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: `1px solid ${activeFilterPill === pill.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: activeFilterPill === pill.id ? 'var(--color-primary-light)' : 'var(--color-surface)',
                color: activeFilterPill === pill.id ? 'var(--color-primary)' : 'var(--color-text-light)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

      </div>

      {viewMode === 'list' && (
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>Giai đoạn:</span>
          <button
            onClick={() => setActiveStageFilter('all')}
            style={{
              padding: '6px 16px', borderRadius: '99px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
              border: `1px solid ${activeStageFilter === 'all' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: activeStageFilter === 'all' ? 'var(--color-primary-light)' : 'var(--color-surface)',
              color: activeStageFilter === 'all' ? 'var(--color-primary)' : 'var(--color-text-light)',
            }}
          >
            Tất cả ({Object.values(filteredItems).flat().length})
          </button>
          {stages.map(stage => {
            const count = (filteredItems[stage.id] || []).length;
            const isActive = activeStageFilter === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageFilter(stage.id)}
                style={{
                  padding: '6px 16px', borderRadius: '99px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  border: `1px solid ${isActive ? stage.color || 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: isActive ? `${stage.color || 'var(--color-primary)'}15` : 'var(--color-surface)',
                  color: isActive ? stage.color || 'var(--color-primary)' : 'var(--color-text-light)',
                }}
              >
                {stage.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === 'kanban' ? (
        <div className="card" style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', padding: '1.5rem', paddingBottom: '2rem', flex: 1, alignItems: 'flex-start', background: 'var(--color-surface)' }}>
          {loading ? (
            // Skeleton columns while loading
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ minWidth: 320, width: 320, flexShrink: 0, background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-light)', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '3px solid var(--color-border)' }}>
                    <div style={{ height: 18, width: 120, background: '#e9ecef', borderRadius: 6, marginBottom: 8 }} />
                    <div style={{ height: 14, width: 60, background: '#f1f3f5', borderRadius: 6 }} />
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2].map(j => (
                      <div key={j} style={{ background: '#f8f9fa', borderRadius: 'var(--radius-lg)', padding: '1.25rem', animation: 'pulse 1.5s ease-in-out infinite' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e9ecef' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ height: 14, width: '70%', background: '#dee2e6', borderRadius: 4, marginBottom: 6 }} />
                            <div style={{ height: 11, width: '50%', background: '#e9ecef', borderRadius: 4 }} />
                          </div>
                        </div>
                        <div style={{ height: 11, width: '60%', background: '#e9ecef', borderRadius: 4, marginBottom: 6 }} />
                        <div style={{ height: 11, width: '80%', background: '#e9ecef', borderRadius: 4 }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : stages.map(stage => {
            const stageItems = filteredItems[stage.id] || [];
            const total = stageItems.reduce((s, d) => s + (Number(d.expected_revenue) || 0), 0);

            return (
              <div key={stage.id}
                style={{ 
                  minWidth: 320, width: 320, flexShrink: 0, 
                  background: 'transparent',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: 'var(--radius-xl)',
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
                }}
              >
                {/* Stage Header */}
                <div style={{ padding: '1rem 1.25rem', borderBottom: `3px solid ${stage.color || 'var(--color-primary)'}`, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>{stage.name}</h3>
                      <span style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)', padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>{stageItems.length}</span>
                    </div>
                    <button className="btn ghost sm" onClick={() => {
                      if (pipelineView === 'contacts') { setSelectedContact({ stage_id: stage.id }); setShowContactDrawer(true); }
                      else { setSelectedCompany({ stage_id: stage.id }); setShowCompanyDrawer(true); }
                    }} style={{ padding: '4px', color: 'var(--color-text-light)' }} title="Thêm vào cột này"><Plus size={18} /></button>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: 600 }}>
                    {FMT(total)}
                  </div>
                </div>

                {/* Cards Container */}
                <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <AnimatePresence>
                    {stageItems.map(item => {
                      const itemName = pipelineView === 'contacts' ? `${item.first_name} ${item.last_name || ''}`.trim() : item.name;
                      return (
                      <motion.div key={item.id}
                        draggable
                        onDragStart={() => setDragging({ id: item.id, fromStage: stage.id })}
                        onDragEnd={() => setDragging(null)}
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} layout
                        style={{ 
                          background: '#ffffff', borderRadius: 'var(--radius-lg)', padding: '1.25rem', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid var(--color-border-light)', 
                          cursor: 'grab', userSelect: 'none', position: 'relative'
                        }}
                        onClick={() => {
                          if (pipelineView === 'contacts') { setSelectedContact(item); setShowContactDrawer(true); }
                          else { setSelectedCompany(item); setShowCompanyDrawer(true); }
                        }}
                        whileHover={{ y: -2, boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }}
                        whileTap={{ cursor: 'grabbing' }}
                      >
                        {/* Header: Avatar and Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${stage.color || 'var(--color-primary)'}20`, color: stage.color || 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.0625rem', fontWeight: 800, flexShrink: 0, border: `1.5px solid ${stage.color || 'var(--color-primary)'}40` }}>
                            {itemName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {itemName}
                            </h4>
                            {item.company_name && (
                              <p style={{ fontSize: '0.73rem', color: 'var(--color-text-light)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                <Building2 size={11} style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.company_name}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Body: Contact Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.875rem' }}>
                          {item.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              <Phone size={13} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.phone}</span>
                            </div>
                          )}
                          {item.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              <Mail size={13} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.email}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Footer: Pipeline Update Time & Owner */}
                        <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-text-light)' }} title="Cập nhật Pipeline lần cuối">
                             <Clock size={12} />
                             <span>{item.updated_at ? item.updated_at.substring(0,10) : (item.created_at?.substring(0,10) || '')}</span>
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }} title={item.owner_name || 'Sale phụ trách'}>
                             <User size={12} />
                             <span>{item.owner_name?.split(' ').pop() || 'Sale'}</span>
                           </div>
                        </div>
                      </motion.div>
                    )})}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-panel" style={{ flex: 1, overflow: 'auto', background: 'var(--color-surface)', padding: 0 }}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center" style={{ minHeight: 300 }}><Loader2 className="spin" size={32} /></div>
          ) : (
            <table className="table" style={{ width: '100%', minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Tên {pipelineView === 'contacts' ? 'Khách hàng' : 'Doanh nghiệp'}</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Dự kiến</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Giai đoạn</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Liên hệ</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(filteredItems)
                  .flat()
                  .filter(item => activeStageFilter === 'all' || String(item.stage_id) === String(activeStageFilter))
                  .map(item => {
                  const itemName = pipelineView === 'contacts' ? `${item.first_name || ''} ${item.last_name || ''}`.trim() : item.name;
                  const stage = stages.find(s => s.id === item.stage_id);
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => {
                        if (pipelineView === 'contacts') { setSelectedContact(item); setShowContactDrawer(true); }
                        else { setSelectedCompany(item); setShowCompanyDrawer(true); }
                      }}
                      style={{ cursor: 'pointer', borderBottom: '1px solid var(--color-border-light)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 800 }}>
                            {itemName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.875rem' }}>{itemName}</p>
                            {item.company_name && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.company_name}</p>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.875rem' }}>{FMT(Number(item.expected_revenue) || 0)}</span>
                        {pipelineView === 'contacts' && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{item.win_probability || 50}% win</div>}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: stage ? `${stage.color || 'var(--color-primary)'}15` : 'var(--color-bg)', color: stage ? stage.color || 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                          {stage?.name || 'Không xác định'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {item.phone && <div style={{ fontSize: '0.8125rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}><Phone size={12} className="text-light"/> {item.phone}</div>}
                        {item.email && <div style={{ fontSize: '0.8125rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} className="text-light"/> {item.email}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showContactDrawer && (
        <CustomerProfileDrawer 
          isOpen={showContactDrawer}
          onClose={() => { setShowContactDrawer(false); fetchData(); }}
          contact={selectedContact}
          onUpdate={(updated) => { updateItemLocally(updated); fetchData(); }}
        />
      )}

      {showCompanyDrawer && (
        <CompanyDrawer
          isOpen={showCompanyDrawer}
          onClose={() => { setShowCompanyDrawer(false); fetchData(); }}
          entity={selectedCompany}
          onSave={() => fetchData()}
        />
      )}

      {/* Transition Modal */}
      <AnimatePresence>
        {transitionModal && transitionModal.isOpen && (
          <div className="overlay-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setTransitionModal(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-xl)', padding: '1.5rem', boxShadow: 'var(--shadow-2xl)' }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cập nhật Pipeline</h3>
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
                  placeholder="Ghi chú bắt buộc lý do chuyển..."
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

    </div>
  );
};
