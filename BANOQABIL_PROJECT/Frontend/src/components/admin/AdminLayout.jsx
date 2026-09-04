import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  UserPlus,
  ClipboardCheck,
  MessageSquare,
  Users,
  Shield,
  Building2,
  Layers,
  CreditCard,
  GraduationCap,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
  Globe,
  UsersRound,
} from 'lucide-react';
import { clearAuthSession, getCurrentUser } from '@/lib/api.js';
import './AdminLayout.css';

const navItems = [
  { label: 'Dashboard', page: 'admin-dashboard', icon: LayoutDashboard, group: 'OPERATIONS' },
  { label: 'Registrations', page: 'admin-registrations', icon: UserPlus, group: 'OPERATIONS' },
  { label: 'Entry Tests', page: 'admin-tests', icon: ClipboardCheck, group: 'OPERATIONS' },
  { label: 'Interviews', page: 'admin-interviews', icon: MessageSquare, group: 'OPERATIONS' },
  { label: 'Students', page: 'admin-students', icon: Users, group: 'OPERATIONS' },
  { label: 'Teachers', page: 'admin-teachers', icon: Shield, group: 'OPERATIONS' },
  // Super-admin only — a campus admin only ever manages their own (already-created) campus.
  { label: 'Campus Management', page: 'admin-campus', icon: Building2, group: 'OPERATIONS', superAdminOnly: true },
  { label: 'Batch Allocation', page: 'admin-batches', icon: Layers, group: 'OPERATIONS' },
  { label: 'Finance & Vouchers', page: 'admin-finance', icon: CreditCard, group: 'OPERATIONS' },
  // Super-admin only — website content is university-wide, not per-campus.
  { label: 'Website Content', page: 'admin-website', icon: Globe, group: 'OPERATIONS', superAdminOnly: true },
  { label: 'Reports', page: 'admin-reports', icon: BarChart3, group: 'ACADEMIC' },
  { label: 'Manage Users', page: 'admin-users', icon: UsersRound, group: 'ACADEMIC', superAdminOnly: true },
];

const groups = ['OPERATIONS', 'ACADEMIC'];

export default function AdminLayout({ children, currentPage, navigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getCurrentUser();
  const isSuperAdmin = user?.role === 'admin';
  const visibleNavItems = navItems.filter((item) => !item.superAdminOnly || isSuperAdmin);

  const handleSignOut = () => {
    clearAuthSession();
    navigate('landing');
  };

  const SidebarContent = () => (
    <div className="AdminLayout-div-1">
      <div className="AdminLayout-div-2">
        <div className="AdminLayout-div-3">
          <img src="/logo.png" alt="Bano Qabil" className="AdminLayout-logo-4" />
          <div>
            <span className="AdminLayout-span-6">Bano Qabil</span>
            <span className="AdminLayout-span-7">Admin ERP</span>
          </div>
        </div>
      </div>

      <nav className="AdminLayout-nav-8">
        {groups.map((group) => (
          <div key={group} className="AdminLayout-div-9">
            <p className="AdminLayout-p-10">{group}</p>
            {visibleNavItems
              .filter((i) => i.group === group)
              .map((item) => {
                const active = currentPage === item.page;
                return (
                  <button
                    key={item.page}
                    onClick={() => { navigate(item.page); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all ${
                      active
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    <item.icon className="AdminLayout-itemicon-11" />
                    {item.label}
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="AdminLayout-div-13">
        <div className="AdminLayout-div-14">
          <div className="AdminLayout-div-15">{isSuperAdmin ? 'SA' : 'CA'}</div>
          <div className="AdminLayout-div-16">
            <p className="AdminLayout-p-17">{isSuperAdmin ? 'Super Admin' : 'Campus Admin'}</p>
            <p className="AdminLayout-p-18">{user?.campus || (isSuperAdmin ? 'All Campuses' : '')}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="AdminLayout-button-19">
          <LogOut className="AdminLayout-logout-20" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="AdminLayout-div-21">
      <aside className="AdminLayout-aside-22"><SidebarContent /></aside>

      {sidebarOpen && (
        <div className="AdminLayout-div-23">
          <div className="AdminLayout-div-24">
            <div className="AdminLayout-div-25">
              <button onClick={() => setSidebarOpen(false)}><X className="AdminLayout-x-26" /></button>
            </div>
            <SidebarContent />
          </div>
          <div className="AdminLayout-div-27" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="AdminLayout-div-28">
        <header className="AdminLayout-div-29">
          <button onClick={() => setSidebarOpen(true)} className="AdminLayout-menu-btn">
            <Menu className="AdminLayout-menu-30" />
          </button>
        </header>
        <main className="AdminLayout-main-34">{children}</main>
      </div>
    </div>
  );
}
