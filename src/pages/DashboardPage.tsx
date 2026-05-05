import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, Users, DollarSign, Download, Trophy,
  AlertTriangle, Tag as TagIcon, ShoppingCart
} from 'lucide-react';
import {
  Bar, BarChart, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, ComposedChart, Area
} from 'recharts';
import api from '../api/axios';
import styles from './DashboardPage.module.css';
import { motion } from 'framer-motion';
import { PeriodFilter, getDateRange } from '../components/ui/PeriodFilter';
import type { Period, DateRange } from '../components/ui/PeriodFilter';
import { DEV_MODE } from '../config/env';
import { useMockStore } from '../store/mockStore';
import { Skeleton } from '../components/ui/Skeleton';

/* ── Mock fallback data (cleared for production) ──────────────── */
const MOCK_REVENUE: any[] = [];
const MOCK_PIPELINE_FUNNEL: any[] = [];
const MOCK_SOURCES: any[] = [];
const MOCK_LEADERBOARD: any[] = [];
const MOCK_STATS = {
  total_value: 0, won_value: 0, expenses: 0,
  profit: 0, new_contacts: 0, tasks_due_today: 0,
};

/* ── Formatters ─────────────────────────────────────────────── */
const FMT = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'T';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toString();
};
const FMT_VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);


/* ── Component ──────────────────────────────────────────────── */
export const DashboardPage: React.FC = () => {
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

    // ── DEV MODE: skip API, load MOCK from Store ────────────────
    if (DEV_MODE) {
      const { expenses, contacts, deals, invoices } = useMockStore.getState();
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalWon = invoices.filter((i: any) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
      
      setStats({
        ...MOCK_STATS,
        expenses: totalExpenses,
        won_value: totalWon,
        profit: totalWon - totalExpenses,
        new_contacts: contacts.length,
        tasks_due_today: 0,
      });
      setRevenueChart([
        { month: 'T10', revenue: 450000000, cost: 30000000 },
        { month: 'T11', revenue: 520000000, cost: 35000000 },
        { month: 'T12', revenue: 480000000, cost: 32000000 },
        { month: 'T1',  revenue: 610000000, cost: 38000000 },
        { month: 'T2',  revenue: 550000000, cost: 40000000 },
        { month: 'T3',  revenue: 670000000, cost: 42000000 },
        { month: 'T4',  revenue: 1250000000, cost: 80000000 },
        { month: 'T5',  revenue: totalWon, cost: totalExpenses },
      ]);
      setPipelineFunnel([
        { name: 'Mới', deal_count: deals.filter((d:any)=>d.stage==='lead').length, total_value: deals.filter((d:any)=>d.stage==='lead').reduce((s,d)=>s+d.value,0), color: '#3b82f6' },
        { name: 'Đàm phán/Báo giá', deal_count: deals.filter((d:any)=>d.stage==='negotiation'||d.stage==='proposal').length, total_value: deals.filter((d:any)=>d.stage==='negotiation'||d.stage==='proposal').reduce((s,d)=>s+d.value,0), color: '#f59e0b' },
        { name: 'Thành công', deal_count: deals.filter((d:any)=>d.stage==='won').length, total_value: deals.filter((d:any)=>d.stage==='won').reduce((s,d)=>s+d.value,0), color: '#10b981' },
      ]);
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
    // ─────────────────────────────────────────────────────────────

    try {
      const [s, rev, pipe, src, lead, tags] = await Promise.all([
        api.get('/dashboard/stats',             { params: { from: dateRange.from, to: dateRange.to } }),
        api.get('/dashboard/chart-revenue',     { params: { months: 8 } }),
        api.get('/dashboard/pipeline-funnel'),
        api.get('/dashboard/lead-sources',      { params: { from: dateRange.from, to: dateRange.to } }),
        api.get('/dashboard/sales-leaderboard', { params: { from: dateRange.from, to: dateRange.to } }),
        api.get('/tags/stats',                  { params: { from: dateRange.from, to: dateRange.to } }),
      ]);
      setStats(s.data.data || null);
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

  const kpiCards = [
    { 
      label: 'Doanh thu', 
      value: FMT_VND(stats?.won_value ?? 0), 
      icon: DollarSign, 
      color: '#7c3aed', 
      sub: <><TrendingUp size={12} color="var(--color-success)"/> <span style={{color:'var(--color-success)', fontWeight:600}}>Tăng trưởng ổn định</span></>
    },
    { 
      label: 'Lợi nhuận gộp', 
      value: FMT_VND(stats?.profit ?? 0), 
      icon: TrendingUp, 
      color: '#10b981', 
      sub: <div style={{width:'100%'}}>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.7rem', marginBottom:4}}>
          <span>Biên lợi nhuận</span>
          <span style={{fontWeight:700, color:'var(--color-success)'}}>{stats?.won_value ? ((stats.profit / stats.won_value) * 100).toFixed(1) : 0}%</span>
        </div>
        <div className="stat-kpi__bar-wrap">
          <div className="stat-kpi__bar" style={{width: `${stats?.won_value ? (stats.profit / stats.won_value * 100) : 0}%`, background:'var(--color-success)'}} />
        </div>
      </div>
    },
    { 
      label: 'Lead mới', 
      value: `${stats?.new_contacts ?? 0} lead`, 
      icon: ShoppingCart, 
      color: '#3b82f6', 
      sub: <span>Khách hàng tiềm năng mới trong kỳ</span>
    },
    { 
      label: 'Chi phí & Hao hụt', 
      value: `- ${FMT_VND(stats?.expenses ?? 0)}`, 
      icon: AlertTriangle, 
      color: '#ef4444', 
      sub: <div style={{width:'100%'}}>
        <p style={{fontSize:'0.65rem', color:'var(--color-text-muted)', marginBottom:4}}>Bao gồm: Hao hụt kho & Phí vận hành</p>
        <p><strong>LN Ròng:</strong> <span style={{color:'var(--color-success)'}}>{FMT_VND((stats?.profit ?? 0) - (stats?.expenses ?? 0))}</span></p>
      </div>
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
          <button className="btn outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.625rem 1.25rem', fontSize: '0.9375rem', borderRadius: 'var(--radius-xl)' }}><Download size={18} /> Xuất PDF</button>
        </div>
      </div>

      {/* Alert */}
      {(stats?.tasks_due_today ?? 0) > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: 36, height: 36, background: 'rgba(245,158,11,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} color="var(--color-warning)" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-warning)' }}>Cần xử lý hôm nay</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '1px' }}>
              <strong>{stats.tasks_due_today}</strong> task đến hạn hôm nay · <strong>{stats.new_contacts}</strong> khách hàng mới trong kỳ
            </p>
          </div>
          <a href="/activities" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-warning)', textDecoration: 'none' }}>Xem ngay →</a>
        </div>
      )}

      {/* KPI Cards — unified stat-kpi, NO borders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {kpiCards.map((card, i) => (
          <motion.div key={i} className="stat-kpi" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div className="stat-kpi__header">
              <div className="stat-kpi__icon" style={{ background: `${card.color}12`, color: card.color }}>
                <card.icon size={16} />
              </div>
              <div className="stat-kpi__label">{card.label}</div>
            </div>
            {loadingStats
              ? <Skeleton height="2.5rem" width="80%" style={{ margin: '0.5rem 0' }} />
              : <div className="stat-kpi__value">{card.value}</div>}
            {loadingStats ? <Skeleton height="0.75rem" width="60%" /> : <div className="stat-kpi__sub">{card.sub}</div>}
          </motion.div>
        ))}
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
            <div style={{ height: 240, display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '1rem' }}>
              {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} height={`${Math.random() * 60 + 20}%`} width="100%" />)}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>

        {/* Sales Leaderboard */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '0.25rem' }}>
            <Trophy size={16} color="var(--color-warning)" /> Top Sales
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '1rem' }}>Doanh thu kỳ được chọn</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {leaderboard.map((sale: any, i: number) => (
              <div key={sale.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: i < leaderboard.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: '10px', background: i === 0 ? 'var(--color-primary)' : i === 1 ? '#8b5cf6' : 'var(--color-border)', color: i < 2 ? 'white' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
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
              {[80,60,45,35,25].map((w, i) => <Skeleton key={i} height="28px" width={`${w}%`} />)}
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
      </div>
    </div>
  );
};
