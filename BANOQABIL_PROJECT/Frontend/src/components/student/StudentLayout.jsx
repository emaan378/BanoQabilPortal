import { useMemo, useState } from 'react';
import { GraduationCap, LayoutDashboard, BookOpen, CalendarCheck, ClipboardList, User, LogOut, Menu, X } from 'lucide-react';
import './StudentLayout.css';
import { clearAuthSession, getCurrentUser } from '@/lib/api.js';

const navItems = [
  { label: 'Dashboard', page: 'student-dashboard', icon: LayoutDashboard, group: 'LEARNING' },
  { label: 'My Courses', page: 'student-courses', icon: BookOpen, group: 'LEARNING' },
  { label: 'Attendance', page: 'student-attendance', icon: CalendarCheck, group: 'LEARNING' },
  { label: 'Assignments', page: 'student-assignments', icon: ClipboardList, group: 'LEARNING' },
  { label: 'Profile', page: 'student-profile', icon: User, group: 'ACCOUNT' },
];
const groups = ['LEARNING', 'ACCOUNT'];

const initials = (name = 'Student') => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

export default function StudentLayout({ children, currentPage, navigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getCurrentUser() || {};
  const displayName = user.name || 'Student';
  const badge = useMemo(() => initials(displayName), [displayName]);

  const signOut = () => {
    clearAuthSession();
    navigate('landing');
  };

  const SidebarContent = () => (
    <div className="StudentLayout-div-1">
      <div className="StudentLayout-div-2">
        <div className="StudentLayout-div-3">
          <img src="/logo.png" alt="Bano Qabil" className="StudentLayout-logo-4" />
          <span className="StudentLayout-span-6">Bano Qabil</span>
        </div>
      </div>
      <nav className="StudentLayout-nav-7" aria-label="Student navigation">
        {groups.map((group) => (
          <div key={group} className="StudentLayout-div-8">
            <p className="StudentLayout-p-9">{group}</p>
            {navItems.filter((item) => item.group === group).map((item) => {
              const active = currentPage === item.page;
              return (
                <button key={item.page} type="button" onClick={() => { navigate(item.page); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/60'}`}>
                  <item.icon className="StudentLayout-itemicon-10" />
                  {item.label}
                  {item.label === 'Assignments' && <span className="StudentLayout-span-11">VIEW</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="StudentLayout-div-13">
        <div className="StudentLayout-div-14">
          <div className="StudentLayout-div-15">{badge}</div>
          <div className="StudentLayout-div-16">
            <p className="StudentLayout-p-17">{displayName}</p>
            <p className="StudentLayout-p-18">{user.email || 'Student account'}</p>
          </div>
        </div>
        <button type="button" onClick={signOut} className="StudentLayout-button-19"><LogOut className="StudentLayout-logout-20" /> Sign Out</button>
      </div>
    </div>
  );

  return (
    <div className="StudentLayout-div-21">
      <aside className="StudentLayout-aside-22"><SidebarContent /></aside>
      {sidebarOpen && (
        <div className="StudentLayout-div-23">
          <div className="StudentLayout-div-24">
            <div className="StudentLayout-div-25"><button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X className="StudentLayout-x-26" /></button></div>
            <SidebarContent />
          </div>
          <div className="StudentLayout-div-27" onClick={() => setSidebarOpen(false)} />
        </div>
      )}
      <div className="StudentLayout-div-28">
        <div className="StudentLayout-div-29">
          <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu className="StudentLayout-menu-30" /></button>
          <div className="StudentLayout-div-3"><div className="StudentLayout-div-31"><GraduationCap className="StudentLayout-graduationcap-32" /></div><span className="StudentLayout-span-33">Student Portal</span></div>
        </div>
        <main className="StudentLayout-main-34">{children}</main>
      </div>
    </div>
  );
}
