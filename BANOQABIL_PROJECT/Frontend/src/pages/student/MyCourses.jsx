import { useEffect, useState } from 'react';
import { CheckCircle2, Lock, BookOpen } from 'lucide-react';
import './MyCourses.css';
import { portalApi } from '@/lib/api.js';

const statusText = { completed: 'Completed', active: 'In progress', locked: 'Locked' };

export default function MyCourses() {
  const [data, setData] = useState(null);
  const [batchName, setBatchName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    portalApi.student.courses().then((res) => {
      const d = res?.data?.data ?? res?.data ?? {};
      if (active) {
        setData(d);
        setBatchName(d?.batchName || '');
      }
    }).catch((e) => {
      if (active) setError(e.message || 'Unable to load courses');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const modules = data?.modules ?? [];
  const stats = data?.stats;

  return (
    <div className="MyCourses-div-1">
      <div>
        <h1 className="MyCourses-h1-2">My Courses</h1>
        <p className="MyCourses-p-3">
          {data?.course ? `${data.course}${batchName ? ` — Batch ${batchName}` : ''}` : 'Your enrolled courses'}
        </p>
      </div>

      {loading ? (
        <p className="MyCourses-p-3">Loading courses...</p>
      ) : error && modules.length === 0 ? (
        <p className="MyCourses-p-3">{error}</p>
      ) : modules.length === 0 ? (
        <p className="MyCourses-p-3">
          No course modules have been published yet. Module progress appears here once your teacher
          publishes assignments.
        </p>
      ) : (
        <div className="MyCourses-div-4">
          <div className="MyCourses-div-5">
            <div className="MyCourses-div-6">
              <BookOpen className="MyCourses-bookopen-6" />
              <h2 className="MyCourses-h2-7">Module Breakdown</h2>
            </div>
            <div className="MyCourses-div-8">
              {modules.map((mod, i) => (
                <div key={mod.module + i} className="MyCourses-div-9">
                  <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                    mod.status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : mod.status === 'active'
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {mod.status === 'completed' ? (
                      <CheckCircle2 className="MyCourses-checkcircle2-10" />
                    ) : mod.status === 'locked' ? (
                      <Lock className="MyCourses-lock-11" />
                    ) : (
                      i + 1
                    )}
                  </div>

                  <div className="MyCourses-div-12">
                    <div className="MyCourses-div-13">
                      <p className="MyCourses-p-14">{mod.module}</p>
                      <span className={`text-xs font-bold ml-4 ${
                        mod.status === 'completed'
                          ? 'text-emerald-600'
                          : mod.status === 'active'
                          ? 'text-amber-600'
                          : 'text-slate-400'
                      }`}>
                        {mod.progress}%
                      </span>
                    </div>
                    <p className="MyCourses-p-15">
                      {mod.total} assignment{mod.total === 1 ? '' : 's'} · {mod.graded} graded ·{' '}
                      {statusText[mod.status] || mod.status}
                    </p>
                    <div className="MyCourses-div-16">
                      <div
                        className={`h-full rounded-full ${mod.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-400'}`}
                        style={{ width: `${mod.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && (stats || modules.length > 0) && (
        <div className="MyCourses-div-17">
          {[
            { label: 'Overall Progress', value: stats ? `${stats.overallProgress}%` : '—', sub: stats ? `${stats.lessonsCompleted} of ${stats.lessonsTotal} graded` : 'No modules yet' },
            { label: 'Modules', value: String(modules.length), sub: 'Course modules' },
            { label: 'Batch', value: batchName || '—', sub: data?.course || 'Course' },
          ].map((s) => (
            <div key={s.label} className="MyCourses-div-18">
              <p className="MyCourses-p-19">{s.label}</p>
              <p className="MyCourses-h1-2">{s.value}</p>
              <p className="MyCourses-p-20">{s.sub}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
