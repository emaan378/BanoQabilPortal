import { useEffect, useState } from 'react';
import { Award, Download, Lock, GraduationCap } from 'lucide-react';
import './Certificates.css';
import { portalApi } from '@/lib/api.js';

const gradeLetter = (score, maxScore) => {
  if (!maxScore || !Number.isFinite(score)) return null;
  const pct = (score / maxScore) * 100;
  if (pct >= 80) return 'A';
  if (pct >= 65) return 'B';
  if (pct >= 50) return 'C';
  return 'D';
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function Certificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    portalApi.student.dashboard().then((res) => {
      const d = res?.data ?? {};
      if (active) {
        const grades = (d.grades || []).filter((g) => Number.isFinite(g.score) && g.maxScore > 0);
        setCerts(grades.map((g) => ({
          title: g.assessment || 'Assessment',
          date: g.recordedAt,
          grade: gradeLetter(g.score, g.maxScore),
          status: 'issued',
          score: `${g.score}/${g.maxScore}`,
        })));
      }
    }).catch((e) => {
      if (active) setError(e.message || 'Unable to load certificates');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const issued = certs.filter((c) => c.status === 'issued');

  return (
    <div className="Certificates-div-1">
      <div>
        <h1 className="Certificates-h1-2">Certificates</h1>
        <p className="Certificates-p-3">Your earned and in-progress certifications</p>
      </div>

      {loading ? (
        <p className="Certificates-p-3">Loading certificates...</p>
      ) : error && issued.length === 0 ? (
        <p className="Certificates-p-3">{error}</p>
      ) : issued.length === 0 ? (
        <>
          <div className="Certificates-div-4">
            {[
              { label: 'Issued', value: '0', color: 'text-emerald-600' },
              { label: 'In Progress', value: '—', color: 'text-amber-600' },
              { label: 'Locked', value: '—', color: 'text-slate-400' },
            ].map((s) => (
              <div key={s.label} className="Certificates-div-5">
                <p className="Certificates-p-6">{s.label}</p>
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="Certificates-empty">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="Certificates-p-14" style={{ textAlign: 'center' }}>
              No certificates yet. Your certificates will appear here once your assessments have
              been graded.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="Certificates-div-4">
            {[
              { label: 'Issued', value: String(issued.length), color: 'text-emerald-600' },
              { label: 'In Progress', value: '0', color: 'text-amber-600' },
              { label: 'Locked', value: '0', color: 'text-slate-400' },
            ].map((s) => (
              <div key={s.label} className="Certificates-div-5">
                <p className="Certificates-p-6">{s.label}</p>
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="Certificates-div-7">
            {certs.map((c) => {
              const issuedCert = c.status === 'issued';
              return (
                <div
                  key={c.title + (c.date || '')}
                  className={`bg-white rounded-2xl border shadow-sm p-5 transition-all border-emerald-200`}
                >
                  <div className="Certificates-div-8">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-600">
                      {issuedCert ? <Award className="Certificates-award-9" /> : <Lock className="Certificates-lock-10" />}
                    </div>
                    <div className="Certificates-div-12">
                      <p className="Certificates-p-13">{c.title}</p>
                      <p className="Certificates-p-14">
                        {issuedCert
                          ? `Issued on ${fmtDate(c.date)} · Grade: ${c.grade} (${c.score})`
                          : 'Complete previous modules to unlock'}
                      </p>
                    </div>
                    {issuedCert ? (
                      <button className="Certificates-button-15">
                        <Download className="Certificates-download-16" />
                        Download
                      </button>
                    ) : (
                      <span className="Certificates-span-17">Locked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
