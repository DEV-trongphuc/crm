import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Briefcase, CalendarCheck,
  Package, BarChart3, Settings, LogOut, Menu, Search,
  ChevronLeft, Moon, Sun, Command, Plus, FileSpreadsheet, Wallet, LifeBuoy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { AlertToast } from '../components/ui/AlertToast';
import { POSModal } from '../components/ui/POSModal';
import { NotificationsDropdown } from '../components/ui/NotificationsDropdown';
import { GlobalSearchModal } from '../components/ui/GlobalSearchModal';
import { GlobalConfirmModal } from '../components/ui/GlobalConfirmModal';
import { CommandPalette } from '../components/ui/CommandPalette';
import styles from './AppLayout.module.css';

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Tổng quan',     end: true },
  { to: '/contacts',  icon: Users,           label: 'Khách hàng' },
  { to: '/companies', icon: Building2,       label: 'Công ty' },
  { to: '/deals',     icon: Briefcase,       label: 'Pipeline' },
  { to: '/activities',icon: CalendarCheck,   label: 'Hoạt động' },
  { to: '/products',  icon: Package,         label: 'Sản phẩm' },
  { to: '/invoices',  icon: FileSpreadsheet, label: 'Hóa đơn & PO' },
  { to: '/expenses',  icon: Wallet,          label: 'Chi phí' },
  { to: '/tickets',   icon: LifeBuoy,        label: 'Hỗ trợ' },
  { to: '/reports',   icon: BarChart3,       label: 'Báo cáo' },
];

export const AppLayout: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const { addToast, showPOS, setShowPOS } = useUIStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const [searchOpen, setSearchOpen] = useState(false);
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

      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileVisible : ''}`}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>D</div>
          {!collapsed && <span className={styles.logoText}>Domation CRM</span>}
          <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)} title="Thu gọn sidebar">
            <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </button>
        </div>
        {/* Nav Groups */}
        <div className={styles.navSection}>
          {!collapsed && <span className={styles.navGroupLabel}>CHỨC NĂNG CHÍNH</span>}
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              title={collapsed ? label : undefined}
              onClick={() => setMobileOpen(false)}>
              <Icon size={20} className={styles.navIcon} />
              {!collapsed && <span className={styles.navLabel}>{label}</span>}
            </NavLink>
          ))}
        </div>

        {!collapsed && <div className={styles.navDivider} />}

        <div className={styles.navSection}>
          {!collapsed && <span className={styles.navGroupLabel}>HỆ THỐNG</span>}
          <NavLink to="/settings"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            onClick={() => setMobileOpen(false)}>
            <Settings size={20} className={styles.navIcon} />
            {!collapsed && <span className={styles.navLabel}>Cài đặt</span>}
          </NavLink>
        </div>

        {/* User Profile */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={`avatar-placeholder sm`} style={{ background: '#7c3aed', fontSize: '0.7rem' }}>{initials}</div>
            {!collapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.full_name || 'Admin'}</span>
                <span className={styles.userRole}>{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</span>
              </div>
            )}
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Đăng xuất">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className={styles.mainContent}>
        {/* TOPBAR */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.iconBtn} onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu size={20} />
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
              <div className={styles.userAvatar}>
                <div className="avatar-placeholder sm" style={{ background: '#7c3aed', fontSize: '0.7rem' }}>{initials}</div>
                <div className={styles.userMeta}>
                  <span className={styles.topUserName}>{user?.full_name}</span>
                  <span className={styles.topUserTenant}>{user?.tenant_name}</span>
                </div>
              </div>
            </div>
        </header>

        {/* PAGE CONTENT */}
        <main className={styles.pageContent}>
          <Outlet />
        </main>
      </div>

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
    </div>
  );
};
