import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Mail, MapPin, Briefcase, Plus, Send, History, CheckSquare, DollarSign, HelpCircle, FileText, ShoppingCart, Tag as TagIcon, Target, Pencil, Trash2 } from 'lucide-react';
import { LeadScoreRing } from '../components/ui/LeadScoreRing';
import { TagInput } from '../components/ui/TagInput';
import { CallLoggerModal } from '../components/ui/CallLoggerModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { AddressSelect } from '../components/ui/AddressSelect';
import { ActivityModal } from '../components/ui/ActivityModal';
import { useUIStore } from '../store/uiStore';
import styles from './EntityDrawer.module.css';

/* ─── Types ─────────────────────────────────────────────────── */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  contact: any;
  onUpdate?: (data: any) => void;
}

/* ─── Mock Data ───────────────────────────────────── */
const buildTimeline = (c: any) => [
  { id: 1, type: 'call', icon: <Phone size={16} />, color: '#10b981', title: `Gọi tư vấn sản phẩm ERP`, user: 'Admin', time: new Date(Date.now() - 1800000).toISOString(), note: 'Khách quan tâm, hẹn demo tuần tới' },
  { id: 2, type: 'email', icon: <Mail size={16} />, color: '#3b82f6', title: `Gửi báo giá Q2/2026`, user: 'Admin', time: new Date(Date.now() - 86400000).toISOString(), note: 'Đã gửi PDF báo giá kèm brochure' },
  { id: 3, type: 'meeting', icon: <MapPin size={16} />, color: '#8b5cf6', title: `Demo sản phẩm tại văn phòng`, user: 'Sales Manager', time: new Date(Date.now() - 172800000).toISOString(), note: 'Khách hài lòng, đang cân nhắc ngân sách' },
  { id: 4, type: 'task', icon: <CheckSquare size={16} />, color: '#f43f5e', title: `Nhiệm vụ: Cập nhật hợp đồng`, user: 'Admin', time: new Date(Date.now() - 200000000).toISOString(), note: 'Đã gửi file hợp đồng cứng qua bưu điện' },
  { id: 5, type: 'note', icon: <FileText size={16} />, color: '#f59e0b', title: `Ghi chú: Quyết định Q3`, user: 'Admin', time: new Date(Date.now() - 259200000).toISOString(), note: 'Khách cho biết sẽ quyết định vào Q3' },
];

const buildDeals = () => [
  { id: 1, title: 'Hệ thống ERP Enterprise', value: 350000000, stage: 'Thương lượng', stage_color: '#8b5cf6', prob: 65, close: '2026-06-30' },
  { id: 2, title: 'Gói Bảo trì hàng năm', value: 36000000, stage: 'Báo giá', stage_color: '#3b82f6', prob: 80, close: '2026-05-31' },
];

const buildTasks = () => [
  { id: 1, title: 'Gửi hợp đồng mẫu để xem xét', due: '2026-05-07', priority: 'high', done: false },
  { id: 2, title: 'Gọi xác nhận quyết định', due: '2026-05-10', priority: 'high', done: false },
  { id: 3, title: 'Gửi case study tương tự', due: '2026-05-06', priority: 'medium', done: true },
];

/* ─── Helpers ────────────────────────────────────────────────── */
const CONTACT_STATUSES = [
  { id: 'lead', label: 'Lead mới', color: '#3b82f6' },
  { id: 'qualified', label: 'Đủ điều kiện', color: '#f59e0b' },
  { id: 'customer', label: 'Khách hàng', color: '#10b981' },
  { id: 'churned', label: 'Đã rời bỏ', color: '#ef4444' }
];

const FMT = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
const AGO = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'Vừa xong';
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  return `${Math.floor(s / 86400)} ngày trước`;
};

const TABS = [
  { id: 'info', label: 'Thông tin chung', icon: <User size={16} /> },
  { id: 'tags', label: 'Tags', icon: <TagIcon size={16} /> },
  { id: 'timeline', label: 'Lịch sử tương tác', icon: <History size={16} /> },
  { id: 'scoring', label: 'Scoring', icon: <Target size={16} /> },
  { id: 'deals', label: 'Cơ hội (Deals)', icon: <DollarSign size={16} /> },
  { id: 'tasks', label: 'Công việc (Tasks)', icon: <CheckSquare size={16} /> },
  { id: 'notes', label: 'Ghi chú nội bộ', icon: <FileText size={16} /> },
  { id: 'docs', label: 'Hồ sơ & Tài liệu', icon: <FileText size={16} /> },
  { id: 'invoices', label: 'Hóa đơn & Thanh toán', icon: <DollarSign size={16} /> },
];

export const CustomerProfileDrawer: React.FC<Props> = ({ isOpen, onClose, contact, onUpdate }) => {
  const { addToast, showConfirm } = useUIStore();
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState<any>({});
  const [tags, setTags] = useState<string[]>([]);
  const [showCallLogger, setShowCallLogger] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<{ id: number; text: string; time: string; user: string }[]>([]);
  const [tasks, setTasks] = useState(buildTasks());
  const [pipelineModal, setPipelineModal] = useState<{ isOpen: boolean; targetId: string; targetLabel: string; note: string }>({ isOpen: false, targetId: '', targetLabel: '', note: '' });
  
  const [docs, setDocs] = useState([
    { id: 1, name: 'CCCD_MatTruoc.jpg', date: new Date().toLocaleDateString('vi-VN'), size: '1.2 MB', type: 'jpg' },
    { id: 2, name: 'CCCD_MatSau.jpg', date: new Date().toLocaleDateString('vi-VN'), size: '1.1 MB', type: 'jpg' }
  ]);

  useEffect(() => {
    if (contact) {
      setFormData(contact);
      setTags(contact.tags || ['vip', 'erp']);
      setNotes([{ id: 1, text: 'Khách rất quan tâm đến module HR, cần demo thêm.', time: new Date(Date.now() - 3600000).toISOString(), user: 'Admin' }]);
      setActiveTab('info');
    }
  }, [contact]);

  if (!contact) return null;

  const { score, rules } = (() => {
    let s = 0;
    const r = [];
    if (formData.job_title?.toLowerCase().includes('giám đốc') || formData.job_title?.toLowerCase().includes('ceo')) {
      s += 30; r.push({ rule: 'Chức danh C-Level (Giám đốc/CEO)', pts: 30, type: 'Demographic' });
    } else if (formData.job_title) {
      s += 10; r.push({ rule: 'Có thông tin chức vụ', pts: 10, type: 'Demographic' });
    }
    if (formData.phone) { s += 15; r.push({ rule: 'Cung cấp số điện thoại', pts: 15, type: 'Demographic' }); }
    if (formData.email) { s += 10; r.push({ rule: 'Cung cấp Email', pts: 10, type: 'Demographic' }); }
    if (formData.source === 'website') { s += 20; r.push({ rule: 'Nguồn Inbound (Website)', pts: 20, type: 'Behavioral' }); }
    if (formData.source === 'referral') { s += 25; r.push({ rule: 'Khách hàng giới thiệu (Referral)', pts: 25, type: 'Behavioral' }); }
    if (formData.expected_revenue > 100000000) { s += 30; r.push({ rule: 'Deal size tiềm năng > 100Tr', pts: 30, type: 'Behavioral' }); }
    if (formData.status === 'qualified' || formData.status === 'customer') { s += 20; r.push({ rule: 'Sales đã verify chất lượng', pts: 20, type: 'Behavioral' }); }

    if (r.length === 0) r.push({ rule: 'Điểm khởi tạo (Mặc định)', pts: 15, type: 'System' });

    return { score: Math.min(100, s || 15), rules: r };
  })();

  const timeline = buildTimeline(contact);
  const deals = buildDeals();
  const fullName = `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || 'Chưa cập nhật tên';

  const handleSave = () => {
    onUpdate?.({ ...formData, tags });
    addToast('Đã lưu thông tin khách hàng', 'success');
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes(p => [{ id: Date.now(), text: newNote.trim(), time: new Date().toISOString(), user: 'Admin' }, ...p]);
    setNewNote('');
    addToast('Đã lưu ghi chú', 'success');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="overlay-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              style={{ zIndex: 400 }}
            />
            <motion.div
              className={styles.drawer}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {/* ── Header ── */}
              <div className={styles.header}>
                <div className={styles.headerProfile}>
                  <div className="avatar-placeholder lg" style={{ background: 'var(--color-primary)', fontSize: '1.25rem', width: 56, height: 56 }}>
                    {(formData.first_name?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <h2 className={styles.title}>{fullName}</h2>
                    <p className={styles.subtitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Briefcase size={14} /> {formData.job_title || 'Chưa cập nhật chức vụ'} tại {formData.company_name || 'Chưa cập nhật công ty'}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {formData.phone || 'Chưa có SĐT'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} /> {formData.email || 'Chưa có Email'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Phụ trách:</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                        {formData.owner_name || 'Admin Sales'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.headerActions}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '16px' }}>
                    <LeadScoreRing score={score} size={42} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Lead Score</span>
                      <span style={{ fontSize: '1rem', fontWeight: 800 }}>{score}</span>
                    </div>
                  </div>
                  <span className={`badge ${formData.status === 'customer' ? 'success' : formData.status === 'qualified' ? 'warning' : 'info'}`}>
                    {formData.status === 'customer' ? 'Khách hàng' : formData.status === 'qualified' ? 'Đủ điều kiện' : 'Tiềm năng'}
                  </span>
                  <button
                    className="btn primary sm flex items-center gap-2"
                    onClick={() => { onClose(); useUIStore.getState().setShowPOS(formData); }}
                  >
                    <ShoppingCart size={14} /> Bán tiếp
                  </button>
                  <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
                </div>
              </div>

              {/* ── Pipeline Stepper Bar ── */}
              <div style={{ display: 'flex', padding: '1rem 1.5rem', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', gap: '4px' }}>
                {CONTACT_STATUSES.map((st, i) => {
                  const currentIndex = CONTACT_STATUSES.findIndex(x => x.id === (formData.status || 'lead'));
                  const isActive = i <= currentIndex;
                  const isCurrent = i === currentIndex;
                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        if (i === currentIndex) return;
                        setPipelineModal({ isOpen: true, targetId: st.id, targetLabel: st.label, note: '' });
                      }}
                      style={{
                        flex: 1, position: 'relative', height: '32px', cursor: i === currentIndex ? 'default' : 'pointer',
                        opacity: i < currentIndex ? 0.6 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '4px', background: isActive ? 'var(--color-primary)' : 'var(--color-border-light)', transform: 'translateY(-50%)', borderRadius: '2px', transition: 'background 0.3s' }} />
                      <div style={{ position: 'relative', zIndex: 2, background: isCurrent ? 'var(--color-primary)' : 'var(--color-surface)', color: isCurrent ? '#fff' : (isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'), border: `2px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`, padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.3s' }}>
                        {st.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Layout Split: Left Sidebar Tabs & Content ── */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* Sidebar Tabs */}
                <div className={styles.sidebarTabs}>
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      className={`${styles.sidebarTabBtn} ${activeTab === tab.id ? styles.sidebarTabActive : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                  <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' }}>Enterprise CRM</p>
                  </div>
                </div>

                {/* Content Area */}
                <div className={styles.contentArea}>

                  {/* INFO TAB */}
                  {activeTab === 'info' && (
                    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Quick Stats Dashboard */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div className="card-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                          <span className="text-xs text-light" style={{ fontWeight: 600 }}>DỰ KIẾN DOANH THU</span>
                          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>{FMT(formData.expected_revenue || 0)}</span>
                          <span className="text-xs text-light mt-1"><span style={{ color: 'var(--color-success)' }}>{formData.win_probability || 0}%</span> xác suất chốt</span>
                        </div>
                        <div className="card-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                          <span className="text-xs text-light" style={{ fontWeight: 600 }}>LẦN LIÊN HỆ CUỐI</span>
                          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.25rem' }}>
                            {formData.last_contact ? new Date(formData.last_contact).toLocaleDateString('vi-VN') : 'Chưa có'}
                          </span>
                          <span className="text-xs text-light mt-1">
                            {formData.last_contact ? AGO(formData.last_contact) : 'Cần liên hệ ngay'}
                          </span>
                        </div>
                        <div className="card-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', borderLeft: '3px solid var(--color-warning)' }}>
                          <span className="text-xs text-light" style={{ fontWeight: 600 }}>TƯƠNG TÁC</span>
                          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.25rem' }}>{timeline.length} lần</span>
                          <span className="text-xs text-light mt-1">Gọi điện, Email, Gặp mặt</span>
                        </div>
                      </div>

                      <div className="card-panel">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="panel-title" style={{ margin: 0 }}>Thông tin liên hệ & Công việc</h4>
                          <button className="btn outline sm" onClick={handleSave}>Lưu thay đổi</button>
                        </div>
                        <div className="grid grid-2">
                          <div className="form-group">
                            <label className="form-label">Họ tên <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input className="form-input" placeholder="Họ" value={formData.first_name || ''} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                              <input className="form-input" placeholder="Tên" value={formData.last_name || ''} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="form-input" type="email" placeholder="ví dụ: email@congty.com" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Số điện thoại chính</label>
                            <input className="form-input" type="tel" placeholder="09xx xxx xxx" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Ngày sinh</label>
                            <input className="form-input" type="date" value={formData.birthday || ''} onChange={e => setFormData({ ...formData, birthday: e.target.value })} />
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--color-border-light)', margin: '1.25rem 0', paddingTop: '1.25rem' }}></div>

                        <div className="grid grid-2">
                          <div className="form-group">
                            <label className="form-label">Công ty / Tổ chức</label>
                            <input className="form-input" placeholder="Tên công ty" value={formData.company_name || ''} onChange={e => setFormData({ ...formData, company_name: e.target.value })} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Chức vụ</label>
                            <input className="form-input" placeholder="Ví dụ: Giám đốc, Kế toán trưởng..." value={formData.job_title || ''} onChange={e => setFormData({ ...formData, job_title: e.target.value })} />
                          </div>
                        </div>
                      </div>

                      <div className="card-panel">
                        <h4 className="panel-title">Phân loại & Trạng thái Sales</h4>
                        <div className="grid grid-2">
                          <div className="form-group">
                            <label className="form-label">Nguồn khách (Source)</label>
                            <CustomSelect
                              options={[
                                { value: 'website', label: 'Từ Website' },
                                { value: 'facebook', label: 'Facebook Ads' },
                                { value: 'referral', label: 'Giới thiệu' },
                                { value: 'cold_call', label: 'Cold Call' }
                              ]}
                              value={formData.source || 'website'}
                              onChange={val => setFormData({ ...formData, source: val as string })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Dự kiến doanh thu</label>
                            <div style={{ position: 'relative' }}>
                              <input className="form-input" type="number" placeholder="0" style={{ paddingRight: '40px' }} value={formData.expected_revenue || ''} onChange={e => setFormData({ ...formData, expected_revenue: e.target.value })} />
                              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>VNĐ</span>
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Xác suất chốt (%)</label>
                            <input className="form-input" type="number" min="0" max="100" placeholder="50" value={formData.win_probability || ''} onChange={e => setFormData({ ...formData, win_probability: e.target.value })} />
                          </div>
                        </div>
                      </div>

                      <div className="card-panel">
                        <h4 className="panel-title">Địa chỉ (Tự động từ JSON)</h4>
                        <AddressSelect
                          city={formData.city || ''}
                          ward={formData.ward || ''}
                          onCityChange={city => setFormData({ ...formData, city })}
                          onWardChange={ward => setFormData({ ...formData, ward })}
                        />
                        <div className="form-group" style={{ marginTop: '0.75rem' }}>
                          <input className="form-input" placeholder="Số nhà, đường phố..." value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAGS TAB */}
                  {activeTab === 'tags' && (
                    <div className="animate-fade">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Phân loại khách hàng (Tags)</h3>
                      </div>
                      <div className="card-panel" style={{ minHeight: '200px' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Sử dụng thẻ để nhóm và tìm kiếm khách hàng dễ dàng hơn.</p>
                        <TagInput tags={tags} onChange={setTags} />
                      </div>
                    </div>
                  )}

                  {/* TIMELINE TAB */}
                  {activeTab === 'timeline' && (
                    <div className="animate-fade">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border-light)' }}>
                        <div>
                          <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>Nhật ký tương tác</h3>
                          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Lưu vết toàn bộ quá trình chăm sóc khách hàng</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button
                            className="btn sm"
                            onClick={() => setShowCallLogger(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid var(--color-primary-light)', fontWeight: 600 }}
                          >
                            <Phone size={14} /> Ghi nhận gọi
                          </button>
                          <button className="btn primary sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowActivityModal(true)}><Plus size={14} /> Thêm log</button>
                        </div>
                      </div>
                      <div className="timeline-stepper" style={{ position: 'relative', marginTop: '1rem', marginLeft: '0.5rem', paddingBottom: '1.5rem' }}>
                        <div style={{ position: 'absolute', left: 18, top: 10, bottom: 0, width: 2, background: 'linear-gradient(to bottom, var(--color-border) 0%, rgba(0,0,0,0) 100%)' }} />

                        {timeline.map((ev, index) => (
                          <motion.div
                            key={ev.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', position: 'relative' }}
                          >
                            {/* Step Node */}
                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${ev.color}15`, border: `2px solid ${ev.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, backgroundColor: 'var(--color-surface)', boxShadow: `0 0 0 4px var(--color-bg)` }}>
                              <div style={{ color: ev.color, display: 'flex' }}>{ev.icon}</div>
                            </div>

                            {/* Step Content */}
                            <div
                              style={{ flex: 1, padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s', cursor: 'default' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = ev.color; e.currentTarget.style.transform = 'translateX(4px)'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-light)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div>
                                  <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>{ev.title}</h4>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: ev.color, background: `${ev.color}15`, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{ev.type.toUpperCase()}</span>
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Thực hiện bởi <strong>{ev.user}</strong></span>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>{new Date(ev.time).toLocaleDateString('vi-VN')}</span>
                                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{new Date(ev.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                              {ev.note && (
                                <div style={{ padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', lineHeight: 1.6 }}>{ev.note}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SCORING TAB */}
                  {activeTab === 'scoring' && (
                    <div className="animate-fade">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div>
                          <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Lead Scoring Engine</h3>
                          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Chi tiết hệ thống tự động chấm điểm khách hàng tiềm năng</p>
                        </div>
                      </div>

                      {(() => {
                        return (
                          <div className="card-panel">
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', alignItems: 'center', padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)' }}>
                              <LeadScoreRing score={score} size={80} />
                              <div>
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>Tổng điểm: {score}/100</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                  Khách hàng này đang ở mức <strong>{score >= 80 ? 'Rất Nóng' : score >= 50 ? 'Tiềm Năng' : 'Lạnh'}</strong>.
                                  Hệ thống tự động phân tích dựa trên {rules.length} tiêu chí.
                                </p>
                              </div>
                            </div>

                            <h4 style={{ fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Phân tích điểm chi tiết</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {rules.map((r, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)' }}>
                                  <div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: r.type === 'Demographic' ? '#3b82f6' : '#8b5cf6', background: r.type === 'Demographic' ? '#3b82f615' : '#8b5cf615', padding: '2px 8px', borderRadius: '12px', marginRight: '8px' }}>
                                      {r.type}
                                    </span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{r.rule}</span>
                                  </div>
                                  <span style={{ fontWeight: 700, color: '#10b981' }}>+{r.pts} pts</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* DEALS TAB */}
                  {activeTab === 'deals' && (
                    <div className="animate-fade">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Cơ hội (Deals) - {deals.length}</h3>
                        <button className="btn primary sm" onClick={() => addToast('Mở form tạo deal mới...', 'info')}><Plus size={14} /> Tạo deal mới</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        {deals.map(d => (
                          <div key={d.id} className="card-panel" style={{ padding: 0, overflow: 'hidden', border: `1px solid var(--color-border)`, transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                            <div style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-light)', background: 'var(--color-surface)' }}>
                              <div>
                                <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text)', marginBottom: '0.375rem' }}>{d.title}</h4>
                                <span className="badge" style={{ background: `${d.stage_color}15`, color: d.stage_color, fontSize: '0.75rem' }}>{d.stage}</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.25rem' }}>{FMT(d.value)}</span>
                              </div>
                            </div>
                            <div style={{ padding: '1rem 1.25rem', background: 'var(--color-bg)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Xác suất chốt</span>
                                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{d.prob}%</span>
                              </div>
                              <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden', marginBottom: '1rem' }}>
                                <div style={{ width: `${d.prob}%`, height: '100%', background: d.stage_color, borderRadius: 3 }} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Ngày dự kiến</span>
                                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{d.close}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TASKS TAB */}
                  {activeTab === 'tasks' && (
                    <div className="animate-fade">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Công việc cần làm</h3>
                        <button className="btn primary sm" onClick={() => addToast('Tạo task mới...', 'info')}><Plus size={14} /> Thêm công việc</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {tasks.map(t => (
                          <div 
                            key={t.id} 
                            className="card-panel" 
                            onClick={() => setTasks(p => p.map(x => x.id === t.id ? { ...x, done: !x.done } : x))}
                            style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', opacity: t.done ? 0.6 : 1, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary-light)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                          >
                            <div style={{ width: 24, height: 24, borderRadius: '6px', border: `2px solid ${t.done ? 'var(--color-success)' : 'var(--color-border)'}`, background: t.done ? 'var(--color-success)' : 'transparent', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                              {t.done && <CheckSquare size={14} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '0.9375rem', fontWeight: 600, textDecoration: t.done ? 'line-through' : 'none', color: 'var(--color-text)' }}>{t.title}</p>
                              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.375rem' }}>
                                <span className={`badge ${t.priority === 'high' ? 'danger' : 'warning'}`} style={{ fontSize: '0.7rem' }}>{t.priority === 'high' ? 'Ưu tiên cao' : 'Trung bình'}</span>
                                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Hạn hoàn thành: {t.due}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NOTES TAB */}
                  {activeTab === 'notes' && (
                    <div className="animate-fade">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Ghi chú nội bộ</h3>
                      </div>
                      <div className="card-panel" style={{ marginBottom: '1.5rem', background: 'var(--color-surface)' }}>
                        <textarea
                          value={newNote}
                          onChange={e => setNewNote(e.target.value)}
                          placeholder="Nhập nội dung ghi chú về khách hàng này..."
                          style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', resize: 'vertical', minHeight: 100, color: 'var(--color-text)', outline: 'none', background: 'var(--color-surface)', marginBottom: '1rem' }}
                          onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                          onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="btn primary" onClick={addNote}><Send size={14} /> Lưu ghi chú</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {notes.map(n => (
                          <div key={n.id} className="card-panel" style={{ padding: '1.25rem' }}>
                            <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>{n.text}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1rem', borderTop: '1px solid var(--color-border-light)', paddingTop: '0.75rem' }}>
                              Tạo bởi <strong>{n.user}</strong> lúc {new Date(n.time).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RESTORED OLD TABS */}
                  {activeTab === 'docs' && (
                    <div className="animate-fade">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Hồ sơ & Tài liệu</h3>
                        <label className="btn outline sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input type="file" style={{ display: 'none' }} onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const file = e.target.files[0];
                              setDocs(prev => [{ id: Date.now(), name: file.name, date: new Date().toLocaleDateString('vi-VN'), size: (file.size / 1024 / 1024).toFixed(1) + ' MB', type: file.name.split('.').pop() || 'file' }, ...prev]);
                              useUIStore.getState().addToast('Đã tải lên tài liệu mới.', 'success');
                            }
                          }} />
                          <Plus size={14} /> Upload file
                        </label>
                      </div>
                      
                      {docs.length === 0 ? (
                        <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                          <FileText size={48} color="var(--color-border)" style={{ margin: '0 auto 1rem auto' }} />
                          <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>Chưa có tài liệu nào</p>
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Upload hợp đồng, CMND/CCCD hoặc báo giá tại đây.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {docs.map(doc => (
                            <div key={doc.id} className="card-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--color-surface)' }}>
                              <div style={{ width: 40, height: 40, background: 'var(--color-info-light)', color: 'var(--color-info)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FileText size={20} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</h4>
                                <p className="text-xs text-light mt-1">Tải lên: {doc.date} • {doc.size}</p>
                              </div>
                              <div className="flex gap-1" style={{ flexShrink: 0 }}>
                                <button className="btn-icon sm" title="Đổi tên" onClick={() => {
                                  const newName = prompt('Nhập tên mới cho tài liệu:', doc.name);
                                  if (newName && newName.trim()) {
                                    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, name: newName.trim() } : d));
                                    useUIStore.getState().addToast('Đã đổi tên tài liệu.', 'success');
                                  }
                                }}><Pencil size={14} /></button>
                                <button className="btn-icon sm text-danger" title="Xóa" onClick={() => {
                                  useUIStore.getState().showConfirm(
                                    'Xóa tài liệu?',
                                    `Bạn có chắc muốn xóa vĩnh viễn tài liệu "${doc.name}"?`,
                                    () => {
                                      setDocs(prev => prev.filter(d => d.id !== doc.id));
                                      useUIStore.getState().addToast('Đã xóa tài liệu.', 'success');
                                    }
                                  );
                                }}><Trash2 size={14} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'invoices' && (
                    <div className="animate-fade">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Hóa đơn & Thanh toán</h3>
                        <button className="btn outline sm" onClick={() => { onClose(); useUIStore.getState().setShowPOS(formData); }}><Plus size={14} /> Tạo hóa đơn</button>
                      </div>
                      <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                        <DollarSign size={48} color="var(--color-border)" style={{ margin: '0 auto 1rem auto' }} />
                        <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>Chưa có lịch sử thanh toán</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CallLoggerModal
        isOpen={showCallLogger}
        onClose={() => setShowCallLogger(false)}
        contact={{ id: contact?.id, full_name: fullName, phone: contact?.phone }}
        onSave={() => addToast('Đã ghi nhận cuộc gọi và thêm vào Timeline', 'success')}
      />
      <ActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        entityType="contact"
        entityId={contact?.id}
      />

      <AnimatePresence>
        {pipelineModal.isOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
              onClick={() => setPipelineModal({ ...pipelineModal, isOpen: false })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{ position: 'relative', background: 'var(--color-surface)', width: '90%', maxWidth: '400px', borderRadius: 'var(--radius-xl)', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            >
              <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>Cập nhật trạng thái Pipeline</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                Từ {CONTACT_STATUSES.find(x => x.id === formData.status)?.label || 'Lead mới'} <span style={{ margin: '0 4px' }}>→</span> <strong style={{ color: CONTACT_STATUSES.find(x => x.id === pipelineModal.targetId)?.color }}>{pipelineModal.targetLabel}</strong>
              </p>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Ghi chú Audit Trail <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <textarea
                  className="form-input"
                  placeholder="Ghi chú bắt buộc lý do hoặc tóm tắt trước khi chuyển bước..."
                  value={pipelineModal.note}
                  onChange={e => setPipelineModal({ ...pipelineModal, note: e.target.value })}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button className="btn outline" onClick={() => setPipelineModal({ ...pipelineModal, isOpen: false })}>Hủy</button>
                <button
                  className="btn primary"
                  disabled={!pipelineModal.note.trim()}
                  onClick={() => {
                    setFormData({ ...formData, status: pipelineModal.targetId });
                    setNotes(p => [{ id: Date.now(), text: `[Chuyển trạng thái] -> ${pipelineModal.targetLabel}: ${pipelineModal.note}`, time: new Date().toISOString(), user: 'Admin' }, ...p]);
                    addToast(`Đã cập nhật trạng thái Pipeline thành ${pipelineModal.targetLabel}`, 'success');
                    setPipelineModal({ isOpen: false, targetId: '', targetLabel: '', note: '' });
                  }}
                >
                  Lưu cập nhật
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
