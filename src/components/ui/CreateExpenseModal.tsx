import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, Users, Briefcase, FileText } from 'lucide-react';
import api from '../../api/axios';
import { useUIStore } from '../../store/uiStore';
import { CustomSelect } from './CustomSelect';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialEntity?: { type: 'contact' | 'company' | 'deal'; id: number; name: string };
  onSuccess?: () => void;
}

export const CreateExpenseModal: React.FC<Props> = ({ isOpen, onClose, initialEntity, onSuccess }) => {
  const { addToast } = useUIStore();
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().substring(0, 10),
    category: 'Ăn uống',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  
  // Entities selection
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        amount: '',
        date: new Date().toISOString().substring(0, 10),
        category: 'Ăn uống',
        notes: '',
      });
      if (initialEntity && initialEntity.type === 'contact') {
        setSelectedContacts([{ id: initialEntity.id, name: initialEntity.name }]);
      } else {
        setSelectedContacts([]);
      }
      
      // Fetch contacts for dropdown
      api.get('/contacts').then(res => {
        setContacts(res.data.data?.items || []);
      }).catch(err => console.error(err));
    }
  }, [isOpen, initialEntity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      addToast('Vui lòng nhập tiêu đề và số tiền', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const amountNum = parseFloat(formData.amount.replace(/,/g, ''));
      
      let entities: any[] = [];
      if (selectedContacts.length > 0) {
        // Split amount evenly
        const splitAmount = amountNum / selectedContacts.length;
        entities = selectedContacts.map(c => ({
          entity_type: 'contact',
          entity_id: c.id,
          amount: splitAmount
        }));
      } else if (initialEntity) {
        entities = [{
          entity_type: initialEntity.type,
          entity_id: initialEntity.id,
          amount: amountNum
        }];
      }

      await api.post('/expenses', {
        title: formData.title,
        amount: amountNum,
        date: formData.date,
        category: formData.category,
        notes: formData.notes,
        entities: entities
      });
      
      addToast('Đã tạo chi phí thành công', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Lỗi khi tạo chi phí', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{
            position: 'relative', width: '100%', maxWidth: '500px', background: 'var(--color-surface)',
            borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
          }}
        >
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign className="text-primary" /> Nhập chi phí mới
            </h3>
            <button className="btn-icon sm" onClick={onClose}><X size={20} /></button>
          </div>

          <div style={{ padding: '1.5rem', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Nội dung chi *</label>
                <input 
                  className="form-input" 
                  placeholder="VD: Mời khách ăn trưa..." 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Số tiền (VNĐ) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="0" 
                    value={formData.amount} 
                    onChange={e => setFormData({ ...formData, amount: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="form-label">Ngày chi</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formData.date} 
                    onChange={e => setFormData({ ...formData, date: e.target.value })} 
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Danh mục</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['Ăn uống', 'Di chuyển', 'Vận hành', 'Quà tặng', 'Khác'].map(cat => (
                    <span 
                      key={cat} 
                      onClick={() => setFormData({ ...formData, category: cat })}
                      style={{ 
                        padding: '6px 12px', borderRadius: '20px', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600,
                        background: formData.category === cat ? 'var(--color-primary)' : 'var(--color-bg)',
                        color: formData.category === cat ? '#fff' : 'var(--color-text)'
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Áp dụng cho (Chia đều tiền bill)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  {selectedContacts.map(c => (
                    <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 600 }}>
                      {c.name}
                      <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSelectedContacts(prev => prev.filter(x => x.id !== c.id))} />
                    </span>
                  ))}
                </div>
                <CustomSelect
                  options={contacts.filter(c => !selectedContacts.find(sc => sc.id === c.id)).map(c => ({ value: String(c.id), label: `${c.first_name} ${c.last_name || ''}`.trim() }))}
                  value=""
                  onChange={(val) => {
                    const found = contacts.find(c => String(c.id) === val);
                    if (found) {
                      setSelectedContacts(prev => [...prev, { id: found.id, name: `${found.first_name} ${found.last_name || ''}`.trim() }]);
                    }
                  }}
                  placeholder="+ Thêm khách hàng..."
                />
              </div>

              <div>
                <label className="form-label">Ghi chú chi tiết</label>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  placeholder="Mô tả thêm nếu cần..." 
                  value={formData.notes} 
                  onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                />
              </div>
            </div>
          </div>

          <div style={{ padding: '1.25rem 1.5rem', background: 'var(--color-bg)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--color-border-light)' }}>
            <button className="btn outline" onClick={onClose}>Hủy</button>
            <button className="btn primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Đang lưu...' : 'Gửi phê duyệt'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
