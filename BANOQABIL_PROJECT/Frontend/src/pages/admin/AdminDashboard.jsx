import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api.js';
import { useToast } from '@/components/ui/Toast.jsx';
import PageHeader from '@/components/ui/PageHeader.jsx';
import { Users, Shield, Building2, BookOpen, Layers, UserPlus, ClipboardCheck, Layers3, CreditCard, ChevronDown, X, Flag, Check } from 'lucide-react';
import { pipelineStages as regStages } from '@/data/mockData.js';
import './AdminDashboard.css';

const EMPTY_LISTS = {
  students: [],
  teachers: [],
  campuses: [],
  courses: [],
  batches: [],
  pendingRegistrations: [],
  pendingInterviews: [],
  pendingBatchAllocations: [],
  pendingFeePayments: [],
  studentFlags: [],
};

const stageLabel = (stage) => regStages.find((r) => r.key === stage)?.label || stage || '';

export default function AdminDashboard() {
  const toast = useToast();
  const [expandedCard, setExpandedCard] = useState(null);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCampuses: 0,
    totalCourses: 0,
    totalBatches: 0,
    pendingRegistrations: 0,
    pendingInterviews: 0,
    pendingBatchAllocations: 0,
    pendingFeePayments: 0,
    pendingFlags: 0,
  });
  const [lists, setLists] = useState(EMPTY_LISTS);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      const res = await dashboardApi.stats();
      setMetrics(res.metrics || {});
      setLists(res.lists || EMPTY_LISTS);
      setRecentRegistrations(res.recentRegistrations || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    const interval = setInterval(fetchDashboardStats, 30000);
    const onFocus = () => fetchDashboardStats();

    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const cards = [
    { icon: Users, label: 'Total Students', value: metrics.totalStudents, iconBg: 'emerald', data: lists.students, badge: (item) => stageLabel(item.stage) },
    { icon: Shield, label: 'Total Teachers', value: metrics.totalTeachers, iconBg: 'teal', data: lists.teachers, sub: (item) => item.specialization || item.email || '—' },
    { icon: Building2, label: 'Total Campuses', value: metrics.totalCampuses, iconBg: 'amber', data: lists.campuses, sub: (item) => item.city || item.address || '—' },
    { icon: BookOpen, label: 'Total Courses', value: metrics.totalCourses, iconBg: 'blue', data: lists.courses, sub: (item) => item.duration || item.campus || '—' },
    { icon: Layers, label: 'Total Batches', value: metrics.totalBatches, iconBg: 'purple', data: lists.batches, sub: (item) => `${item.course} · ${item.enrolled}/${item.capacity}` },
    { icon: UserPlus, label: 'Pending Registrations', value: metrics.pendingRegistrations, iconBg: 'slate', data: lists.pendingRegistrations, badge: (item) => stageLabel(item.stage) },
    { icon: ClipboardCheck, label: 'Pending Interviews', value: metrics.pendingInterviews, iconBg: 'orange', data: lists.pendingInterviews, badge: (item) => stageLabel(item.stage) },
    { icon: Layers3, label: 'Pending Batch Allocations', value: metrics.pendingBatchAllocations, iconBg: 'indigo', data: lists.pendingBatchAllocations, badge: (item) => stageLabel(item.stage) },
    { icon: CreditCard, label: 'Pending Fee Payments', value: metrics.pendingFeePayments, iconBg: 'red', data: lists.pendingFeePayments, badge: (item) => stageLabel(item.stage) },
    { icon: Flag, label: 'Teacher Flags', value: metrics.pendingFlags, iconBg: 'orange', data: lists.studentFlags, badge: (item) => `${item.studentName}`, isFlag: true },
  ];

  const toggleCard = (label) => {
    setExpandedCard((prev) => (prev === label ? null : label));
  };

  const resolveFlag = async (id) => {
    setResolvingId(id);
    try {
      await dashboardApi.resolveFlag(id);
      toast.success('Flag resolved');
      setLists((prev) => ({ ...prev, studentFlags: (prev.studentFlags || []).filter((f) => f._id !== id) }));
      setMetrics((prev) => ({ ...prev, pendingFlags: Math.max(0, (prev.pendingFlags || 0) - 1) }));
    } catch (err) {
      toast.error(err.message || 'Failed to resolve flag');
    } finally {
      setResolvingId(null);
    }
  };

  const renderRow = (card, item) => {
    const sub = card.sub ? card.sub(item) : (item.cnic || item.email || item.specialization || '—');
    const badgeText = card.badge ? card.badge(item) : null;
    return (
      <div key={item._id || item.id} className="AdminDashboard-row">
        <div className="AdminDashboard-row-avatar">{item.name ? item.name[0] : 'U'}</div>
        <div className="AdminDashboard-row-main">
          <p className="AdminDashboard-row-title">{item.name}</p>
          <p className="AdminDashboard-row-sub">{sub}</p>
        </div>
        {badgeText && <span className="AdminDashboard-row-badge">{badgeText}</span>}
      </div>
    );
  };

  const activeCard = cards.find((c) => c.label === expandedCard);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Connecting to Backend Database...</div>;
  }

  return (
    <div className="AdminDashboard-div-1">
      <PageHeader title="Dashboard" subtitle="Faisalabad Campus · Overview" />

      <div className="AdminDashboard-div-2">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => toggleCard(card.label)}
            className={`AdminDashboard-div-3 AdminDashboard-card-clickable ${expandedCard === card.label ? 'AdminDashboard-card-clickable--active' : ''}`}
          >
            <div className="AdminDashboard-card-top">
              <div className={`AdminDashboard-icon-wrap AdminDashboard-icon-wrap--${card.iconBg}`}>
                <card.icon className="AdminDashboard-icon" />
              </div>
              <ChevronDown className={`AdminDashboard-chevron ${expandedCard === card.label ? 'AdminDashboard-chevron--open' : ''}`} />
            </div>
            <p className="AdminDashboard-p-4">{card.label}</p>
            <p className="AdminDashboard-p-5">{card.value}</p>
          </button>
        ))}
      </div>

      {activeCard && (
        <div className="AdminDashboard-detail-panel">
          <div className="AdminDashboard-detail-header">
            <h2 className="AdminDashboard-h2-9">{activeCard.label}</h2>
            <button type="button" className="AdminDashboard-detail-close" onClick={() => setExpandedCard(null)}>
              <X className="AdminDashboard-detail-close-icon" />
            </button>
          </div>
          {activeCard.data.length === 0 ? (
            <p className="AdminDashboard-p-10">No records found in database.</p>
          ) : activeCard.isFlag ? (
            <div className="AdminDashboard-div-11">
              {activeCard.data.map((item) => (
                <div key={item._id || item.id} className="AdminDashboard-div-12">
                  <div className="AdminDashboard-div-13">{item.studentName ? item.studentName[0] : 'S'}</div>
                  <div className="AdminDashboard-div-14">
                    <p className="AdminDashboard-p-15">{item.studentName} <span className="AdminDashboard-p-16">· {item.rollNumber || '—'}</span></p>
                    <p className="AdminDashboard-p-16">
                      {item.batchName || '—'} · by {item.teacher?.name || 'Teacher'}
                    </p>
                    <p className="AdminDashboard-p-16" style={{ marginTop: '2px' }}>{item.reason}</p>
                  </div>
                  <button
                    type="button"
                    disabled={resolvingId === item._id}
                    onClick={() => resolveFlag(item._id)}
                    style={{ marginLeft: 'auto', background: 'teal', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    {resolvingId === item._id ? '…' : (<><Check size={14} /> Resolve</>)}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="AdminDashboard-div-11">
              {activeCard.data.map((item) => renderRow(activeCard, item))}
            </div>
          )}
        </div>
      )}

      <div className="AdminDashboard-div-6">
        <div className="AdminDashboard-div-7">
          <Users className="AdminDashboard-users-8" />
          <h2 className="AdminDashboard-h2-9">Recent Registrations</h2>
        </div>
        {recentRegistrations.length === 0 ? (
          <p className="AdminDashboard-p-10">No students registered yet.</p>
        ) : (
          <div className="AdminDashboard-div-11">
            {recentRegistrations.map((s) => (
              <div key={s._id || s.id} className="AdminDashboard-div-12">
                <div className="AdminDashboard-div-13">{s.name ? s.name[0] : 'S'}</div>
                <div className="AdminDashboard-div-14">
                  <p className="AdminDashboard-p-15">{s.name}</p>
                  <p className="AdminDashboard-p-16">{s.cnic || '—'}</p>
                </div>
                <span className="AdminDashboard-span-17">{stageLabel(s.stage) || 'pending'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
