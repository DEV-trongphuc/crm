import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, Trash2, CheckCircle, Package, Plus, X, User, DollarSign } from 'lucide-react';
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
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ maxWidth: '1300px', width: '95vw', height: '85vh', maxHeight: '900px', background: 'var(--color-surface)', display: 'flex', overflow: 'hidden', borderRadius: '32px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-2xl)' }} 
        onClick={e => e.stopPropagation()}
      >
          {/* Left: Product Selection */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
            <div className="p-8 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black flex items-center gap-2">
                    <span style={{ background: 'var(--color-primary)', color: 'white', padding: '8px', borderRadius: '12px' }}><Package size={24} /></span>
                    Quầy Bán Hàng
                  </h2>
                  <p className="text-xs text-light font-bold uppercase tracking-widest mt-1">Hệ thống quản lý kho & bán hàng thông minh</p>
                </div>
                <button className="btn ghost btn-icon lg" onClick={onClose} style={{ borderRadius: '100%' }}><X size={24} /></button>
              </div>
              
              <div className="search-wrap" style={{ borderRadius: '20px', padding: '14px 20px', background: 'var(--color-bg-light)', border: '2px solid transparent' }}>
                <Search size={22} className="text-primary" />
                <input autoFocus className="form-input" style={{ fontSize: '1rem', border: 'none', background: 'transparent' }} placeholder="Quét mã vạch hoặc tìm tên sản phẩm..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} />
              </div>

              {searchProduct && (
                <div className="card mt-2 p-2 shadow-2xl" style={{ position: 'absolute', width: 'calc(100% - 64px)', zIndex: 100, borderRadius: '20px' }}>
                  {filteredProducts.map(p => (
                    <div key={p.id} className="p-4 hover-bg rounded-xl cursor-pointer flex justify-between items-center transition-all" onClick={() => addToCart(p)}>
                      <div className="flex items-center gap-4">
                        <div style={{ width: 48, height: 48, background: 'var(--color-bg-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package className="text-light" /></div>
                        <div>
                          <p className="font-bold text-lg">{p.name}</p>
                          <p className="text-xs text-light font-bold">Mã: {p.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-primary text-xl">{p.price.toLocaleString()}đ</p>
                        <button className="btn primary sm rounded-lg mt-1">Thêm</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 flex-1 overflow-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-light uppercase tracking-widest">Sản phẩm phổ biến</h3>
                <div className="flex gap-2">
                  <span className="badge outline">Tất cả</span>
                  <span className="badge">Phần mềm</span>
                  <span className="badge">Dịch vụ</span>
                </div>
              </div>
              <div className="grid grid-3 gap-6">
                {(searchProduct ? filteredProducts : products.slice(0, 12)).map(p => (
                  <motion.div 
                    whileTap={{ scale: 0.95 }}
                    key={p.id} className="card card-hover p-5 cursor-pointer flex flex-col justify-between" style={{ borderRadius: '24px', height: '140px' }} onClick={() => addToCart(p)}
                  >
                    <div>
                      <p className="font-bold text-base mb-1 line-clamp-2">{p.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                       <p className="text-primary font-black text-lg">{p.price.toLocaleString()}đ</p>
                       <Plus size={16} className="text-light" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Cart & Customer */}
          <div style={{ width: 460, background: 'var(--color-bg-light)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--color-border)' }}>
            <div className="p-8 border-b" style={{ borderColor: 'var(--color-border)', background: 'white' }}>
              <h3 className="text-xs font-black text-light uppercase tracking-widest mb-4">Thông tin khách hàng</h3>
              {selectedContact ? (
                <div className="card p-5 flex items-center justify-between" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)', border: '2px solid var(--color-primary)' }}>
                  <div className="flex items-center gap-4">
                    <div className="avatar-placeholder lg" style={{ background: 'var(--color-primary)', width: 56, height: 56, borderRadius: '18px' }}>{selectedContact.first_name[0]}</div>
                    <div>
                      <p className="font-black text-lg">{selectedContact.first_name} {selectedContact.last_name}</p>
                      <p className="text-sm text-light font-bold">{selectedContact.phone}</p>
                    </div>
                  </div>
                  <button className="btn-icon lg" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }} onClick={() => setSelectedContact(null)}><X size={20} /></button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex gap-2 mb-4">
                    <div className="search-wrap" style={{ borderRadius: '18px', background: '#f9fafb', flex: 1 }}>
                      <User size={20} className="text-light" />
                      <input className="form-input" style={{ background: 'transparent', border: 'none' }} placeholder="Chọn khách hàng..." value={searchContact} onChange={e => setSearchContact(e.target.value)} />
                    </div>
                    <button className="btn primary btn-icon lg" onClick={() => setShowQuickAdd(true)} style={{ borderRadius: '18px' }}><Plus size={20} /></button>
                  </div>

                  {showQuickAdd && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-4 mb-4 border-primary" style={{ borderRadius: '18px' }}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-black uppercase tracking-widest text-primary">Thêm khách hàng nhanh</span>
                        <button onClick={() => setShowQuickAdd(false)}><X size={16} /></button>
                      </div>
                      <div className="flex flex-col gap-3">
                        <input className="form-input sm" placeholder="Họ" value={newCust.last_name} onChange={e => setNewCust({...newCust, last_name: e.target.value})} />
                        <input className="form-input sm" placeholder="Tên *" value={newCust.first_name} onChange={e => setNewCust({...newCust, first_name: e.target.value})} />
                        <input className="form-input sm" placeholder="Số điện thoại *" value={newCust.phone} onChange={e => setNewCust({...newCust, phone: e.target.value})} />
                        <button className="btn primary sm w-full mt-1" onClick={handleQuickAdd} disabled={loading}>Lưu & Chọn</button>
                      </div>
                    </motion.div>
                  )}

                  {searchContact && (
                    <div className="card mt-2 p-2 absolute w-full z-10 shadow-2xl" style={{ borderRadius: '18px', top: '50px' }}>
                      {filteredContacts.map(c => (
                        <div key={c.id} className="p-4 hover-bg rounded-xl cursor-pointer" onClick={() => { setSelectedContact(c); setSearchContact(''); }}>
                          <p className="font-bold">{c.first_name} {c.last_name}</p>
                          <p className="text-xs text-light">{c.phone}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-8 flex-1 overflow-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-light uppercase tracking-widest">Giỏ hàng</h3>
                <span className="badge primary">{cart.length} món</span>
              </div>
              <div className="flex flex-col gap-4">
                {cart.map((item, idx) => (
                  <motion.div layout key={idx} className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-primary-light transition-all">
                    <div style={{ flex: 1 }}>
                      <p className="text-sm font-bold truncate">{item.name}</p>
                      <p className="text-xs text-primary font-black">{item.price.toLocaleString()}đ <span className="text-light font-normal">/ sản phẩm</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                        <button className="btn ghost sm" style={{ padding: 2, width: 28, height: 28, borderRadius: '8px' }} onClick={() => {
                          setCart(prev => prev.map(x => x.id === item.id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x));
                        }}>-</button>
                        <span className="text-sm font-black w-6 text-center">{item.quantity}</span>
                        <button className="btn ghost sm" style={{ padding: 2, width: 28, height: 28, borderRadius: '8px' }} onClick={() => {
                          setCart(prev => prev.map(x => x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x));
                        }}>+</button>
                      </div>
                      <button className="btn ghost sm text-danger" style={{ padding: 8 }} onClick={() => {
                        setCart(prev => prev.filter(x => x.id !== item.id));
                      }}><Trash2 size={16} /></button>
                    </div>
                  </motion.div>
                ))}
                {cart.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-light opacity-50">
                    <ShoppingCart size={48} className="mb-4" />
                    <p className="font-bold">Giỏ hàng trống</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-white border-t" style={{ borderColor: 'var(--color-border)', borderRadius: '0 0 32px 0' }}>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-xs font-black text-light uppercase tracking-widest">Tổng tiền thanh toán</span>
                  <div className="text-4xl font-black text-primary mt-1">{totalAmount.toLocaleString()}đ</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-success flex items-center gap-1 justify-end"><CheckCircle size={12} /> Bao gồm VAT</span>
                </div>
              </div>
              <button 
                className="btn primary lg w-full py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                disabled={loading || cart.length === 0 || !selectedContact}
                onClick={handleCheckout}
                style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #9333ea 100%)', fontSize: '1.1rem', fontWeight: 800, border: 'none' }}
              >
                {loading ? <span className="loader sm" /> : <DollarSign size={24} />}
                THANH TOÁN & XUẤT HÓA ĐƠN
              </button>
            </div>
          </div>
      </motion.div>
    </div>
  );
};
