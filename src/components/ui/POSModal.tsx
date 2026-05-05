import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, Trash2, CheckCircle, Package, Plus, X, User, DollarSign, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { useUIStore } from '../../store/uiStore';

interface Product {
  id: number;
  name: string;
  price: number;
  category_id?: number;
}

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
}

interface CartItem extends Product {
  quantity: number;
}

export const POSModal: React.FC<{ onClose: () => void; defaultContact?: Contact | null }> = ({ onClose, defaultContact }) => {
  const { addToast } = useUIStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(defaultContact || null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newCust, setNewCust] = useState({ first_name: '', last_name: '', phone: '' });

  useEffect(() => {
    api.get('/products').then(r => setProducts(Array.isArray(r.data.data) ? r.data.data : (r.data.data?.items || []))).catch(() => {});
    api.get('/contacts').then(r => setContacts(Array.isArray(r.data.data) ? r.data.data : (r.data.data?.items || []))).catch(() => {});
  }, []);

  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => p?.name?.toLowerCase().includes(searchProduct.toLowerCase())).slice(0, 20);
  }, [products, searchProduct]);

  const filteredContacts = useMemo(() => {
    return (contacts || []).filter(c => `${c?.first_name} ${c?.last_name} ${c?.phone}`.toLowerCase().includes(searchContact.toLowerCase())).slice(0, 10);
  }, [contacts, searchContact]);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === p.id);
      if (existing) {
        return prev.map(item => item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...p, quantity: 1 }];
    });
    setSearchProduct('');
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const FMT_PRICE = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

  const handleQuickAdd = async () => {
    if (!newCust.first_name || !newCust.phone) return addToast('Vui lòng nhập tên và SĐT', 'warning');
    setLoading(true);
    try {
      const r = await api.post('/contacts', newCust);
      const created = r.data.data;
      setContacts(prev => [created, ...prev]);
      setSelectedContact(created);
      setShowQuickAdd(false);
      setNewCust({ first_name: '', last_name: '', phone: '' });
      addToast('Đã thêm khách hàng mới', 'success');
    } catch {
      addToast('Lỗi khi thêm khách hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedContact) return addToast('Vui lòng chọn khách hàng', 'warning');
    if (cart.length === 0) return addToast('Giỏ hàng trống', 'warning');

    setLoading(true);
    try {
      await api.post('/pos', {
        customer_id: selectedContact.id,
        cart,
        total_amount: totalAmount
      });
      addToast('Tạo đơn hàng thành công!', 'success');
      onClose();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Lỗi khi tạo đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ maxWidth: '1200px', width: '95vw', height: '85vh', maxHeight: '850px', background: 'var(--color-surface)', display: 'flex', overflow: 'hidden', borderRadius: '32px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-2xl)' }} 
        onClick={e => e.stopPropagation()}
      >
          {/* Left: Product Selection */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
            <div className="p-8 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between mb-6">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'var(--color-primary)', color: 'white', width: 48, height: 48, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px var(--color-primary-light)' }}>
                    <ShoppingCart size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>Quầy Bán Hàng</h2>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hệ thống quản lý kho & bán hàng thông minh</p>
                  </div>
                </div>
                <button className="btn ghost sm" onClick={onClose} style={{ borderRadius: '50%', width: 36, height: 36, padding: 0 }}><X size={20} /></button>
              </div>
              
              <div className="filter-search" style={{ borderRadius: '16px', padding: '12px 18px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                <Search size={20} style={{ color: 'var(--color-primary)' }} />
                <input autoFocus style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.95rem', fontWeight: 500 }} placeholder="Quét mã vạch hoặc tìm tên sản phẩm..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} />
              </div>

              <AnimatePresence>
                {searchProduct && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card mt-2 p-2 shadow-2xl" style={{ position: 'absolute', width: 'calc(100% - 64px)', zIndex: 100, borderRadius: '20px', left: 32 }}>
                    {filteredProducts.length > 0 ? filteredProducts.map(p => (
                      <div key={p.id} className="p-3 hover-bg rounded-xl cursor-pointer flex justify-between items-center transition-all" onClick={() => addToCart(p)}>
                        <div className="flex items-center gap-3">
                          <div style={{ width: 40, height: 40, background: 'var(--color-bg)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={18} className="text-light" /></div>
                          <div>
                            <p className="font-bold text-sm">{p.name}</p>
                            <p className="text-xs text-light font-bold">Mã: {p.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-primary text-base">{FMT_PRICE(p.price)}</p>
                        </div>
                      </div>
                    )) : <div className="p-4 text-center text-light">Không tìm thấy sản phẩm</div>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-8 flex-1 overflow-auto" style={{ background: '#fcfcfd' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-light uppercase tracking-widest">Sản phẩm phổ biến</h3>
                <div className="flex gap-2">
                  <span className="badge primary" style={{ cursor: 'pointer' }}>Tất cả</span>
                  <span className="badge outline" style={{ cursor: 'pointer' }}>Phần mềm</span>
                  <span className="badge outline" style={{ cursor: 'pointer' }}>Dịch vụ</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                {(searchProduct ? filteredProducts : products.slice(0, 15)).map(p => (
                   <motion.div 
                    whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                    whileTap={{ scale: 0.98 }}
                    key={p.id} 
                    className="card p-5 cursor-pointer flex flex-col justify-between" 
                    style={{ borderRadius: '24px', border: '1px solid var(--color-border-light)', background: 'white', transition: 'all 0.2s' }} 
                    onClick={() => addToCart(p)}
                   >
                     <div>
                      <div style={{ width: 32, height: 32, background: 'var(--color-bg)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                        <Package size={16} color="var(--color-text-muted)" />
                      </div>
                      <p className="font-bold text-sm mb-1 line-clamp-2" style={{ color: 'var(--color-text)', minHeight: '2.8rem' }}>{p.name}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                       <p className="text-primary font-black text-base">{FMT_PRICE(p.price)}</p>
                       <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Plus size={16} strokeWidth={3} />
                       </div>
                    </div>
                   </motion.div>
                 ))}
              </div>
            </div>
          </div>

          {/* Right: Cart & Customer */}
          <div style={{ width: 420, background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--color-border)' }}>
            <div className="p-8 border-b" style={{ borderColor: 'var(--color-border)', background: 'white' }}>
              <h3 className="text-xs font-black text-light uppercase tracking-widest mb-4">Thông tin khách hàng</h3>
              {selectedContact ? (
                <div className="card p-4 flex items-center justify-between" style={{ borderRadius: '20px', background: 'var(--color-bg)', border: '1px solid var(--color-primary)' }}>
                  <div className="flex items-center gap-3">
                    <div className="avatar-placeholder md" style={{ background: 'var(--color-primary)', borderRadius: '14px' }}>{selectedContact.first_name[0]}</div>
                    <div>
                      <p className="font-bold text-sm">{selectedContact.first_name} {selectedContact.last_name}</p>
                      <p className="text-xs text-light font-bold">{selectedContact.phone}</p>
                    </div>
                  </div>
                  <button className="btn ghost sm text-danger" onClick={() => setSelectedContact(null)}><X size={16} /></button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex gap-2 mb-2">
                    <div className="filter-search" style={{ borderRadius: '14px', background: 'var(--color-bg)', flex: 1, border: '1px solid var(--color-border)' }}>
                      <User size={18} className="text-light" />
                      <input className="form-input" style={{ background: 'transparent', border: 'none', fontSize: '0.875rem' }} placeholder="Chọn khách hàng..." value={searchContact} onChange={e => setSearchContact(e.target.value)} />
                    </div>
                    <button className="btn primary sm" onClick={() => setShowQuickAdd(true)} style={{ borderRadius: '14px', width: 42, height: 42, padding: 0 }}><Plus size={20} /></button>
                  </div>

                  <AnimatePresence>
                    {showQuickAdd && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-4 mb-4 border-primary" style={{ borderRadius: '18px', boxShadow: 'var(--shadow-xl)' }}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-black uppercase tracking-widest text-primary">Thêm khách hàng nhanh</span>
                          <button onClick={() => setShowQuickAdd(false)} className="text-light"><X size={14} /></button>
                        </div>
                        <div className="flex flex-col gap-2">
                          <input className="form-input sm" placeholder="Họ" value={newCust.last_name} onChange={e => setNewCust({...newCust, last_name: e.target.value})} />
                          <input className="form-input sm" placeholder="Tên *" value={newCust.first_name} onChange={e => setNewCust({...newCust, first_name: e.target.value})} />
                          <input className="form-input sm" placeholder="Số điện thoại *" value={newCust.phone} onChange={e => setNewCust({...newCust, phone: e.target.value})} />
                          <button className="btn primary sm w-full mt-1" onClick={handleQuickAdd} disabled={loading}>Lưu & Chọn</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {searchContact && (
                    <div className="card mt-1 p-1 absolute w-full z-10 shadow-2xl" style={{ borderRadius: '16px', top: '48px' }}>
                      {filteredContacts.length > 0 ? filteredContacts.map(c => (
                        <div key={c.id} className="p-3 hover-bg rounded-xl cursor-pointer" onClick={() => { setSelectedContact(c); setSearchContact(''); }}>
                          <p className="font-bold text-sm">{c.first_name} {c.last_name}</p>
                          <p className="text-xs text-light">{c.phone}</p>
                        </div>
                      )) : <div className="p-3 text-center text-xs text-light">Không tìm thấy khách hàng</div>}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-8 flex-1 overflow-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-light uppercase tracking-widest">Giỏ hàng</h3>
                <span className="badge primary" style={{ borderRadius: '6px' }}>{cart.length} món</span>
              </div>
              <div className="flex flex-col gap-3">
                {cart.map((item) => (
                  <motion.div layout key={item.id} className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-primary-light transition-all">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{item.name}</p>
                      <p className="text-xs text-primary font-black">{FMT_PRICE(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                        <button className="btn ghost sm" style={{ padding: 0, width: 24, height: 24, borderRadius: '6px', minWidth: 24 }} onClick={() => {
                          setCart(prev => prev.map(x => x.id === item.id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x));
                        }}>-</button>
                        <span className="text-xs font-black w-5 text-center">{item.quantity}</span>
                        <button className="btn ghost sm" style={{ padding: 0, width: 24, height: 24, borderRadius: '6px', minWidth: 24 }} onClick={() => {
                          setCart(prev => prev.map(x => x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x));
                        }}>+</button>
                      </div>
                      <button className="text-danger" style={{ padding: 4, background: 'none' }} onClick={() => {
                        setCart(prev => prev.filter(x => x.id !== item.id));
                      }}><Trash2 size={16} /></button>
                    </div>
                  </motion.div>
                ))}
                {cart.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-light opacity-30">
                    <ShoppingCart size={48} strokeWidth={1} className="mb-3" />
                    <p className="text-sm font-bold">Giỏ hàng trống</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-white border-t" style={{ borderColor: 'var(--color-border)', borderRadius: '0 0 32px 0' }}>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-xs font-black text-light uppercase tracking-widest">Tổng tiền thanh toán</span>
                  <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>{FMT_PRICE(totalAmount)}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-success flex items-center gap-1 justify-end"><CheckCircle size={12} /> Đã bao gồm VAT</span>
                </div>
              </div>
              <button 
                className="btn primary lg w-full py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all hover:translate-y-[-2px]" 
                disabled={loading || cart.length === 0 || !selectedContact}
                onClick={handleCheckout}
                style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #6d28d9 100%)', fontSize: '1rem', fontWeight: 800, border: 'none', height: '60px' }}
              >
                {loading ? <Loader2 size={24} className="spin" /> : <CheckCircle size={20} />}
                THANH TOÁN & XUẤT HÓA ĐƠN
              </button>
            </div>
          </div>
      </motion.div>
    </div>
  );
};
