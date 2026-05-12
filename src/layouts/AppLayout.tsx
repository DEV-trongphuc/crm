import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Briefcase, CalendarCheck,
  Package, BarChart3, Settings, LogOut, Menu, Search,
  ChevronLeft, Moon, Sun, Command, Plus, FileSpreadsheet, Wallet, LifeBuoy,
  Truck, ShoppingCart, Folder, Calendar, Layers, FileText, LayoutGrid, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { DEV_MODE } from '../config/env';
import { AlertToast } from '../components/ui/AlertToast';
import { POSModal } from '../components/ui/POSModal';
import { NotificationsDropdown } from '../components/ui/NotificationsDropdown';
import { GlobalSearchModal } from '../components/ui/GlobalSearchModal';
import { GlobalConfirmModal } from '../components/ui/GlobalConfirmModal';
import { CommandPalette } from '../components/ui/CommandPalette';
import { DemoIndicator } from '../components/ui/DemoIndicator';
import { QRCodeCallModal } from '../components/ui/QRCodeCallModal';
import { AdminProfileModal } from '../components/ui/AdminProfileModal';
import { AppLauncherModal } from '../components/ui/AppLauncherModal';
import styles from './AppLayout.module.css';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Tổng quan', end: true },
  { to: '/contacts', icon: Users, label: 'Khách hàng' },
  { to: '/companies', icon: Building2, label: 'Công ty' },
  { to: '/deals', icon: Briefcase, label: 'Pipeline' },
  { to: '/quotes', icon: FileText, label: 'Báo giá' },
  { to: '/activities', icon: CalendarCheck, label: 'Hoạt động' },
  { to: '/products', icon: Layers, label: 'Sản phẩm' },
  { to: '/suppliers', icon: Truck, label: 'Nhà cung cấp' },
  { to: '/inventory', icon: Package, label: 'Kho & Lô hàng' },
  { to: '/invoices', icon: FileSpreadsheet, label: 'Hóa đơn' },
  { to: '/expenses', icon: Wallet, label: 'Chi phí' },
  { to: '/files', icon: Folder, label: 'Tài liệu' },
  { to: '/tickets', icon: LifeBuoy, label: 'Hỗ trợ' },
  { to: '/reports', icon: BarChart3, label: 'Báo cáo' },
];

const MOCK_ADMIN = {
  id: 1,
  full_name: 'Phúc Trọng (Demo)',
  email: 'admin@minth.io',
  role: 'admin',
  tenant_name: 'Minth Corp',
  avatar_url: null
};

export const AppLayout: React.FC = () => {
  const { user: realUser, clearAuth } = useAuthStore();
  const user = DEV_MODE ? (realUser || MOCK_ADMIN) : realUser;
  const { addToast, showPOS, setShowPOS } = useUIStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  const handleLogout = () => {
    clearAuth();
    addToast('Đã đăng xuất thành công', 'info');
    navigate('/login');
  };

  const initials = user?.full_name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'U';

  return (
    <div className={styles.appContainer}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)} style={{ zIndex: 150 }} />
        )}
      </AnimatePresence>

      {/* Mobile Not Supported Overlay */}
      <div className={styles.mobileNotSupportedOverlay}>
        <div style={{ textAlign: 'center', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Hiện chưa hỗ trợ Mobile</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>Vui lòng sử dụng màn hình lớn hơn (PC, Laptop, hoặc Tablet xoay ngang) để có trải nghiệm sử dụng hệ thống quản trị CRM tốt nhất.</p>
        </div>
      </div>

      <DemoIndicator />
      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileVisible : ''}`}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logoIcon} onClick={() => setLauncherOpen(true)} style={{ cursor: 'pointer', overflow: 'hidden' }}>
            <img src="/LOGO.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {!collapsed && <span className={styles.logoText} onClick={() => setLauncherOpen(true)} style={{ cursor: 'pointer' }}>CRM System</span>}
        </div>

        <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)} title="Thu gọn sidebar">
          <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
        </button>
        {/* Nav Groups Scrollable */}
        <div className={styles.navScrollArea}>
          <div className={styles.navSection}>
            {!collapsed && <span className={styles.navGroupLabel}>CHỨC NĂNG CHÍNH</span>}
            {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => {
              // Role-based visibility for nav items
              if (user?.role === 'sale' && ['/reports', '/suppliers'].includes(to)) return null;
              if (user?.role === 'accountant' && !['/', '/invoices', '/expenses', '/reports', '/files'].includes(to)) return null;

              return (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                  title={collapsed ? label : undefined}
                  onClick={() => setMobileOpen(false)}>
                  <div className={styles.navIconBox}>
                    <Icon size={18} className={styles.navIcon} />
                  </div>
                  {!collapsed && <span className={styles.navLabel}>{label}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* FIXED FOOTER */}
        <div className={styles.sidebarFooter}>
          {user?.role !== 'sale' && (
            <NavLink to="/settings"
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              title={collapsed ? 'Cài đặt' : undefined}
              onClick={() => setMobileOpen(false)}>
              <div className={styles.navIconBox}>
                <Settings size={18} className={styles.navIcon} />
              </div>
              {!collapsed && <span className={styles.navLabel}>Cài đặt</span>}
            </NavLink>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className={styles.mainContent}>
        {/* TOPBAR */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={`${styles.iconBtn} ${styles.mobileMenuBtn}`} onClick={() => setMobileOpen(true)} title="Menu">
              <Menu size={20} />
            </button>
            <button className={`${styles.iconBtn} ${styles.desktopLauncherBtn}`} onClick={() => setLauncherOpen(true)} title="Trình khởi chạy">
              <LayoutGrid size={20} />
            </button>
            {/* Global Search trigger */}
            <button className={styles.searchTrigger} onClick={() => setSearchOpen(true)}>
              <Search size={16} />
              <span>Tìm kiếm toàn hệ thống...</span>
              <kbd className={styles.kbd}><Command size={12} />K</kbd>
            </button>
          </div>

          <div className={styles.topbarRight}>

            <button className={styles.iconBtn} onClick={toggleDark} title="Chế độ tối">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <NotificationsDropdown />
            <div className={styles.userAvatar} onClick={() => setProfileModalOpen(true)} style={{ cursor: 'pointer' }}>
              <div className="avatar-placeholder sm" style={{ background: '#7c3aed', fontSize: '0.7rem' }}>{initials}</div>
              <div className={styles.userMeta}>
                <span className={styles.topUserName}>{user?.full_name}</span>
                <span className={styles.topUserTenant}>{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className={styles.pageContent}>
          <Outlet />
        </main>
      </div>

      {/* BOTTOM NAVIGATION (MOBILE) */}
      <nav className={styles.bottomNav}>
        <NavLink to="/" className={({ isActive }) => `${styles.bottomNavItem} ${isActive ? styles.active : ''}`} end onClick={() => setMobileOpen(false)}>
          <LayoutDashboard size={20} />
          <span>Tổng quan</span>
        </NavLink>
        <NavLink to="/deals" className={({ isActive }) => `${styles.bottomNavItem} ${isActive ? styles.active : ''}`} onClick={() => setMobileOpen(false)}>
          <Briefcase size={20} />
          <span>Pipeline</span>
        </NavLink>
        <NavLink to="/contacts" className={({ isActive }) => `${styles.bottomNavItem} ${isActive ? styles.active : ''}`} onClick={() => setMobileOpen(false)}>
          <Users size={20} />
          <span>Khách hàng</span>
        </NavLink>
        <button className={styles.bottomNavItem} onClick={() => setMobileOpen(true)}>
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>

      {/* GLOBAL SEARCH MODAL */}
      <AnimatePresence>
        {searchOpen && <GlobalSearchModal onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      <GlobalConfirmModal />
      <AlertToast />

      {/* Global POS Modal */}
      <AnimatePresence>
        {showPOS && (
          <POSModal
            onClose={() => setShowPOS(false)}
            defaultContact={typeof showPOS === 'object' ? showPOS : null}
          />
        )}
      </AnimatePresence>
      <CommandPalette />
      <QRCodeCallModal />
      <AdminProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <AppLauncherModal isOpen={launcherOpen} onClose={() => setLauncherOpen(false)} items={NAV_ITEMS} />
    </div>
  );
};
