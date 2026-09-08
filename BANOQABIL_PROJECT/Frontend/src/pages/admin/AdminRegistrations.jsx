import { useCallback, useEffect, useState } from 'react';
import { UserPlus, Search, Calendar, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast.jsx';
import { registrationApi } from '@/lib/api.js';
import './AdminRegistrations.css';

const pipelineStages = [
  { key: 'registered', label: 'Registered' },
  { key: 'test-scheduled', label: 'Test Scheduled' },
  { key: 'interview-passed', label: 'Interview Passed' },
  { key: 'fee-verified', label: 'Fee Verified' },
  { key: 'enrolled', label: 'Enrolled' },
];

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
};

const toInputDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function AdminRegistrations() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await registrationApi.list({ search, page, limit: 20 });
      setRegistrations(response.data || []);
      setPagination(response.pagination || { page: 1, pages: 0, total: 0 });
    } catch (error) {
      toast.error(error.status === 401 ? 'Please log in again.' : error.message);
    } finally {
      setLoading(false);
    }
  }, [search, page, toast]);

  useEffect(() => {
    const timer = setTimeout(loadRegistrations, 300);
    return () => clearTimeout(timer);
  }, [loadRegistrations]);

  const openRegistration = async (registration) => {
    setSelected(registration);
    try {
      const response = await registrationApi.get(registration._id);
      setSelected(response.data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const runAction = async (action, successMessage) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const response = await action();
      setSelected(response.data);
      setRegistrations((prev) => prev.map((item) => item._id === response.data._id ? response.data : item));
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleTest = () => {
    const current = toInputDateTime(selected?.test?.scheduledAt);
    const value = window.prompt('Enter test date/time (YYYY-MM-DDTHH:mm)', current || '2026-08-15T10:00');
    if (!value) return;
    runAction(() => registrationApi.scheduleTest(selected._id, new Date(value).toISOString()), 'Entry test scheduled');
  };

  const handleAdvance = (nextStage) => {
    runAction(() => registrationApi.advanceStage(selected._id, nextStage), 'Pipeline stage updated');
  };

  return (
    <div className="AdminRegistrations-div-1">
      <div>
        <h1 className="AdminRegistrations-h1-2">Student Lifecycle Management</h1>
        <p className="AdminRegistrations-p-3">Review applications, schedule tests, and track pipeline stages</p>
      </div>

      <div className="AdminRegistrations-div-5">
        <Search className="AdminRegistrations-search-6" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, CNIC, or registration ID..."
          className="AdminRegistrations-input-7"
        />
      </div>

      <div className="AdminRegistrations-div-8">
        <div className="AdminRegistrations-div-9">
          <table className="AdminRegistrations-table-10">
            <thead>
              <tr className="AdminRegistrations-tr-11">
                {['Reg ID', 'Name', 'CNIC', 'Course', 'Stage', 'Action'].map((h) => (
                  <th key={h} className="AdminRegistrations-th-12">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="AdminRegistrations-tbody-13">
              {loading ? (
                <tr><td colSpan="6" className="AdminRegistrations-loading"><Loader2 className="animate-spin" /> Loading registrations...</td></tr>
              ) : registrations.map((r) => (
                <tr key={r._id} className="AdminRegistrations-tr-14">
                  <td className="AdminRegistrations-td-15">{r.registrationId}</td>
                  <td className="AdminRegistrations-td-16">
                    <p className="AdminRegistrations-p-17">{r.name}</p>
                    <p className="AdminRegistrations-p-18">{r.phone}</p>
                  </td>
                  <td className="AdminRegistrations-td-19">{r.cnic}</td>
                  <td className="AdminRegistrations-td-19">{r.course}</td>
                  <td className="AdminRegistrations-td-16">
                    <span className={`AdminRegistrations-badge AdminRegistrations-badge--${r.stage}`}>
                      {pipelineStages.find((s) => s.key === r.stage)?.label || r.stage}
                    </span>
                  </td>
                  <td className="AdminRegistrations-td-16">
                    <button onClick={() => openRegistration(r)} className="AdminRegistrations-button-20">
                      Manage <ChevronRight className="AdminRegistrations-chevronright-21" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && registrations.length === 0 && (
          <div className="AdminRegistrations-div-22">No registrations match your filters.</div>
        )}
        {!loading && pagination.pages > 1 && (
          <div className="AdminRegistrations-pagination">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1} className="AdminRegistrations-page-btn">Previous</button>
            <div className="AdminRegistrations-page-info">Page {pagination.page} of {pagination.pages} ({pagination.total} total)</div>
            <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={pagination.page >= pagination.pages} className="AdminRegistrations-page-btn">Next</button>
          </div>
        )}
      </div>

      {selected && (
        <div className="AdminRegistrations-div-23">
          <div className="AdminRegistrations-div-24" onClick={() => setSelected(null)} />
          <div className="AdminRegistrations-div-25">
            <div className="AdminRegistrations-div-26">
              <div className="AdminRegistrations-div-27">
                <UserPlus className="AdminRegistrations-userplus-28" />
                <h3 className="AdminRegistrations-h3-29">Registration Details</h3>
              </div>
              <button onClick={() => setSelected(null)} className="AdminRegistrations-button-30">&times;</button>
            </div>

            <div className="AdminRegistrations-div-31">
              <div className="AdminRegistrations-div-32">
                <div className="AdminRegistrations-div-33">{selected.name?.[0]}</div>
                <div>
                  <p className="AdminRegistrations-p-34">{selected.name}</p>
                  <p className="AdminRegistrations-p-18">{selected.registrationId} · {formatDate(selected.createdAt)}</p>
                </div>
              </div>

              <div className="AdminRegistrations-div-35">
                <div><p className="AdminRegistrations-p-18">CNIC</p><p className="AdminRegistrations-p-36">{selected.cnic}</p></div>
                <div><p className="AdminRegistrations-p-18">Phone</p><p className="AdminRegistrations-p-36">{selected.phone}</p></div>
                <div><p className="AdminRegistrations-p-18">Course</p><p className="AdminRegistrations-p-36">{selected.course}</p></div>
                <div>
                  <p className="AdminRegistrations-p-18">Current Stage</p>
                  <span className={`AdminRegistrations-badge AdminRegistrations-badge--${selected.stage}`}>
                    {pipelineStages.find((s) => s.key === selected.stage)?.label || selected.stage}
                  </span>
                </div>
              </div>

              {selected.test?.scheduledAt && (
                <div className="AdminRegistrations-div-37">
                  <div className="AdminRegistrations-div-38">
                    <Calendar className="AdminRegistrations-calendar-39" />
                    <p className="AdminRegistrations-p-40">Entry Test</p>
                  </div>
                  <p className="AdminRegistrations-p-41">Scheduled: {formatDate(selected.test.scheduledAt)}</p>
                  {selected.test.score !== undefined && <p className="AdminRegistrations-p-42">Score: {selected.test.score}/100 · {selected.test.result}</p>}
                </div>
              )}

              {selected.interview?.scheduledAt && (
                <div className="AdminRegistrations-div-43">
                  <div className="AdminRegistrations-div-38">
                    <CheckCircle2 className="AdminRegistrations-checkcircle2-44" />
                    <p className="AdminRegistrations-p-45">Interview</p>
                  </div>
                  <p className="AdminRegistrations-p-46">Scheduled: {formatDate(selected.interview.scheduledAt)}</p>
                  {selected.interview.decision !== 'Awaiting' && <p className="AdminRegistrations-p-46">Decision: {selected.interview.decision}</p>}
                </div>
              )}

              <div className="AdminRegistrations-div-47">
                <p className="AdminRegistrations-p-48">Advance Stage</p>
                {pipelineStages.slice(0, -1).map((s, i) => {
                  const next = pipelineStages[i + 1];
                  if (selected.stage !== s.key) return null;
                  return (
                    <button key={next.key} disabled={actionLoading} onClick={() => handleAdvance(next.key)} className="AdminRegistrations-button-49">
                      {actionLoading ? <Loader2 className="animate-spin" /> : null}
                      Move to {next.label} <ChevronRight className="AdminRegistrations-chevronright-50" />
                    </button>
                  );
                })}
                {selected.stage === 'registered' && (
                  <button disabled={actionLoading} onClick={handleScheduleTest} className="AdminRegistrations-button-51">
                    <Calendar className="AdminRegistrations-chevronright-50" />
                    Schedule Entry Test
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
