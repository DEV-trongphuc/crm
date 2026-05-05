import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, FileText, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string; // "Liên hệ", "Công ty"
  onImport?: (data: any[]) => void;
  onExport?: (format: 'csv'|'excel') => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose, entityName, onImport, onExport }) => {
  const { addToast } = useUIStore();
  const [tab, setTab] = useState<'import' | 'export'>('import');
  
  // Import states
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [step, setStep] = useState<1 | 2>(1); // 1: Upload, 2: Deduplication Mapping
  const [dedupeAction, setDedupeAction] = useState<'skip' | 'overwrite' | 'duplicate'>('skip');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    
    // Simulate parsing and finding duplicates
    setTimeout(() => {
      setPreview([
        { id: 1, name: 'Nguyễn Văn A', email: 'a@example.com', phone: '0901234567' },
        { id: 2, name: 'Trần B', email: 'b@example.com', phone: '0987654321' },
      ]);
      setDuplicates([
        { id: 3, name: 'Lê C (Đã tồn tại)', email: 'c@example.com', conflictField: 'Email' }
      ]);
      setStep(2);
      addToast('Phân tích file thành công', 'success');
    }, 600);
  };

  const executeImport = () => {
    addToast(`Đã import thành công ${preview.length} bản ghi. (Hành động trùng lặp: ${dedupeAction})`, 'success');
    if (onImport) onImport(preview);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="overlay-backdrop" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
        <motion.div 
          style={{ width: '100%', maxWidth: 600, background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-2xl)' }}
          initial={{ opacity: 0, y: 20, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
            <button 
              style={{ flex: 1, padding: '1.25rem', background: tab === 'import' ? 'var(--color-bg)' : 'transparent', borderBottom: tab === 'import' ? '2px solid var(--color-primary)' : '2px solid transparent', fontWeight: 600, color: tab === 'import' ? 'var(--color-primary)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={() => { setTab('import'); setStep(1); setFile(null); }}
            >
              <Upload size={18} /> Nhập (Import)
            </button>
            <button 
              style={{ flex: 1, padding: '1.25rem', background: tab === 'export' ? 'var(--color-bg)' : 'transparent', borderBottom: tab === 'export' ? '2px solid var(--color-primary)' : '2px solid transparent', fontWeight: 600, color: tab === 'export' ? 'var(--color-primary)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={() => setTab('export')}
            >
              <Download size={18} /> Xuất (Export)
            </button>
            <button className="btn-icon-bare" style={{ position: 'absolute', top: '1rem', right: '1rem' }} onClick={onClose}><X size={20}/></button>
          </div>
          
          {tab === 'import' && (
            <div style={{ padding: '1.5rem' }}>
              {step === 1 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Nhập {entityName} từ file</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Hỗ trợ định dạng .csv, .xlsx. Vui lòng sử dụng file mẫu để tránh lỗi.</p>
                    </div>
                    <button className="btn outline sm" onClick={() => addToast('Đang tải file mẫu...', 'success')}><FileText size={14}/> Tải file mẫu</button>
                  </div>
                  
                  <div style={{ border: '2px dashed var(--color-primary-light)', borderRadius: 'var(--radius-xl)', padding: '3rem 2rem', textAlign: 'center', background: 'var(--color-bg)', cursor: 'pointer', position: 'relative' }}>
                    <input type="file" accept=".csv, .xlsx" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    <Upload size={40} color="var(--color-primary)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Kéo thả file hoặc Click để tải lên</h4>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Dung lượng tối đa: 10MB</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Xác nhận & Xử lý trùng lặp</h3>
                    <span className="badge success">{preview.length} bản ghi mới</span>
                  </div>
                  
                  {duplicates.length > 0 && (
                    <div style={{ padding: '1rem', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontWeight: 700, marginBottom: '0.75rem' }}>
                        <AlertTriangle size={18} /> Phát hiện {duplicates.length} bản ghi trùng lặp
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                          <input type="radio" name="dedupe" checked={dedupeAction === 'skip'} onChange={() => setDedupeAction('skip')} style={{ width: 16, height: 16, accentColor: 'var(--color-warning)' }} />
                          <div><span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Bỏ qua</span> <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>(Giữ lại dữ liệu cũ trên hệ thống)</span></div>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                          <input type="radio" name="dedupe" checked={dedupeAction === 'overwrite'} onChange={() => setDedupeAction('overwrite')} style={{ width: 16, height: 16, accentColor: 'var(--color-warning)' }} />
                          <div><span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Cập nhật (Ghi đè)</span> <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>(Cập nhật dữ liệu từ file mới tải lên)</span></div>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                          <input type="radio" name="dedupe" checked={dedupeAction === 'duplicate'} onChange={() => setDedupeAction('duplicate')} style={{ width: 16, height: 16, accentColor: 'var(--color-warning)' }} />
                          <div><span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Tạo bản ghi mới</span> <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>(Chấp nhận trùng lặp dữ liệu)</span></div>
                        </label>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--color-border-light)' }}>
                    <button className="btn outline" onClick={() => setStep(1)}>Hủy tải lên</button>
                    <button className="btn primary" onClick={executeImport}>
                      <CheckCircle size={16} /> Bắt đầu Import
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'export' && (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Xuất {entityName}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Tải xuống dữ liệu hiện tại để sao lưu hoặc phân tích.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button 
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 1rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  onClick={() => { addToast('Đang tải xuống tệp CSV...', 'success'); if(onExport) onExport('csv'); onClose(); }}
                >
                  <FileText size={40} color="var(--color-primary)" />
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>Xuất file CSV</span>
                </button>
                <button 
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 1rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  onClick={() => { addToast('Đang tải xuống tệp Excel...', 'success'); if(onExport) onExport('excel'); onClose(); }}
                >
                  <FileText size={40} color="#10b981" />
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>Xuất file Excel</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
