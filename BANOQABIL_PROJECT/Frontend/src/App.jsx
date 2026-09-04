import { useEffect, useState } from 'react';
import { ADMIN_PAGES, TEACHER_PAGES } from '@/types.js';
import { ToastProvider } from '@/components/ui/Toast.jsx';
import LandingPage from '@/pages/LandingPage.jsx';
import PortalSelector from '@/pages/PortalSelector.jsx';
import StudentLogin from '@/pages/student/StudentLogin.jsx';
import StudentLayout from '@/components/student/StudentLayout.jsx';
import Dashboard from '@/pages/student/Dashboard.jsx';
import MyCourses from '@/pages/student/MyCourses.jsx';
import Attendance from '@/pages/student/Attendance.jsx';
import Assignments from '@/pages/student/Assignments.jsx';
import Profile from '@/pages/student/Profile.jsx';
import AdminLogin from '@/pages/admin/AdminLogin.jsx';
import AdminLayout from '@/components/admin/AdminLayout.jsx';
import AdminDashboard from '@/pages/admin/AdminDashboard.jsx';
import AdminRegistrations from '@/pages/admin/AdminRegistrations.jsx';
import AdminTests from '@/pages/admin/AdminTests.jsx';
import AdminInterviews from '@/pages/admin/AdminInterviews.jsx';
import AdminStudents from '@/pages/admin/AdminStudents.jsx';
import AdminStudentProfile from '@/pages/admin/AdminStudentProfile.jsx';
import AdminTeachers from '@/pages/admin/AdminTeachers.jsx';
import AdminCampus from '@/pages/admin/AdminCampus.jsx';
import AdminBatches from '@/pages/admin/AdminBatches.jsx';
import AdminFinance from '@/pages/admin/AdminFinance.jsx';
import AdminReports from '@/pages/admin/AdminReports.jsx';
import AdminWebsite from '@/pages/admin/AdminWebsite.jsx';
import AdminUsers from '@/pages/admin/AdminUsers.jsx';
import { getCurrentUser } from '@/lib/api.js';
import TeacherLogin from '@/pages/teacher/TeacherLogin.jsx';
import TeacherLayout from '@/components/teacher/TeacherLayout.jsx';
import TeacherDashboard from '@/pages/teacher/TeacherDashboard.jsx';
import TeacherAttendance from '@/pages/teacher/TeacherAttendance.jsx';
import TeacherAssignments from '@/pages/teacher/TeacherAssignments.jsx';
import TeacherGradebook from '@/pages/teacher/TeacherGradebook.jsx';
import TeacherPerformance from '@/pages/teacher/TeacherPerformance.jsx';
import TeacherNotices from '@/pages/teacher/TeacherNotices.jsx';
import { TeacherNoticesProvider } from '@/context/TeacherNoticesContext.jsx';

function StudentPage({ page }) {
  switch (page) {
    case 'student-dashboard': return <Dashboard />;
    case 'student-courses': return <MyCourses />;
    case 'student-attendance': return <Attendance />;
    case 'student-assignments': return <Assignments />;
    case 'student-profile': return <Profile />;
    default: return <Dashboard />;
  }
}

function AdminPage({ page, navigate }) {
  const isSuperAdmin = getCurrentUser()?.role === 'admin';
  switch (page) {
    case 'admin-dashboard': return <AdminDashboard />;
    case 'admin-registrations': return <AdminRegistrations />;
    case 'admin-tests': return <AdminTests />;
    case 'admin-interviews': return <AdminInterviews />;
    case 'admin-students': return <AdminStudents />;
    case 'admin-student-profile': return <AdminStudentProfile navigate={navigate} />;
    case 'admin-teachers': return <AdminTeachers />;
    // Campus Management & Website Content are super-admin only — a campus admin
    // is bounced back to their dashboard even if they reach this state directly.
    case 'admin-campus': return isSuperAdmin ? <AdminCampus navigate={navigate} /> : <AdminDashboard />;
    case 'admin-batches': return <AdminBatches />;
    case 'admin-finance': return <AdminFinance />;
    case 'admin-reports': return <AdminReports />;
    case 'admin-website': return isSuperAdmin ? <AdminWebsite /> : <AdminDashboard />;
    case 'admin-users': return isSuperAdmin ? <AdminUsers /> : <AdminDashboard />;
    default: return <AdminDashboard />;
  }
}

function TeacherPage({ page, navigate }) {
  switch (page) {
    case 'teacher-dashboard': return <TeacherDashboard navigate={navigate} />;
    case 'teacher-attendance': return <TeacherAttendance />;
    case 'teacher-assignments': return <TeacherAssignments />;
    case 'teacher-gradebook': return <TeacherGradebook />;
    case 'teacher-performance': return <TeacherPerformance />;
    case 'teacher-notices': return <TeacherNotices />;
    default: return <TeacherDashboard navigate={navigate} />;
  }
}

function AppContent() {
  const [page, setPage] = useState('landing');

  useEffect(() => {
    const handlePortalNavigation = (event) => {
      if (event.detail) setPage(event.detail);
    };
    window.addEventListener('bq:navigate', handlePortalNavigation);
    return () => window.removeEventListener('bq:navigate', handlePortalNavigation);
  }, []);

  if (page === 'landing') return <LandingPage navigate={setPage} />;
  if (page === 'portal-selector') return <PortalSelector navigate={setPage} />;
  if (page === 'student-login') return <StudentLogin navigate={setPage} />;
  if (page === 'admin-login') return <AdminLogin navigate={setPage} />;
  if (page === 'teacher-login') return <TeacherLogin navigate={setPage} />;

  if (ADMIN_PAGES.includes(page)) {
    return (
      <AdminLayout currentPage={page} navigate={setPage}>
        <AdminPage page={page} navigate={setPage} />
      </AdminLayout>
    );
  }

  if (TEACHER_PAGES.includes(page)) {
    return (
      <TeacherNoticesProvider>
        <TeacherLayout currentPage={page} navigate={setPage}>
          <TeacherPage page={page} navigate={setPage} />
        </TeacherLayout>
      </TeacherNoticesProvider>
    );
  }

  if (page.startsWith('student-')) {
    return (
      <StudentLayout currentPage={page} navigate={setPage}>
        <StudentPage page={page} />
      </StudentLayout>
    );
  }

  return <LandingPage navigate={setPage} />;
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
