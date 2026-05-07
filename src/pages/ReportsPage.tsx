import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Briefcase, Download, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { PeriodFilter, getDateRange } from '../components/ui/PeriodFilter';
import { useUIStore } from '../store/uiStore';
import type { Period, DateRange } from '../components/ui/PeriodFilter';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { DEV_MODE } from '../config/env';
import { useMockStore } from '../store/mockStore';
import { Skeleton, TableSkeleton } from '../components/ui/Skeleton';
import { Avatar } from '../components/ui/Avatar';

const COLORS = ['#7c3aed', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];
const T_LABEL: Record<string, string> = {
  'call': 'Cuộc gọi',
  'email': 'Email',
  'meeting': 'Cuộc họp',
  'task': 'Công việc',
  'note': 'Ghi chú'
};

const MONTHLY: any[] = [];
const BY_OWNER: any[] = [];

const FMT = (n: number) => n >= 1e9 ? (n / 1e9).toFixed(1) + 'T' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : (n / 1e3).toFixed(0) + 'K';
const FMT_VND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

export const ReportsPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [tab, setTab] = useState<'sales' | 'pipeline' | 'customers' | 'companies' | 'expenses' | 'activities'>('sales');
  const [period, setPeriod] = useState<Period>('this_quarter');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('this_quarter'));
  
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any>(null);
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [customerData, setCustomerData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [activityData, setActivityData] = useState<any>(null);

  const fetchSales = async () => {
    if (DEV_MODE) {
      setLoading(true);
      const state = useMockStore.getState();
      const wonValue = state.contacts.filter(c => state.pipeline_stages.find(s => s.id === c.stage_id)?.is_won)
        .reduce((sum, c) => sum + (Number(c.expected_revenue) || 0), 0);
      
      setSalesData({
        summary: {
          total_revenue: wonValue,
          revenue_change: '+12.4%',
          deals: 45,
          deals_change: '+5.2%',
          contacts: state.contacts.length,
          contacts_change: '+8.1%',
          win_rate: 68,
          win_rate_change: '+2.5%'
        },
        by_month: [
          { month: 'T08', revenue: wonValue * 0.7, target: wonValue * 0.8 },
          { month: 'T09', revenue: wonValue * 0.85, target: wonValue * 0.8 },
          { month: 'T10', revenue: wonValue * 0.9, target: wonValue * 1.0 },
          { month: 'T11', revenue: wonValue * 1.1, target: wonValue * 1.0 },
          { month: 'T12', revenue: wonValue, target: wonValue * 1.1 }
        ],
        by_owner: state.users.slice(0, 4).map((u, i) => ({
          id: u.id,
          name: u.full_name,
          deals: 12 - i,
          revenue: wonValue * (0.4 - i * 0.1)
        }))
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const r = await api.get('/reports/sales', { params: { from: dateRange.from, to: dateRange.to } });
      setSalesData(r.data.data);
    } catch {
      // silent fail — show empty charts
    } finally {
      setLoading(false);
    }
  };

  const fetchPipeline = async () => {
    if (DEV_MODE) {
      setLoading(true);
      const state = useMockStore.getState();
      setPipelineData(state.pipeline_stages.map(s => ({
        stage: s.name,
        count: state.contacts.filter(c => c.stage_id === s.id).length,
        total_value: state.contacts.filter(c => c.stage_id === s.id).reduce((sum, c) => sum + (Number(c.expected_revenue) || 0), 0),
        color: s.color
      })));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const r = await api.get('/reports/pipeline', { params: { from: dateRange.from, to: dateRange.to } });
      setPipelineData(r.data.data);
    } catch {
      // silent fail
    } finally { setLoading(false); }
  };

  const fetchActivities = async () => {
    if (DEV_MODE) {
      setLoading(true);
      const state = useMockStore.getState();
      const types = ['call', 'email', 'meeting', 'task', 'note'];
      setActivityData({
        by_type: types.map(t => ({
          type: t,
          total: state.activities.filter(a => a.type === t).length
        })),
        by_user_type: state.users.slice(0, 3).flatMap(u => 
          types.map(t => ({
            user_name: u.full_name,
            type: t,
            total: Math.floor(Math.random() * 10) + 2
          }))
        )
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const r = await api.get('/reports/activities', { params: { from: dateRange.from, to: dateRange.to } });
      setActivityData(r.data.data);
    } catch (e) {
      console.error("Failed to fetch activities", e);
    } finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    if (DEV_MODE) {
      setLoading(true);
      const state = useMockStore.getState();
      setCustomerData({
        by_source: [
          { source: 'Facebook', count: 45 },
          { source: 'Website', count: 32 },
          { source: 'Referral', count: 18 },
          { source: 'Other', count: 5 }
        ],
        trend: [
          { date: '01/01', count: 5 },
          { date: '05/01', count: 12 },
          { date: '10/01', count: 8 },
          { date: '15/01', count: 15 }
        ],
        by_score: [
          { bucket: '0-20', count: 10 },
          { bucket: '21-40', count: 25 },
          { bucket: '41-60', count: 45 },
          { bucket: '61-80', count: 30 },
          { bucket: '81-100', count: 15 }
        ]
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const r = await api.get('/reports/customers', { params: { from: dateRange.from, to: dateRange.to } });
      setCustomerData(r.data.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const fetchCompanies = async () => {
    if (DEV_MODE) {
      setLoading(true);
      const state = useMockStore.getState();
      setCompanyData({
        by_industry: [
          { industry: 'Công nghệ', count: 25 },
          { industry: 'Sản xuất', count: 18 },
          { industry: 'Dịch vụ', count: 15 },
          { industry: 'Bán lẻ', count: 12 }
        ],
        by_size: [
          { size: 'Nhỏ (1-10)', count: 35 },
          { size: 'Vừa (11-50)', count: 20 },
          { size: 'Lớn (>50)', count: 15 }
        ],
        by_city: [
          { city: 'Hà Nội', count: 30 },
          { city: 'TP. HCM', count: 45 },
          { city: 'Đà Nẵng', count: 12 },
          { city: 'Hải Phòng', count: 8 }
        ]
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const r = await api.get('/reports/companies');
      setCompanyData(r.data.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const fetchExpenses = async () => {
    if (DEV_MODE) {
      setLoading(true);
      const state = useMockStore.getState();
      const totalExp = state.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      setExpenseData({
        by_category: [
          { category: 'Marketing', total: totalExp * 0.4 },
          { category: 'Vận hành', total: totalExp * 0.3 },
          { category: 'Nhân sự', total: totalExp * 0.2 },
          { category: 'Khác', total: totalExp * 0.1 }
        ],
        trend: [
          { date: '01/01', total: totalExp * 0.1 },
          { date: '05/01', total: totalExp * 0.2 },
          { date: '10/01', total: totalExp * 0.15 },
          { date: '15/01', total: totalExp * 0.25 }
        ]
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const r = await api.get('/reports/expenses', { params: { from: dateRange.from, to: dateRange.to } });
      setExpenseData(r.data.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'sales') fetchSales();
    else if (tab === 'pipeline') fetchPipeline();
    else if (tab === 'customers') fetchCustomers();
    else if (tab === 'companies') fetchCompanies();
    else if (tab === 'expenses') fetchExpenses();
    else if (tab === 'activities') fetchActivities();
  }, [tab, dateRange]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Báo cáo & Phân tích</h1>
          <p className="page-subtitle">Dữ liệu tổng hợp toàn hệ thống</p>
        </div>
        <div className="flex gap-2">
          <PeriodFilter value={period} onChange={(p, r) => { setPeriod(p); setDateRange(r); }} />
          <button className="btn secondary" onClick={() => {
            addToast('Đang tạo báo cáo PDF...', 'info');
            setTimeout(() => window.print(), 1000);
          }}><Download size={16} /> Xuất PDF</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {[
          ['sales', 'Doanh thu'], 
          ['pipeline', 'Pipeline'], 
          ['customers', 'Khách hàng'], 
          ['companies', 'Doanh nghiệp'], 
          ['expenses', 'Chi phí'], 
          ['activities', 'Hoạt động']
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            style={{ padding: '0.625rem 1.25rem', fontWeight: 600, fontSize: '0.9rem', color: tab === k ? 'var(--color-primary)' : 'var(--color-text-light)', borderBottom: tab === k ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: '-2px', cursor: 'pointer', transition: 'color 0.2s', background: 'transparent', border: 'none' }}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* KPI Cards */}
          <div className="grid grid-4">
            {[
              { label: 'Tổng doanh thu', value: FMT_VND(salesData?.summary?.total_revenue || 0), change: salesData?.summary?.revenue_change, up: (salesData?.summary?.revenue_change || '').startsWith('+'), icon: TrendingUp, color: '#7c3aed' },
              { label: 'Cơ hội bán hàng', value: String(salesData?.summary?.deals || 0), change: salesData?.summary?.deals_change, up: (salesData?.summary?.deals_change || '').startsWith('+'), icon: Briefcase, color: '#10b981' },
              { label: 'Khách hàng', value: String(salesData?.summary?.contacts || 0), change: salesData?.summary?.contacts_change, up: (salesData?.summary?.contacts_change || '').startsWith('+'), icon: Users, color: '#3b82f6' },
              { label: 'Tỷ lệ chốt deal', value: `${salesData?.summary?.win_rate || 0}%`, change: salesData?.summary?.win_rate_change, up: (salesData?.summary?.win_rate_change || '').startsWith('+'), icon: BarChart3, color: '#f59e0b' },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.label} className="stat-kpi" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="stat-kpi__header">
                    <div className="stat-kpi__icon" style={{ background: `${card.color}12`, color: card.color }}><Icon size={16} /></div>
                    <div className="stat-kpi__label">{card.label}</div>
                  </div>
                  {loading ? (
                    <div style={{ padding: '0.5rem 0' }}>
                      <Skeleton height="2rem" width="80%" style={{ marginBottom: '0.5rem' }} />
                      <Skeleton height="0.875rem" width="60%" />
                    </div>
                  ) : (
                    <>
                      <div className="stat-kpi__value">{card.value}</div>
                      {card.change && (
                        <div className="stat-kpi__sub">
                          <span className={`stat-kpi__change ${card.up ? 'up' : 'down'}`}>
                            {card.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {card.change}
                          </span>
                          <span style={{color:'var(--color-text-muted)', fontSize:'0.7rem'}}>so với kỳ trước</span>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Revenue chart */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Doanh thu vs Mục tiêu</h3>
            <p className="text-sm text-light mb-4">So sánh doanh thu thực tế với chỉ tiêu — 9 tháng gần nhất</p>
            {loading ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'flex-end', gap: '1.25rem', padding: '1rem' }}>
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={`${Math.random() * 40 + 40}%`} width="100%" />)}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={salesData?.by_month || MONTHLY} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={FMT} tick={{ fontSize: 10, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip formatter={(v: any, name: any) => [FMT_VND(Number(v || 0)), name === 'revenue' ? 'Doanh thu' : 'Mục tiêu']}
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '0.8125rem' }} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="target" name="Mục tiêu" fill="#e5e7eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* By owner table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border-light)' }}>
              <h3 style={{ fontWeight: 700 }}>Hiệu suất theo nhân viên</h3>
            </div>
            {loading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Nhân viên</th><th>Số Deal</th><th>Doanh thu</th><th>% Đóng góp</th></tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const rows = salesData?.by_owner || BY_OWNER;
                      const total = rows.reduce((s: number, o: any) => s + Number(o.revenue || 0), 0);
                      return rows.map((o: any) => {
                        const pct = total > 0 ? Math.round((Number(o.revenue || 0) / total) * 100) : 0;
                        return (
                          <tr key={o.id || o.user_id || o.name || o.user_name}>
                            <td>
                              <div className="flex items-center gap-2">
                                <Avatar name={o.name || o.user_name || 'U'} size={28} />
                                <span style={{ fontWeight: 600 }}>{o.name || o.user_name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td><span className="badge purple">{o.deals || o.total_deals || 0} deals</span></td>
                            <td className="font-semi" style={{ color: 'var(--color-primary)' }}>{FMT_VND(Number(o.revenue || 0))}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ flex: 1, height: 7, background: 'var(--color-border)', borderRadius: 4 }}>
                                  <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 4 }} />
                                </div>
                                <span className="text-sm font-semi" style={{ minWidth: 36 }}>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'pipeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid grid-2" style={{ gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={18} color="var(--color-primary)" />
                Phễu chuyển đổi (Conversion Funnel)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                {(() => {
                  const data = pipelineData.length ? pipelineData : [];
                  const maxVal = Math.max(...data.map((d: any) => d.count)) || 1;
                  
                  return data.map((s: any, idx: number) => {
                    const width = (s.count / maxVal) * 100;
                    const nextS = data[idx+1];
                    const dropoff = nextS ? Math.round((nextS.count / s.count) * 100) : null;
                    
                    return (
                      <React.Fragment key={s.stage}>
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text)' }}>{s.stage}</span>
                          </div>
                          <div style={{ width: '300px', display: 'flex', justifyContent: 'center' }}>
                            <motion.div 
                              initial={{ width: 0 }} animate={{ width: `${width}%` }}
                              style={{ height: '36px', background: s.color || 'var(--color-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.875rem', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                            >
                              {s.count}
                            </motion.div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', fontWeight: 600 }}>{FMT_VND(s.total_value)}</span>
                          </div>
                        </div>
                        {dropoff !== null && (
                          <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
                            <div style={{ height: '20px', width: '2px', background: 'var(--color-border)', margin: '0 1rem' }} />
                            Tỷ lệ chuyển đổi: <span style={{ color: dropoff < 50 ? 'var(--color-danger)' : 'var(--color-success)', marginLeft: '4px' }}>{dropoff}%</span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
               <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.5rem' }}>Phân bổ theo giai đoạn</h3>
               <div style={{ height: 300 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pipelineData} dataKey="count" nameKey="stage" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4}>
                        {pipelineData.map((s: any, i: number) => (
                          <Cell key={`cell-${i}`} fill={s.color || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8125rem', fontWeight: 500 }} />
                    </PieChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>

          <div className="grid grid-3" style={{ gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
               <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Giá trị trung bình mỗi deal</p>
               <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-primary)' }}>{FMT_VND(pipelineData.reduce((s,d) => s+Number(d.total_value),0) / (pipelineData.reduce((s,d) => s+Number(d.count),0) || 1))}</p>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
               <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Tổng cơ hội đang mở</p>
               <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-text)' }}>{pipelineData.reduce((s,d) => s+Number(d.count),0)}</p>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
               <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Tổng giá trị Pipeline</p>
               <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-success)' }}>{FMT_VND(pipelineData.reduce((s,d) => s+Number(d.total_value),0))}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'customers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid grid-2" style={{ gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Nguồn khách hàng</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={customerData?.by_source || []} dataKey="count" nameKey="source" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4}>
                      {(customerData?.by_source || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8125rem', fontWeight: 500 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Tăng trưởng khách hàng mới</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerData?.trend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Phân bổ theo Lead Score</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerData?.by_score || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                  <XAxis dataKey="bucket" label={{ value: 'Điểm tiềm năng', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Số lượng', angle: -90, position: 'insideLeft' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'companies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid grid-2" style={{ gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Phân loại theo lĩnh vực</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={companyData?.by_industry || []} dataKey="count" nameKey="industry" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4}>
                      {(companyData?.by_industry || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8125rem', fontWeight: 500 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Quy mô doanh nghiệp</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={companyData?.by_size || []} dataKey="count" nameKey="size" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4}>
                      {(companyData?.by_size || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8125rem', fontWeight: 500 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Top 10 thành phố</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyData?.by_city || []} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-light)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="city" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid grid-2" style={{ gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Cơ cấu chi phí</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={expenseData?.by_category || []} 
                      dataKey="total" 
                      nameKey="category" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={70}
                      outerRadius={100} 
                      paddingAngle={4}
                    >
                      {(expenseData?.by_category || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => FMT_VND(Number(v))} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8125rem', fontWeight: 500 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Biến động chi phí theo ngày</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={expenseData?.trend || []}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={FMT} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: any) => FMT_VND(Number(v))} />
                    <Area type="monotone" dataKey="total" stroke="#ef4444" fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Chi phí vs Doanh thu (Kết hợp)</h3>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesData?.by_month || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={FMT} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any) => FMT_VND(Number(v))} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8125rem', fontWeight: 500 }} />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Line type="monotone" dataKey="cost" name="Chi phí" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'activities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="grid grid-2">
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Phân bổ loại hoạt động</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={activityData?.by_type || []} 
                      dataKey="total" 
                      nameKey="type" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60}
                      outerRadius={85} 
                      paddingAngle={4}
                    >
                      {(activityData?.by_type || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8125rem', fontWeight: 500 }} formatter={(v) => T_LABEL[v as string] || v} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Tóm tắt hoạt động nhân viên</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Nhân viên</th><th>Tổng</th></tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const userTotals: any = {};
                      (activityData?.by_user_type || []).forEach((a: any) => {
                        userTotals[a.user_name] = (userTotals[a.user_name] || 0) + Number(a.total);
                      });
                      return Object.entries(userTotals).map(([name, total]: [any, any]) => (
                        <tr key={name}>
                          <td>
                            <div className="flex items-center gap-2">
                              <Avatar name={name} size={24} />
                              <span style={{ fontWeight: 600 }}>{name}</span>
                            </div>
                          </td>
                          <td><span className="badge info">{total}</span></td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border-light)' }}>
              <h3 style={{ fontWeight: 700 }}>Chi tiết hoạt động theo loại</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Nhân viên</th><th>Cuộc gọi</th><th>Email</th><th>Cuộc họp</th><th>Task</th><th>Ghi chú</th><th>Tổng</th></tr>
                </thead>
                  <tbody>
                    {(() => {
                      const grouped: any = {};
                      (activityData?.by_user_type || []).forEach((a: any) => {
                        if (!grouped[a.user_name]) grouped[a.user_name] = { name: a.user_name, call: 0, email: 0, meeting: 0, task: 0, note: 0, total: 0 };
                        grouped[a.user_name][a.type] = (grouped[a.user_name][a.type] || 0) + Number(a.total);
                        grouped[a.user_name].total += Number(a.total);
                      });
                      
                      const rows = Object.values(grouped);
                      if (rows.length === 0) return (<tr><td colSpan={7} style={{textAlign:'center', padding:'2rem', color:'var(--color-text-muted)'}}>Không có dữ liệu trong khoảng thời gian này</td></tr>);

                      return rows.map((r: any) => (
                        <tr key={r.name}>
                          <td>
                            <div className="flex items-center gap-2">
                              <Avatar name={r.name} size={28} />
                              <span style={{ fontWeight: 600 }}>{r.name}</span>
                            </div>
                          </td>
                          <td><span className="badge info">{r.call}</span></td>
                          <td><span className="badge purple">{r.email}</span></td>
                          <td><span className="badge warning">{r.meeting}</span></td>
                          <td><span className="badge success">{r.task}</span></td>
                          <td><span className="badge secondary">{r.note}</span></td>
                          <td><span style={{ fontWeight: 700 }}>{r.total}</span></td>
                        </tr>
                      ));
                    })()}
                  </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
