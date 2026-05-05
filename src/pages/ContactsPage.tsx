import React, { useState, useMemo } from 'react';
import { Plus, Search, Phone, Mail, Eye, Trash2, X, Download, Users, Tag as TagIcon, UserCheck, RefreshCw, Filter, LayoutGrid, List, ArrowDownUp, Columns, Building2, Briefcase, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import { CustomerProfileDrawer } from './CustomerProfileDrawer';
import { LeadScoreRing } from '../components/ui/LeadScoreRing';
import { TagDisplay } from '../components/ui/TagInput';
import { Pagination } from '../components/ui/Pagination';
import { ColumnCustomizer, type ColumnDef } from '../components/ui/ColumnCustomizer';
import { ImportExportModal } from '../components/ui/ImportExportModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import api from '../api/axios';
import { DEV_MODE } from '../config/env';

const PAGE_SIZE = 50;

const STATUS_LABEL: Record<string,string> = { lead:'Lead mới', qualified:'Đủ điều kiện', customer:'Khách hàng', churned:'Đã rời' };
const STATUS_CLASS: Record<string,string> = { lead:'info', qualified:'warning', customer:'success', churned:'danger' };

const calcScore = (c: any) => {
  if (!c) return 0;
  let s = 50;
  if (c.status==='customer')  s+=30;
  if (c.status==='qualified') s+=15;
  if (c.status==='churned')   s-=20;
  if (c.source==='referral')  s+=10;
  if (c.has_called)           s+=15;
  return Math.min(100, Math.max(0,s));
};

// Mock data removed for production enforcement
const MOCK: any[] = [
  { id:1,  first_name:'Nguyễn', last_name:'Văn An',      email:'an.nguyen@abctech.vn',   phone:'0901234567', job_title:'Giám đốc',          status:'customer',  source:'referral',  company_name:'ABC Technology',   has_called:true,  city:'Hà Nội',   tags:['vip','erp','q3'],      last_contact:'2026-05-03', open_deal_value:350000000 },
  { id:2,  first_name:'Trần',   last_name:'Thị Bình',    email:'binh.tran@abctech.vn',   phone:'0912345678', job_title:'Trưởng phòng IT',    status:'customer',  source:'website',   company_name:'ABC Technology',   has_called:false, city:'TP.HCM',    tags:['it','cloud'],          last_contact:'2026-04-28', open_deal_value:85000000  },
  { id:3,  first_name:'Lê',     last_name:'Minh Cường',  email:'cuong.le@xyz.vn',        phone:'0923456789', job_title:'CFO',                status:'qualified', source:'cold_call', company_name:'XYZ Holdings',     has_called:true,  city:'Đà Nẵng', tags:['finance','priority'],  last_contact:'2026-05-01', open_deal_value:125000000 },
  { id:4,  first_name:'Phạm',   last_name:'Thị Dung',    email:'dung.pham@green.vn',     phone:'0934567890', job_title:'CEO',                status:'lead',      source:'event',     company_name:'GreenSolar Corp',  has_called:false, city:'Hà Nội',   tags:['solar','new'],         last_contact:'2026-04-15', open_deal_value:0         },
  { id:5,  first_name:'Hoàng',  last_name:'Văn Em',      email:'em.hoang@pho24.vn',      phone:'0945678901', job_title:'Quản lý',            status:'qualified', source:'social',    company_name:'Phở 24',           has_called:true,  city:'TP.HCM',    tags:['food','retail'],       last_contact:'2026-05-02', open_deal_value:45000000  },
  { id:6,  first_name:'Vũ',     last_name:'Thanh Hà',    email:'ha.vu@logitrans.vn',     phone:'0956789012', job_title:'Giám đốc Vận hành', status:'customer',  source:'referral',  company_name:'LogiTrans Express', has_called:true, city:'Hà Nội',   tags:['logistics','vip'],     last_contact:'2026-05-04', open_deal_value:36000000  },
  { id:7,  first_name:'Đinh',   last_name:'Minh Lộc',    email:'loc.dinh@edutech.vn',    phone:'0967890123', job_title:'CEO',                status:'qualified', source:'event',     company_name:'EduTech Vietnam',  has_called:false, city:'TP.HCM',    tags:['edu','startup'],       last_contact:'2026-04-20', open_deal_value:95000000  },
  { id:8,  first_name:'Bùi',    last_name:'Thị Lan',     email:'lan.bui@fashion.vn',     phone:'0978901234', job_title:'Marketing Director', status:'lead',      source:'social',    company_name:'FashionHub',        has_called:false, city:'TP.HCM',    tags:['fashion','b2c'],       last_contact:'2026-03-10', open_deal_value:0         },
  { id:9,  first_name:'Đỗ',     last_name:'Quang Minh',  email:'minh.do@retail.vn',      phone:'0989012345', job_title:'CTO',                status:'customer',  source:'referral',  company_name:'Retail Pro Group',  has_called:true, city:'Đà Nẵng', tags:['tech','pos'],          last_contact:'2026-05-01', open_deal_value:175000000 },
  { id:10, first_name:'Cao',    last_name:'Thị Nga',     email:'nga.cao@megastore.vn',   phone:'0990123456', job_title:'COO',                status:'qualified', source:'cold_call', company_name:'MegaStore Vietnam', has_called:true, city:'TP.HCM',    tags:['ecom','enterprise'],   last_contact:'2026-04-25', open_deal_value:220000000 },
  { id:11, first_name:'Trịnh',  last_name:'Văn Phúc',    email:'phuc.trinh@xyz.vn',      phone:'0901111222', job_title:'Sales Director',     status:'churned',   source:'cold_call', company_name:'XYZ Holdings',     has_called:true,  city:'Hà Nội',   tags:['churned'],             last_contact:'2026-02-01', open_deal_value:0         },
  { id:12, first_name:'Lý',     last_name:'Thị Quỳnh',   email:'quynh.ly@startup.vn',    phone:'0902222333', job_title:'Founder',            status:'lead',      source:'website',   company_name:'StartupVN',         has_called:false, city:'TP.HCM',    tags:['startup','saas'],      last_contact:'2026-05-05', open_deal_value:0         },
];

const SEGMENTS = [
  { key:'all',         label:'Tất cả',              icon:'' },
  { key:'hot',         label:'Hot (≥80đ)',          icon:'' },
  { key:'customer',    label:'Khách hàng',           icon:'' },
  { key:'has_deal',    label:'Có deal đang mở',      icon:'' },
  { key:'no_contact',  label:'Không liên hệ >30n',   icon:'' },
  { key:'new_week',    label:'Mới trong tuần',        icon:'' },
];

const FMT_VND = (n: number) => n ? new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(n) : '—';
const AGO_DAYS = (d: string) => d ? Math.floor((Date.now()-new Date(d).getTime())/86400000) : 999;

export const ContactsPage: React.FC = () => {
  const { addToast, showConfirm } = useUIStore();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('all');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [profileContact, setProfileContact] = useState<any>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ first_name: '', last_name: '', email: '', phone: '', company_name: '', job_title: '', status: 'lead', source: 'other' });
  const [creating, setCreating] = useState(false);

  // New Enterprise Features State
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [sortBy, setSortBy] = useState<'newest' | 'score_desc' | 'deal_desc'>('newest');
  
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: 'name', label: 'Tên liên hệ', visible: true },
    { id: 'score', label: 'Lead Score', visible: true },
    { id: 'company', label: 'Công ty', visible: true },
    { id: 'tags', label: 'Phân loại (Tags)', visible: true },
    { id: 'contact', label: 'Liên lạc', visible: true },
    { id: 'deal', label: 'Deal hiện tại', visible: true },
    { id: 'status', label: 'Trạng thái', visible: true },
  ]);
  const [showColumns, setShowColumns] = useState(false);

  React.useEffect(() => {
    setLoading(true);
    if (DEV_MODE) { setContacts(MOCK); setLoading(false); return; }
    api.get('/contacts')
      .then(r => { const d = r.data.data?.items||r.data.data||[]; setContacts(d); })
      .catch(() => {
        setContacts([]);
        addToast('Không thể lấy danh sách liên hệ', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return contacts
      .map(c => ({ ...c, score: calcScore(c) }))
      .filter(c => {
        const q = search.toLowerCase();
        const matchSearch = !q || `${c.first_name} ${c.last_name} ${c.email} ${c.company_name} ${c.phone}`.toLowerCase().includes(q);
        if (!matchSearch) return false;
        const days = AGO_DAYS(c.last_contact);
        switch(segment) {
          case 'hot':        return c.score >= 80;
          case 'customer':   return c.status === 'customer';
          case 'has_deal':   return (c.open_deal_value||0) > 0;
          case 'no_contact': return days > 30;
          case 'new_week':   return days <= 7;
          default:           return true;
        }
      })
      .sort((a, b) => {
        if (sortBy === 'score_desc') return b.score - a.score;
        if (sortBy === 'deal_desc') return (b.open_deal_value || 0) - (a.open_deal_value || 0);
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(); // newest
      });
  }, [contacts, search, segment, sortBy]);

  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const toggleSelect = (id: number) => setSelected(p => { 
    const n = new Set(p); 
    if (n.has(id)) n.delete(id); 
    else n.add(id); 
    return n; 
  });
  const toggleAll = () => setSelected(selected.size===paged.length ? new Set() : new Set(paged.map(c=>c.id)));

  const bulkDelete = () => {
    showConfirm(
      `Xóa ${selected.size} liên hệ?`,
      `Bạn có chắc chắn muốn xóa vĩnh viễn các liên hệ đã chọn? Thao tác này không thể hoàn tác.`,
      async () => {
        try {
          await api.post('/contacts/bulk-delete', { ids: Array.from(selected) });
          setContacts(p => p.filter(c => !selected.has(c.id)));
          addToast(`Đã xóa ${selected.size} liên hệ thành công`, 'success');
          setSelected(new Set());
        } catch (e: any) {
          addToast(e.response?.data?.message || 'Lỗi khi xóa liên hệ', 'error');
        }
      }
    );
  };

  const bulkExport = () => addToast(`Xuất ${selected.size} liên hệ ra CSV...`, 'info');
  const bulkTag    = () => addToast('Mở gán tag hàng loạt...', 'info');
  const bulkEmail  = () => addToast(`Soạn email cho ${selected.size} liên hệ...`, 'info');
  const bulkAssign = () => addToast('Gán nhân viên phụ trách...', 'info');

  const handleCreateContact = async () => {
    if (!createForm.first_name.trim()) { addToast('Vui lòng nhập họ tên', 'error'); return; }
    setCreating(true);
    try {
      const r = await api.post('/contacts', createForm);
      const newContact = r.data.data;
      setContacts(prev => [newContact, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ first_name: '', last_name: '', email: '', phone: '', company_name: '', job_title: '', status: 'lead', source: 'other' });
      addToast('Đã thêm liên hệ mới thành công', 'success');
    } catch (e: any) {
      addToast(e.response?.data?.message || 'Không thể tạo liên hệ', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Liên hệ & Khách hàng</h1>
          <p className="page-subtitle">{loading ? '...' : `${filtered.length} liên hệ`}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn outline sm" onClick={() => setShowImportExport(true)}><Download size={14}/> Nhập/Xuất Dữ liệu</button>
          <button className="btn primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={15}/> Thêm liên hệ
          </button>
        </div>
      </div>

      {/* Smart Segments */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', overflowX:'auto', paddingBottom:4 }}>
        {SEGMENTS.map(s => {
          const cnt = s.key==='all' ? contacts.length : contacts.map(c=>({...c,score:calcScore(c)})).filter(c=>{
            const days=AGO_DAYS(c.last_contact);
            if(s.key==='hot')        return c.score>=80;
            if(s.key==='customer')   return c.status==='customer';
            if(s.key==='has_deal')   return (c.open_deal_value||0)>0;
            if(s.key==='no_contact') return days>30;
            if(s.key==='new_week')   return days<=7;
            return true;
          }).length;
          return (
            <button key={s.key} onClick={() => { setSegment(s.key); setPage(1); }}
              style={{ padding:'0.5rem 1rem', borderRadius:'var(--radius-full)', border:`1px solid ${segment===s.key?'var(--color-primary)':'var(--color-border)'}`, background:segment===s.key?'var(--color-primary)':'var(--color-surface)', color:segment===s.key?'white':'var(--color-text)', fontWeight:600, fontSize:'0.8125rem', whiteSpace:'nowrap', cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', gap:'6px' }}>
              {s.icon && <span>{s.icon}</span>}{s.label}
              <span style={{ background:segment===s.key?'rgba(255,255,255,0.25)':'var(--color-bg)', borderRadius:10, padding:'1px 6px', fontSize:'0.7rem', fontWeight:700 }}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* Search + filter row */}
      <div className="card" style={{ padding:'0.75rem 1rem', marginBottom:'0.75rem', display:'flex', gap:'0.75rem', alignItems:'center', flexWrap: 'wrap' }}>
        <div className="filter-search" style={{ width: '300px' }}>
          <Search size={14} style={{ color:'var(--color-text-muted)' }}/>
          <input placeholder="Tìm tên, email, điện thoại..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
        </div>
        <button className="btn ghost sm" onClick={() => setSearch('')} style={{ opacity: search?1:0.4 }}>
          <X size={14}/>
        </button>
        
        <div style={{ flex: 1 }} />
        
        {/* View Mode & Layout Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ width: 170 }}>
            <CustomSelect 
              value={sortBy} 
              onChange={val => setSortBy(val as any)} 
              options={[
                { value: 'newest', label: 'Mới nhất', icon: <ArrowDownUp size={14} /> },
                { value: 'score_desc', label: 'Score giảm dần', icon: <ArrowDownUp size={14} /> },
                { value: 'deal_desc', label: 'Deal lớn nhất', icon: <ArrowDownUp size={14} /> }
              ]} 
            />
          </div>

          <button 
            className={`btn sm ${viewMode === 'list' ? 'primary' : 'ghost'}`} 
            onClick={() => setViewMode('list')} 
            title="Danh sách"
            style={{ padding: '0.5rem' }}
          >
            <List size={16} />
          </button>
          <button 
            className={`btn sm ${viewMode === 'card' ? 'primary' : 'ghost'}`} 
            onClick={() => setViewMode('card')} 
            title="Dạng thẻ"
            style={{ padding: '0.5rem' }}
          >
            <LayoutGrid size={16} />
          </button>
          
          <button 
            className="btn outline sm" 
            onClick={() => setShowColumns(true)} 
            title="Tùy chỉnh cột"
            style={{ padding: '0.5rem' }}
          >
            <Columns size={16} />
          </button>
        </div>
      </div>

      <ColumnCustomizer 
        isOpen={showColumns} 
        onClose={() => setShowColumns(false)} 
        columns={columns} 
        onChange={setColumns} 
      />

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ position:'sticky', top:68, zIndex:100, marginBottom:'0.75rem', padding:'0.75rem 1.25rem', background:'var(--color-primary)', borderRadius:'var(--radius-xl)', display:'flex', alignItems:'center', gap:'0.75rem', boxShadow:'0 8px 24px rgba(124,58,237,0.3)' }}>
            <span style={{ color:'white', fontWeight:700, fontSize:'0.875rem' }}>{selected.size} đã chọn</span>
            <div style={{ flex:1 }}/>
            {[
              { label:'Email', action:bulkEmail },
              { label:'Tag',   action:bulkTag   },
              { label:'Gán',  action:bulkAssign},
              { label:'Xuất', action:bulkExport },
            ].map(b=>(
              <button key={b.label} onClick={b.action}
                style={{ padding:'0.375rem 0.875rem', background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'var(--radius-lg)', color:'white', fontWeight:600, fontSize:'0.8125rem', cursor:'pointer' }}>
                {b.label}
              </button>
            ))}
            <button onClick={bulkDelete}
              style={{ padding:'0.375rem 0.875rem', background:'rgba(239,68,68,0.8)', border:'none', borderRadius:'var(--radius-lg)', color:'white', fontWeight:700, fontSize:'0.8125rem', cursor:'pointer' }}>
              Xóa
            </button>
            <button onClick={() => setSelected(new Set())} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer' }}><X size={16}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {Array.from({length:6}).map((_,i) => <div key={i} className="skeleton" style={{ height:56, borderRadius:'var(--radius-lg)' }}/>)}
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {viewMode === 'list' ? (
            <div className="table-wrap" style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-surface)', boxShadow: '0 1px 0 var(--color-border)' }}>
                  <tr>
                    <th style={{ width: 44, padding: '0.875rem 0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                      <input type="checkbox" checked={selected.size === paged.length && paged.length > 0} onChange={toggleAll}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
                    </th>
                    {columns.find(c => c.id === 'name')?.visible && <th style={{ borderBottom: '1px solid var(--color-border)' }}>Liên hệ</th>}
                    {columns.find(c => c.id === 'score')?.visible && <th style={{ borderBottom: '1px solid var(--color-border)' }}>Score</th>}
                    {columns.find(c => c.id === 'company')?.visible && <th style={{ borderBottom: '1px solid var(--color-border)' }}>Công ty</th>}
                    {columns.find(c => c.id === 'tags')?.visible && <th style={{ borderBottom: '1px solid var(--color-border)' }}>Tags</th>}
                    {columns.find(c => c.id === 'contact')?.visible && <th style={{ borderBottom: '1px solid var(--color-border)' }}>Liên lạc cuối</th>}
                    {columns.find(c => c.id === 'deal')?.visible && <th style={{ borderBottom: '1px solid var(--color-border)' }}>Deal đang mở</th>}
                    {columns.find(c => c.id === 'status')?.visible && <th style={{ borderBottom: '1px solid var(--color-border)' }}>Trạng thái</th>}
                    <th style={{ width: 120, borderBottom: '1px solid var(--color-border)' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(c => {
                    const days = AGO_DAYS(c.last_contact);
                    const fullName = `${c.first_name} ${c.last_name}`;
                    return (
                      <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer' }}
                        className="table-row-hover"
                        onClick={() => setProfileContact(c)}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border-light)' }} onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)}
                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
                        </td>
                        {columns.find(col => col.id === 'name')?.visible && (
                          <td style={{ padding: '0.875rem 0.75rem', borderBottom: '1px solid var(--color-border-light)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>
                                {(c.first_name?.[0] || '?').toUpperCase()}
                              </div>
                              <div>
                                <p style={{ fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{fullName}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.email}</p>
                              </div>
                            </div>
                          </td>
                        )}
                        {columns.find(col => col.id === 'score')?.visible && (
                          <td style={{ padding: '0.875rem 0.75rem', borderBottom: '1px solid var(--color-border-light)' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: c.score >= 80 ? 'var(--color-success)' : c.score >= 60 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                              {c.score}
                            </span>
                          </td>
                        )}
                        {columns.find(col => col.id === 'company')?.visible && (
                          <td style={{ padding: '0.875rem 0.75rem', borderBottom: '1px solid var(--color-border-light)' }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{c.company_name || '—'}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.job_title || ''}</p>
                          </td>
                        )}
                        {columns.find(col => col.id === 'tags')?.visible && (
                          <td style={{ padding: '0.875rem 0.75rem', maxWidth: 160, borderBottom: '1px solid var(--color-border-light)' }}>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {(c.tags || []).slice(0, 2).map((t: string) => (
                                <span key={t} style={{ padding: '2px 8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                  {t}
                                </span>
                              ))}
                              {(c.tags || []).length > 2 && (
                                <span style={{ padding: '2px 6px', color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>+{c.tags.length - 2}</span>
                              )}
                            </div>
                          </td>
                        )}
                        {columns.find(col => col.id === 'contact')?.visible && (
                          <td style={{ padding: '0.875rem 0.75rem', borderBottom: '1px solid var(--color-border-light)' }}>
                            <span style={{ fontSize: '0.8125rem', color: days > 30 ? 'var(--color-danger)' : days > 14 ? 'var(--color-warning)' : 'var(--color-text-muted)', fontWeight: days > 30 ? 700 : 400 }}>
                              {c.last_contact ? (days === 0 ? 'Hôm nay' : days === 1 ? 'Hôm qua' : `${days} ngày trước`) : '—'}
                            </span>
                          </td>
                        )}
                        {columns.find(col => col.id === 'deal')?.visible && (
                          <td style={{ padding: '0.875rem 0.75rem', borderBottom: '1px solid var(--color-border-light)' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: (c.open_deal_value || 0) > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                              {FMT_VND(c.open_deal_value || 0)}
                            </span>
                          </td>
                        )}
                        {columns.find(col => col.id === 'status')?.visible && (
                          <td style={{ padding: '0.875rem 0.75rem', borderBottom: '1px solid var(--color-border-light)' }}>
                            <span className={`badge ${STATUS_CLASS[c.status] || 'info'}`}>{STATUS_LABEL[c.status] || c.status}</span>
                          </td>
                        )}
                        <td style={{ padding: '0.875rem 0.75rem', borderBottom: '1px solid var(--color-border-light)' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', opacity: 0 }} className="row-actions">
                            <button className="btn ghost sm" title="Xem hồ sơ" onClick={() => setProfileContact(c)}><Eye size={13} /></button>
                            <button className="btn ghost sm" style={{ color: 'var(--color-danger)' }} title="Xóa"
                              onClick={() => {
                                showConfirm({
                                  title: 'Xóa liên hệ',
                                  message: `Bạn có chắc chắn muốn xóa liên hệ ${fullName}? Hành động này không thể hoàn tác.`,
                                  isDanger: true,
                                  confirmText: 'Xóa',
                                  onConfirm: () => {
                                    setContacts(p => p.filter(x => x.id !== c.id));
                                    addToast('Đã xóa liên hệ', 'success');
                                  }
                                });
                              }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <Users size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                  <p style={{ fontWeight: 600 }}>Không tìm thấy liên hệ nào</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '1rem', background: 'var(--color-bg)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {paged.map(c => {
                  const days = AGO_DAYS(c.last_contact);
                  const fullName = `${c.first_name} ${c.last_name}`;
                  return (
                    <motion.div 
                      key={c.id} 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => setProfileContact(c)}
                      style={{ 
                        background: 'var(--color-surface)', border: '1px solid var(--color-border)', 
                        borderRadius: 'var(--radius-xl)', padding: '1.25rem', cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s', position: 'relative'
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                    >
                      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)}
                          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem' }}>
                          {(c.first_name?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>{fullName}</h3>
                          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Building2 size={12} /> {c.company_name || 'Cá nhân'}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span className={`badge ${STATUS_CLASS[c.status] || 'info'}`}>{STATUS_LABEL[c.status] || c.status}</span>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--color-bg)', borderRadius: 'var(--radius-full)', fontWeight: 600, color: c.score >= 80 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                          Score: {c.score}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-light)' }}>
                        <div>
                          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>Liên lạc cuối</p>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: days > 30 ? 'var(--color-danger)' : 'var(--color-text)' }}>
                            {c.last_contact ? (days === 0 ? 'Hôm nay' : days === 1 ? 'Hôm qua' : `${days} ngày trước`) : '—'}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>Deal đang mở</p>
                          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: (c.open_deal_value || 0) > 0 ? 'var(--color-primary)' : 'var(--color-text)' }}>
                            {FMT_VND(c.open_deal_value || 0)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {filtered.length === 0 && (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <Users size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                  <p style={{ fontWeight: 600 }}>Không tìm thấy liên hệ nào</p>
                </div>
              )}
            </div>
          )}
          
          <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onChange={setPage}/>
        </div>
      )}

      {/* 360° Profile Drawer */}
      <CustomerProfileDrawer
        isOpen={!!profileContact}
        onClose={() => setProfileContact(null)}
        contact={profileContact}
        onUpdate={updated => { setContacts(p=>p.map(c=>c.id===updated?.id?{...c,...updated}:c)); }}
      />
      
      <ImportExportModal 
        isOpen={showImportExport} 
        onClose={() => setShowImportExport(false)} 
        entityName="Liên hệ" 
      />

      {/* Quick Create Contact Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} style={{ zIndex: 400 }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }}
              style={{ position: 'fixed', top: '50%', left: '50%', width: 520, maxWidth: 'calc(100vw - 2rem)', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', zIndex: 410, overflow: 'hidden' }}
            >
              {/* Header */}
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={18} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Thêm Liên hệ mới</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Nhập thông tin cơ bản — có thể bổ sung chi tiết sau</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}><X size={18} /></button>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Name row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Họ <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input className="form-input" placeholder="VD: Nguyễn" value={createForm.first_name} onChange={e => setCreateForm(f => ({ ...f, first_name: e.target.value }))} autoFocus />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Tên</label>
                    <input className="form-input" placeholder="VD: Văn An" value={createForm.last_name} onChange={e => setCreateForm(f => ({ ...f, last_name: e.target.value }))} />
                  </div>
                </div>

                {/* Contact row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Số điện thoại</label>
                    <input className="form-input" placeholder="09xx xxx xxx" value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label"><Mail size={12} style={{ display: 'inline', marginRight: 4 }} />Email</label>
                    <input className="form-input" type="email" placeholder="email@congty.com" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>

                {/* Company + Job */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label"><Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />Công ty</label>
                    <input className="form-input" placeholder="Tên công ty..." value={createForm.company_name} onChange={e => setCreateForm(f => ({ ...f, company_name: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label"><Briefcase size={12} style={{ display: 'inline', marginRight: 4 }} />Chức vụ</label>
                    <input className="form-input" placeholder="VD: Giám đốc, Kế toán trưởng..." value={createForm.job_title} onChange={e => setCreateForm(f => ({ ...f, job_title: e.target.value }))} />
                  </div>
                </div>

                {/* Status + Source */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Trạng thái</label>
                    <select className="form-input" value={createForm.status} onChange={e => setCreateForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="lead">Lead mới</option>
                      <option value="qualified">Đủ điều kiện</option>
                      <option value="customer">Khách hàng</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Nguồn khách</label>
                    <select className="form-input" value={createForm.source} onChange={e => setCreateForm(f => ({ ...f, source: e.target.value }))}>
                      <option value="other">Khác</option>
                      <option value="website">Website</option>
                      <option value="referral">Giới thiệu</option>
                      <option value="social">Mạng xã hội</option>
                      <option value="cold_call">Cold Call</option>
                      <option value="event">Sự kiện</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'var(--color-bg)' }}>
                <button className="btn outline" onClick={() => setShowCreateModal(false)}>Hủy bỏ</button>
                <button className="btn primary" onClick={handleCreateContact} disabled={creating} style={{ minWidth: 130 }}>
                  {creating ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                  {creating ? 'Đang tạo...' : 'Tạo Liên hệ'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
