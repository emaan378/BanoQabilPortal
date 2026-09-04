import { useEffect, useState } from 'react';
import { CalendarCheck, TrendingUp, ClipboardList, Clock, BookOpen } from 'lucide-react';
import './Dashboard.css';
import { portalApi } from '@/lib/api.js';

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([portalApi.student.dashboard(), portalApi.student.courses()])
      .then(([dashRes, courseRes]) => {
        if (!active) return;
        const d = dashRes?.data ?? {};
        const c = courseRes?.data?.data ?? courseRes?.data ?? {};
        setDashboard(d);
        setModules(c.modules || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const profile = dashboard?.profile;
  const batch = dashboard?.batch;
  const displayName = profile?.name || 'Student';
  const initials = displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const stats = dashboard?.stats || {};

  const cards = [
    { icon: CalendarCheck, label: 'Attendance', value: stats.attendanceRate != null ? `${stats.attendanceRate}%` : '—', sub: stats.attendanceSessions != null ? `${stats.attendanceSessions} sessions` : '', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueCls: 'text-emerald-700' },
    { icon: TrendingUp, label: 'Course Progress', value: stats.courseProgress != null ? `${stats.courseProgress}%` : '—', sub: modules.length ? `${modules.length} modules` : '', iconBg: 'bg-teal-100', iconColor: 'text-teal-600', valueCls: 'text-teal-700' },
    { icon: ClipboardList, label: 'Assignments', value: stats.pendingAssignments != null ? String(stats.pendingAssignments) : '—', sub: 'Pending', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', valueCls: 'text-amber-700' },
  ];

  const schedule = [];
  if (batch?.name) {
    schedule.push({ time: batch.time || '—', subject: batch.course || 'Course', room: batch.room || '—', detail: `${batch.days ? batch.days + ' · ' : ''}Batch ${batch.name}` });
  }

  if (loading) {
    return (
      <div className="Dashboard-div-1">
        <h1 className="Dashboard-h1-3">Asalam-o-Alaikum, loading...</h1>
      </div>
    );
  }

  return (
    <div className="Dashboard-div-1">
      <div className="Dashboard-div-2">
        <div>
          <h1 className="Dashboard-h1-3">Asalam-o-Alaikum, {displayName.split(' ')[0]}</h1>
          <p className="Dashboard-p-4">
            {batch ? `${batch.course} — ${batch.name} · ${profile?.campus || 'Bano Qabil Campus'}` : 'Your learning dashboard · Bano Qabil Campus'}
          </p>
        </div>
        <div className="Dashboard-div-5">
          <div className="Dashboard-div-6">{initials}</div>
          <span className="Dashboard-span-7">{displayName}</span>
        </div>
      </div>

      <div className="Dashboard-div-15">
        {cards.map((card) => (
          <div key={card.label} className="Dashboard-div-16">
            <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-4 h-4 ${card.iconColor}`} />
            </div>
            <p className="Dashboard-p-17">{card.label}</p>
            <p className={`text-xl font-extrabold ${card.valueCls}`}>{card.value}</p>
            <p className="Dashboard-p-18">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="Dashboard-div-19">
        <div className="Dashboard-div-20">
          <div className="Dashboard-div-21">
            <Clock className="Dashboard-clock-22" />
            <h2 className="Dashboard-h2-23">Class Schedule</h2>
          </div>
          {schedule.length === 0 ? (
            <div className="Dashboard-div-33">
              <div className="Dashboard-div-11">
                <p className="Dashboard-p-31">No batch schedule is linked to your account yet.</p>
              </div>
            </div>
          ) : (
            <div className="Dashboard-div-25">
              {schedule.map((cls) => (
                <div key={cls.subject + cls.time} className="Dashboard-div-26">
                  <div className="Dashboard-div-27">
                    <p className="Dashboard-p-28">{cls.time.split(' ')[0]}</p>
                    <p className="Dashboard-p-29">{cls.time.split(' ')[1]}</p>
                  </div>
                  <div className="Dashboard-div-30" />
                  <div className="Dashboard-div-11">
                    <p className="Dashboard-p-31">{cls.subject}</p>
                    <p className="Dashboard-p-32">{cls.room} · {cls.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="Dashboard-div-20">
          <div className="Dashboard-div-21">
            <BookOpen className="Dashboard-clock-22" />
            <h2 className="Dashboard-h2-23">Module Progress</h2>
          </div>
          {modules.length === 0 ? (
            <div className="Dashboard-div-33">
              <div className="Dashboard-div-11">
                <p className="Dashboard-p-31">No modules published yet.</p>
              </div>
            </div>
          ) : (
            <div className="Dashboard-div-33">
              {modules.map((mod) => (
                <div key={mod.module}>
                  <div className="Dashboard-div-34">
                    <span className="Dashboard-span-35">{mod.module}</span>
                    <span className={`text-xs font-bold ${mod.progress === 100 ? 'text-emerald-600' : mod.progress > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {mod.progress}%
                    </span>
                  </div>
                  <div className="Dashboard-div-36">
                    <div
                      className={`h-full rounded-full transition-all ${mod.progress === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                      style={{ width: `${mod.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
