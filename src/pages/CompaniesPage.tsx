import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Building2, X, Loader2, Pencil, Trash2, Globe, Phone, Mail, Users, LayoutGrid, List, Filter, RefreshCw, Download, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '../components/ui/Avatar';
import { useUIStore } from '../store/uiStore';
import { CompanyDrawer } from './CompanyDrawer';
import { Pagination } from '../components/ui/Pagination';
import { ImportExportModal } from '../components/ui/ImportExportModal';
import api from '../api/axios';
import { DEV_MODE } from '../config/env';
import { useMockStore } from '../store/mockStore';
import { PhoneLink } from '../components/ui/PhoneLink';
import { useDebounce } from '../hooks/useDebounce';

const STATUSES = ['active', 'inactive', 'prospect'];
const ST_LABEL: Record<string, string> = { active: 'Hoạt động', inactive: 'Ngừng', prospect: 'Tiềm năng' };
const ST_CLASS: Record<string, string> = { active: 'success', inactive: 'danger', prospect: 'warning' };
const PAGE_SIZE = 50;

const MOCK_COMPANIES: any[] = [];

export const CompaniesPage: React.FC = () => {
  const { addToast, showConfirm, closeConfirm } = useUIStore();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [page, setPage] = useState(1);
  const [showImportExport, setShowImportExport] = useState(false);

  const fetchCompanies = useCallback(async () => {
    if (DEV_MODE) {
      const state = useMockStore.getState();
      let list = [...state.companies];
      
      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase();
        list = list.filter(c => c.name.toLowerCase().includes(s) || c.industry?.toLowerCase().includes(s));
      }
      
      if (statusFilter) {
        list = list.filter(c => c.status === statusFilter);
      }
      
      setCompanies(list);
      setTotal(list.length);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params: any = { page, limit: PAGE_SIZE };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      
      const r = await api.get('/companies', { params });
      const data = r.data.data;
      setCompanies(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setCompanies([]);
      setTotal(0);
      addToast('Không thể tải danh sách công ty', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const openCreate = () => { setEditItem(null); setShowModal(true); };
  const openEdit = (c: any) => { setEditItem(c); setShowModal(true); };

  const handleSaveCompany = async (formData: any) => {
    try {
      if (editItem) {
        await api.put(`/companies/${editItem.id}`, formData);
        addToast('Đã cập nhật công ty', 'success');
      } else {
        await api.post('/companies', formData);
        addToast('Đã thêm công ty mới', 'success');
      }
      setShowModal(false);
      fetchCompanies();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Lỗi khi lưu công ty', 'error');
      throw err;
    }
  };

  const confirmDelete = (co: any) => {
    showConfirm({
      title: 'Xóa công ty?',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn công ty "${co.name}"? Thao tác này không thể hoàn tác.`,
      isDanger: true,
      impactInfo: `Cảnh báo: Xóa công ty sẽ gỡ bỏ liên kết với ${co.contact_count || 0} liên hệ và toàn bộ lịch sử hoạt động liên quan.`,
      confirmText: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          setDeleting(true);
          await api.delete(`/companies/${co.id}`);
          addToast('Đã xóa công ty thành công', 'success');
          fetchCompanies();
        } catch {
          addToast('Lỗi khi xóa công ty', 'error');
        } finally {
          setDeleting(false);
          closeConfirm();
        }
      }
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Công ty</h1>
          <p className="page-subtitle">{loading ? '...' : `${total} công ty khách hàng`}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-icon" onClick={fetchCompanies} title="Làm mới">
            <RefreshCw size={16} />
          </button>
          <button className="btn outline" onClick={() => setShowImportExport(true)}>
            <Download size={16} /> Nhập/Xuất
          </button>
          <button className="btn primary" onClick={openCreate}><Plus size={16} /> Thêm công ty</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1rem', padding: '0.875rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="filter-search" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ color: 'var(--color-text-muted)' }} />
          <input placeholder="Tìm tên công ty, ngành nghề..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')}><X size={14} /></button>}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['', ...STATUSES].map(s => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`btn sm ${statusFilter === s ? 'primary' : 'outline'}`}
            >
              {s ? ST_LABEL[s] : 'Tất cả'}
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }} />

        <div style={{ display: 'flex', background: 'var(--color-bg)', borderRadius: '8px', padding: '2px', border: '1px solid var(--color-border)' }}>
          <button
            className="btn ghost sm"
            style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', background: viewMode === 'card' ? 'var(--color-surface)' : 'transparent' }}
            onClick={() => setViewMode('card')} title="Dạng thẻ"
          ><LayoutGrid size={15} /></button>
          <button
            className="btn ghost sm"
            style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', background: viewMode === 'list' ? 'var(--color-surface)' : 'transparent' }}
            onClick={() => setViewMode('list')} title="Dạng danh sách"
          ><List size={15} /></button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'card' ? 'repeat(3, 1fr)' : '1fr', gap: '1rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: viewMode === 'card' ? 180 : 56, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {/* Card View */}
      {!loading && viewMode === 'card' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <AnimatePresence>
            {companies.map(co => (
              <motion.div
                key={co.id}
                className="card card-hover"
                style={{ padding: '1.25rem', cursor: 'pointer' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => openEdit(co)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={co.name} src={co.logo_url} size={40} style={{ borderRadius: '10px' }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{co.name}</p>
                      <p className="text-xs text-light">{co.industry}{co.city ? ` · ${co.city}` : ''}</p>
                    </div>
                  </div>
                  <span className={`badge ${ST_CLASS[co.status] || 'info'}`}>{ST_LABEL[co.status] || co.status}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1rem' }}>
                  {co.phone && <PhoneLink phone={co.phone} showIcon style={{ fontSize: '0.75rem' }} />}
                  {co.email && <span className="flex items-center gap-2 text-xs text-light"><Mail size={11} />{co.email}</span>}
                  {co.website && <span className="flex items-center gap-2 text-xs text-light"><Globe size={11} />{co.website}</span>}
                  {co.expected_revenue > 0 && <span className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--color-primary)' }}><DollarSign size={11} />{new Intl.NumberFormat('vi-VN').format(co.expected_revenue)} đ</span>}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <span className="flex items-center gap-1 text-xs text-light"><Users size={12} />{co.contact_count || 0}</span>
                    {co.stage_name && <span className="badge sm" style={{ background: (co.stage_color || '#7c3aed') + '15', color: co.stage_color || '#7c3aed', fontSize: '0.65rem' }}>{co.stage_name}</span>}
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button className="btn ghost sm" onClick={() => openEdit(co)}><Pencil size={13} /></button>
                    <button className="btn ghost sm" style={{ color: 'var(--color-danger)' }} onClick={() => confirmDelete(co)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {total === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <Building2 size={40} />
              <h3>Chưa có công ty nào</h3>
              <p>Thêm công ty đầu tiên để bắt đầu quản lý khách hàng doanh nghiệp.</p>
              <button className="btn primary mt-4" onClick={openCreate}><Plus size={16} /> Thêm công ty</button>
            </div>
          )}
        </div>
      )}
      {!loading && viewMode === 'card' && companies.length > PAGE_SIZE && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <Pagination total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && (
        <div className="card" style={{ overflow: 'visible' }}>
          <div className="table-wrap">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Công ty</th>
                  <th style={{ padding: '1rem', textAlign: 'left', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Trạng thái</th>
                  <th style={{ padding: '1rem', textAlign: 'left', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Ngành</th>
                  <th style={{ padding: '1rem', textAlign: 'left', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Giai đoạn</th>
                  <th style={{ padding: '1rem', textAlign: 'left', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Dự kiến</th>
                  <th style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {companies.map(co => (
                    <motion.tr
                      key={co.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer' }}
                      onClick={() => openEdit(co)}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div className="flex items-center gap-3">
                          <Avatar name={co.name} src={co.logo_url} size={32} style={{ borderRadius: '8px' }} />
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{co.name}</p>
                            <p className="text-xs text-light">{co.website || co.city}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}><span className={`badge ${ST_CLASS[co.status] || 'info'}`}>{ST_LABEL[co.status] || co.status}</span></td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{co.industry || '—'}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {co.phone && <PhoneLink phone={co.phone} style={{ fontSize: '0.875rem' }} />}
                          <p className="text-xs text-light">{co.email}</p>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {co.stage_name ? <span className="badge sm" style={{ background: (co.stage_color || '#7c3aed') + '15', color: co.stage_color || '#7c3aed' }}>{co.stage_name}</span> : '—'}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, fontSize: '0.875rem' }}>
                        {co.expected_revenue > 0 ? new Intl.NumberFormat('vi-VN').format(co.expected_revenue) + ' đ' : '—'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn ghost sm" onClick={() => openEdit(co)}><Pencil size={13} /></button>
                          <button className="btn ghost sm" style={{ color: 'var(--color-danger)' }} onClick={() => confirmDelete(co)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {total === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Không tìm thấy công ty nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!loading && viewMode === 'list' && (
        <div className="card" style={{ marginTop: '0.25rem' }}>
          <Pagination total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      )}

      {/* Company Drawer */}
      <CompanyDrawer
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        entity={editItem}
        onSave={handleSaveCompany}
      />
      
      {/* Import Export Modal */}
      <ImportExportModal 
        isOpen={showImportExport} 
        onClose={() => setShowImportExport(false)} 
        entityName="Công ty" 
      />
    </div>
  );
};
