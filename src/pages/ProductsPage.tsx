import React, { useState } from 'react';
import { Plus, Package, Pencil, Trash2, X, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import api from '../api/axios';
import { DEV_MODE } from '../config/env';
import { useMockStore } from '../store/mockStore';

const FMT = (n: number) => new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND', maximumFractionDigits:0 }).format(n);

const MOCK = [
  { id:1, name:'Phần mềm CRM Pro', sku:'SW-CRM-PRO', category:'Phần mềm', price:15000000, unit:'license/năm', is_active:true, description:'Bản quyền phần mềm CRM đầy đủ tính năng', stock: 999 },
  { id:2, name:'Dịch vụ tư vấn triển khai', sku:'SV-CONSULT', category:'Dịch vụ', price:8000000, unit:'ngày/người', is_active:true, description:'Tư vấn và hỗ trợ triển khai tại chỗ', stock: 100 },
  { id:3, name:'Module Kho hàng nâng cao', sku:'SW-WH-ADV', category:'Phần mềm', price:5000000, unit:'module/năm', is_active:true, description:'Mô-đun quản lý kho hàng tích hợp', stock: 2 },
  { id:4, name:'Bảo trì hệ thống hàng năm', sku:'SV-MAINTAIN', category:'Dịch vụ', price:3000000, unit:'năm', is_active:false, description:'Gói bảo trì và cập nhật hệ thống', stock: 0 },
];

const DEFAULT_CATEGORIES = ['Phần mềm', 'Dịch vụ', 'Phần cứng', 'Khác'];

const EMPTY = { name:'', sku:'', category:'Phần mềm', price:'', unit:'cái', description:'', is_active:true, stock: 0 };

export const ProductsPage: React.FC = () => {
  const { addToast, showConfirm } = useUIStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [search, setSearch] = useState('');
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
    if (DEV_MODE) { setProducts(useMockStore.getState().products); setLoading(false); return; }
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

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('Tên sản phẩm là bắt buộc', 'error'); return; }
    setSaving(true);
    try {
      if (DEV_MODE) {
        if (editItem) {
          useMockStore.setState(state => ({
            products: state.products.map(p => p.id === editItem.id ? { ...editItem, ...form, price: Number(form.price) } : p)
          }));
          addToast('Đã cập nhật sản phẩm', 'success');
        } else {
          useMockStore.getState().addProduct({ ...form, price: Number(form.price) });
          addToast('Đã thêm sản phẩm mới', 'success');
        }
        fetchProducts();
        setShowModal(false);
        setSaving(false);
        return;
      }

      if (editItem) {
        await api.put(`/products/${editItem.id}`, { ...form, price: Number(form.price) });
        addToast('Đã cập nhật sản phẩm', 'success');
      } else {
        await api.post('/products', { ...form, price: Number(form.price) });
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
        <div className="filter-search" style={{ flex:1 }}>
          <Search size={15} style={{ color:'var(--color-text-muted)' }} />
          <input placeholder="Tìm sản phẩm, SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input sm" style={{ width: '200px' }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
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
                <th style={{ width: 40 }}><input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={e => setSelectedIds(e.target.checked ? filtered.map(p => p.id) : [])} /></th>
                <th>Sản phẩm</th><th>SKU</th><th>Danh mục</th><th>Đơn giá</th><th>Kho</th><th>Đơn vị</th><th>Trạng thái</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <motion.tr key={p.id} initial={{ opacity:0 }} animate={{ opacity:1 }}>
                  <td><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))} /></td>
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
                    <span className={`badge ${p.stock <= 5 ? 'danger' : 'info'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                      {p.stock}
                    </span>
                  </td>
                  <td><span className="text-sm text-light">{p.unit}</span></td>
                  <td><span className={`badge ${p.is_active ? 'success' : 'danger'}`}>{p.is_active ? 'Đang bán' : 'Ngừng bán'}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn ghost sm" onClick={() => { setEditItem(p); setForm({...p, price:String(p.price)}); setShowModal(true); }}><Pencil size={14} /></button>
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
            <motion.div className="modal-sheet" style={{ position:'fixed', top:'50%', left:'50%', width:'500px', maxWidth:'calc(100vw - 2rem)', zIndex:300 }}
              initial={{ opacity:0, scale:0.96, x: '-50%', y: '-45%' }} animate={{ opacity:1, scale:1, x: '-50%', y: '-50%' }} exit={{ opacity:0, scale:0.96, x: '-50%', y: '-45%' }}>
              
              <div className="modal-header">
                <h3 style={{ fontWeight:800, fontSize: '1.15rem' }}>{editItem ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h3>
                <button className="btn-icon-bare" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>

              <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Tên sản phẩm *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="VD: Phần mềm quản lý bán hàng..." />
                </div>
                
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Mã SKU</label>
                    <input className="form-input" value={form.sku} onChange={e => setForm({...form, sku:e.target.value})} placeholder="VD: SW-CRM-01" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Nhóm danh mục</label>
                    <select className="form-input" value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Đơn giá (đ)</label>
                    <input className="form-input" type="number" value={form.price} onChange={e => setForm({...form, price:e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Đơn vị</label>
                    <input className="form-input" value={form.unit} onChange={e => setForm({...form, unit:e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Tồn kho</label>
                    <input className="form-input" type="number" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Mô tả sản phẩm</label>
                  <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Mô tả ngắn gọn về sản phẩm..." style={{ resize: 'none' }} />
                </div>

                <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer', padding: '0.5rem 0' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active:e.target.checked})} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Sản phẩm đang kinh doanh</span>
                </label>
              </div>

              <div className="modal-footer">
                <button className="btn secondary" onClick={() => setShowModal(false)} disabled={saving}>Hủy bỏ</button>
                <button className="btn primary" onClick={handleSave} disabled={saving} style={{ minWidth: 120 }}>
                  {saving && <Loader2 size={16} className="spin" />}
                  {editItem ? 'Cập nhật' : 'Thêm sản phẩm'}
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
