import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, Flame, BarChart2, Briefcase, Zap, Hand, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import styles from './LoginPage.module.css';
import { DEV_MODE } from '../config/env';
import { useMockStore, getFilteredMockState } from '../store/mockStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const mockUsers = useMockStore(state => state.users);
  const [form, setForm] = useState({ email: 'admin@domation.crm', password: 'password' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMockLogin = (user: any) => {
    setAuth(user, 'mock_access_token', 'mock_refresh_token');
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.data.user, data.data.access_token, data.data.refresh_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <div className={styles.brandIcon} style={{ overflow: 'hidden' }}>
            <img src="/LOGO.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span className={styles.brandName}>CRM System</span>
        </div>
        <div className={styles.heroText}>
          <h1>Quản lý khách hàng<br />thông minh hơn.</h1>
          <p>Pipeline bán hàng, theo dõi khách hàng, và phân tích dữ liệu — tất cả trong một nền tảng.</p>
        </div>
        <div className={styles.featureList}>
          {[
            { icon: <Flame size={18} color="var(--color-warning)" />, text: 'Lead Heatmap thông minh' },
            { icon: <BarChart2 size={18} color="var(--color-primary)" />, text: 'Báo cáo doanh thu real-time' },
            { icon: <Briefcase size={18} color="var(--color-success)" />, text: 'Quản lý deal Kanban' },
            { icon: <Zap size={18} color="var(--color-info)" />, text: 'Automation workflow' }
          ].map(f => (
            <div key={f.text} className={styles.featureItem} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {f.icon} {f.text}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>Đăng nhập</h2>
            <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Chào mừng trở lại <Hand size={16} color="var(--color-warning)" />
            </p>
          </div>

          {error && <div className={styles.errorAlert}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="email" className={`form-input ${styles.inputPadded}`}
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="email@company.com" required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  type={showPw ? 'text' : 'password'} className={`form-input ${styles.inputPadded} ${styles.inputPaddedRight}`}
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.forgotRow}>
              <a href="#" className={styles.forgotLink}>Quên mật khẩu?</a>
            </div>

            <button type="submit" className={`btn primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : null}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
          {DEV_MODE && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <p style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                DEV MODE: Đăng nhập nhanh theo Role
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {mockUsers.map((u: any) => (
                  <button
                    key={u.id}
                    type="button"
                    className="btn outline"
                    onClick={() => handleMockLogin(u)}
                    style={{ justifyContent: 'flex-start', padding: '0.5rem 0.75rem', height: 'auto' }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem', overflow: 'hidden', flexShrink: 0 }}>
                      {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={16} />}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, lineHeight: 1.2 }}>{u.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Role: {u.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {!DEV_MODE && (
            <div className={styles.demoHint}>
              <p className="text-xs text-light" style={{ textAlign: 'center' }}>Demo: admin@domation.crm / password</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
