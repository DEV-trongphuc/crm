import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Clock, AlertCircle, User, Paperclip, Send, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useUIStore } from '../store/uiStore';
import styles from './EntityDrawer.module.css'; // Reuse existing styles

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ticket: any;
  onUpdate?: (data: any) => void;
}

const TICKET_STATUSES = [
  { id: 'open', label: 'Mới mở', color: '#3b82f6' },
  { id: 'in_progress', label: 'Đang xử lý', color: '#f59e0b' },
  { id: 'waiting', label: 'Chờ phản hồi', color: '#8b5cf6' },
  { id: 'resolved', label: 'Đã giải quyết', color: '#10b981' },
  { id: 'closed', label: 'Đã đóng', color: '#6b7280' },
];

const PRIORITIES = [
  { id: 'low', label: 'Thấp', color: '#10b981' },
  { id: 'medium', label: 'Trung bình', color: '#3b82f6' },
  { id: 'high', label: 'Cao', color: '#f59e0b' },
  { id: 'urgent', label: 'Khẩn cấp', color: '#ef4444' },
];

export const TicketDrawer: React.FC<Props> = ({ isOpen, onClose, ticket, onUpdate }) => {
  const { addToast } = useUIStore();
  const [formData, setFormData] = useState<any>({});
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  useEffect(() => {
    if (ticket) {
      setFormData(ticket);
      // Mock comments
      setComments([
        { id: 1, user: 'Hệ thống', text: 'Ticket được tạo từ form', time: ticket.created_at },
        { id: 3, user: 'Admin Support', text: 'Đã tiếp nhận yêu cầu, đang kiểm tra kỹ thuật.', time: new Date(Date.now() - 3600000).toISOString() }
      ]);
    }
  }, [ticket]);

  if (!ticket) return null;

  const handleSend = () => {
    if (!newComment.trim()) return;
    setComments([...comments, {
      id: Date.now(),
      user: formData.assignee_name || 'Admin Support',
      text: newComment,
      time: new Date().toISOString()
    }]);
    setNewComment('');
    addToast('Đã thêm ghi chú', 'success');
  };

  const handleStatusChange = (newStatus: string) => {
    const oldStatus = formData.status;
    setFormData({ ...formData, status: newStatus });
    onUpdate?.({ ...formData, status: newStatus });
    
    addToast('Đã cập nhật trạng thái', 'success', {
      label: 'Undo',
      onClick: () => {
        setFormData({ ...formData, status: oldStatus });
        onUpdate?.({ ...formData, status: oldStatus });
      }
    });
  };

  return (
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
                <div className="avatar-placeholder lg" style={{ background: PRIORITIES.find(p => p.id === formData.priority)?.color || 'var(--color-primary)' }}>
                  <AlertCircle size={24} color="white" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-light)' }}>#{formData.id}</span>
                    <span className="badge" style={{ background: PRIORITIES.find(p => p.id === formData.priority)?.color + '20', color: PRIORITIES.find(p => p.id === formData.priority)?.color }}>
                      {PRIORITIES.find(p => p.id === formData.priority)?.label}
                    </span>
                  </div>
                  <h2 className={styles.title} style={{ fontSize: '1.25rem' }}>{formData.subject}</h2>
                  <p className={styles.subtitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <User size={14} /> {formData.customer_name} • Mở lúc: {new Date(formData.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <div className={styles.headerActions}>
                <div style={{ width: 140 }}>
                  <CustomSelect 
                    options={TICKET_STATUSES.map(s => ({ value: s.id, label: s.label }))} 
                    value={formData.status} 
                    onChange={val => handleStatusChange(val.toString())} 
                  />
                </div>
                <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
              </div>
            </div>

            {/* ── Content Split ── */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#fcfcfd' }}>
              
              {/* Left: Activity Thread */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)' }}>
                <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {comments.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', gap: '1rem', flexDirection: 'row' }}>
                      <Avatar name={msg.user} size={32} />
                      <div style={{ maxWidth: '85%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>{msg.user}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{new Date(msg.time).toLocaleString('vi-VN')}</span>
                        </div>
                        <div style={{ 
                          padding: '0.875rem 1.25rem', 
                          borderRadius: '16px', 
                          background: 'white',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text)',
                          fontSize: '0.9375rem', lineHeight: 1.5,
                          borderTopLeftRadius: '4px'
                        }}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Box */}
                <div style={{ padding: '1.5rem', background: 'white', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ position: 'relative' }}>
                    <textarea 
                      className="form-input" 
                      placeholder="Thêm ghi chú, cập nhật tiến độ xử lý..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      style={{ minHeight: '100px', paddingBottom: '3rem', resize: 'none' }}
                    />
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                      <button className="btn-icon sm"><Paperclip size={16} /></button>
                    </div>
                    <button 
                      className="btn primary sm"
                      style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={handleSend}
                    >
                      <CheckCircle2 size={14} /> Cập nhật
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Info Panel */}
              <div style={{ width: '320px', background: 'white', padding: '1.5rem', overflow: 'auto' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: '1rem' }}>Thông tin Ticket</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Người phụ trách</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Avatar name={formData.assignee_name} size={24} />
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formData.assignee_name || 'Admin'}</span>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Thời hạn (SLA)</p>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> {new Date(formData.due_date).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>

                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: '1rem' }}>Thông tin khách hàng</h4>
                <div className="card" style={{ padding: '1rem', background: 'var(--color-bg)', border: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
                    <Avatar name={formData.customer_name} size={40} />
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formData.customer_name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Khách hàng VIP</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                    <p><strong style={{ color: 'var(--color-text-light)' }}>SĐT:</strong> 0901234567</p>
                    <p><strong style={{ color: 'var(--color-text-light)' }}>Email:</strong> contact@company.com</p>
                    <p><strong style={{ color: 'var(--color-text-light)' }}>Đã chi:</strong> <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>45.000.000 đ</span></p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
