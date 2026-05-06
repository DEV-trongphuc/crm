import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Mail, MapPin, Briefcase, Plus, Send, History, CheckSquare, DollarSign, HelpCircle, FileText, ShoppingCart, Tag as TagIcon, Target, Pencil, Trash2, LifeBuoy, AlertCircle, Clock, UserCheck, Activity, Calendar, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { LeadScoreRing } from '../components/ui/LeadScoreRing';
import { TagInput } from '../components/ui/TagInput';
import { CallLoggerModal } from '../components/ui/CallLoggerModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { AddressSelect } from '../components/ui/AddressSelect';
import { PhoneLink } from '../components/ui/PhoneLink';
import { ActivityModal } from '../components/ui/ActivityModal';
import { MentionInput } from '../components/ui/MentionInput';
import { CreateExpenseModal } from '../components/ui/CreateExpenseModal';
import { Avatar } from '../components/ui/Avatar';
import { EmptyCard } from '../components/ui/EmptyCard';
import { useUIStore } from '../store/uiStore';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { DEV_MODE } from '../config/env';
import { useMockStore } from '../store/mockStore';
import styles from './EntityDrawer.module.css';

/* ─── Types ─────────────────────────────────────────────────── */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  contact: any;
  onUpdate?: (data: any) => void;
}

const buildTimeline = (c: any): any[] => {
  if (!c) return [];
  const { activities } = useMockStore.getState();
  return activities.filter((a: any) => a.contact_id === c.id);
};
const buildDeals = (c: any): any[] => {
  if (!c) return [];
  const { deals } = useMockStore.getState();
  return deals.filter((d: any) => d.contact_id === c.id);
};
const buildTasks = (c: any): any[] => {
  if (!c) return [];
  const { activities } = useMockStore.getState();
  return activities.filter((a: any) => a.contact_id === c.id && a.type === 'task');
};

/* ─── Helpers ────────────────────────────────────────────────── */
// Fallback statuses used when pipeline-stages API has no data or in DEV_MODE
const DEFAULT_PIPELINE_STAGES = [
  { id: 'lead', name: 'Lead mới', color: '#3b82f6', order_index: 0 },
  { id: 'qualified', name: 'Đủ điều kiện', color: '#f59e0b', order_index: 1 },
  { id: 'customer', name: 'Khách hàng', color: '#10b981', order_index: 2 },
  { id: 'churned', name: 'Đã rời bỏ', color: '#ef4444', order_index: 3 },
];
// Keep for pipelineModal label lookups
const CONTACT_STATUSES = DEFAULT_PIPELINE_STAGES.map(s => ({ id: s.id, label: s.name, color: s.color }));

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
  { id: 'invoices', label: 'Invoices', icon: <DollarSign size={16} /> },
  { id: 'expenses', label: 'Chi phí', icon: <DollarSign size={16} /> },
  { id: 'tickets', label: 'Hỗ trợ/Khiếu nại', icon: <LifeBuoy size={16} /> },
];

export const CustomerProfileDrawer: React.FC<Props> = ({ isOpen, onClose, contact, onUpdate }) => {
  const { addToast, showConfirm, showCall } = useUIStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('info');
  const [formData, setFormData] = useState<any>({});
  const [tags, setTags] = useState<string[]>([]);
  const [showCallLogger, setShowCallLogger] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<{ id: number; text: string; time: string; user: string }[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [pipelineModal, setPipelineModal] = useState<{ isOpen: boolean; targetId: string; targetLabel: string; note: string }>({ isOpen: false, targetId: '', targetLabel: '', note: '' });
  const [users, setUsers] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [pipelineStages, setPipelineStages] = useState<any[]>(DEFAULT_PIPELINE_STAGES);

  const [ticketForm, setTicketForm] = useState({ subject: '', priority: 'medium', description: '' });
  const [dealForm, setDealForm] = useState({ title: '', value: '', stage: 'lead', probability: 50, expected_close: '' });
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', due_date: '', description: '' });

  const [docs, setDocs] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [drawerInvoices, setDrawerInvoices] = useState<any[]>([]);
  const [drawerExpenses, setDrawerExpenses] = useState<any[]>([]);
  const [drawerTickets, setDrawerTickets] = useState<any[]>([]);
  const [drawerActivities, setDrawerActivities] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [quickUserCard, setQuickUserCard] = useState<{ id: number; name: string; role: string; email?: string; visible: boolean; x: number; y: number } | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [tempAvatar, setTempAvatar] = useState('');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // In real app, upload to server. For now, use FileReader for preview + update state
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        await api.put(`/contacts/${contact.id}`, { avatar_url: base64 });
        setFormData({ ...formData, avatar_url: base64 });
        addToast('Đã cập nhật ảnh đại diện', 'success');
        onUpdate?.({ ...formData, avatar_url: base64 });
      } catch (err) {
        addToast('Lỗi khi cập nhật ảnh', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const showUserCard = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    const user = users.find(u => u.full_name === name || u.full_name.replace(/\s+/g, '_') === name);
    setQuickUserCard({
      id: user?.id || 0,
      name: user?.full_name || name,
      role: user?.role || 'Nhân viên',
      email: user?.email,
      visible: true,
      x: e.clientX,
      y: e.clientY
    });
  };

  const formatNote = (text: string) => {
    const parts = text.split(/(@[a-zA-Z0-9_\u00C0-\u1EF9]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const name = part.substring(1);
        return (
          <span 
            key={i} 
            onClick={(e) => showUserCard(e, name)}
            style={{ color: '#8b5cf6', fontWeight: 700, cursor: 'pointer', background: '#f5f3ff', padding: '2px 6px', borderRadius: '4px', margin: '0 2px' }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const fetchData = useCallback(async () => {
    if (!contact?.id) return;
    setLoadingRelated(true);
    try {
      // Fetch Notes
      const notesRes = await api.get(`/notes?entity_type=contact&entity_id=${contact.id}`);
      setNotes((notesRes.data.data || []).map((n: any) => ({
        id: n.id,
        text: n.body,
        time: n.created_at,
        user: n.user_name || 'Hệ thống'
      })));

      // Fetch Tasks (Activities)
      const tasksRes = await api.get(`/activities?related_type=contact&related_id=${contact.id}`);
      const rawActivities = tasksRes.data.data.items || [];
      setDrawerActivities(rawActivities);
      setTasks(rawActivities.filter((a: any) => a.type === 'task').map((a: any) => ({
        id: a.id,
        title: a.subject,
        done: a.status === 'completed',
        priority: a.priority,
        due: a.due_date ? new Date(a.due_date).toLocaleDateString('vi-VN') : '—'
      })));

      // Fetch Deals
      const dealsRes = await api.get(`/deals?contact_id=${contact.id}`);
      setDeals((dealsRes.data.data.items || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        value: d.value,
        stage: d.stage_name,
        prob: d.probability,
        close: d.expected_close_date,
        stage_color: d.stage_color || '#3b82f6'
      })));

      // Fetch Invoices
      const invoicesRes = await api.get(`/invoices?contact_id=${contact.id}`);
      setDrawerInvoices(invoicesRes.data.data.items || []);

      // Fetch Expenses
      const expensesRes = await api.get(`/expenses/entity/contact/${contact.id}`);
      setDrawerExpenses(invoicesRes.data.data || []);

      // Fetch Tickets
      const ticketsRes = await api.get(`/tickets?contact_id=${contact.id}`);
      setDrawerTickets(ticketsRes.data.data.items || []);

    } catch (e) {
      console.error("Error fetching drawer data:", e);
    } finally {
      setLoadingRelated(false);
    }
  }, [contact?.id]);

  useEffect(() => {
    if (contact) {
      setFormData(contact);
      setTags(contact.tags || []);
      setNotes([]);
      setTasks([]);
      setDeals([]);
      setDrawerInvoices([]);
      setDrawerExpenses([]);
      setDrawerTickets([]);
      setActiveTab('info');
      if (isOpen) fetchData();
    }
  }, [contact, isOpen, fetchData]);

  useEffect(() => {
    if (isOpen) {
      api.get('/users').then(r => setUsers(r.data.data || [])).catch(() => { });
      api.get('/tags').then(r => setAllTags(r.data.data || [])).catch(() => { });
      api.get('/pipeline-stages')
        .then(r => {
          const stages = r.data.data || [];
          if (stages.length > 0) {
            setPipelineStages(stages.map((s: any) => ({ id: s.id, name: s.name, color: s.color || '#6366f1', order_index: s.order_index })));
          }
        })
        .catch(() => { });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const hasChanges = useMemo(() => {
    if (!contact) return false;
    const baseTags = contact.tags || [];
    if (JSON.stringify(tags) !== JSON.stringify(baseTags)) return true;
    for (const key of Object.keys(formData)) {
      if (formData[key] !== contact[key]) return true;
    }
    return false;
  }, [formData, tags, contact]);

  const { score, rules } = useMemo(() => {
    let s = 0;
    const r: any[] = [];
    const title = (formData.job_title || '').toLowerCase();
    if (title.includes('giám đốc') || title.includes('ceo')) {
      s += 30; r.push({ rule: 'Chức danh C-Level (Giám đốc/CEO)', pts: 30, type: 'Demographic' });
    } else if (title) {
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
  }, [formData.job_title, formData.phone, formData.email, formData.source, formData.expected_revenue, formData.status]);

  const mockStore = useMockStore();

  const timeline = useMemo(() => {
    if (!contact?.id) return [];
    const source = DEV_MODE ? mockStore.activities.filter((a: any) => a.contact_id === contact.id) : drawerActivities;
    return source.map((a: any) => ({
        id: a.id,
        title: a.subject,
        type: a.type,
        user: a.user_name || 'Hệ thống',
        time: a.created_at,
        color: a.type === 'call' ? '#3b82f6' : a.type === 'meeting' ? '#8b5cf6' : '#10b981',
        icon: a.type === 'call' ? <Phone size={16} /> : a.type === 'meeting' ? <User size={16} /> : <Mail size={16} />,
        note: a.body || a.note || ''
      }));
  }, [drawerActivities, mockStore.activities, contact?.id]);
  const fullName = `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || 'Chưa cập nhật tên';

  const handleSave = async () => {
    // Only send fields that ContactController accepts
    const allowedFields = [
      'company_id', 'company_name', 'owner_id', 'first_name', 'last_name', 'email', 'phone',
      'mobile', 'job_title', 'department', 'source', 'status', 'notes',
      'birthday', 'address', 'city', 'ward', 'expected_revenue', 'win_probability', 'last_contact', 'created_at'
    ];
    const payload: Record<string, any> = {};
    allowedFields.forEach(f => { if (formData[f] !== undefined) payload[f] = formData[f]; });
    payload.tags = tags;
    try {
      const res = await api.put(`/contacts/${contact.id}`, payload);
      const updated = res.data?.data || { ...formData, tags };
      setFormData(updated);
      onUpdate?.(updated);
      addToast('Đã lưu thông tin khách hàng', 'success');
    } catch (e: any) {
      addToast(e?.response?.data?.message || 'Lỗi khi lưu thông tin', 'error');
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const text = newNote.trim();
    try {
      await api.post(`/notes?entity_type=contact&entity_id=${contact.id}`, {
        body: text, type: 'internal'
      });
      setNewNote('');
      fetchData(); // Reload all to stay in sync
      addToast('Đã lưu ghi chú', 'success');
    } catch {
      addToast('Lỗi khi lưu ghi chú', 'error');
    }
  };

  const handleAddTask = async () => {
    if (!taskForm.title.trim()) return;
    try {
      await api.post('/activities', {
        related_type: 'contact',
        related_id: contact.id,
        subject: taskForm.title,
        type: 'task',
        priority: taskForm.priority,
        due_date: taskForm.due_date,
        status: 'planned'
      });
      setShowTaskModal(false);
      setTaskForm({ title: '', priority: 'medium', due_date: '', description: '' });
      fetchData();
      addToast('Đã thêm công việc mới', 'success');
    } catch (e: any) {
      addToast(e?.response?.data?.message || 'Lỗi khi lưu công việc', 'error');
    }
  };

  const deleteActivity = async (id: number) => {
    showConfirm({
      title: 'Xóa hoạt động',
      message: 'Bạn có chắc chắn muốn xóa hoạt động này khỏi nhật ký?',
      isDanger: true,
      confirmText: 'Xóa',
      onConfirm: async () => {
        try {
          await api.delete(`/activities/${id}`);
          fetchData();
          addToast('Đã xóa hoạt động', 'success');
        } catch {
          addToast('Lỗi khi xóa hoạt động', 'error');
        }
      }
    });
  };

  const handleCreateDeal = async () => {
    if (!dealForm.title.trim()) return;
    try {
      await api.post('/deals', {
        contact_id: contact.id,
        title: dealForm.title,
        value: Number(dealForm.value) || 0,
        stage_id: dealForm.stage === 'lead' ? null : dealForm.stage,
        probability: dealForm.probability
      });
      setShowDealModal(false);
      setDealForm({ title: '', value: '', stage: 'lead', probability: 50, expected_close: '' });
      fetchData();
      addToast('Đã tạo cơ hội mới thành công', 'success');
    } catch (e: any) {
      addToast(e?.response?.data?.message || 'Lỗi khi tạo cơ hội', 'error');
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketForm.subject.trim()) return;
    try {
      await api.post('/tickets', {
        contact_id: contact.id,
        customer_name: fullName,
        subject: ticketForm.subject,
        priority: ticketForm.priority,
        description: ticketForm.description
      });
      setShowTicketModal(false);
      setTicketForm({ subject: '', priority: 'medium', description: '' });
      fetchData();
      addToast('Đã gửi yêu cầu hỗ trợ', 'success');
    } catch (e: any) {
      addToast(e?.response?.data?.message || 'Lỗi khi tạo ticket', 'error');
    }
  };

  if (!contact) return null;

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
              <AnimatePresence>
              {showAvatarModal && (
                <div className="overlay-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    style={{ background: 'var(--color-surface)', width: '400px', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-2xl)' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>Cập nhật Ảnh đại diện</h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                      <div style={{ width: 120, height: 120, borderRadius: '32px', background: tempAvatar ? `url(${tempAvatar}) center/cover` : 'var(--color-bg)', border: '4px solid var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                        {!tempAvatar && <User size={48} color="var(--color-text-muted)" />}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label className="form-label">Tải ảnh lên</label>
                        <input 
                          type="file" 
                          className="form-input" 
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setTempAvatar(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="form-label">Hoặc dán URL ảnh</label>
                        <input 
                          className="form-input" 
                          placeholder="https://example.com/avatar.jpg"
                          value={tempAvatar}
                          onChange={e => setTempAvatar(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                      <button className="btn outline" style={{ flex: 1 }} onClick={() => setShowAvatarModal(false)}>Hủy</button>
                      <button 
                        className="btn primary" 
                        style={{ flex: 1 }} 
                        onClick={async () => {
                          try {
                            let finalUrl = tempAvatar;
                            
                            // Check if tempAvatar is a base64 string (meaning it was just uploaded)
                            if (tempAvatar.startsWith('data:image/')) {
                              const blob = await (await fetch(tempAvatar)).blob();
                              const formDataUpload = new FormData();
                              formDataUpload.append('file', blob, 'avatar.jpg');
                              formDataUpload.append('previous_url', formData.avatar_url || '');
                              
                              const uploadRes = await api.post('/upload', formDataUpload, {
                                headers: { 'Content-Type': 'multipart/form-data' }
                              });
                              finalUrl = uploadRes.data.data.url;
                            }

                            await api.put(`/contacts/${contact.id}`, { avatar_url: finalUrl });
                            setFormData({ ...formData, avatar_url: finalUrl });
                            addToast('Đã cập nhật ảnh đại diện', 'success');
                            setShowAvatarModal(false);
                            onUpdate?.({ ...formData, avatar_url: finalUrl });
                          } catch (err: any) {
                            addToast(err.response?.data?.message || 'Lỗi khi lưu ảnh', 'error');
                          }
                        }}
                      >
                        Lưu thay đổi
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
            
            {/* ── Quick User Card Popover ── */}
            <AnimatePresence>
              {quickUserCard && quickUserCard.visible && (
                <>
                  <div 
                    style={{ position: 'fixed', inset: 0, zIndex: 3000 }} 
                    onClick={() => setQuickUserCard(null)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    style={{
                      position: 'fixed',
                      top: quickUserCard.y - 120,
                      left: quickUserCard.x - 220,
                      zIndex: 3001,
                      width: 220,
                      background: 'var(--color-surface)',
                      borderRadius: '16px',
                      boxShadow: '0 20px 50px -12px rgba(99, 102, 241, 0.25)',
                      border: '1px solid var(--color-primary-light)',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ height: 60, background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }} />
                    <div style={{ padding: '0 1.25rem 1.25rem', textAlign: 'center', marginTop: -30 }}>
                      <div style={{ width: 60, height: 60, borderRadius: '20px', background: 'white', margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', border: '4px solid white', fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6' }}>
                        {quickUserCard.name.charAt(0).toUpperCase()}
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '4px' }}>{quickUserCard.name}</h4>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{quickUserCard.role === 'admin' ? 'Quản trị viên' : 'Nhân viên kinh doanh'}</p>
                      {quickUserCard.email && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--color-text-light)', fontSize: '0.8125rem', padding: '8px', background: 'var(--color-bg)', borderRadius: '10px' }}>
                          <Mail size={12} />
                          <span style={{ fontWeight: 500 }}>{quickUserCard.email}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

              {/* ── Header ── */}
              <div style={{ padding: '2rem 2.5rem', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)', borderBottom: '1px solid var(--color-border-light)', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                  {/* Avatar Section */}
                  <div style={{ position: 'relative' }}>
                    <div 
                      className="avatar-placeholder lg" 
                      style={{ 
                        background: formData.avatar_url ? `url(${formData.avatar_url}) center/cover` : 'linear-gradient(135deg, var(--color-primary) 0%, #4338ca 100%)', 
                        fontSize: '1.5rem', width: 80, height: 80, borderRadius: '24px', 
                        boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => {
                        setTempAvatar(formData.avatar_url || '');
                        setShowAvatarModal(true);
                      }}
                    >
                      {!formData.avatar_url && (formData.first_name?.[0] || '?').toUpperCase()}
                      <div 
                        style={{ 
                          position: 'absolute', 
                          inset: 0, 
                          background: 'rgba(0,0,0,0.3)', 
                          opacity: 0, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          transition: 'opacity 0.2s',
                          borderRadius: '24px' 
                        }} 
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'} 
                        onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                      >
                        <Pencil size={20} color="white" />
                      </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', border: '2px solid white' }}>
                      <UserCheck size={14} className="text-success" />
                    </div>
                  </div>

                  {/* Info Section */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>{fullName}</h2>
                      <span className={`badge ${formData.status === 'customer' ? 'success' : formData.status === 'qualified' ? 'warning' : 'info'}`} style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '8px' }}>
                        {formData.status === 'customer' ? 'Khách hàng VIP' : formData.status === 'qualified' ? 'Đã thẩm định' : 'Tiềm năng'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-light)', fontSize: '0.8125rem' }}>
                        <Clock size={14} /> <span>Tạo lúc: <strong style={{ color: 'var(--color-text)' }}>{formData.created_at ? new Date(formData.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</strong></span>
                      </p>
                      {formData.updated_at && formData.updated_at !== formData.created_at && (
                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-light)', fontSize: '0.8125rem' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>|</span>
                          <span>Cập nhật: <strong style={{ color: 'var(--color-text)' }}>{new Date(formData.updated_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => formData.phone && showCall(formData.phone)}>
                          <Phone size={14} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <PhoneLink phone={formData.phone} style={{ fontSize: '0.875rem' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Mail size={14} className="text-muted" />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>{formData.email || 'contact@email.com'}</span>
                      </div>
                      <div 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'white', border: '1px solid var(--color-border)', borderRadius: '12px', cursor: 'pointer' }}
                        onClick={(e) => showUserCard(e, formData.owner_name)}
                      >
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>
                          {formData.owner_name ? formData.owner_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#6d28d9' }}>{formData.owner_name || 'Sale phụ trách'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button className={styles.closeBtn} onClick={onClose} style={{ order: 2 }}><X size={24} /></button>
                      <button
                        className={`btn ${hasChanges ? 'primary' : 'outline'} lg`}
                        disabled={!hasChanges}
                        onClick={handleSave}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '14px' }}
                      >
                        <CheckSquare size={18} /> {hasChanges ? 'Lưu thay đổi' : 'Đã đồng bộ'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '10px 16px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mã liên hệ</p>
                        <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>#CON-{formData.id}</p>
                      </div>
                      <div style={{ width: 1, height: 32, background: 'var(--color-border-light)' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Lead Score</p>
                          <p style={{ fontSize: '1rem', fontWeight: 800, color: score > 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>{score}/100</p>
                        </div>
                        <LeadScoreRing score={score} size={40} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Pipeline Stepper Bar ── */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'white', borderBottom: '1px solid var(--color-border-light)' }}>
                <button className="btn outline sm" style={{ padding: '4px', height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: '50%', position: 'absolute', left: '1rem', zIndex: 10, background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} onClick={() => document.getElementById('pipeline-scroll-container')?.scrollBy({ left: -250, behavior: 'smooth' })}>
                  <ChevronLeft size={16} />
                </button>
                <div id="pipeline-scroll-container" style={{ display: 'flex', padding: '1.25rem 3.5rem', gap: '12px', overflowX: 'auto', flex: 1, scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <style dangerouslySetInnerHTML={{ __html: `#pipeline-scroll-container::-webkit-scrollbar { display: none; }` }} />
                  {pipelineStages.map((st, i) => {
                    // contacts.status is always an enum string (lead/qualified/customer/churned)
                    // Map the current status to an index position in pipelineStages by order
                    const STATUS_ORDER: Record<string, number> = { lead: 0, qualified: 1, customer: 2, churned: 3 };
                    const currentStatus = formData.status || 'lead';
                    const currentIndex = STATUS_ORDER[currentStatus] ?? 0;
                    const isActive = i <= currentIndex;
                    const isCurrent = i === currentIndex;
                    const stColor = st.color || '#6366f1';
                    return (
                      <div
                        key={st.id}
                        onClick={() => {
                          if (isCurrent) return;
                          setPipelineModal({ isOpen: true, targetId: String(st.id), targetLabel: st.name, note: '' });
                        }}
                        style={{
                          flex: '0 0 auto', width: 'calc(25% - 9px)', position: 'relative', height: '40px', cursor: isCurrent ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', transition: 'all 0.3s'
                        }}
                      >
                        {/* Connection Line */}
                        {i < pipelineStages.length - 1 && (
                          <div style={{ position: 'absolute', top: '50%', left: '50%', right: '-50%', height: '3px', background: i < currentIndex ? stColor : '#e2e8f0', transform: 'translateY(-50%)', zIndex: 1, borderRadius: '4px' }} />
                        )}

                        <div style={{
                          position: 'relative', zIndex: 2, flex: 1,
                          background: isCurrent ? stColor : 'white',
                          color: isCurrent ? '#fff' : (isActive ? stColor : '#94a3b8'),
                          border: `2px solid ${isActive ? stColor : '#f1f5f9'}`,
                          padding: '6px 12px', borderRadius: '12px', fontSize: '0.8125rem', fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          whiteSpace: 'nowrap',
                          boxShadow: isCurrent ? `0 4px 12px ${stColor}40` : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>
                          {isActive && <UserCheck size={14} />}
                          {st.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button className="btn outline sm" style={{ padding: '4px', height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: '50%', position: 'absolute', right: '1rem', zIndex: 10, background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} onClick={() => document.getElementById('pipeline-scroll-container')?.scrollBy({ left: 250, behavior: 'smooth' })}>
                  <ChevronRight size={16} />
                </button>
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
                        <div className="card-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                          <span className="text-xs text-light" style={{ fontWeight: 600 }}>TƯƠNG TÁC</span>
                          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.25rem' }}>{timeline.length} lần</span>
                          <span className="text-xs text-light mt-1">Gọi điện, Email, Gặp mặt</span>
                        </div>
                      </div>

                      <div className="card-panel">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="panel-title" style={{ margin: 0 }}>Thông tin liên hệ & Công việc</h4>
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
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Clock size={13} style={{ color: 'var(--color-text-muted)' }} /> Thời gian
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-light)', minWidth: 58 }}>Tạo lúc:</span>
                                <input 
                                  type="datetime-local" 
                                  className="form-input sm" 
                                  style={{ padding: '4px 8px', fontSize: '0.8125rem', width: '180px' }}
                                  value={formData.created_at ? formData.created_at.substring(0, 16) : ''} 
                                  onChange={e => setFormData({ ...formData, created_at: e.target.value.replace('T', ' ') + ':00' })}
                                />
                              </div>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-light)', minWidth: 58 }}>Cập nhật:</span>
                                <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                                  {formData.updated_at ? new Date(formData.updated_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                </span>
                              </div>
                            </div>
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
                          <div className="form-group">
                            <label className="form-label">Người đang chăm sóc (Sale)</label>
                            <CustomSelect
                              options={users.map(u => ({ 
                                value: u.id, 
                                label: u.full_name, 
                                avatar: u.avatar_url,
                                sublabel: u.role
                              }))}
                              value={formData.owner_id || ''}
                              onChange={val => {
                                const u = users.find(x => x.id === Number(val));
                                setFormData({ ...formData, owner_id: val, owner_name: u?.full_name || '' });
                              }}
                              placeholder="Chọn sale phụ trách..."
                              searchable
                              showAvatars
                            />
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TagIcon size={24} />
                        </div>
                        <div>
                          <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Phân loại khách hàng</h3>
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>Sử dụng các thẻ tag để phân nhóm và tối ưu hóa quy trình tìm kiếm.</p>
                        </div>
                      </div>

                      <div className="card-panel" style={{ padding: '2.5rem', background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)', border: '1px solid var(--color-border-light)' }}>
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                          <label className="form-label" style={{ fontWeight: 700, marginBottom: '1rem', display: 'block', fontSize: '0.9375rem' }}>Gắn thẻ thông minh</label>
                          <TagInput
                            tags={tags}
                            onChange={setTags}
                            suggestions={allTags.map(t => t.name)}
                            placeholder="Chọn thẻ tag..."
                          />
                          <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', width: '100%', marginBottom: '0.25rem' }}>Gợi ý hệ thống:</span>
                            {allTags.slice(0, 8).map(t => (
                              <button
                                key={t.id}
                                onClick={() => !tags.includes(t.name) && setTags([...tags, t.name])}
                                className="btn ghost sm"
                                style={{ borderRadius: '10px', fontSize: '0.75rem', padding: '4px 12px', border: '1px dashed var(--color-border)' }}
                              >
                                + {t.name}
                              </button>
                            ))}
                          </div>
                        </div>
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
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      Thực hiện bởi <Avatar name={ev.user} size="sm" /> <strong>{ev.user}</strong>
                                    </span>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>{new Date(ev.time).toLocaleDateString('vi-VN')}</span>
                                    <button 
                                      className="btn ghost sm" 
                                      style={{ padding: '2px', height: '24px', width: '24px', color: 'var(--color-danger)', opacity: 0.5 }}
                                      onClick={(e) => { e.stopPropagation(); deleteActivity(ev.id); }}
                                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                      onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
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
                        <button className="btn primary sm" onClick={() => setShowDealModal(true)}><Plus size={14} /> Tạo deal mới</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        {deals.map((d: any) => (
                          <div key={d.id} className="card-panel" style={{ padding: 0, overflow: 'hidden', border: `1px solid var(--color-border)`, transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer', borderRadius: '16px' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.05)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--color-surface)' }}>
                              <div>
                                <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>{d.title}</h4>
                                <span className="badge" style={{ background: `${d.stage_color}15`, color: d.stage_color, fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px' }}>{d.stage}</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1rem', letterSpacing: '-0.01em' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(d.value || 0)}</span>
                              </div>
                            </div>
                            <div style={{ padding: '1rem 1.5rem', background: 'linear-gradient(to right, var(--color-bg), var(--color-surface))', borderTop: '1px solid var(--color-border-light)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
                                <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14} /> Xác suất chốt</span>
                                <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{d.prob}%</span>
                              </div>
                              <div style={{ height: 8, background: 'var(--color-border-light)', borderRadius: 4, overflow: 'hidden', marginBottom: '1.25rem' }}>
                                <div style={{ width: `${d.prob}%`, height: '100%', background: `linear-gradient(90deg, ${d.stage_color}88 0%, ${d.stage_color} 100%)`, borderRadius: 4 }} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                                <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> Ngày dự kiến</span>
                                <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{new Date(d.close).toLocaleDateString('vi-VN')}</span>
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
                        <button className="btn primary sm" onClick={() => setShowTaskModal(true)}><Plus size={14} /> Thêm công việc</button>
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
                            <button
                              className="btn-icon sm text-danger"
                              style={{ opacity: 0.4, transition: 'opacity 0.2s' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                showConfirm(
                                  'Xóa công việc?',
                                  `Bạn có chắc chắn muốn xóa công việc "${t.title}"?`,
                                  async () => {
                                    try {
                                      await api.delete(`/activities/${t.id}`);
                                      setTasks(prev => prev.filter(x => x.id !== t.id));
                                      addToast('Đã xóa công việc thành công', 'success');
                                    } catch (err: any) {
                                      addToast(err.response?.data?.message || 'Lỗi khi xóa công việc', 'error');
                                    }
                                  }
                                );
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                            >
                              <Trash2 size={16} />
                            </button>
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
                        <MentionInput
                          value={newNote}
                          onChange={e => setNewNote(e.target.value)}
                          placeholder="Nhập nội dung ghi chú về khách hàng này (Sử dụng @ để tag user/sale)..."
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>{formatNote(n.text)}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1rem', borderTop: '1px solid var(--color-border-light)', paddingTop: '0.75rem' }}>
                                  Tạo bởi <strong>{n.user}</strong> lúc {new Date(n.time).toLocaleString('vi-VN')}
                                </p>
                              </div>
                              <button 
                                className="btn-icon sm text-danger" 
                                style={{ opacity: 0.4, transition: 'opacity 0.2s' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showConfirm(
                                    'Xóa ghi chú?',
                                    'Bạn có chắc chắn muốn xóa ghi chú này không?',
                                    async () => {
                                      try {
                                        await api.delete(`/notes/${n.id}`);
                                        setNotes(prev => prev.filter(x => x.id !== n.id));
                                        addToast('Đã xóa ghi chú', 'success');
                                      } catch {
                                        addToast('Lỗi khi xóa ghi chú', 'error');
                                      }
                                    }
                                  );
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
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
                              addToast('Đã tải lên tài liệu mới.', 'success');
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
                              <div className="flex gap-2" style={{ flexShrink: 0 }}>
                                <button className="btn-icon sm" title="Đổi tên" onClick={() => {
                                  const newName = prompt('Nhập tên mới cho tài liệu:', doc.name);
                                  if (newName && newName.trim()) {
                                    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, name: newName.trim() } : d));
                                    addToast('Đã đổi tên tài liệu.', 'success');
                                  }
                                }}><Pencil size={14} /></button>
                                <button className="btn-icon sm text-danger" title="Xóa" onClick={() => {
                                  showConfirm(
                                    'Xóa tài liệu?',
                                    `Bạn có chắc muốn xóa vĩnh viễn tài liệu "${doc.name}"?`,
                                    () => {
                                      setDocs(prev => prev.filter(d => d.id !== doc.id));
                                      addToast('Đã xóa tài liệu.', 'success');
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
                        <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Invoices</h3>
                        <button className="btn outline sm" onClick={() => { useUIStore.getState().setShowPOS(formData); }}><Plus size={14} /> Tạo hóa đơn</button>
                      </div>
                      {drawerInvoices.length === 0 ? (
                        <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                          <DollarSign size={48} color="var(--color-border)" style={{ margin: '0 auto 1rem auto' }} />
                          <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>Chưa có lịch sử thanh toán</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          {/* Invoice Summary */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            <div className="card-panel" style={{ padding: '1.25rem 1rem', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <div style={{ width: 24, height: 24, borderRadius: '6px', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <FileText size={14} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Tổng hóa đơn</span>
                              </div>
                              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(drawerInvoices.reduce((acc: number, inv: any) => acc + inv.total, 0))}
                              </h4>
                            </div>
                            <div className="card-panel" style={{ padding: '1.25rem 1rem', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0', position: 'relative', overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <div style={{ width: 24, height: 24, borderRadius: '6px', background: '#bbf7d0', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <CheckCircle2 size={14} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>Đã thu</span>
                              </div>
                              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#166534' }}>
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(drawerInvoices.filter((i: any) => i.status === 'paid').reduce((acc: number, inv: any) => acc + inv.total, 0))}
                              </h4>
                            </div>
                            <div className="card-panel" style={{ padding: '1.25rem 1rem', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a', position: 'relative', overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <div style={{ width: 24, height: 24, borderRadius: '6px', background: '#fde68a', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Clock size={14} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Chờ xử lý</span>
                              </div>
                              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#92400e' }}>
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(drawerInvoices.filter((i: any) => i.status === 'pending').reduce((acc: number, inv: any) => acc + inv.total, 0))}
                              </h4>
                            </div>
                            <div className="card-panel" style={{ padding: '1.25rem 1rem', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fecaca', position: 'relative', overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <div style={{ width: 24, height: 24, borderRadius: '6px', background: '#fecaca', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <AlertCircle size={14} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase' }}>Quá hạn nợ</span>
                              </div>
                              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#991b1b' }}>
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(drawerInvoices.filter((i: any) => i.status === 'overdue').reduce((acc: number, inv: any) => acc + inv.total, 0))}
                              </h4>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gap: '1rem' }}>
                            {drawerInvoices.map((inv: any) => (
                              <div key={inv.id} className="card-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = 'var(--color-primary-light)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}>
                                <div>
                                  <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)', letterSpacing: '-0.01em' }}>{inv.invoice_number}</h4>
                                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={12} /> Xuất ngày: {new Date(inv.issue_date).toLocaleDateString('vi-VN')}
                                  </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.05rem', marginBottom: '6px', letterSpacing: '-0.01em' }}>
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(inv.total)}
                                  </div>
                                  <span className={`badge ${inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}`} style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                    {inv.status === 'paid' ? 'Đã thanh toán' : inv.status === 'overdue' ? 'Quá hạn' : 'Chờ xử lý'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* EXPENSES TAB */}
                  {activeTab === 'expenses' && (
                    <div className="animate-fade">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Chi phí liên quan</h3>
                        <button className="btn outline sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b5cf6', borderColor: '#8b5cf6' }} onClick={() => setShowExpenseModal(true)}><Plus size={14} /> Nhập chi phí</button>
                      </div>
                      {drawerExpenses.length > 0 ? (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                          {drawerExpenses.map((exp: any) => (
                            <div key={exp.id} className="card-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '4px' }}>{exp.title}</h4>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                  <span className="badge info">{exp.category}</span>
                                  <span>{new Date(exp.date).toLocaleDateString('vi-VN')}</span>
                                  <span>Tạo bởi: {exp.creator_name}</span>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>
                                  -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(exp.split_amount || exp.amount)}
                                </div>
                                {exp.split_amount && exp.split_amount !== exp.amount && (
                                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                    (Chia từ tổng {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(exp.amount)})
                                  </div>
                                )}
                                <span className={`badge ${exp.status === 'approved' ? 'success' : exp.status === 'rejected' ? 'danger' : 'warning'}`} style={{ marginTop: '4px', fontSize: '0.7rem' }}>
                                  {exp.status === 'approved' ? 'Đã duyệt' : exp.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="card-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                          <DollarSign size={48} style={{ color: 'var(--color-border)', margin: '0 auto 1rem', opacity: 0.5 }} />
                          <h4 style={{ fontWeight: 700 }}>Chưa có chi phí nào được ghi nhận</h4>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'tickets' && (
                    <div className="animate-fade">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Hỗ trợ / Khiếu nại (Tickets)</h3>
                        <button className="btn outline sm" onClick={() => setShowTicketModal(true)}>
                          <Plus size={14} /> Tạo Ticket
                        </button>
                      </div>
                      {drawerTickets.length === 0 ? (
                        <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                          <LifeBuoy size={48} color="var(--color-border)" style={{ margin: '0 auto 1rem auto' }} />
                          <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>Chưa có ticket nào</p>
                        </div>
                      ) : (
                        <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)' }}>Mã & Tiêu đề</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)' }}>Trạng thái</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)' }}>Phụ trách</th>
                              </tr>
                            </thead>
                            <tbody>
                              {drawerTickets.map((t: any) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                                  <td style={{ padding: '0.875rem 1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                      <AlertCircle size={14} color={t.priority === 'high' || t.priority === 'urgent' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#10b981'} style={{ marginTop: '2px' }} />
                                      <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '2px' }}>{t.subject}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>#{t.id} • Mở: {new Date(t.created_at).toLocaleDateString('vi-VN')}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.875rem 1rem' }}>
                                    <span className={`badge ${t.status === 'resolved' ? 'success' : t.status === 'in_progress' ? 'warning' : 'danger'}`}>
                                      {t.status === 'resolved' ? 'Đã giải quyết' : t.status === 'in_progress' ? 'Đang xử lý' : 'Đang mở'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', fontWeight: 600 }}>{t.assignee_name || 'Chưa phân công'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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
        onSave={async (log) => {
          try {
            // Map CallLog to activities table schema exactly
            const subject = `Cuộc gọi ${log.direction === 'outbound' ? 'đi' : 'đến'}: ${log.outcome === 'reached' ? 'Đã kết nối' :
                log.outcome === 'no_answer' ? 'Không nghe máy' :
                  log.outcome === 'busy' ? 'Máy bận' :
                    log.outcome === 'voicemail' ? 'Hộp thư thoại' : 'Sai số'
              }`;
            await api.post('/activities', {
              type: 'call',
              subject,
              body: log.note || null,
              status: 'done',
              related_type: 'contact',
              related_id: contact?.id,
              due_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
              done_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            });

            // Update local mock store for immediate timeline reflect
            const { addActivity } = useMockStore.getState();
            addActivity({
              id: Date.now(), subject, type: 'call', status: 'done',
              user_name: 'Admin', created_at: new Date().toISOString(), contact_id: contact?.id
            });

            addToast('Đã ghi nhận cuộc gọi và thêm vào Timeline', 'success');
          } catch (err) {
            addToast('Lỗi khi lưu nhật ký cuộc gọi', 'error');
          }
        }}
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
                Từ <strong>{pipelineStages.find(x => String(x.id) === String(formData.stage_id || formData.status))?.name || pipelineStages[0]?.name || 'Bước 1'}</strong>
                <span style={{ margin: '0 4px' }}>→</span>
                <strong style={{ color: pipelineStages.find(x => String(x.id) === pipelineModal.targetId)?.color || 'var(--color-primary)' }}>{pipelineModal.targetLabel}</strong>
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
                  onClick={async () => {
                    const targetId = pipelineModal.targetId;   // string, e.g. 'lead' or '3'
                    const targetLabel = pipelineModal.targetLabel;
                    const note = pipelineModal.note;
                    setPipelineModal({ isOpen: false, targetId: '', targetLabel: '', note: '' });

                    // contacts.status is an ENUM (lead/qualified/customer/churned).
                    // Pipeline stages from settings are display-only for the stepper.
                    // We always persist to the 'status' field.
                    // Map numeric stage ID back to the DEFAULT fallback status string
                    const isNumericId = !isNaN(Number(targetId)) && targetId !== '';
                    let statusValue = targetId;
                    if (isNumericId) {
                      // Find in pipelineStages by index position and map to DEFAULT enum
                      const idx = pipelineStages.findIndex(s => String(s.id) === targetId);
                      const defaults = ['lead', 'qualified', 'customer', 'churned'];
                      statusValue = defaults[idx] ?? 'lead';
                    }

                    // Optimistically update UI
                    setFormData((prev: any) => ({ ...prev, status: statusValue }));

                    try {
                      // Persist status change
                      await api.put(`/contacts/${contact.id}`, { status: statusValue });
                      // Log audit note with correct query params
                      await api.post(`/notes?entity_type=contact&entity_id=${contact.id}`, {
                        body: `[Chuyển trạng thái Pipeline] → ${targetLabel}: ${note}`,
                        type: 'internal'
                      });
                      setNotes(p => [{ id: Date.now(), text: `[Chuyển trạng thái] → ${targetLabel}: ${note}`, time: new Date().toISOString(), user: 'Admin' }, ...p]);
                      addToast(`Đã cập nhật Pipeline thành ${targetLabel}`, 'success');
                    } catch (e: any) {
                      addToast(e?.response?.data?.message || 'Lỗi khi cập nhật Pipeline', 'error');
                    }
                  }}
                >
                  Lưu cập nhật
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE DEAL MODAL */}
      <AnimatePresence>
        {showDealModal && (
          <div className="overlay-backdrop" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDealModal(false)}>
            <motion.div
              className="modal-sheet"
              style={{ width: '100%', maxWidth: 500 }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Tạo cơ hội (Deal) mới</h3>
                <button className="btn-icon-bare" onClick={() => setShowDealModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên Deal *</label>
                  <input className="form-input" placeholder="VD: Triển khai ERP cho {fullName}" value={dealForm.title} onChange={e => setDealForm({ ...dealForm, title: e.target.value })} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá trị dự kiến (VNĐ)</label>
                  <input className="form-input" type="number" placeholder="0" value={dealForm.value} onChange={e => setDealForm({ ...dealForm, value: e.target.value })} />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Giai đoạn</label>
                    <CustomSelect 
                      options={[
                        { value: 'lead', label: 'Mới (Lead)' },
                        { value: 'negotiation', label: 'Đàm phán' },
                        { value: 'proposal', label: 'Đã báo giá' }
                      ]} 
                      value={dealForm.stage} 
                      onChange={val => setDealForm({ ...dealForm, stage: val.toString() })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Xác suất (%)</label>
                    <input className="form-input" type="number" value={dealForm.probability} onChange={e => setDealForm({ ...dealForm, probability: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn outline" onClick={() => setShowDealModal(false)}>Hủy</button>
                <button className="btn primary" onClick={handleCreateDeal}>Tạo Deal</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE TASK MODAL */}
      <AnimatePresence>
        {showTaskModal && (
          <div className="overlay-backdrop" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowTaskModal(false)}>
            <motion.div
              className="modal-sheet"
              style={{ width: '100%', maxWidth: 500 }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Thêm công việc cho {formData.last_name}</h3>
                <button className="btn-icon-bare" onClick={() => setShowTaskModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên công việc *</label>
                  <input className="form-input" placeholder="VD: Gửi báo giá, Demo tính năng..." value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} autoFocus />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Mức độ ưu tiên</label>
                    <CustomSelect 
                      options={[
                        { value: 'low', label: 'Thấp' },
                        { value: 'medium', label: 'Trung bình' },
                        { value: 'high', label: 'Cao' }
                      ]} 
                      value={taskForm.priority} 
                      onChange={val => setTaskForm({ ...taskForm, priority: val.toString() })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hạn hoàn thành</label>
                    <input className="form-input" type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn outline" onClick={() => setShowTaskModal(false)}>Hủy</button>
                <button className="btn primary" onClick={handleAddTask}>Lưu công việc</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE TICKET MODAL */}
      <AnimatePresence>
        {showTicketModal && (
          <div className="overlay-backdrop" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowTicketModal(false)}>
            <motion.div
              className="modal-sheet"
              style={{ width: '100%', maxWidth: 500 }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Tạo Ticket hỗ trợ</h3>
                <button className="btn-icon-bare" onClick={() => setShowTicketModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Khách hàng</label>
                  <input className="form-input" value={fullName} disabled style={{ background: 'var(--color-bg)' }} />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Tiêu đề hỗ trợ *</label>
                    <input className="form-input" placeholder="Tóm tắt yêu cầu/lỗi..." value={ticketForm.subject} onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })} autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Độ ưu tiên</label>
                    <CustomSelect 
                      options={[
                        { value: 'low', label: 'Thấp' },
                        { value: 'medium', label: 'Trung bình' },
                        { value: 'high', label: 'Cao' },
                        { value: 'urgent', label: 'Khẩn cấp' }
                      ]} 
                      value={ticketForm.priority} 
                      onChange={val => setTicketForm({ ...ticketForm, priority: val.toString() })} 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả chi tiết</label>
                  <textarea className="form-input" rows={4} placeholder="Nội dung chi tiết..." value={ticketForm.description} onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })} style={{ resize: 'none' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn outline" onClick={() => setShowTicketModal(false)}>Hủy</button>
                <button className="btn primary" onClick={handleCreateTicket}>Tạo Ticket</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <CreateExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        initialEntity={{ type: 'contact', id: contact?.id, name: `${contact?.first_name} ${contact?.last_name || ''}`.trim() }}
        onSuccess={fetchData}
      />
    </>
  );
};
