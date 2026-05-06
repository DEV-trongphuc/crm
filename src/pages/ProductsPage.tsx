import React, { useState, useMemo } from 'react';
import { Plus, Package, Pencil, Trash2, X, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import api from '../api/axios';
import { DEV_MODE } from '../config/env';
import { useMockStore } from '../store/mockStore';
import { useDebounce } from '../hooks/useDebounce';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomCheckbox } from '../components/ui/CustomCheckbox';

const FMT = (n: number) => new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND', maximumFractionDigits:0 }).format(n);

const DEFAULT_CATEGORIES = ['Phần mềm', 'Dịch vụ', 'Phần cứng', 'Khác'];

const EMPTY = { name:'', sku:'', category:'Phần mềm', price:'', cost:'', unit:'cái', description:'', is_active:true, stock_quantity: 0, track_inventory: true };

export const ProductsPage: React.FC = () => {
  const { addToast, showConfirm } = useUIStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchProducts = () => {
    setLoading(true);
    if (DEV_MODE) { 
      setProducts(useMockStore.getState().products); 
      setLoading(false); 
      return; 
    }
    api.get('/products')
      .then(r => { setProducts(r.data.data || []); })
      .catch(() => {
        setProducts([]);
        addToast('Không thể tải danh sách sản phẩm', 'error');
      })
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (showModal || showCatModal) && !saving) {
        setShowModal(false);
        setShowCatModal(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showModal, showCatModal, saving]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = debouncedSearch.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
      const matchCat = !categoryFilter || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, debouncedSearch, categoryFilter]);

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('Tên sản phẩm là bắt buộc', 'error'); return; }
    setSaving(true);
    const payload = { 
      ...form, 
      price: Number(form.price),
      cost: Number(form.cost),
      stock_quantity: Number(form.stock_quantity)
    };
    try {
      if (DEV_MODE) {
        if (editItem) {
          useMockStore.setState(state => ({
            products: state.products.map(p => p.id === editItem.id ? { ...editItem, ...payload } : p)
          }));
          addToast('Đã cập nhật sản phẩm', 'success');
        } else {
          useMockStore.getState().addProduct(payload);
          addToast('Đã thêm sản phẩm mới', 'success');
        }
        fetchProducts();
        setShowModal(false);
        setSaving(false);
        return;
      }

      if (editItem) {
        await api.put(`/products/${editItem.id}`, payload);
        addToast('Đã cập nhật sản phẩm', 'success');
      } else {
        await api.post('/products', payload);
        addToast('Đã thêm sản phẩm', 'success');
      }
      fetchProducts();
      setShowModal(false);
    } catch (err) {
      addToast('Lỗi khi lưu sản phẩm', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sản phẩm & Dịch vụ</h1>
          <p className="page-subtitle">{products.filter(p=>p.is_active).length} đang hoạt động</p>
        </div>
        <div className="flex gap-2">
          <button className="btn secondary" onClick={() => setShowCatModal(true)}>Quản lý danh mục</button>
          <button className="btn primary" onClick={() => { setEditItem(null); setForm(EMPTY); setShowModal(true); }}><Plus size={16} /> Thêm sản phẩm</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom:'1rem', padding:'0.875rem 1.25rem', display:'flex', gap:'0.75rem', alignItems:'center' }}>
        <div className="filter-search" style={{ flex:1, position: 'relative' }}>
          <Search size={15} style={{ color:'var(--color-text-muted)' }} />
          <input placeholder="Tìm sản phẩm, SKU..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: '2rem' }} />
          <AnimatePresence>
            {search && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="btn-icon-bare" 
                onClick={() => setSearch('')} 
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', padding: 4 }}
                title="Xóa tìm kiếm"
              >
                <X size={14} style={{ color: 'var(--color-text-muted)' }}/>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <div style={{ width: '200px' }}>
          <CustomSelect 
            options={[{ value: '', label: 'Tất cả danh mục' }, ...categories.map(c => ({ value: c, label: c }))]} 
            value={categoryFilter} 
            onChange={val => setCategoryFilter(String(val))} 
          />
        </div>
        {selectedIds.length > 0 && (
          <button className="btn danger sm" onClick={() => { 
            showConfirm(
              `Xóa ${selectedIds.length} sản phẩm?`,
              `Tất cả sản phẩm đã chọn sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`,
              async () => {
                try {
                  await api.post('/products/bulk-delete', { ids: selectedIds });
                  addToast(`Đã xóa ${selectedIds.length} sản phẩm`, 'success');
                  setSelectedIds([]);
                  fetchProducts();
                } catch { 
                  addToast('Lỗi khi xóa hàng loạt (Demo Mode)', 'error'); 
                  setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
                  setSelectedIds([]);
                }
              }
            );
          }}>Xóa {selectedIds.length} mục</button>
        )}
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <CustomCheckbox 
                    checked={selectedIds.length === filtered.length && filtered.length > 0} 
                    onChange={e => setSelectedIds(e.target.checked ? filtered.map(p => p.id) : [])} 
                  />
                </th>
                <th>Sản phẩm</th><th>SKU</th><th>Danh mục</th><th>Đơn giá</th><th>Kho</th><th>Đơn vị</th><th>Trạng thái</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <motion.tr key={p.id} initial={{ opacity:0 }} animate={{ opacity:1 }}>
                  <td>
                    <CustomCheckbox 
                      checked={selectedIds.includes(p.id)} 
                      onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))} 
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div style={{ width:36, height:36, borderRadius:'10px', background:'rgba(124,58,237,0.1)', color:'var(--color-primary)', display:'flex', alignItems:'center', justifyContent:'center' }}><Package size={16} /></div>
                      <div>
                        <p className="text-sm font-semi">{p.name}</p>
                        <p className="text-xs text-light">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td><code style={{ background:'var(--color-bg)', padding:'2px 6px', borderRadius:4, fontSize:'0.8rem' }}>{p.sku}</code></td>
                  <td><span className="badge" style={{ background:'var(--color-bg)', color:'var(--color-text-light)' }}>{p.category}</span></td>
                  <td><span className="font-semi" style={{ color:'var(--color-primary)' }}>{FMT(p.price)}</span></td>
                  <td>
                    <span className={`badge ${(p.stock_quantity || 0) <= 5 ? 'danger' : 'info'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                      {p.stock_quantity || 0}
                    </span>
                  </td>
                  <td><span className="text-sm text-light">{p.unit}</span></td>
                  <td><span className={`badge ${p.is_active ? 'success' : 'danger'}`}>{p.is_active ? 'Đang bán' : 'Ngừng bán'}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn ghost sm" onClick={() => { setEditItem(p); setForm({...p, price:String(p.price), cost: String(p.cost || ''), track_inventory: !!p.track_inventory}); setShowModal(true); }}><Pencil size={14} /></button>
                      <button className="btn ghost sm" style={{ color:'var(--color-danger)' }} onClick={() => { 
                        showConfirm(
                          'Xóa sản phẩm?',
                          `Bạn có chắc muốn xóa "${p.name}"?`,
                          async () => {
                            try {
                              await api.delete(`/products/${p.id}`);
                              addToast('Đã xóa sản phẩm thành công', 'success');
                              fetchProducts();
                            } catch { 
                              addToast('Lỗi khi xóa (Demo Mode)', 'error'); 
                              setProducts(prev => prev.filter(x => x.id !== p.id));
                            }
                          }
                        );
                      }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div className="overlay-backdrop" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setShowModal(false)} />
            <motion.div className="modal-sheet" style={{ position:'fixed', top:'50%', left:'50%', width:'540px', maxWidth:'calc(100vw - 2rem)', zIndex:300 }}
              initial={{ opacity:0, scale:0.96, x: '-50%', y: '-45%' }} animate={{ opacity:1, scale:1, x: '-50%', y: '-50%' }} exit={{ opacity:0, scale:0.96, x: '-50%', y: '-45%' }}>
              
              <div className="modal-header" style={{ padding: '1.25rem 1.75rem' }}>
                <h3 style={{ fontWeight:800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>{editItem ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h3>
                <button className="btn-icon-bare" onClick={() => setShowModal(false)}><X size={22} /></button>
              </div>

              <div className="modal-body" style={{ padding: '1.75rem', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>Tên sản phẩm *</label>
                  <input className="form-input" style={{ padding: '0.75rem 1rem' }} value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="VD: Phần mềm quản lý bán hàng..." autoFocus />
                </div>
                
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>Mã SKU</label>
                    <input className="form-input" style={{ padding: '0.75rem 1rem' }} value={form.sku} onChange={e => setForm({...form, sku:e.target.value})} placeholder="VD: SW-CRM-01" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>Nhóm danh mục</label>
                    <CustomSelect 
                      options={categories.map(c => ({ value: c, label: c }))} 
                      value={form.category} 
                      onChange={val => setForm({...form, category: String(val)})} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>Giá bán lẻ (đ)</label>
                    <div style={{ position: 'relative' }}>
                      <input className="form-input" style={{ padding: '0.75rem 1rem', paddingRight: '2.5rem' }} type="number" value={form.price} onChange={e => setForm({...form, price:e.target.value})} />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>đ</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>Giá vốn nhập (đ)</label>
                    <div style={{ position: 'relative' }}>
                      <input className="form-input" style={{ padding: '0.75rem 1rem', paddingRight: '2.5rem' }} type="number" value={form.cost} onChange={e => setForm({...form, cost:e.target.value})} />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>đ</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>Đơn vị tính</label>
                  <input className="form-input" style={{ padding: '0.75rem 1rem' }} value={form.unit} onChange={e => setForm({...form, unit:e.target.value})} placeholder="VD: Cái, Bộ, Giờ..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>Tồn kho hiện có</label>
                    <input className="form-input" style={{ padding: '0.75rem 1rem' }} type="number" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: Number(e.target.value)})} disabled={!form.track_inventory} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '1.75rem' }}>
                    <CustomCheckbox 
                      checked={form.track_inventory} 
                      onChange={e => setForm({...form, track_inventory: e.target.checked})} 
                      label="Quản lý tồn kho"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>Mô tả sản phẩm</label>
                  <textarea className="form-input" rows={3} style={{ padding: '0.75rem 1rem', resize: 'none' }} value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Mô tả ngắn gọn về sản phẩm..." />
                </div>

                <div style={{ padding: '0.25rem 0' }}>
                  <CustomCheckbox 
                    checked={form.is_active} 
                    onChange={e => setForm({...form, is_active:e.target.checked})} 
                    label="Sản phẩm đang kinh doanh"
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1.25rem 1.75rem', background: '#fcfcfd' }}>
                <button className="btn outline" onClick={() => setShowModal(false)} disabled={saving} style={{ minWidth: '100px' }}>Hủy bỏ</button>
                <button className="btn primary" onClick={handleSave} disabled={saving} style={{ minWidth: '160px', padding: '0.75rem' }}>
                  {saving && <Loader2 size={16} className="spin" />}
                  {editItem ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Category Management Modal */}
      <AnimatePresence>
        {showCatModal && (
          <>
            <motion.div className="overlay-backdrop" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setShowCatModal(false)} />
            <motion.div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'400px', background:'var(--color-surface)', borderRadius:'var(--radius-xl)', boxShadow:'var(--shadow-xl)', border:'1px solid var(--color-border)', zIndex:300, padding: '1.5rem' }}
              initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}>
              <h3 className="mb-4 font-bold">Quản lý Danh mục</h3>
              <div className="flex gap-2 mb-4">
                <input className="form-input sm" placeholder="Tên danh mục mới" value={newCat} onChange={e => setNewCat(e.target.value)} />
                <button className="btn primary sm" onClick={() => { if(newCat.trim()){ setCategories([...categories, newCat.trim()]); setNewCat(''); addToast('Đã thêm danh mục', 'success'); } }}>Thêm</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {categories.map(c => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--color-bg)', borderRadius: '8px' }}>
                    <span className="text-sm">{c}</span>
                    <button className="btn-icon sm text-danger" onClick={() => { setCategories(categories.filter(x => x !== c)); addToast('Đã xóa danh mục', 'info'); }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button className="btn secondary sm" onClick={() => setShowCatModal(false)}>Đóng</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
