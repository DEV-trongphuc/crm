import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, AlignLeft, Phone, Mail, Users, CheckSquare, Zap } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { CustomSelect } from './CustomSelect';
import api from '../../api/axios';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: 'contact' | 'company' | 'deal';
  entityId?: number;
  onSuccess?: () => void;
}

const TYPES = [
  { id: 'call', label: 'Cuộc gọi', icon: <Phone size={16} />, color: 'var(--color-primary)' },
  { id: 'email', label: 'Email', icon: <Mail size={16} />, color: '#10b981' },
  { id: 'meeting', label: 'Cuộc họp', icon: <Users size={16} />, color: '#f59e0b' },
  { id: 'task', label: 'Công việc', icon: <CheckSquare size={16} />, color: '#8b5cf6' },
  { id: 'note', label: 'Ghi chú', icon: <AlignLeft size={16} />, color: '#f59e0b' }
];

export const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, entityType, entityId, onSuccess }) => {
  const { addToast } = useUIStore();
  const [formData, setFormData] = useState({
    type: 'task',
    subject: '',
    body: '',
    due_date: '',
    priority: 'medium',
    auto_trigger: false // The automation trigger integration
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim()) { addToast('Vui lòng nhập tiêu đề hoạt động', 'error'); return; }
    setLoading(true);
    
    try {
      await api.post('/activities', {
        ...formData,
        related_type: entityType,
        related_id: entityId
      });
      
      if (formData.auto_trigger) {
        addToast('Đã kích hoạt tự động hóa Workflow', 'success');
      }
      
      addToast('Đã thêm hoạt động mới', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      addToast('Lỗi khi thêm hoạt động', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="overlay-backdrop" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
        <motion.div 
          className="modal-sheet" 
          style={{ width: '100%', maxWidth: 500, padding: 0 }}
          initial={{ opacity: 0, y: 20, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Thêm hoạt động mới
            </h2>
            <button className="btn-icon-bare" onClick={onClose}><X size={20}/></button>
          </div>
          
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Type selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {TYPES.map(t => (
                <button 
                  key={t.id} type="button"
                  onClick={() => setFormData({ ...formData, type: t.id })}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    padding: '0.75rem 0', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                    background: formData.type === t.id ? `${t.color}15` : 'var(--color-surface)',
                    border: `2px solid ${formData.type === t.id ? t.color : 'var(--color-border)'}`,
                    color: formData.type === t.id ? t.color : 'var(--color-text-muted)',
                    fontWeight: formData.type === t.id ? 700 : 500, transition: 'all 0.2s'
                  }}
                >
                  {t.icon}
                  <span style={{ fontSize: '0.8125rem' }}>{t.label}</span>
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Tiêu đề <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input 
                className="form-input" 
                placeholder="VD: Gọi điện chốt sale, Họp demo..." 
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> Thời gian thực hiện
                </label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ width: 140 }}>
                <label className="form-label">Mức độ</label>
                <CustomSelect 
                  options={[
                    { value: 'low', label: 'Thấp' },
                    { value: 'medium', label: 'Bình thường' },
                    { value: 'high', label: 'Cao' }
                  ]}
                  value={formData.priority}
                  onChange={val => setFormData({ ...formData, priority: val as string })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlignLeft size={14} /> Ghi chú / Chi tiết
              </label>
              <textarea 
                className="form-input" 
                rows={3} 
                placeholder="Nội dung hoạt động..."
                value={formData.body}
                onChange={e => setFormData({ ...formData, body: e.target.value })}
              />
            </div>

            {/* Automation Trigger Toggle */}
            <div 
              style={{
                background: 'linear-gradient(to right, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05))',
                border: '1px solid var(--color-primary-light)', borderRadius: 'var(--radius-lg)',
                padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer'
              }}
              onClick={() => setFormData({ ...formData, auto_trigger: !formData.auto_trigger })}
            >
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Zap size={16} /> Tích hợp Automation
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Tự động gửi email Follow-up hoặc Cập nhật Deal nếu đáp ứng điều kiện Workflow.
                </p>
              </div>
              <div className={`custom-toggle ${formData.auto_trigger ? 'active' : ''}`} style={{ zoom: 1.2 }}></div>
            </div>

            <div className="modal-footer" style={{ padding: 0, paddingTop: '1rem', border: 'none', background: 'transparent' }}>
              <button type="button" className="btn outline" onClick={onClose} disabled={loading}>Hủy</button>
              <button type="submit" className="btn primary" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu hoạt động'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
