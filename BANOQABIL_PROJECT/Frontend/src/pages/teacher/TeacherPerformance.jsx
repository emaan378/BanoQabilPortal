import { Fragment, useEffect, useState } from 'react';
import {
  CalendarCheck,
  TrendingUp,
  ClipboardList,
  Flag,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Star,
  AlertTriangle,
} from 'lucide-react';
import './TeacherPerformance.css';
import { portalApi } from '@/lib/api.js';

const subStatusStyle = {
  submitted: { cls: 'text-amber-600 bg-amber-50', label: 'Submitted' },
  late: { cls: 'text-red-600 bg-red-50', label: 'Late' },
  graded: { cls: 'text-emerald-600 bg-emerald-50', label: 'Graded' },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function TeacherPerformance() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    portalApi.teacher.batches().then((res) => setBatches(res.data || [])).catch(() => {});
  }, []);

  const firstBatchId = batches[0]?._id || batches[0]?.id || '';

  useEffect(() => {
    if (!selectedBatch && firstBatchId) setSelectedBatch(firstBatchId);
  }, [firstBatchId, selectedBatch]);

  useEffect(() => {
    if (!selectedBatch) return;
    let active = true;
    setLoading(true);
    setData(null);
    setExpanded(null);
    portalApi.teacher.performance(selectedBatch)
      .then((res) => { if (active) setData(res.data); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedBatch]);

  const rows = data?.data || [];
  const submissionsMap = (row) => {
    const map = {};
    (row.submissions || []).forEach((s) => {
      const key = s.assignment?._id || s.assignment;
      map[key] = s;
    });
    return map;
  };

  const display = (v, suffix = '') => (v === null || v === undefined ? '—' : `${v}${suffix}`);

  return (
    <div className="TeacherPerformance-div-1">
      <div className="TeacherPerformance-head">
        <div>
          <h1 className="TeacherPerformance-h1">Student Performance</h1>
          <p className="TeacherPerformance-p-sub">Attendance, grades, and assignment completion per student.</p>
        </div>
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="TeacherPerformance-select"
        >
          {batches.length === 0 && <option value="">No batches assigned</option>}
          {batches.map((b) => (
            <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="TeacherPerformance-empty">Loading performance...</p>
      ) : !data ? (
        <p className="TeacherPerformance-empty">Select a batch to view student performance.</p>
      ) : rows.length === 0 ? (
        <p className="TeacherPerformance-empty">No students found in this batch.</p>
      ) : (
        <div className="TeacherPerformance-table-wrap">
          <table className="TeacherPerformance-table">
            <thead>
              <tr className="TeacherPerformance-tr-head">
                <th className="TeacherPerformance-th">Student</th>
                <th className="TeacherPerformance-th"><CalendarCheck className="TeacherPerformance-th-icon" />Attendance</th>
                <th className="TeacherPerformance-th"><TrendingUp className="TeacherPerformance-th-icon" />Avg Grade</th>
                <th className="TeacherPerformance-th"><ClipboardList className="TeacherPerformance-th-icon" />Assignments</th>
                <th className="TeacherPerformance-th">Status</th>
                <th className="TeacherPerformance-th" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const m = row.metrics || {};
                const isOpen = expanded === row.student._id;
                const byAssignment = submissionsMap(row);
                return (
                  <Fragment key={row.student._id}>
                    <tr className="TeacherPerformance-tr">
                      <td className="TeacherPerformance-td">
                        <div className="TeacherPerformance-student-cell">
                          <div className="TeacherPerformance-avatar">
                            {(row.student.name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="TeacherPerformance-student-name">{row.student.name}</p>
                            <p className="TeacherPerformance-student-sub">{row.student.rollNumber || row.student.registrationId || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="TeacherPerformance-td">
                        <span className="TeacherPerformance-metric">{display(m.attendanceRate, '%')}</span>
                        <span className="TeacherPerformance-metric-sub">{m.attendanceSessions ?? 0} sessions</span>
                      </td>
                      <td className="TeacherPerformance-td">
                        <span className="TeacherPerformance-metric">{display(m.averageGrade, '%')}</span>
                        <span className="TeacherPerformance-metric-sub">submissions {display(m.avgSubmissionGrade, '%')}</span>
                      </td>
                      <td className="TeacherPerformance-td">
                        <div className="TeacherPerformance-assign">
                          <span className="TeacherPerformance-assign-item"><CheckCircle2 className="TeacherPerformance-assign-icon emerald" />{m.graded ?? 0} graded</span>
                          <span className="TeacherPerformance-assign-item"><Clock className="TeacherPerformance-assign-icon amber" />{m.pending ?? 0} pending</span>
                        </div>
                        <span className="TeacherPerformance-metric-sub">{m.submitted ?? 0} of {m.totalAssignments ?? 0} submitted</span>
                      </td>
                      <td className="TeacherPerformance-td">
                        <div className="TeacherPerformance-status-cell">
                          {row.flags && (
                            <span className="TeacherPerformance-flag">
                              <Flag className="TeacherPerformance-flag-icon" />Flagged
                            </span>
                          )}
                          {m.attendanceRate != null && m.attendanceRate < 75 && (
                            <span className="TeacherPerformance-alert">
                              <AlertTriangle className="TeacherPerformance-alert-icon" />Low attendance
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="TeacherPerformance-td">
                        <button type="button" className="TeacherPerformance-expand" onClick={() => setExpanded(isOpen ? null : row.student._id)}>
                          {isOpen ? <ChevronUp className="TeacherPerformance-expand-icon" /> : <ChevronDown className="TeacherPerformance-expand-icon" />}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="TeacherPerformance-tr detail">
                        <td className="TeacherPerformance-td-detail" colSpan="6">
                          <div className="TeacherPerformance-detail">
                            <div className="TeacherPerformance-detail-head">
                              <p className="TeacherPerformance-detail-title">Submitted Assignments</p>
                              <span className="TeacherPerformance-detail-sub">{row.student.name}</span>
                            </div>
                            {(row.submissions || []).length === 0 ? (
                              <p className="TeacherPerformance-empty">No submissions yet for this student.</p>
                            ) : (
                              <div className="TeacherPerformance-subs">
                                {(data.assignments || []).map((assignment) => {
                                  const submission = byAssignment[assignment._id];
                                  const stat = subStatusStyle[submission?.status] || subStatusStyle.submitted;
                                  return (
                                    <div key={assignment._id} className="TeacherPerformance-sub">
                                      <div className="TeacherPerformance-sub-main">
                                        <div className="TeacherPerformance-sub-icon">
                                          <ClipboardList className="TeacherPerformance-sub-icon-svg" />
                                        </div>
                                        <div className="TeacherPerformance-sub-info">
                                          <p className="TeacherPerformance-sub-title">{assignment.title}</p>
                                          <p className="TeacherPerformance-sub-meta">
                                            {assignment.module || '—'} · Due {fmtDate(assignment.dueAt)} · {assignment.totalMarks} marks
                                          </p>
                                          {submission ? (
                                            <p className="TeacherPerformance-sub-meta">
                                              {submission.fileName ? `File: ${submission.fileName}` : ''}
                                              {submission.link ? ` Link: ${submission.link}` : ''}
                                              {submission.note ? ` · ${submission.note}` : ''}
                                            </p>
                                          ) : (
                                            <p className="TeacherPerformance-sub-meta">Not submitted</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="TeacherPerformance-sub-side">
                                        {submission ? (
                                          <span className={`TeacherPerformance-sub-status ${stat.cls}`}>{stat.label}</span>
                                        ) : (
                                          <span className="TeacherPerformance-sub-status text-slate-500 bg-slate-100">Missing</span>
                                        )}
                                        {submission?.status === 'graded' && submission.score !== undefined && (
                                          <span className="TeacherPerformance-sub-score">
                                            <Star className="TeacherPerformance-sub-score-icon" />
                                            {submission.score}/{assignment.totalMarks || 100}
                                          </span>
                                        )}
                                        {submission?.feedback && (
                                          <p className="TeacherPerformance-sub-feedback">{submission.feedback}</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
