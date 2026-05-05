import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Briefcase, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PeriodFilter, getDateRange } from '../components/ui/PeriodFilter';
import { useUIStore } from '../store/uiStore';
import type { Period, DateRange } from '../components/ui/PeriodFilter';
import { motion } from 'framer-motion';
import api from '../api/axios';

const MONTHLY = [
  { month: 'T10/24', revenue: 72000000, target: 90000000 },
  { month: 'T11/24', revenue: 68000000, target: 90000000 },
  { month: 'T12/24', revenue: 112000000, target: 100000000 },
  { month: 'T1/25', revenue: 85000000, target: 100000000 },
  { month: 'T2/25', revenue: 132000000, target: 100000000 },
  { month: 'T3/25', revenue: 98000000, target: 120000000 },
  { month: 'T4/25', revenue: 175000000, target: 150000000 },
  { month: 'T5/25', revenue: 220000000, target: 180000000 },
  { month: 'T6/25', revenue: 195000000, target: 200000000 },
];

const BY_OWNER = [
  { name: 'Admin', deals: 8, revenue: 820000000, calls: 12, emails: 8, meetings: 5, tasks: 6 },
  { name: 'Sales Manager', deals: 5, revenue: 265000000, calls: 9, emails: 6, meetings: 4, tasks: 8 },
  { name: 'Sales', deals: 3, revenue: 185000000, calls: 6, emails: 4, meetings: 2, tasks: 5 },
];

const FMT = (n: number) => n >= 1e9 ? (n / 1e9).toFixed(1) + 'T' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : (n / 1e3).toFixed(0) + 'K';
const FMT_VND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';
const totalRev = BY_OWNER.reduce((s, o) => s + o.revenue, 0);

export const ReportsPage: React.FC = () => {
  const [tab, setTab] = useState<'sales' | 'pipeline' | 'activities'>('sales');
  const [period, setPeriod] = useState<Period>('this_quarter');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('this_quarter'));
  
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any>(null);
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const r = await api.get('/reports/sales', { params: { from: dateRange.from, to: dateRange.to } });
      setSalesData(r.data.data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const r = await api.get('/reports/pipeline');
      setPipelineData(r.data.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const r = await api.get('/reports/activities');
      setActivityData(r.data.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'sales') fetchSales();
    else if (tab === 'pipeline') fetchPipeline();
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
          <button className="btn secondary sm" onClick={() => {
            const { addToast } = useUIStore.getState();
            addToast('Đang tạo báo cáo PDF...', 'info');
            setTimeout(() => window.print(), 1000);
          }}><Download size={14} /> Xuất PDF</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)' }}>
        {[['sales', 'Doanh thu'], ['pipeline', 'Pipeline'], ['activities', 'Hoạt động']].map(([k, l]) => (
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
              { label: 'Tổng doanh thu', value: FMT_VND(salesData?.summary?.total_revenue || 0), change: '+18%', up: true, icon: TrendingUp, color: '#7c3aed' },
              { label: 'Cơ hội (Deals)', value: String(salesData?.summary?.deal_count || 0), change: '+12%', up: true, icon: Briefcase, color: '#10b981' },
              { label: 'Khách hàng', value: String(salesData?.summary?.customer_count || 0), change: '+5 kỳ trước', up: true, icon: Users, color: '#3b82f6' },
              { label: 'Tỷ lệ chốt deal', value: '22.2%', change: '-2.1%', up: false, icon: BarChart3, color: '#f59e0b' },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.label} className="stat-kpi" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="stat-kpi__header">
                    <div className="stat-kpi__icon" style={{ background: `${card.color}12`, color: card.color }}><Icon size={16} /></div>
                    <div className="stat-kpi__label">{card.label}</div>
                  </div>
                  {loading ? <div className="skeleton" style={{ height: 38, width: '85%', borderRadius: 6, marginBottom: 12 }} /> : <div className="stat-kpi__value">{card.value}</div>}
                  <div className="stat-kpi__sub">
                    <span className={`stat-kpi__change ${card.up ? 'up' : 'down'}`}>
                      {card.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {card.change}
                    </span>
                    <span style={{color:'var(--color-text-muted)', fontSize:'0.7rem'}}>so với kỳ trước</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Revenue chart */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Doanh thu vs Mục tiêu</h3>
            <p className="text-sm text-light mb-4">So sánh doanh thu thực tế với chỉ tiêu — 9 tháng gần nhất</p>
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
          </div>

          {/* By owner table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border-light)' }}>
              <h3 style={{ fontWeight: 700 }}>Hiệu suất theo nhân viên</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Nhân viên</th><th>Số Deal</th><th>Doanh thu</th><th>% Đóng góp</th></tr>
                </thead>
                <tbody>
                  {(salesData?.by_owner || BY_OWNER).map((o: any) => (
                    <tr key={o.name}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar-placeholder sm" style={{ background: '#7c3aed', fontSize: '0.65rem' }}>{o.name[0]}</div>
                          <span style={{ fontWeight: 600 }}>{o.name}</span>
                        </div>
                      </td>
                      <td><span className="badge purple">{o.deals || o.total_deals} deals</span></td>
                      <td className="font-semi" style={{ color: 'var(--color-primary)' }}>{FMT_VND(o.revenue)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ flex: 1, height: 7, background: 'var(--color-border)', borderRadius: 4 }}>
                            <div style={{ width: `${Math.round((o.revenue / (salesData?.summary?.total_revenue || 1)) * 100)}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 4 }} />
                          </div>
                          <span className="text-sm font-semi">{Math.round((o.revenue / (salesData?.summary?.total_revenue || 1)) * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'pipeline' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Phân bổ Pipeline theo giai đoạn</h3>
          {(() => {
            const data = pipelineData.length ? pipelineData : [
              { stage: 'Lead mới', count: 42, total_value: 1850000000, color: '#6366f1' },
              { stage: 'Đã liên hệ', count: 28, total_value: 1240000000, color: '#f59e0b' },
            ];
            const totalVal = data.reduce((sum, s) => sum + Number(s.total_value || 0), 0) || 1;
            return data.map((s: any) => (
              <div key={s.stage} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: s.color || 'var(--color-primary)', flexShrink: 0 }} />
                <span style={{ width: 150, fontWeight: 600, fontSize: '0.875rem' }}>{s.stage}</span>
                <div style={{ flex: 1, height: 10, background: 'var(--color-border)', borderRadius: 5 }}>
                  <div style={{ width: `${Math.round((s.total_value || 0) / totalVal * 100)}%`, height: '100%', background: s.color || 'var(--color-primary)', borderRadius: 5, transition: 'width 1s ease' }} />
                </div>
                <span style={{ width: 80, textAlign: 'right', fontSize: '0.8125rem', fontWeight: 700 }}>{s.count} deals</span>
                <span style={{ width: 120, textAlign: 'right', fontSize: '0.8125rem', color: 'var(--color-text-light)' }}>{FMT(s.total_value)} đ</span>
              </div>
            ));
          })()}
        </div>
      )}

      {tab === 'activities' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border-light)' }}>
            <h3 style={{ fontWeight: 700 }}>Hoạt động theo nhân viên</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Nhân viên</th><th>Cuộc gọi</th><th>Email</th><th>Cuộc họp</th><th>Task</th><th>Tổng</th></tr>
              </thead>
                <tbody>
                  {(() => {
                    const grouped: any = {};
                    (activityData.length ? activityData : []).forEach((a: any) => {
                      if (!grouped[a.user_name]) grouped[a.user_name] = { name: a.user_name, call: 0, email: 0, meeting: 0, task: 0, note: 0, total: 0 };
                      grouped[a.user_name][a.type] = (grouped[a.user_name][a.type] || 0) + Number(a.total);
                      grouped[a.user_name].total += Number(a.total);
                    });
                    
                    const rows = Object.values(grouped);
                    if (rows.length === 0) return BY_OWNER.map(o => (
                      <tr key={o.name}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="avatar-placeholder sm" style={{ background: '#7c3aed', fontSize: '0.65rem' }}>{o.name[0]}</div>
                            <span style={{ fontWeight: 600 }}>{o.name}</span>
                          </div>
                        </td>
                        <td><span className="badge info">{o.calls}</span></td>
                        <td><span className="badge purple">{o.emails}</span></td>
                        <td><span className="badge warning">{o.meetings}</span></td>
                        <td><span className="badge success">{o.tasks}</span></td>
                        <td><span style={{ fontWeight: 700 }}>{o.calls + o.emails + o.meetings + o.tasks}</span></td>
                      </tr>
                    ));

                    return rows.map((r: any) => (
                      <tr key={r.name}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="avatar-placeholder sm" style={{ background: '#7c3aed', fontSize: '0.65rem' }}>{r.name[0]}</div>
                            <span style={{ fontWeight: 600 }}>{r.name}</span>
                          </div>
                        </td>
                        <td><span className="badge info">{r.call}</span></td>
                        <td><span className="badge purple">{r.email}</span></td>
                        <td><span className="badge warning">{r.meeting}</span></td>
                        <td><span className="badge success">{r.task}</span></td>
                        <td><span style={{ fontWeight: 700 }}>{r.total}</span></td>
                      </tr>
                    ));
                  })()}
                </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
