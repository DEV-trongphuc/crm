import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, Users, DollarSign, Download, Trophy,
  AlertTriangle, Tag as TagIcon, ShoppingCart, RefreshCw,
  Zap, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  Bar, BarChart, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, ComposedChart, Area, AreaChart
} from 'recharts';
import api from '../api/axios';
import styles from './DashboardPage.module.css';
import { motion } from 'framer-motion';
import { Avatar } from '../components/ui/Avatar';
import { PeriodFilter, getDateRange } from '../components/ui/PeriodFilter';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { Period, DateRange } from '../components/ui/PeriodFilter';
import { DEV_MODE } from '../config/env';
import { useMockStore } from '../store/mockStore';
import { Skeleton } from '../components/ui/Skeleton';

const FMT = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n || 0);
const FMT_VND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n || 0);

const MOCK_STATS = {
  won_value: 0,
  profit: 0,
  new_contacts: 0,
  expenses: 0,
  tasks_due_today: 0
};

/* ── Component ──────────────────────────────────────────────── */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [pipelineFunnel, setPipelineFunnel] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [tagStats, setTagStats] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>('this_month');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('this_month'));
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoadingStats(true);

    if (DEV_MODE) {
      const { expenses, contacts, companies, invoices } = useMockStore.getState();
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalWon = invoices.filter((i: any) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);

      setStats({
        ...MOCK_STATS,
        expenses: totalExpenses,
        won_value: totalWon,
        profit: totalWon - totalExpenses,
        new_contacts: contacts.length,
        tasks_due_today: 0
      });
      setRevenueChart([
        { month: 'T10', revenue: 450000000, cost: 30000000 },
        { month: 'T11', revenue: 520000000, cost: 35000000 },
        { month: 'T12', revenue: 480000000, cost: 32000000 },
        { month: 'T1', revenue: 610000000, cost: 38000000 },
        { month: 'T2', revenue: 550000000, cost: 40000000 },
        { month: 'T3', revenue: 670000000, cost: 42000000 },
        { month: 'T4', revenue: 1250000000, cost: 80000000 },
        { month: 'T5', revenue: totalWon, cost: totalExpenses },
      ]);
      const funnelStages = [
        { id: 1, name: 'Giai đoạn mới', color: '#3b82f6' },
        { id: 2, name: 'Đã liên hệ', color: '#6366f1' },
        { id: 3, name: 'Đang thương lượng', color: '#f59e0b' },
        { id: 4, name: 'Gửi báo giá', color: '#8b5cf6' },
        { id: 5, name: 'Chốt thành công', color: '#10b981' },
        { id: 6, name: 'Thất bại', color: '#ef4444' },
      ];
      setPipelineFunnel(funnelStages.map(s => {
        const contactCount = contacts.filter((c: any) => Number(c.stage_id) === s.id).length;
        const companyCount = companies.filter((c: any) => Number(c.stage_id) === s.id).length;
        const contactValue = contacts.filter((c: any) => Number(c.stage_id) === s.id).reduce((sum, c) => sum + (c.expected_revenue || 0), 0);
        const companyValue = companies.filter((c: any) => Number(c.stage_id) === s.id).reduce((sum, c) => sum + (c.expected_revenue || 0), 0);
        
        return {
          ...s,
          deal_count: contactCount + companyCount,
          total_value: contactValue + companyValue
        };
      }));
      setLeadSources([
        { source: 'Website', count: 12, color: '#3b82f6' },
        { source: 'Facebook', count: 8, color: '#8b5cf6' },
        { source: 'Referral', count: 5, color: '#10b981' },
      ]);
      setLeaderboard([
        { id: 1, full_name: 'Admin Sales', won_count: 5, won_value: totalWon * 0.6 },
        { id: 2, full_name: 'Sale Manager', won_count: 3, won_value: totalWon * 0.4 },
      ]);
      setLoadingStats(false);
      return;
    }

    try {
      const [s, rev, pipe, src, lead, tags] = await Promise.all([
        api.get('/dashboard/stats', { params: { from: dateRange.from, to: dateRange.to } }),
        api.get('/dashboard/chart-revenue', { params: { months: 8 } }),
        api.get('/dashboard/pipeline-funnel'),
        api.get('/dashboard/lead-sources', { params: { from: dateRange.from, to: dateRange.to } }),
        api.get('/dashboard/sales-leaderboard', { params: { from: dateRange.from, to: dateRange.to } }),
        api.get('/tags/stats', { params: { from: dateRange.from, to: dateRange.to } }),
      ]);
      setStats(s.data.data || MOCK_STATS);
      setRevenueChart(rev.data.data || []);
      setPipelineFunnel(pipe.data.data || []);
      const srcColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];
      const srcData = (src.data.data || []).map((x: any, i: number) => ({ ...x, color: srcColors[i % srcColors.length] }));
      setLeadSources(srcData);
      setLeaderboard(lead.data.data || []);
      setTagStats((tags.data.data || []).slice(0, 12));
    } catch {
      setStats(null);
      setRevenueChart([]);
      setPipelineFunnel([]);
      setLeadSources([]);
      setLeaderboard([]);
      setTagStats([]);
    } finally {
      setLoadingStats(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const margin = stats?.won_value > 0 ? (stats?.profit / stats?.won_value) * 100 : 0;

  const kpiCards = [
    {
      id: 'revenue',
      label: 'Doanh thu',
      value: FMT_VND(stats?.won_value ?? 0),
      icon: DollarSign,
      color: '#7c3aed',
      change: stats?.revenue_change,
      up: (stats?.revenue_change || '').startsWith('+')
    },
    {
      id: 'profit',
      label: 'Lợi nhuận ròng',
      value: FMT_VND(stats?.profit ?? 0),
      icon: TrendingUp,
      color: '#10b981',
      change: stats?.profit_change,
      up: (stats?.profit_change || '').startsWith('+'),
      extra: (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', marginBottom: '4px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            <span>Biên lợi nhuận</span>
            <span style={{ color: margin >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{margin.toFixed(1)}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--color-bg)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
              style={{ height: '100%', background: margin >= 20 ? 'var(--color-success)' : margin > 0 ? 'var(--color-primary)' : 'var(--color-danger)', borderRadius: 3 }} 
            />
          </div>
        </div>
      )
    },
    {
      id: 'leads',
      label: 'Lead mới',
      value: `${stats?.new_contacts ?? 0} lead`,
      icon: ShoppingCart,
      color: '#3b82f6',
      change: stats?.leads_change,
      up: (stats?.leads_change || '').startsWith('+')
    },
    {
      id: 'expenses',
      label: 'Chi phí & Hao hụt',
      value: FMT_VND(stats?.expenses ?? 0),
      icon: AlertTriangle,
      color: '#ef4444',
      change: stats?.expenses_change,
      up: (stats?.expenses_change || '').startsWith('+'),
      extra: (
        <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'var(--color-bg)', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Lợi nhuận ròng còn lại:</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: (stats?.profit ?? 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {FMT_VND(stats?.profit ?? 0)}
            </span>
          </div>
        </div>
      )
    },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800 }}>Báo cáo Tổng quan</h1>
          <p className="page-subtitle">Phân tích hiệu suất kinh doanh đến {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <div className="flex gap-3">
          <PeriodFilter
            value={period}
            onChange={(p, r) => { setPeriod(p); setDateRange(r); }}
          />
          <button
            className="btn outline"
            onClick={fetchAll}
            disabled={loadingStats}
            title="Làm mới dữ liệu"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.625rem 1.25rem', fontSize: '0.9375rem', borderRadius: 'var(--radius-xl)' }}
          >
            <RefreshCw size={16} style={{ animation: loadingStats ? 'spin 1s linear infinite' : 'none' }} />
            Làm mới
          </button>
          <button className="btn outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.625rem 1.25rem', fontSize: '0.9375rem', borderRadius: 'var(--radius-xl)' }}><Download size={18} /> Xuất PDF</button>
        </div>
      </div>

      {/* Alert / Today's Focus */}
      {(() => {
        const tasksToday = DEV_MODE
          ? useMockStore.getState().activities.filter((a: any) => a.status === 'planned' && a.due_date && new Date(a.due_date).toDateString() === new Date().toDateString())
          : (stats?.today_tasks || []);

        if (tasksToday.length === 0 && (stats?.tasks_due_today ?? 0) === 0) return null;

        return (
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(139, 92, 246, 0.08))', border: '1px solid rgba(124, 58, 237, 0.15)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ width: 36, height: 36, background: 'var(--color-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={18} color="white" fill="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--color-primary)' }}>Tiêu điểm công việc hôm nay</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginTop: '2px' }}>
                  Có <strong>{tasksToday.length || stats?.tasks_due_today}</strong> hoạt động cần bạn xử lý trong ngày {new Date().toLocaleDateString('vi-VN')}
                  {stats?.overdue_tasks > 0 && <span style={{ color: 'var(--color-danger)', fontWeight: 700, marginLeft: '8px' }}>• {stats.overdue_tasks} việc quá hạn cần xử lý gấp!</span>}
                </p>
              </div>
              <button className="btn ghost sm" onClick={() => navigate('/activities')} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Tất cả hoạt động →</button>
            </div>

            {tasksToday.length > 0 && (
              <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                {tasksToday.map((task: any) => (
                  <motion.div
                    key={task.id}
                    whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                    onClick={() => navigate('/activities')}
                    style={{
                      minWidth: 280,
                      padding: '1.25rem',
                      background: 'var(--color-surface)',
                      borderRadius: 'var(--radius-xl)',
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: task.priority === 'high' ? '#ef4444' : '#7c3aed' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--color-bg)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={16} />
                      </div>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        {task.due_date ? new Date(task.due_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Cả ngày'}
                      </span>
                      <span className="badge" style={{ fontSize: '0.65rem', marginLeft: 'auto', background: 'var(--color-bg)', color: '#7c3aed', border: 'none' }}>{task.type}</span>
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.subject}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={12} /> {task.priority === 'high' ? 'Ưu tiên cao' : 'Bình thường'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>Mở →</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* KPI Cards — Simple & Standard */}
      <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              className="stat-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                if (card.id === 'leads' || card.label.includes('Lead')) navigate('/contacts');
                if (card.id === 'revenue' || card.label.includes('Doanh thu')) navigate('/reports');
                if (card.id === 'expenses' || card.label.includes('Chi phí')) {
                  navigate('/expenses', { state: { period, dateRange } });
                }
                if (card.id === 'profit' || card.label.includes('Lợi nhuận')) navigate('/reports');
              }}
              style={{ cursor: 'pointer', minHeight: '140px', display: 'flex', flexDirection: 'column' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="stat-label">{card.label}</span>
                <div style={{ color: card.color, opacity: 0.8 }}><Icon size={20} /></div>
              </div>
              
              {loadingStats ? (
                <Skeleton height="2rem" width="80%" />
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="stat-value" style={{ fontSize: '1.5rem' }}>{card.value}</div>
                  <div className={`stat-change ${card.up !== false ? 'up' : 'down'}`} style={{ marginBottom: card.extra ? '0' : '0.5rem' }}>
                    {card.up !== false ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {card.change || '+0%'}
                    <span style={{ color: 'var(--color-text-light)', marginLeft: '4px', fontWeight: 400 }}>so với kỳ trước</span>
                  </div>
                  {card.extra}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Revenue chart + Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Revenue */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Hiệu suất doanh thu</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginTop: '2px' }}>8 tháng gần nhất — đường Doanh thu vs Chi phí</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: 10, height: 10, background: '#7c3aed', borderRadius: 2 }}></span>Doanh thu</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: 10, height: 10, background: '#ef4444', borderRadius: 2, opacity: 0.7 }}></span>Chi phí</span>
            </div>
          </div>
          {loadingStats ? (
            <div style={{ height: 240, display: 'flex', alignItems: 'flex-end', gap: '10px', padding: '1rem' }}>
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={`${Math.random() * 60 + 20}%`} width="100%" />)}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={revenueChart} margin={{ left: -10, right: 5 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={FMT} tick={{ fontSize: 10, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} width={38} />
                <Tooltip formatter={(v: any, name: any) => [FMT_VND(Number(v || 0)), name === 'revenue' ? 'Doanh thu' : 'Chi phí']} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '0.8125rem' }} />
                <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={3} fill="url(#revGrad)" dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                {revenueChart[0]?.cost !== undefined && (
                  <Bar dataKey="cost" fill="#ef4444" fillOpacity={0.5} radius={[3, 3, 0, 0]} barSize={12} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pipeline stages */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Pipeline Stages</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '1rem' }}>Số deal & giá trị theo giai đoạn</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pipelineFunnel.map((stage: any) => {
              const maxCount = Math.max(...pipelineFunnel.map((s: any) => Number(s.deal_count)));
              const pct = maxCount > 0 ? (Number(stage.deal_count) / maxCount * 100) : 0;
              return (
                <div key={stage.id || stage.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{stage.name}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{stage.deal_count} · {FMT(Number(stage.total_value))}</span>
                  </div>
                  <div style={{ height: 7, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: stage.color || '#7c3aed', borderRadius: 4, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3-column row: Leaderboard + Lead Sources + Activities */}
      <div style={{ display: 'grid', gridTemplateColumns: user?.role === 'sale' ? '1fr' : 'repeat(3, 1fr)', gap: '1.25rem' }}>

        {/* Sales Leaderboard */}
        {user?.role !== 'sale' && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '0.25rem' }}>
              <Trophy size={16} color="var(--color-warning)" /> Top Sales
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '1rem' }}>Doanh thu kỳ được chọn</p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {leaderboard.map((sale: any, i: number) => (
                <div key={sale.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: i < leaderboard.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar name={sale.full_name} src={sale.avatar_url} size={38} style={{ borderRadius: '10px' }} />
                    <div style={{ position: 'absolute', top: -5, right: -5, width: 20, height: 20, background: i === 0 ? 'var(--color-primary)' : i === 1 ? '#8b5cf6' : 'var(--color-border)', color: i < 2 ? 'white' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.65rem', borderRadius: '50%', border: '2px solid white', boxShadow: 'var(--shadow-sm)', zIndex: 1 }}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.3 }}>{sale.full_name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sale.won_count || 0} deals chốt</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.875rem' }}>{FMT(Number(sale.won_value || 0))}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lead Sources donut */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '0.25rem' }}>
            <Users size={16} color="var(--color-primary)" /> Nguồn khách hàng
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>Kỳ được chọn</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={leadSources} nameKey="source" dataKey="count" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4}>
                {leadSources.map((_: any, i: number) => <Cell key={i} fill={leadSources[i]?.color || '#6366f1'} />)}
              </Pie>
              <Tooltip formatter={(v: any, _: any, entry: any) => [`${v} liên hệ`, entry.payload.source]} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)', fontSize: '0.8125rem' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.25rem' }}>
            {leadSources.map((s: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, flex: 1 }}>{s.source}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tag Stats chart */}
        {user?.role !== 'sale' && (
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <TagIcon size={16} color="var(--color-primary)" /> Thống kê Tags
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginTop: '2px' }}>Leads có tag theo kỳ được chọn</p>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
                {tagStats.reduce((s, t) => s + t.count, 0)} tag-lead
              </span>
            </div>

            {loadingStats ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {[80, 60, 45, 35, 25].map((w, i) => <Skeleton key={i} height="28px" width={`${w}%`} />)}
              </div>
            ) : tagStats.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem', gap: '0.5rem' }}>
                <TagIcon size={32} style={{ opacity: 0.3 }} />
                <span>Chưa có tag nào trong kỳ này</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(180, tagStats.length * 34)}>
                <BarChart data={tagStats} layout="vertical" margin={{ left: 4, right: 30, top: 2, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="tag" tick={{ fontSize: 11, fill: 'var(--color-text)', fontWeight: 600 }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'var(--color-primary-light)' }}
                    formatter={(v: any) => [v + ' lead', 'Số lead']}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)', fontSize: '0.8125rem' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {tagStats.map((entry, i) => <Cell key={i} fill={entry.color || 'var(--color-primary)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
