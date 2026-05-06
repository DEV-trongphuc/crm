import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Search, Trash2, CheckCircle2, Package, Plus, X, 
  User, DollarSign, Loader2, Calendar, FileType, ChevronDown, 
  Tag, Percent, Calculator, Info, ShoppingCart, ArrowRight, TrendingUp
} from 'lucide-react';
import api from '../../api/axios';
import { useUIStore } from '../../store/uiStore';

interface Product {
  id: number;
  name: string;
  price: number;
  sku?: string;
  description?: string;
}

interface Contact {
  id: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  company_name?: string;
}

interface QuoteItem {
  product_id?: number;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount: number; // percent
  subtotal: number;
}

interface QuoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  quote?: any; // If editing
  onSuccess: () => void;
  initialContact?: Contact | null;
}

export const QuoteEditorModal: React.FC<QuoteEditorProps> = ({ 
  isOpen, onClose, quote, onSuccess, initialContact 
}) => {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  const [form, setForm] = useState({
    title: '',
    contact_id: null as number | null,
    deal_id: null as number | null,
    valid_until: '',
    status: 'draft',
    notes: '',
    terms: '',
    discount: 0, // overall discount amount
    tax_rate: 10, // VAT 10%
  });

  const [items, setItems] = useState<QuoteItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [showContactResults, setShowContactResults] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(initialContact || null);

  useEffect(() => {
    if (isOpen) {
      api.get('/products').then(r => setProducts(r.data.data || [])).catch(() => {});
      api.get('/contacts').then(r => setContacts(r.data.data?.items || r.data.data || [])).catch(() => {});
      
      if (quote) {
        setForm({
          title: quote.title || '',
          contact_id: quote.contact_id || null,
          deal_id: quote.deal_id || null,
          valid_until: quote.valid_until || '',
          status: quote.status || 'draft',
          notes: quote.notes || '',
          terms: quote.terms || '',
          discount: Number(quote.discount) || 0,
          tax_rate: 10,
        });
        api.get(`/quotes/${quote.id}`).then(r => {
          setItems(r.data.data.items || []);
          if (r.data.data.contact_id) {
             const c = contacts.find(x => x.id === r.data.data.contact_id);
             if (c) setSelectedContact(c);
          }
        });
      } else {
        setForm({
          title: '',
          contact_id: initialContact?.id || null,
          deal_id: null,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'draft',
          notes: '',
          terms: 'Thanh toán 100% sau khi ký báo giá.',
          discount: 0,
          tax_rate: 10,
        });
        setItems([]);
        setSelectedContact(initialContact || null);
      }
    }
  }, [isOpen, quote, initialContact]);

  const filteredProducts = useMemo(() => {
    if (!searchProduct) return [];
    return products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase())).slice(0, 10);
  }, [products, searchProduct]);

  const filteredContacts = useMemo(() => {
    if (!searchContact) return [];
    return contacts.filter(c => `${c.first_name} ${c.last_name} ${c.phone} ${c.email}`.toLowerCase().includes(searchContact.toLowerCase())).slice(0, 8);
  }, [contacts, searchContact]);

  const addItem = (p: Product) => {
    const newItem: QuoteItem = {
      product_id: p.id,
      name: p.name,
      description: p.description,
      quantity: 1,
      unit_price: p.price,
      discount: 0,
      subtotal: p.price
    };
    setItems([...items, newItem]);
    setSearchProduct('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, fields: Partial<QuoteItem>) => {
    const newItems = [...items];
    const item = { ...newItems[index], ...fields };
    item.subtotal = (item.unit_price * item.quantity) * (1 - (item.discount / 100));
    newItems[index] = item;
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const taxAmount = (subtotal - form.discount) * (form.tax_rate / 100);
  const total = subtotal - form.discount + taxAmount;

  const handleSave = async () => {
    if (!form.title) return addToast('Vui lòng nhập tiêu đề báo giá', 'warning');
    if (!selectedContact) return addToast('Vui lòng chọn khách hàng', 'warning');
    if (items.length === 0) return addToast('Báo giá phải có ít nhất 1 sản phẩm', 'warning');

    setLoading(true);
    const payload = { ...form, contact_id: selectedContact.id, subtotal, tax: taxAmount, total, items };

    try {
      if (quote) {
        await api.put(`/quotes/${quote.id}`, payload);
        addToast('Cập nhật báo giá thành công', 'success');
      } else {
        await api.post('/quotes', payload);
        addToast('Tạo báo giá thành công', 'success');
      }
      onSuccess();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Lỗi khi lưu báo giá', 'error');
    } finally {
      setLoading(false);
    }
  };

  const FMT = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

  if (!isOpen) return null;

  return (
    <div className="overlay-backdrop" style={{ zIndex: 9999 }}>
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="modal-sheet"
          style={{ width: '95vw', maxWidth: '1100px', maxHeight: '95vh', overflow: 'hidden' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="flex items-center gap-4">
              <div style={{ background: 'var(--color-primary)', color: '#fff', width: 48, height: 48, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(124, 58, 237, 0.25)' }}>
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black">{quote ? 'Chỉnh sửa Báo giá' : 'Tạo Báo giá Mới'}</h2>
                <p className="text-xs text-light font-bold uppercase tracking-widest opacity-70">{quote ? quote.quote_number : 'Bản nháp báo giá chuyên nghiệp'}</p>
              </div>
            </div>
            <button className="btn-icon sm" onClick={onClose}><X size={20} /></button>
          </div>

          <div className="modal-body" style={{ background: '#fcfcfd' }}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-8">
                {/* Section 1: Basic Info */}
                <div className="card p-6" style={{ border: '1px solid var(--color-border-light)' }}>
                  <h3 className="text-sm font-black mb-6 flex items-center gap-2 text-primary uppercase tracking-widest"><FileType size={16} /> Thông tin chung</h3>
                  <div className="space-y-6">
                    <div className="form-group">
                      <label className="form-label">Tiêu đề báo giá <span className="text-danger">*</span></label>
                      <input 
                        className="form-input font-bold" 
                        style={{ height: '50px', fontSize: '1rem' }}
                        placeholder="VD: Báo giá triển khai hệ thống quản trị..." 
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-2">
                      <div className="form-group relative">
                        <label className="form-label">Khách hàng nhận <span className="text-danger">*</span></label>
                        <div className="filter-search" style={{ background: '#fff', height: '48px' }}>
                          <User size={18} className="text-muted" />
                          <input 
                            placeholder="Tìm theo tên, SĐT hoặc Email..." 
                            value={selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name || ''}` : searchContact}
                            onChange={e => {
                              setSearchContact(e.target.value);
                              setShowContactResults(true);
                              if (selectedContact) setSelectedContact(null);
                            }}
                          />
                          {selectedContact && <button onClick={() => setSelectedContact(null)} className="text-muted hover:text-danger"><X size={16} /></button>}
                        </div>
                        {showContactResults && filteredContacts.length > 0 && (
                          <div className="card shadow-2xl absolute w-full mt-2 z-50 p-2 space-y-1 overflow-hidden" style={{ borderRadius: '16px' }}>
                            {filteredContacts.map(c => (
                              <div 
                                key={c.id} 
                                className="p-3 hover:bg-slate-50 cursor-pointer rounded-xl flex items-center gap-3 transition-colors"
                                onClick={() => {
                                  setSelectedContact(c);
                                  setShowContactResults(false);
                                  setSearchContact('');
                                }}
                              >
                                <div className="avatar-placeholder sm" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>{c.first_name?.[0]}</div>
                                <div className="flex-1">
                                  <div className="font-bold text-sm text-gray-800">{c.first_name} {c.last_name || ''}</div>
                                  <div className="text-[10px] text-muted flex items-center gap-2">{c.phone} <span className="opacity-30">|</span> {c.email}</div>
                                </div>
                                <ArrowRight size={14} className="text-muted opacity-0 group-hover:opacity-100" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Ngày hết hiệu lực</label>
                        <div className="filter-search" style={{ background: '#fff', height: '48px' }}>
                          <Calendar size={18} className="text-muted" />
                          <input 
                            type="date" 
                            className="form-input-bare"
                            value={form.valid_until}
                            onChange={e => setForm({ ...form, valid_until: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Items */}
                <div className="card overflow-hidden" style={{ border: '1px solid var(--color-border-light)' }}>
                  <div className="p-5 bg-white border-b flex justify-between items-center">
                    <h3 className="text-sm font-black flex items-center gap-2 text-primary uppercase tracking-widest"><Package size={16} /> Danh mục hàng hóa</h3>
                    <div className="relative" style={{ width: '300px' }}>
                      <div className="filter-search" style={{ background: 'var(--color-bg)', height: '40px', borderRadius: '12px' }}>
                        <Search size={16} className="text-muted" />
                        <input 
                          placeholder="Thêm sản phẩm từ kho..." 
                          value={searchProduct}
                          onChange={e => setSearchProduct(e.target.value)}
                        />
                      </div>
                      {filteredProducts.length > 0 && (
                        <div className="card shadow-2xl absolute w-full mt-2 z-50 p-2 space-y-1" style={{ borderRadius: '16px' }}>
                          {filteredProducts.map(p => (
                            <div 
                              key={p.id} 
                              className="p-3 hover:bg-primary/5 cursor-pointer rounded-xl flex justify-between items-center transition-colors"
                              onClick={() => addItem(p)}
                            >
                              <div>
                                <span className="text-sm font-bold block">{p.name}</span>
                                <span className="text-[10px] text-muted uppercase font-black">{p.sku || 'N/A SKU'}</span>
                              </div>
                              <span className="text-xs font-black text-primary">{FMT(p.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="table-wrap">
                    <table style={{ background: 'white' }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: '1rem' }}>Tên sản phẩm / Dịch vụ</th>
                          <th style={{ width: 80, textAlign: 'center' }}>SL</th>
                          <th style={{ width: 150, textAlign: 'right' }}>Đơn giá</th>
                          <th style={{ width: 100, textAlign: 'center' }}>% Giảm</th>
                          <th style={{ width: 150, textAlign: 'right' }}>Thành tiền</th>
                          <th style={{ width: 50 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center p-16">
                              <div className="flex flex-col items-center gap-3 opacity-30">
                                <ShoppingCart size={48} strokeWidth={1} />
                                <p className="text-sm font-bold">Chưa có sản phẩm nào được chọn</p>
                                <p className="text-[10px] uppercase tracking-widest">Sử dụng thanh tìm kiếm phía trên để thêm</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          items.map((item, idx) => (
                            <tr key={idx} className="table-row-hover">
                              <td>
                                <input 
                                  className="form-input sm font-bold w-full border-none focus:ring-0 bg-transparent" 
                                  placeholder="Tên hạng mục..."
                                  value={item.name}
                                  onChange={e => updateItem(idx, { name: e.target.value })}
                                />
                                <textarea 
                                  className="form-input mt-1 text-[11px] text-muted resize-none p-0 border-none bg-transparent focus:ring-0"
                                  placeholder="Mô tả chi tiết (nếu có)..."
                                  value={item.description || ''}
                                  onChange={e => updateItem(idx, { description: e.target.value })}
                                  rows={1}
                                />
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  className="form-input sm text-center font-bold" 
                                  value={item.quantity}
                                  min={0.01}
                                  onChange={e => updateItem(idx, { quantity: Number(e.target.value) })}
                                />
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  className="form-input sm font-mono text-right font-bold" 
                                  value={item.unit_price}
                                  onChange={e => updateItem(idx, { unit_price: Number(e.target.value) })}
                                />
                              </td>
                              <td>
                                <div className="relative">
                                  <input 
                                    type="number" 
                                    className="form-input sm pr-6 text-center font-bold" 
                                    value={item.discount}
                                    max={100}
                                    onChange={e => updateItem(idx, { discount: Math.min(100, Number(e.target.value)) })}
                                  />
                                  <Percent size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted" />
                                </div>
                              </td>
                              <td>
                                <div className="font-black text-sm text-right text-gray-800">{FMT(item.subtotal)}</div>
                              </td>
                              <td className="text-center">
                                <button className="btn-icon sm text-danger hover:bg-danger/10" onClick={() => removeItem(idx)}><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-2 gap-6">
                   <div className="card p-5" style={{ background: 'white' }}>
                     <label className="text-[10px] font-black mb-3 block uppercase tracking-widest text-muted">Ghi chú gửi khách</label>
                     <textarea 
                        className="form-input w-full bg-slate-50 border-none focus:bg-white transition-colors" 
                        style={{ height: '100px', padding: '1rem' }}
                        placeholder="Lời nhắn chân thành hoặc ghi chú đặc biệt..."
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                     />
                   </div>
                   <div className="card p-5" style={{ background: 'white' }}>
                     <label className="text-[10px] font-black mb-3 block uppercase tracking-widest text-muted">Điều khoản áp dụng</label>
                     <textarea 
                        className="form-input w-full bg-slate-50 border-none focus:bg-white transition-colors" 
                        style={{ height: '100px', padding: '1rem' }}
                        value={form.terms}
                        onChange={e => setForm({ ...form, terms: e.target.value })}
                     />
                   </div>
                </div>
              </div>

              {/* Right Column: Financials */}
              <div className="lg:col-span-4 space-y-6">
                <div className="card overflow-hidden shadow-2xl" style={{ border: '2px solid var(--color-primary-light)', borderRadius: '24px' }}>
                  <div className="p-6 bg-primary text-white">
                    <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest"><Calculator size={18} /> Tóm tắt tài chính</h3>
                  </div>
                  
                  <div className="p-6 space-y-6 bg-white">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semi text-light">Thành tiền hàng:</span>
                      <span className="font-black text-gray-800">{FMT(subtotal)}</span>
                    </div>

                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm font-semi text-light">Giảm giá trực tiếp:</span>
                      <div className="flex-1 max-w-[120px]">
                        <input 
                          type="number" 
                          className="form-input sm font-mono text-right font-bold text-danger"
                          style={{ background: 'var(--color-danger-light)', border: 'none' }}
                          value={form.discount}
                          onChange={e => setForm({ ...form, discount: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm font-semi text-light">Thuế VAT (%):</span>
                      <div className="flex-1 max-w-[80px]">
                        <input 
                          type="number" 
                          className="form-input sm text-center font-bold"
                          value={form.tax_rate}
                          onChange={e => setForm({ ...form, tax_rate: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-muted">Tiền thuế:</span>
                       <span className="font-bold">+{FMT(taxAmount)}</span>
                    </div>

                    <div className="pt-6 border-t-2 border-dashed">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-[10px] font-black text-primary uppercase tracking-tighter block mb-1">Tổng cộng báo giá</span>
                          <p className="text-[9px] text-muted font-bold">Đã bao gồm thuế & chiết khấu</p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-primary tracking-tighter">{FMT(total)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 space-y-3">
                      <label className="text-[10px] font-black uppercase text-muted block">Trạng thái xuất bản</label>
                      <div className="grid grid-2 gap-2">
                        {['draft', 'sent'].map(s => (
                          <button 
                            key={s}
                            onClick={() => setForm({ ...form, status: s })}
                            className={`btn sm ${form.status === s ? 'primary' : 'secondary'} flex-1`}
                          >
                            {s === 'draft' ? 'Lưu Nháp' : 'Sẵn sàng gửi'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deal Context */}
                <div className="card p-6 bg-slate-900 text-white border-none shadow-xl" style={{ borderRadius: '24px' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div style={{ background: 'rgba(255,255,255,0.1)', width: 32, height: 32, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={16} className="text-primary-light" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Gắn kết Pipeline</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-5">Liên kết báo giá này với một Deal để theo dõi tỉ lệ thành công của chiến dịch kinh doanh.</p>
                  <button className="btn ghost sm w-full border border-slate-700 text-white hover:bg-slate-800" style={{ borderRadius: '12px' }}>
                    Chọn Cơ hội liên quan...
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
             <button className="btn ghost font-bold text-muted" onClick={onClose}>Hủy bỏ</button>
             <button 
               className="btn primary" 
               style={{ minWidth: '220px', boxShadow: '0 10px 20px -5px rgba(124, 58, 237, 0.4)' }}
               onClick={handleSave}
               disabled={loading}
             >
               {loading ? <Loader2 className="animate-spin" /> : (quote ? 'Cập nhật thay đổi' : 'Xác nhận & Lưu báo giá')}
             </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
