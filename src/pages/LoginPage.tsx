import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, Flame, BarChart2, Briefcase, Zap, Hand } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: 'admin@domation.crm', password: 'password' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})}
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
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})}
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
          <div className={styles.demoHint}>
            <p className="text-xs text-light" style={{ textAlign: 'center' }}>Demo: admin@domation.crm / password</p>
          </div>
        </div>
      </div>
    </div>
  );
};
