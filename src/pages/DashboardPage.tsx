import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, Users, DollarSign, Download, Phone, Mail, CheckSquare, FileText, ShoppingCart,
  AlertTriangle, Trophy
} from 'lucide-react';
import {
  Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, ComposedChart
} from 'recharts';
import api from '../api/axios';
import styles from './DashboardPage.module.css';
import { motion } from 'framer-motion';
import { PeriodFilter, getDateRange } from '../components/ui/PeriodFilter';
import type { Period, DateRange } from '../components/ui/PeriodFilter';
import { DEV_MODE } from '../config/env';

/* ── Mock fallback data (rich & realistic) ───────────────────── */
const MOCK_REVENUE = [
  { month: 'T11/24', revenue: 68000000, cost: 32000000 },
  { month: 'T12/24', revenue: 112000000, cost: 48000000 },
  { month: 'T1/25', revenue: 85000000, cost: 38000000 },
  { month: 'T2/25', revenue: 132000000, cost: 55000000 },
  { month: 'T3/25', revenue: 98000000, cost: 44000000 },
  { month: 'T4/25', revenue: 175000000, cost: 68000000 },
  { month: 'T5/25', revenue: 220000000, cost: 82000000 },
  { month: 'T6/25', revenue: 195000000, cost: 74000000 },
];

const MOCK_PIPELINE_FUNNEL = [
  { id: 1, name: 'Lead mới', deal_count: 42, total_value: 1850000000, color: '#6366f1' },
  { id: 2, name: 'Đã liên hệ', deal_count: 28, total_value: 1240000000, color: '#f59e0b' },
  { id: 3, name: 'Thương lượng', deal_count: 15, total_value: 820000000, color: '#8b5cf6' },
  { id: 4, name: 'Báo giá', deal_count: 9, total_value: 490000000, color: '#3b82f6' },
  { id: 5, name: 'Chốt hợp đồng', deal_count: 6, total_value: 320000000, color: '#10b981' },
];

const MOCK_SOURCES = [
  { source: 'Google Ads', count: 38, color: '#3b82f6' },
  { source: 'Facebook', count: 24, color: '#8b5cf6' },
  { source: 'Referral', count: 18, color: '#10b981' },
  { source: 'Cold Call', count: 12, color: '#f59e0b' },
  { source: 'Website', count: 8, color: '#ef4444' },
];

const MOCK_LEADERBOARD = [
  { id: 1, full_name: 'Nguyễn Văn An', won_count: 12, won_value: 450000000, avatar: 'A' },
  { id: 2, full_name: 'Trần Thị Bình', won_count: 9, won_value: 380000000, avatar: 'B' },
  { id: 3, full_name: 'Lê Hoàng Chính', won_count: 7, won_value: 210000000, avatar: 'C' },
  { id: 4, full_name: 'Phạm Minh Dũng', won_count: 5, won_value: 185000000, avatar: 'D' },
];

const MOCK_ACTIVITIES = [
  { id: 1, type: 'call', subject: 'Gọi tư vấn ERP cho ABC Technology', user_name: 'Admin', created_at: new Date(Date.now() - 600000).toISOString(), status: 'done' },
  { id: 2, type: 'meeting', subject: 'Demo sản phẩm CRM cho GreenSolar Corp', user_name: 'Sales Manager', created_at: new Date(Date.now() - 7200000).toISOString(), status: 'planned' },
  { id: 3, type: 'email', subject: 'Gửi báo giá dịch vụ tư vấn Q2/2026', user_name: 'Admin', created_at: new Date(Date.now() - 18000000).toISOString(), status: 'done' },
  { id: 4, type: 'task', subject: 'Chuẩn bị tài liệu demo POS nhà hàng', user_name: 'Sales', created_at: new Date(Date.now() - 86400000).toISOString(), status: 'planned' },
  { id: 5, type: 'note', subject: 'Ghi chú cuộc họp chiến lược Q2 với Ban Giám đốc', user_name: 'Admin', created_at: new Date(Date.now() - 172800000).toISOString(), status: 'done' },
];

const MOCK_STATS = {
  total_value: 1085000000, won_value: 320000000, expenses: 28200000,
  profit: 291800000, new_contacts: 14, tasks_due_today: 5,
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

const activityIcon: Record<string, React.ReactNode> = {
  call:    <Phone    size={16} color="var(--color-info)" />,
  email:   <Mail     size={16} color="var(--color-primary)" />,
  meeting: <Users    size={16} color="var(--color-warning)" />,
  task:    <CheckSquare size={16} color="var(--color-success)" />,
  note:    <FileText size={16} color="var(--color-text-light)" />,
};

/* ── Component ──────────────────────────────────────────────── */
export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [pipelineFunnel, setPipelineFunnel] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>('this_month');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('this_month'));
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoadingStats(true);

    // ── DEV MODE: skip API, load MOCK instantly ──────────────────
    if (DEV_MODE) {
      setStats(MOCK_STATS);
      setRevenueChart(MOCK_REVENUE);
      setPipelineFunnel(MOCK_PIPELINE_FUNNEL);
      setLeadSources(MOCK_SOURCES);
      setLeaderboard(MOCK_LEADERBOARD);
      setRecentActivities(MOCK_ACTIVITIES);
      setLoadingStats(false);
      return;
    }
    // ─────────────────────────────────────────────────────────────

    try {
      const [s, rev, pipe, src, lead, acts] = await Promise.all([
        api.get('/dashboard/stats',             { params: { from: dateRange.from, to: dateRange.to } }),
        api.get('/dashboard/chart-revenue',     { params: { months: 8 } }),
        api.get('/dashboard/pipeline-funnel'),
        api.get('/dashboard/lead-sources',      { params: { from: dateRange.from, to: dateRange.to } }),
        api.get('/dashboard/sales-leaderboard', { params: { from: dateRange.from, to: dateRange.to } }),
        api.get('/dashboard/recent-activities'),
      ]);
      setStats(s.data.data || MOCK_STATS);
      setRevenueChart(rev.data.data?.length ? rev.data.data : MOCK_REVENUE);
      setPipelineFunnel(pipe.data.data?.length ? pipe.data.data : MOCK_PIPELINE_FUNNEL);
      const srcColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];
      const srcData = src.data.data?.length
        ? src.data.data.map((x: any, i: number) => ({ ...x, color: srcColors[i % srcColors.length] }))
        : MOCK_SOURCES;
      setLeadSources(srcData);
      setLeaderboard(lead.data.data?.length ? lead.data.data : MOCK_LEADERBOARD);
      setRecentActivities(acts.data.data?.length ? acts.data.data : MOCK_ACTIVITIES);
    } catch {
      setStats(MOCK_STATS);
      setRevenueChart(MOCK_REVENUE);
      setPipelineFunnel(MOCK_PIPELINE_FUNNEL);
      setLeadSources(MOCK_SOURCES);
      setLeaderboard(MOCK_LEADERBOARD);
      setRecentActivities(MOCK_ACTIVITIES);
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
      label: 'Đơn & AOV', 
      value: `${stats?.won_count ?? 0} đơn`, 
      icon: ShoppingCart, 
      color: '#3b82f6', 
      sub: <span>TB/Đơn: <strong>{FMT_VND(stats?.won_count ? stats.won_value / stats.won_count : 0)}</strong></span> 
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
          <button className="btn secondary sm"><Download size={14} /> Xuất PDF</button>
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
              ? <div className="skeleton" style={{ height: 38, borderRadius: 6, width: '85%', marginBottom: 12 }} />
              : <div className="stat-kpi__value">{card.value}</div>}
            <div className="stat-kpi__sub">{card.sub}</div>
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
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={leadSources} nameKey="source" dataKey="count" cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={4}>
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

        {/* Recent Activities */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Nhật ký hoạt động</h3>
            <a href="/activities" style={{ color: 'var(--color-primary)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>Xem tất cả →</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
            {recentActivities.map((act: any) => {
              const ago = (() => {
                const diff = Date.now() - new Date(act.created_at).getTime();
                if (diff < 3600000) return `${Math.round(diff / 60000)} phút trước`;
                if (diff < 86400000) return `${Math.round(diff / 3600000)} giờ trước`;
                return `${Math.round(diff / 86400000)} ngày trước`;
              })();
              return (
                <div key={act.id} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '9px', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {activityIcon[act.type] || activityIcon.note}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{act.subject}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{act.user_name || act.user} · {ago}</p>
                  </div>
                  <span className={`badge ${act.status === 'done' ? 'success' : 'warning'}`} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                    {act.status === 'done' ? 'Xong' : 'Chờ'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
