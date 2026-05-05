import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, FileText, FileBadge, Tag as TagIcon, Phone, Mail, MapPin, Search, History, Briefcase, Plus, HelpCircle, Settings, Download, Trash2, CheckCircle, ShoppingCart } from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';
import { AddressSelect } from '../components/ui/AddressSelect';
import { EmptyCard } from '../components/ui/EmptyCard';
import { useUIStore } from '../store/uiStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './EntityDrawer.module.css';

interface EntityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entity: any;
  onSave: (data: any) => void;
}

const TABS = [
  { id: 'info', label: 'Thông tin chung', icon: <User size={16} /> },
  { id: 'activities', label: 'Lịch sử & Ghi chú', icon: <History size={16} /> },
  { id: 'docs', label: 'Hồ sơ & Tài liệu', icon: <FileBadge size={16} /> },
  { id: 'invoices', label: 'Hóa đơn & Thanh toán', icon: <FileText size={16} /> },
  { id: 'settings', label: 'Thiết lập & Cổng TT', icon: <Settings size={16} /> },
  { id: 'tags', label: 'Tags & Custom', icon: <TagIcon size={16} /> },
];

export const EntityDrawer: React.FC<EntityDrawerProps> = ({ isOpen, onClose, entity, onSave }) => {
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState(entity || {});
  const [helpModal, setHelpModal] = useState<{title: string, content: string} | null>(null);
  
  // Billing States
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    product: '', terms: 'one-time', discount: 0, months: 3, incurred_costs: [{ name: '', amount: 0 }]
  });
  
  // Update state when entity prop changes
  useEffect(() => {
    if (entity) setFormData(entity);
  }, [entity]);

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
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerProfile}>
                <div className="avatar-placeholder lg" style={{ background: '#7c3aed', fontSize: '1.25rem', width: 56, height: 56 }}>
                  {formData?.first_name?.[0]}{formData?.last_name?.[0]}
                </div>
                <div>
                  <h2 className={styles.title}>{formData?.first_name} {formData?.last_name}</h2>
                  <p className={styles.subtitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={14} /> {formData?.job_title || 'Chưa cập nhật chức vụ'} tại {formData?.company_name || 'Chưa cập nhật công ty'}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} /> {formData?.phone || 'Chưa có SĐT'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={12} /> {formData?.email || 'Chưa có Email'}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.headerActions}>
                <span className={`badge ${formData?.status === 'customer' ? 'success' : 'warning'}`}>
                  {formData?.status === 'customer' ? 'Khách hàng' : 'Tiềm năng'}
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

            {/* Layout Split: Left Sidebar & Content */}
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
              </div>

              {/* Content Area */}
              <div className={styles.contentArea}>
                {activeTab === 'info' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Quick Stats Dashboard inside Modal */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <div className="card-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                        <span className="text-xs text-light" style={{ fontWeight: 600 }}>TỔNG DOANH THU</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>145.5M</span>
                        <span className="text-xs text-light mt-1"><span style={{ color: 'var(--color-success)' }}>+12%</span> so với năm trước</span>
                      </div>
                      <div className="card-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                        <span className="text-xs text-light" style={{ fontWeight: 600 }}>TỈ LỆ CHỐT (WIN RATE)</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.25rem' }}>68%</span>
                        <span className="text-xs text-light mt-1">Đã chốt 4/6 Deals</span>
                      </div>
                      <div className="card-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', borderLeft: '3px solid var(--color-danger)' }}>
                        <span className="text-xs text-light" style={{ fontWeight: 600 }}>CHI PHÍ PHÁT SINH</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)', marginTop: '0.25rem' }}>1.2M</span>
                        <span className="text-xs text-light mt-1">Ăn uống, Xăng xe, Tiếp khách</span>
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
                            <input className="form-input" placeholder="Họ" value={formData?.first_name || ''} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                            <input className="form-input" placeholder="Tên" value={formData?.last_name || ''} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Email</label>
                          <input className="form-input" type="email" placeholder="ví dụ: email@congty.com" value={formData?.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Số điện thoại chính</label>
                          <input className="form-input" type="tel" placeholder="09xx xxx xxx" value={formData?.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Ngày sinh</label>
                          <input className="form-input" type="date" value={formData?.birthday || ''} onChange={e => setFormData({...formData, birthday: e.target.value})} />
                        </div>
                      </div>
                      
                      <div style={{ borderTop: '1px solid var(--color-border-light)', margin: '1.25rem 0', paddingTop: '1.25rem' }}></div>
                      
                      <div className="grid grid-2">
                        <div className="form-group">
                          <label className="form-label">Công ty / Tổ chức</label>
                          <input className="form-input" placeholder="Tên công ty" value={formData?.company_name || ''} onChange={e => setFormData({...formData, company_name: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Chức vụ</label>
                          <input className="form-input" placeholder="Ví dụ: Giám đốc, Kế toán trưởng..." value={formData?.job_title || ''} onChange={e => setFormData({...formData, job_title: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="card-panel">
                      <h4 className="panel-title">Phân loại & Trạng thái Sales</h4>
                      <div className="grid grid-2">
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Trạng thái Khách hàng
                            <button className="btn-icon-bare" onClick={() => setHelpModal({ title: 'Trạng thái Khách hàng', content: 'Phân loại vòng đời của khách hàng trong hệ thống CRM.\n\n- Lead mới: Những người vừa để lại thông tin nhưng chưa được liên hệ.\n- Đủ điều kiện (Qualified): Những khách hàng đã được lọc và đánh giá là có tiềm năng mua hàng thật sự.\n- Đã mua hàng (Customer): Khách hàng đã chốt sale thành công.\n- Đã rời bỏ (Churned): Khách hàng không còn sử dụng dịch vụ hoặc không thể tiếp cận.' })}><HelpCircle size={14} color="var(--color-text-muted)" /></button>
                          </label>
                          <CustomSelect 
                            options={[
                              { value: 'lead', label: 'Lead mới (Tiềm năng)' },
                              { value: 'qualified', label: 'Đủ điều kiện (Qualified)' },
                              { value: 'customer', label: 'Đã mua hàng (Customer)' },
                              { value: 'churned', label: 'Đã rời bỏ (Churned)' }
                            ]}
                            value={formData?.status || 'lead'}
                            onChange={val => setFormData({...formData, status: val as string})}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Nguồn khách (Source)</label>
                          <CustomSelect 
                            options={[
                              { value: 'website', label: 'Từ Website' },
                              { value: 'facebook', label: 'Facebook Ads' },
                              { value: 'referral', label: 'Giới thiệu' },
                              { value: 'cold_call', label: 'Cold Call' }
                            ]}
                            value={formData?.source || 'website'}
                            onChange={val => setFormData({...formData, source: val as string})}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Dự kiến doanh thu
                            <button className="btn-icon-bare" onClick={() => setHelpModal({ title: 'Dự kiến doanh thu', content: 'Ước tính số tiền mà Deal này có thể mang lại nếu chốt thành công.\n\nChỉ số này sẽ được tổng hợp tự động lên Bảng điều khiển (Dashboard) của Giám đốc để dự báo dòng tiền trong tương lai của doanh nghiệp.' })}><HelpCircle size={14} color="var(--color-text-muted)" /></button>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input className="form-input" type="number" placeholder="0" style={{ paddingRight: '40px' }} value={formData?.expected_revenue || ''} onChange={e => setFormData({...formData, expected_revenue: e.target.value})} />
                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>VNĐ</span>
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Xác suất chốt (%)
                            <button className="btn-icon-bare" onClick={() => setHelpModal({ title: 'Xác suất chốt (Win Probability)', content: 'Đánh giá khả năng chốt sale thành công (từ 0% đến 100%).\n\nVí dụ:\n- 20%: Khách hàng mới quan tâm sơ bộ.\n- 50%: Khách hàng đang xem xét báo giá.\n- 80%: Khách hàng đã chốt mồm, đang chờ ký hợp đồng.\n\nXác suất này kết hợp với Dự kiến doanh thu để tính ra Giá trị trọng số (Weighted Value).' })}><HelpCircle size={14} color="var(--color-text-muted)" /></button>
                          </label>
                          <input className="form-input" type="number" min="0" max="100" placeholder="50" value={formData?.win_probability || ''} onChange={e => setFormData({...formData, win_probability: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="card-panel">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="panel-title" style={{ margin: 0 }}>Các trường tùy chỉnh (Custom Fields)</h4>
                        <button className="btn outline sm" onClick={() => addToast('Đang mở form tạo trường tùy chỉnh...', 'info')}><Plus size={14} /> Thêm trường</button>
                      </div>
                      <div className="grid grid-2">
                        <div className="form-group">
                          <label className="form-label" style={{ color: 'var(--color-primary)' }}>Mã số thuế</label>
                          <input className="form-input" placeholder="Nhập MST..." />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ color: 'var(--color-primary)' }}>Ngành nghề kinh doanh</label>
                          <input className="form-input" placeholder="Ví dụ: Bán lẻ, Sản xuất..." />
                        </div>
                      </div>
                    </div>

                    <div className="card-panel">
                      <h4 className="panel-title">Địa chỉ (Tự động từ JSON)</h4>
                      <AddressSelect 
                        city={formData?.city || ''}
                        ward={formData?.ward || ''}
                        onCityChange={city => setFormData({...formData, city})}
                        onWardChange={ward => setFormData({...formData, ward})}
                      />
                      <div className="form-group" style={{ marginTop: '0.75rem' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Địa chỉ chi tiết</label>
                        <input className="form-input" placeholder="Số nhà, đường..." value={formData?.address_detail || ''} onChange={e => setFormData({...formData, address_detail: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'activities' && (
                  <div className="animate-fade">
                    <div className="card-panel" style={{ marginBottom: '1.5rem', background: 'var(--color-bg)' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                        <button 
                          className={`btn ${formData?.has_called ? 'success' : 'outline'}`} 
                          onClick={() => setFormData({...formData, has_called: !formData?.has_called})}
                          style={{ flex: 1, padding: '0.75rem', fontWeight: 600, border: formData?.has_called ? 'none' : '1px solid var(--color-border)' }}
                        >
                          <Phone size={16} /> 
                          {formData?.has_called ? 'Đã liên hệ qua điện thoại' : 'Đánh dấu là đã gọi'}
                        </button>
                        <button className="btn outline" style={{ flex: 1, padding: '0.75rem', fontWeight: 600, border: '1px solid var(--color-border)' }}>
                          <Mail size={16} /> Gửi Email
                        </button>
                      </div>
                      
                      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                        <textarea 
                          className="form-textarea" 
                          rows={3} 
                          placeholder="Thêm ghi chú, lịch hẹn hoặc diễn biến cuộc gọi..."
                          style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '0.5rem', resize: 'none' }}
                        ></textarea>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 0.5rem 0.5rem' }}>
                          <button className="btn primary sm" style={{ borderRadius: '6px' }} onClick={() => addToast('Đã lưu ghi chú thành công!', 'success')}>Lưu Ghi Chú</button>
                        </div>
                      </div>
                    </div>
                    
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '1rem', paddingLeft: '0.5rem' }}>Nhật ký hoạt động</h4>
                    <div className="timeline">
                      {formData?.has_called && (
                        <div className="timeline-item">
                          <div className="timeline-icon" style={{ background: 'var(--color-success)' }}><Phone size={14} color="#fff" /></div>
                          <div className="timeline-content">
                            <p><strong>Bạn</strong> đã đánh dấu liên hệ qua điện thoại.</p>
                            <span className="text-xs text-muted">Vừa xong</span>
                          </div>
                        </div>
                      )}
                      <div className="timeline-item">
                        <div className="timeline-icon bg-primary"><History size={14} color="#fff" /></div>
                        <div className="timeline-content">
                          <p><strong>Bạn</strong> đã tạo hồ sơ khách hàng này.</p>
                          <span className="text-xs text-muted">Hôm qua lúc 14:30</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'docs' && (
                  <div className="animate-fade">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <div>
                        <h4 className="panel-title" style={{ margin: 0 }}>Kho lưu trữ tài liệu</h4>
                        <p className="text-sm text-light mt-1">Lưu trữ CCCD, Hợp đồng, File scan liên quan.</p>
                      </div>
                      <button className="btn primary sm" onClick={() => addToast('Vui lòng chọn tệp từ máy tính của bạn...', 'info')}><Plus size={14}/> Tải lên tệp</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="card-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                        <div style={{ width: 44, height: 44, background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileBadge size={22} /></div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>CCCD_MatTruoc_KH.jpg</h4>
                          <p className="text-xs text-light mt-1">Tải lên hôm qua bởi Admin • 2.4 MB</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn outline sm" title="Tải xuống"><Download size={14} /></button>
                          <button className="btn outline sm" title="Xóa" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger-light)' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div className="card-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                        <div style={{ width: 44, height: 44, background: 'var(--color-info-light)', color: 'var(--color-info)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={22} /></div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>HopDong_DichVu_Thang5.pdf</h4>
                          <p className="text-xs text-light mt-1">Tải lên 3 ngày trước bởi Sales • 1.1 MB</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn outline sm" title="Tải xuống" onClick={() => addToast('Đang tải xuống HopDong_DichVu_Thang5.pdf...', 'success')}><Download size={14} /></button>
                          <button className="btn outline sm" title="Xóa" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger-light)' }} onClick={() => addToast('Đã xóa tệp HopDong_DichVu_Thang5.pdf', 'info')}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'invoices' && (
                  <div className="animate-fade">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h4 className="panel-title" style={{ margin: 0 }}>Lịch sử Giao dịch</h4>
                      {!showInvoiceForm && (
                        <button className="btn primary sm" onClick={() => setShowInvoiceForm(true)}>
                          <Plus size={14}/> Tạo Hóa đơn
                        </button>
                      )}
                    </div>
                    
                    {showInvoiceForm ? (
                      <div className="card-panel" style={{ animation: 'fadeIn 0.3s' }}>
                        <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>Thêm Hóa Đơn Mới</h4>
                        
                        <div className="grid grid-2" style={{ gap: '1.5rem' }}>
                          {/* Cột trái: Thông tin sản phẩm & Thanh toán */}
                          <div>
                            <div className="form-group mb-4">
                              <label className="form-label">Sản phẩm / Dịch vụ</label>
                              <CustomSelect 
                                options={[
                                  { value: 'crm-pro', label: 'Phần mềm CRM Pro (15.000.000đ)' },
                                  { value: 'consult', label: 'Dịch vụ Tư vấn Triển khai (8.000.000đ)' }
                                ]}
                                value={invoiceForm.product}
                                onChange={v => setInvoiceForm({...invoiceForm, product: String(v)})}
                              />
                            </div>
                            
                            <div className="form-group mb-4">
                              <label className="form-label">Hình thức thanh toán</label>
                              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                  <input type="radio" name="terms" checked={invoiceForm.terms === 'one-time'} onChange={() => setInvoiceForm({...invoiceForm, terms: 'one-time'})} />
                                  <span style={{ fontSize: '0.9rem' }}>Thanh toán 1 lần</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                  <input type="radio" name="terms" checked={invoiceForm.terms === 'installment'} onChange={() => setInvoiceForm({...invoiceForm, terms: 'installment'})} />
                                  <span style={{ fontSize: '0.9rem' }}>Trả góp</span>
                                </label>
                              </div>
                            </div>

                            {invoiceForm.terms === 'installment' && (
                              <div className="form-group mb-4">
                                <label className="form-label">Số kỳ hạn (Tháng)</label>
                                <input type="number" className="form-input" min={2} max={12} value={invoiceForm.months} onChange={e => setInvoiceForm({...invoiceForm, months: Number(e.target.value)})} />
                              </div>
                            )}

                            <div className="form-group mb-4">
                              <label className="form-label">Chiết khấu / Giảm giá (VNĐ)</label>
                              <input type="number" className="form-input" placeholder="Nhập số tiền giảm" value={invoiceForm.discount} onChange={e => setInvoiceForm({...invoiceForm, discount: Number(e.target.value)})} />
                            </div>
                          </div>
                          
                          {/* Cột phải: Chi phí phát sinh (Incurred Costs) */}
                          <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '8px' }}>
                            <h5 style={{ fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}><History size={16} color="var(--color-danger)" /> Chi phí phát sinh (Incurred Costs)</h5>
                            <p className="text-xs text-light mb-3">Ghi nhận các chi phí ngoại tuyến như tiền xăng xe, cà phê, đi nhậu gặp khách hàng để trừ vào Lợi nhuận gộp.</p>
                            
                            {invoiceForm.incurred_costs.map((cost, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input className="form-input sm" style={{ flex: 1 }} placeholder="Tên chi phí (VD: Ăn uống)" value={cost.name} onChange={e => {
                                  const newCosts = [...invoiceForm.incurred_costs];
                                  newCosts[idx].name = e.target.value;
                                  setInvoiceForm({...invoiceForm, incurred_costs: newCosts});
                                }} />
                                <input className="form-input sm" type="number" style={{ width: '120px' }} placeholder="Số tiền" value={cost.amount || ''} onChange={e => {
                                  const newCosts = [...invoiceForm.incurred_costs];
                                  newCosts[idx].amount = Number(e.target.value);
                                  setInvoiceForm({...invoiceForm, incurred_costs: newCosts});
                                }} />
                              </div>
                            ))}
                            
                            <button className="btn outline sm" style={{ width: '100%', marginTop: '0.5rem', borderStyle: 'dashed' }} onClick={() => setInvoiceForm({...invoiceForm, incurred_costs: [...invoiceForm.incurred_costs, {name: '', amount: 0}]})}>
                              <Plus size={14} /> Thêm chi phí
                            </button>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-light)' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tổng chi phí:</span>
                              <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{invoiceForm.incurred_costs.reduce((sum, item) => sum + item.amount, 0).toLocaleString('vi-VN')} đ</span>
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                          <button className="btn secondary" onClick={() => setShowInvoiceForm(false)}>Hủy</button>
                          <button className="btn primary" onClick={() => {
                            addToast('Đã tạo Hóa đơn và ghi nhận chi phí phát sinh!', 'success');
                            setShowInvoiceForm(false);
                          }}>Lưu Hóa đơn</button>
                        </div>
                      </div>
                    ) : (
                      <div className="card-panel">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h4 className="text-lg font-bold">Lịch sử Giao dịch</h4>
                            <p className="text-sm text-light">Tổng chi tiêu: <span className="font-bold text-primary">{(formData.total_spent || 0).toLocaleString()}đ</span></p>
                          </div>
                          <button className="btn primary sm" onClick={() => useUIStore.getState().setShowPOS(formData)}>
                            <Plus size={14} /> Tạo đơn hàng mới
                          </button>
                        </div>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <th style={{ padding: '0.75rem 0', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>MÃ HÓA ĐƠN</th>
                              <th style={{ padding: '0.75rem 0', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>SỐ TIỀN</th>
                              <th style={{ padding: '0.75rem 0', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>TRẠNG THÁI</th>
                              <th style={{ padding: '0.75rem 0', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>NGÀY LẬP</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                              <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--color-primary)' }}>INV-2026-001</td>
                              <td style={{ padding: '1rem 0', fontWeight: 600 }}>15.000.000 đ</td>
                              <td style={{ padding: '1rem 0' }}><span className="badge success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12}/> Đã thanh toán</span></td>
                              <td style={{ padding: '1rem 0', textAlign: 'right', fontSize: '0.85rem' }}>10/04/2026</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--color-primary)' }}>INV-2026-042</td>
                              <td style={{ padding: '1rem 0', fontWeight: 600 }}>45.500.000 đ</td>
                              <td style={{ padding: '1rem 0' }}><span className="badge warning">Chờ thanh toán</span></td>
                              <td style={{ padding: '1rem 0', textAlign: 'right', fontSize: '0.85rem' }}>02/05/2026</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="animate-fade">
                    <div className="card-panel mb-4">
                      <h4 className="panel-title">Quyền truy cập Cổng thông tin (Client Portal)</h4>
                      <p className="text-sm text-light mb-4">Cấp quyền cho khách hàng đăng nhập vào hệ thống để xem tiến độ dự án, tài liệu và hóa đơn.</p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border-light)' }}>
                        <div>
                          <h5 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Cho phép đăng nhập Portal</h5>
                          <p className="text-xs text-light mt-1">Hệ thống sẽ gửi email chứa tài khoản và mật khẩu tạm thời.</p>
                        </div>
                        <button 
                          className={`btn ${formData?.portal_access ? 'primary' : 'outline'}`} 
                          onClick={() => setFormData({...formData, portal_access: !formData?.portal_access})}
                        >
                          {formData?.portal_access ? 'Đã Cấp quyền' : 'Chưa Cấp quyền'}
                        </button>
                      </div>
                    </div>

                    <div className="card-panel">
                      <h4 className="panel-title">Tùy chọn Marketing & CSKH</h4>
                      <p className="text-sm text-light mb-4">Cấu hình luồng chăm sóc tự động (Automation) cho liên hệ này.</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', border: '1px solid var(--color-border-light)', borderRadius: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                          <span style={{ fontWeight: 500 }}>Nhận Email Khuyến mãi / Bản tin</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', border: '1px solid var(--color-border-light)', borderRadius: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                          <span style={{ fontWeight: 500 }}>Nhắn tin SMS tự động chúc mừng sinh nhật</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', border: '1px solid var(--color-border-light)', borderRadius: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                          <span style={{ fontWeight: 500 }}>Cho phép Telesale gọi điện CSKH định kỳ</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'tags' && (
                  <div className="animate-fade">
                    <div className="card-panel">
                      <p className="text-sm text-light mb-4">Quản lý các trường thông tin tùy chỉnh và phân loại khách hàng theo Tag.</p>
                      <div className="form-group mb-4">
                        <label className="form-label">Thêm Tag phân loại</label>
                        <CustomSelect 
                          options={[
                            { value: 'vip', label: 'VIP' },
                            { value: 'wholesale', label: 'Sỉ' },
                            { value: 'retail', label: 'Lẻ' },
                          ]}
                          value={null}
                          onChange={() => {}}
                          placeholder="Chọn hoặc nhập tag mới..."
                          searchable
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <button className="btn ghost" onClick={onClose}>Hủy bỏ</button>
              <button className="btn primary" onClick={() => onSave(formData)}>Lưu thay đổi</button>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {helpModal && (
          <>
            <motion.div 
              className="overlay-backdrop" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setHelpModal(null)} 
              style={{ zIndex: 600, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: 'var(--color-surface)', width: '400px', borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)', zIndex: 610, border: '1px solid var(--color-border)',
                overflow: 'hidden'
              }}
            >
              <div style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #6366f1 100%)', padding: '1rem 1.25rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><HelpCircle size={18} /> {helpModal.title}</h3>
                <button onClick={() => setHelpModal(null)} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '4px', color: 'white' }}><X size={16} /></button>
              </div>
              <div style={{ padding: '1.25rem', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
                {helpModal.content}
              </div>
              <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'flex-end', background: 'var(--color-bg)' }}>
                <button className="btn outline" onClick={() => setHelpModal(null)}>Đã hiểu</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
