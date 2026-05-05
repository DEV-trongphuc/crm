import React, { useState, useEffect } from 'react';
import { Users, Shield, Sliders, Plus, Pencil, Trash2, X, Tag as TagIcon, LayoutList, GripVertical, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import api from '../api/axios';

const ROLES = ['admin','manager','sales','viewer'];
const R_LABEL: Record<string,string> = { admin:'Quản trị viên', manager:'Quản lý', sales:'Sale', viewer:'Xem' };
const R_COLOR: Record<string,string> = { admin:'danger', manager:'warning', sales:'info', viewer:'cool' };

const MOCK_USERS = [
  { id:1, full_name:'Quản trị viên', email:'admin@minth.crm', role:'admin', is_active:true, last_login_at:'2025-05-04T08:00:00' },
  { id:2, full_name:'Nhân viên Kinh doanh', email:'sales@minth.crm', role:'sales', is_active:true, last_login_at:'2025-05-03T15:30:00' },
];

const TABS = [
  { id:'users', label:'Người dùng', icon: Users },
  { id:'roles', label:'Phân quyền', icon: Shield },
  { id:'pipeline', label:'Pipeline', icon: Sliders },
  { id:'tags', label:'Quản lý Tags', icon: TagIcon },
  { id:'custom_fields', label:'Trường tùy chỉnh', icon: LayoutList },
];

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast, showConfirm } = useUIStore();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ full_name:'', email:'', role:'sales', password:'', is_active:true });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [pipelines, setPipelines] = useState<any[]>([]);
  const [tags, setTags] = useState([
    { id: 1, name: 'VIP', color: '#f59e0b', count: 12 },
    { id: 2, name: 'Khách sỉ', color: '#3b82f6', count: 45 },
    { id: 3, name: 'Hủy dịch vụ', color: '#ef4444', count: 8 },
    { id: 4, name: 'Phần mềm ERP', color: '#10b981', count: 24 }
  ]);
  const [customFields, setCustomFields] = useState([
    { id: 1, name: 'Mã số thuế', entity: 'Công ty', type: 'Text', required: false },
    { id: 2, name: 'Ngày sinh', entity: 'Liên hệ', type: 'Date', required: false },
    { id: 3, name: 'Hạn mức tín dụng', entity: 'Công ty', type: 'Number', required: false },
    { id: 4, name: 'Phân loại khách hàng', entity: 'Liên hệ', type: 'Select', required: true }
  ]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await api.get('/users');
      setUsers(r.data.data || []);
    } catch {
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  };

  const fetchPipelines = async () => {
    setLoading(true);
    try {
      const r = await api.get('/pipeline-stages');
      setPipelines(r.data.data || []);
    } catch {
      addToast('Lỗi tải danh sách Pipeline', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'pipeline') fetchPipelines();
  }, [tab]);

  const [activeModal, setActiveModal] = useState<{type: 'pipeline'|'tag'|'field'|null, item: any}>({ type: null, item: null });
  const [genericForm, setGenericForm] = useState<any>({});

  const openGenericModal = (type: 'pipeline'|'tag'|'field', item?: any) => {
    setActiveModal({ type, item });
    if (item) {
      setGenericForm({ ...item });
    } else {
      if (type === 'pipeline') setGenericForm({ name: '', color: '#3b82f6' });
      if (type === 'tag') setGenericForm({ name: '', color: '#10b981' });
      if (type === 'field') setGenericForm({ name: '', entity: 'Liên hệ', type: 'Text', required: false });
    }
  };

  const handleGenericSave = async () => {
    if (!genericForm.name) { addToast('Vui lòng nhập tên', 'error'); return; }
    
    try {
      if (activeModal.type === 'pipeline') {
        if (activeModal.item) await api.put(`/pipeline-stages/${activeModal.item.id}`, genericForm);
        else await api.post('/pipeline-stages', genericForm);
        fetchPipelines();
      }
      // (Tags/Fields remain local simulation for now)
      if (activeModal.type === 'tag') {
        if (activeModal.item) setTags(t => t.map(x => x.id === activeModal.item.id ? { ...x, ...genericForm } : x));
        else setTags(t => [...t, { ...genericForm, id: Date.now(), count: 0 }]);
      }
      if (activeModal.type === 'field') {
        if (activeModal.item) setCustomFields(f => f.map(x => x.id === activeModal.item.id ? { ...x, ...genericForm } : x));
        else setCustomFields(f => [...f, { ...genericForm, id: Date.now() }]);
      }
      
      addToast('Đã lưu cấu hình', 'success');
      setActiveModal({ type: null, item: null });
    } catch (e: any) {
      addToast(e.response?.data?.message || 'Lỗi lưu cấu hình', 'error');
    }
  };

  const handleSave = async () => {
    if (!form.full_name || !form.email) { addToast('Họ tên và email là bắt buộc', 'error'); return; }
    setSaving(true);
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, form);
        addToast('Đã cập nhật người dùng', 'success');
      } else {
        await api.post('/users', form);
        addToast('Đã thêm người dùng mới', 'success');
      }
      fetchUsers();
      setShowModal(false);
    } catch (e: any) {
      addToast(e.response?.data?.message || 'Lỗi khi lưu người dùng', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = (u: any) => {
    showConfirm(
      'Xóa người dùng?',
      `Bạn có chắc chắn muốn xóa vĩnh viễn người dùng "${u.full_name}"? Thao tác này không thể hoàn tác.`,
      async () => {
        try {
          await api.delete(`/users/${u.id}`);
          addToast('Đã xóa người dùng thành công', 'success');
          fetchUsers();
        } catch (e: any) {
          addToast(e.response?.data?.message || 'Lỗi khi xóa người dùng', 'error');
        }
      }
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Cài đặt hệ thống</h1>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'0.25rem', marginBottom:'1.5rem', background:'var(--color-bg)', padding:'0.375rem', borderRadius:'var(--radius-lg)', width:'fit-content' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 1.125rem', borderRadius:'8px', fontWeight:600, fontSize:'0.875rem', background: tab===id ? 'var(--color-surface)' : 'transparent', color: tab===id ? 'var(--color-text)' : 'var(--color-text-light)', boxShadow: tab===id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', border:'none', cursor:'pointer', transition:'all 0.2s' }}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-light">{users.length} người dùng trong hệ thống</p>
            <button className="btn primary sm" onClick={() => { setEditUser(null); setForm({ full_name:'', email:'', role:'sales', password:'', is_active:true }); setShowModal(true); }}>
              <Plus size={14} /> Thêm người dùng
            </button>
          </div>
          <div className="card" style={{ overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign:'left', padding:'0.75rem 1rem', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--color-text-light)', background:'var(--color-bg)', borderBottom:'1px solid var(--color-border)' }}>Người dùng</th>
                  <th style={{ textAlign:'left', padding:'0.75rem 1rem', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--color-text-light)', background:'var(--color-bg)', borderBottom:'1px solid var(--color-border)' }}>Role</th>
                  <th style={{ textAlign:'left', padding:'0.75rem 1rem', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--color-text-light)', background:'var(--color-bg)', borderBottom:'1px solid var(--color-border)' }}>Trạng thái</th>
                  <th style={{ textAlign:'left', padding:'0.75rem 1rem', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--color-text-light)', background:'var(--color-bg)', borderBottom:'1px solid var(--color-border)' }}>Đăng nhập cuối</th>
                  <th style={{ background:'var(--color-bg)', borderBottom:'1px solid var(--color-border)' }}></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom:'1px solid var(--color-border-light)' }}>
                    <td style={{ padding:'0.875rem 1rem', verticalAlign:'middle' }}>
                      <div className="flex items-center gap-3">
                        <div className="avatar-placeholder sm" style={{ background: u.role === 'admin' ? '#ef4444' : '#7c3aed', fontSize:'0.65rem' }}>{u.full_name[0]}</div>
                        <div>
                          <p className="text-sm font-semi">{u.full_name}</p>
                          <p className="text-xs text-light">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'0.875rem 1rem', verticalAlign:'middle' }}><span className={`badge ${R_COLOR[u.role]}`}>{R_LABEL[u.role]}</span></td>
                    <td style={{ padding:'0.875rem 1rem', verticalAlign:'middle' }}><span className={`badge ${u.is_active ? 'success' : 'danger'}`}>{u.is_active ? 'Đang hoạt động' : 'Vô hiệu hóa'}</span></td>
                    <td style={{ padding:'0.875rem 1rem', verticalAlign:'middle' }}>
                      <span className="text-sm text-light">{u.last_login_at ? new Date(u.last_login_at).toLocaleString('vi-VN', { dateStyle:'short', timeStyle:'short' }) : '—'}</span>
                    </td>
                    <td style={{ padding:'0.875rem 1rem', verticalAlign:'middle' }}>
                      <div className="flex gap-2">
                        <button className="btn ghost sm" onClick={() => { setEditUser(u); setForm({ full_name:u.full_name, email:u.email, role:u.role, password:'', is_active:u.is_active }); setShowModal(true); }}><Pencil size={13} /></button>
                        {u.id !== user?.id && u.role !== 'admin' && <button className="btn ghost sm" style={{ color:'var(--color-danger)' }} onClick={() => deleteUser(u)}><Trash2 size={13} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'roles' && (
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontWeight:700, marginBottom:'1rem' }}>Phân quyền theo Role</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tính năng</th>
                    <th>Admin</th><th>Manager</th><th>Sales</th><th>Viewer</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Xem khách hàng', <Check size={16} color="var(--color-success)" />, <Check size={16} color="var(--color-success)" />, <Check size={16} color="var(--color-success)" />, <Check size={16} color="var(--color-success)" />],
                    ['Thêm/sửa khách hàng', <Check size={16} color="var(--color-success)" />, <Check size={16} color="var(--color-success)" />, <Check size={16} color="var(--color-success)" />, <X size={16} color="var(--color-text-muted)" />],
                    ['Xóa khách hàng', <Check size={16} color="var(--color-success)" />, <Check size={16} color="var(--color-success)" />, <X size={16} color="var(--color-text-muted)" />, <X size={16} color="var(--color-text-muted)" />],
                    ['Xem deal', <Check size={16} color="var(--color-success)" />, <Check size={16} color="var(--color-success)" />, <span className="badge info sm" style={{ padding: '2px 6px', fontSize: '10px' }}>Của mình</span>, <X size={16} color="var(--color-text-muted)" />],
                    ['Xóa deal', <Check size={16} color="var(--color-success)" />, <Check size={16} color="var(--color-success)" />, <X size={16} color="var(--color-text-muted)" />, <X size={16} color="var(--color-text-muted)" />],
                    ['Xem báo cáo', <Check size={16} color="var(--color-success)" />, <Check size={16} color="var(--color-success)" />, <span className="badge info sm" style={{ padding: '2px 6px', fontSize: '10px' }}>Của mình</span>, <X size={16} color="var(--color-text-muted)" />],
                    ['Quản lý người dùng', <Check size={16} color="var(--color-success)" />, <X size={16} color="var(--color-text-muted)" />, <X size={16} color="var(--color-text-muted)" />, <X size={16} color="var(--color-text-muted)" />],
                    ['Cài đặt hệ thống', <Check size={16} color="var(--color-success)" />, <X size={16} color="var(--color-text-muted)" />, <X size={16} color="var(--color-text-muted)" />, <X size={16} color="var(--color-text-muted)" />],
                  ].map(([feat, ...perms]) => (
                    <tr key={feat as string}>
                      <td className="font-semi">{feat}</td>
                      {perms.map((p, i) => <td key={i} style={{ textAlign:'center' }}>{p}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'pipeline' && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontWeight:700 }}>Cấu hình các giai đoạn Pipeline</h3>
              <button className="btn primary sm" onClick={() => openGenericModal('pipeline')}>
                <Plus size={14} /> Thêm giai đoạn
              </button>
            </div>
            {pipelines.map((s, i) => (
              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.75rem 0', borderBottom:'1px solid var(--color-border-light)' }}>
                <span style={{ width:8, height:32, background:s.color, borderRadius:4, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <p className="font-semi text-sm">{s.name}</p>
                  <p className="text-xs text-light">{s.deals || 0} deals đang ở giai đoạn này</p>
                </div>
                <button className="btn ghost sm" onClick={() => openGenericModal('pipeline', s)}><Pencil size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'tags' && (
        <div className="animate-fade">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Quản lý Tags Hệ thống</h3>
              <p className="text-sm text-light">Thiết lập trước các Tags chung cho toàn công ty.</p>
            </div>
            <button className="btn primary sm" onClick={() => openGenericModal('tag')}>
              <Plus size={14} /> Thêm Tag mới
            </button>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {tags.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.color }} />
                  <span style={{ fontWeight: 600 }}>{t.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px' }}>{t.count || 0}</span>
                  <button className="btn-icon-bare" style={{ marginLeft: '0.5rem', color: 'var(--color-text-light)' }} onClick={() => openGenericModal('tag', t)}><Pencil size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'custom_fields' && (
        <div className="animate-fade">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Các trường tùy chỉnh (Custom Fields)</h3>
              <p className="text-sm text-light">Định nghĩa dữ liệu thu thập thêm cho Liên hệ và Công ty.</p>
            </div>
            <button className="btn primary sm" onClick={() => openGenericModal('field')}>
              <Plus size={14} /> Thêm trường mới
            </button>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: 40, background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}></th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>Tên trường</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>Module</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>Loại dữ liệu</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>Bắt buộc</th>
                  <th style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}></th>
                </tr>
              </thead>
              <tbody>
                {customFields.map((f, i) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)', cursor: 'grab' }}><GripVertical size={16} /></td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>{f.name}</td>
                    <td style={{ padding: '0.875rem 1rem' }}><span className="badge info">{f.entity}</span></td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem' }}>{f.type}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div className={`custom-toggle ${f.required ? 'active' : ''}`} style={{ zoom: 0.8 }} onClick={() => { setCustomFields(prev => prev.map(x => x.id === f.id ? {...x, required: !x.required} : x)) }} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <button className="btn-icon-bare text-light" onClick={() => openGenericModal('field', f)}><Pencil size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div className="overlay-backdrop" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setShowModal(false)} />
            <motion.div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'460px', maxWidth:'calc(100vw - 2rem)', background:'var(--color-surface)', borderRadius:'var(--radius-xl)', boxShadow:'var(--shadow-xl)', border:'1px solid var(--color-border)', zIndex:300 }}
              initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--color-border)' }}>
                <h3 style={{ fontWeight:700 }}>{editUser ? 'Sửa người dùng' : 'Thêm người dùng'}</h3>
                <button onClick={() => setShowModal(false)} style={{ color:'var(--color-text-muted)' }}><X size={18} /></button>
              </div>
              <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div className="form-group"><label className="form-label">Họ & Tên *</label><input className="form-input" value={form.full_name} onChange={e => setForm({...form, full_name:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                  <div className="form-group"><label className="form-label">Role</label>
                    <select className="form-input" value={form.role} onChange={e => setForm({...form, role:e.target.value})}>
                      {ROLES.map(r => <option key={r} value={r}>{R_LABEL[r]}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">{editUser ? 'Mật khẩu mới' : 'Mật khẩu *'}</label><input className="form-input" type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder={editUser ? '(để trống = giữ nguyên)' : ''} /></div>
                </div>
                <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active:e.target.checked})} />
                  <span className="text-sm">Kích hoạt tài khoản</span>
                </label>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', padding:'1.25rem 1.5rem', borderTop:'1px solid var(--color-border)' }}>
                <button className="btn secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button className="btn primary" onClick={handleSave} disabled={saving}>{saving && <Loader2 size={14} className="spin" />}{editUser ? 'Lưu' : 'Thêm'}</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Generic Modal for Settings */}
      <AnimatePresence>
        {activeModal.type && (
          <>
            <motion.div className="overlay-backdrop" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setActiveModal({type: null, item: null})} />
            <motion.div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'460px', maxWidth:'calc(100vw - 2rem)', background:'var(--color-surface)', borderRadius:'var(--radius-xl)', boxShadow:'var(--shadow-xl)', border:'1px solid var(--color-border)', zIndex:300 }}
              initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--color-border)' }}>
                <h3 style={{ fontWeight:700 }}>
                  {activeModal.item ? 'Chỉnh sửa ' : 'Thêm mới '}
                  {activeModal.type === 'pipeline' ? 'giai đoạn Pipeline' : activeModal.type === 'tag' ? 'Tag' : 'Trường tùy chỉnh'}
                </h3>
                <button onClick={() => setActiveModal({type: null, item: null})} style={{ color:'var(--color-text-muted)' }}><X size={18} /></button>
              </div>
              <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tên {activeModal.type === 'pipeline' ? 'giai đoạn' : activeModal.type === 'tag' ? 'Tag' : 'trường'} *</label>
                  <input className="form-input" value={genericForm.name || ''} onChange={e => setGenericForm({...genericForm, name: e.target.value})} autoFocus />
                </div>
                
                {(activeModal.type === 'pipeline' || activeModal.type === 'tag') && (
                  <div className="form-group">
                    <label className="form-label">Màu sắc</label>
                    <input type="color" value={genericForm.color || '#000000'} onChange={e => setGenericForm({...genericForm, color: e.target.value})} style={{ width: '100%', height: 40, padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                  </div>
                )}

                {activeModal.type === 'field' && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Module áp dụng</label>
                      <select className="form-input" value={genericForm.entity || 'Liên hệ'} onChange={e => setGenericForm({...genericForm, entity: e.target.value})}>
                        <option value="Liên hệ">Liên hệ</option>
                        <option value="Công ty">Công ty</option>
                        <option value="Cơ hội">Cơ hội (Deal)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Loại dữ liệu</label>
                      <select className="form-input" value={genericForm.type || 'Text'} onChange={e => setGenericForm({...genericForm, type: e.target.value})}>
                        <option value="Text">Văn bản (Text)</option>
                        <option value="Number">Số (Number)</option>
                        <option value="Date">Ngày tháng (Date)</option>
                        <option value="Select">Lựa chọn (Select)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'1.25rem 1.5rem', borderTop:'1px solid var(--color-border)' }}>
                {activeModal.item ? (
                  <button className="btn danger sm" onClick={() => {
                    showConfirm(
                      'Xác nhận xóa?',
                      'Bạn có chắc chắn muốn xóa mục này? Thao tác này không thể hoàn tác.',
                      async () => {
                        try {
                          if (activeModal.type === 'pipeline') {
                            await api.delete(`/pipeline-stages/${activeModal.item.id}`);
                            fetchPipelines();
                          }
                          if (activeModal.type === 'tag') setTags(t => t.filter(x => x.id !== activeModal.item.id));
                          if (activeModal.type === 'field') setCustomFields(f => f.filter(x => x.id !== activeModal.item.id));
                          setActiveModal({type: null, item: null});
                          addToast('Đã xóa', 'success');
                        } catch (e: any) {
                          addToast(e.response?.data?.message || 'Lỗi khi xóa', 'error');
                        }
                      }
                    );
                  }}><Trash2 size={14} /> Xóa</button>
                ) : <div/>}
                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <button className="btn secondary" onClick={() => setActiveModal({type: null, item: null})}>Hủy</button>
                  <button className="btn primary" onClick={handleGenericSave}>Lưu cấu hình</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
