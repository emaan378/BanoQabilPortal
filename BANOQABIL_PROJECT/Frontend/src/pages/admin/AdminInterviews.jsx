import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/Toast.jsx';
import Modal from '@/components/ui/Modal.jsx';
import PageHeader from '@/components/ui/PageHeader.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import FormField, { inputCls } from '@/components/ui/FormField.jsx';
import LoadingSpinner from '@/components/ui/LoadingSpinner.jsx';
import { interviewApi } from '@/lib/api.js';
import { MessageSquare, Search, Calendar, ChevronRight } from 'lucide-react';
import './AdminInterviews.css';

const interviewStatusConfig = {
  pending: { cls: 'AdminInterviews-badge--pending', label: 'Pending' },
  scheduled: { cls: 'AdminInterviews-badge--scheduled', label: 'Scheduled' },
  passed: { cls: 'AdminInterviews-badge--passed', label: 'Passed' },
  failed: { cls: 'AdminInterviews-badge--failed', label: 'Failed' },
};

const LIMIT = 20;

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminInterviews() {
  const toast = useToast();
  const [interviews, setInterviews] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, scheduled: 0, passed: 0, failed: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ interviewDate: '', interviewTime: '', interviewer: '' });
  const [resultForm, setResultForm] = useState({ result: 'passed', notes: '' });

  const query = useMemo(
    () => ({ status: filter === 'all' ? '' : filter, search: search.trim(), page, limit: LIMIT }),
    [filter, search, page]
  );

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await interviewApi.list(query);
      setInterviews(res.data || []);
      setCounts(res.counts || { all: 0, pending: 0, scheduled: 0, passed: 0, failed: 0 });
      setPagination(res.pagination || { page: 1, pages: 0, total: 0 });
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    const timer = setTimeout(() => fetchInterviews(), query.search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [query, fetchInterviews]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const changeFilter = (nextFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const openSchedule = (student) => {
    setSelected(student);
    setScheduleForm({ interviewDate: '', interviewTime: '', interviewer: '' });
    setScheduleOpen(true);
  };

  const openResult = (student) => {
    setSelected(student);
    setResultForm({ result: 'passed', notes: '' });
    setResultOpen(true);
  };

  const handleSchedule = async () => {
    if (!scheduleForm.interviewDate || !scheduleForm.interviewTime) { toast.error('Please fill date and time'); return; }
    setSubmitting(true);
    try {
      await interviewApi.schedule(selected._id, {
        scheduledAt: new Date(`${scheduleForm.interviewDate}T${scheduleForm.interviewTime}`).toISOString(),
        interviewer: scheduleForm.interviewer || undefined,
      });
      toast.success('Interview scheduled successfully');
      setScheduleOpen(false);
      fetchInterviews();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResult = async () => {
    setSubmitting(true);
    try {
      await interviewApi.recordResult(selected._id, resultForm.result === 'passed' ? 'Passed' : 'Failed', resultForm.notes || undefined);
      toast.success('Interview result saved successfully');
      setResultOpen(false);
      fetchInterviews();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="AdminInterviews-div-1">
      <PageHeader title="Interviews" subtitle="Schedule interviews and record interview results for students" />

      <div className="AdminInterviews-div-6">
        <div className="AdminInterviews-div-7"><Search className="AdminInterviews-search-8" /><input value={search} onChange={handleSearchChange} placeholder="Search by name, CNIC, or email..." className="AdminInterviews-input-9" /></div>
        <div className="AdminInterviews-div-10">{['all', 'pending', 'scheduled', 'passed', 'failed'].map((f) => <button key={f} onClick={() => changeFilter(f)} className={`AdminInterviews-filter-btn capitalize ${filter === f ? 'AdminInterviews-filter-btn--active' : ''}`}>{f} ({counts[f] || 0})</button>)}</div>
      </div>

      {error && (
        <div className="AdminInterviews-div-11">
          <div className="AdminInterviews-div-33">
            <div className="AdminInterviews-error-row">
              <p className="AdminInterviews-p-23">Unable to load interviews: {error}</p>
              <button onClick={fetchInterviews} className="AdminInterviews-retry-btn">Retry</button>
            </div>
          </div>
        </div>
      )}

      {loading && !error && interviews.length === 0 ? (
        <div className="AdminInterviews-div-11"><LoadingSpinner label="Loading interviews..." /></div>
      ) : !error && interviews.length === 0 ? (
        <div className="AdminInterviews-div-11"><EmptyState icon={MessageSquare} message="No students found." /></div>
      ) : !error ? (
        <div className="AdminInterviews-div-12">
          <div className="AdminInterviews-div-13">
            <table className="AdminInterviews-table-14">
              <thead><tr className="AdminInterviews-tr-15">{['Student', 'CNIC', 'Course', 'Test', 'Interview Status', 'Actions'].map((h) => <th key={h} className="AdminInterviews-th-16">{h}</th>)}</tr></thead>
              <tbody className="AdminInterviews-tbody-17">
                {interviews.map((s) => { const cfg = interviewStatusConfig[s.interviewStatus] || interviewStatusConfig.pending; const testPassed = s.testStatus === 'passed'; return (
                  <tr key={s._id} className="AdminInterviews-tr-18">
                    <td className="AdminInterviews-td-19"><div className="AdminInterviews-div-20"><div className="AdminInterviews-div-21">{(s.name || '?')[0]}</div><div><p className="AdminInterviews-p-22">{s.name}</p><p className="AdminInterviews-p-23">{s.phone || s.email || '—'}</p></div></div></td>
                    <td className="AdminInterviews-td-24">{s.cnic || '—'}</td>
                    <td className="AdminInterviews-td-24">{s.course || '—'}</td>
                    <td className="AdminInterviews-td-19">{testPassed ? <span className="AdminInterviews-span-25">Passed</span> : <span className="AdminInterviews-span-26">{s.testStatus || '—'}</span>}</td>
                    <td className="AdminInterviews-td-19"><span className={`AdminInterviews-badge ${cfg.cls}`}>{cfg.label}</span></td>
                    <td className="AdminInterviews-td-19"><div className="AdminInterviews-div-27">
                      {(s.interviewStatus === 'pending' || s.interviewStatus === 'failed') && testPassed && <button onClick={() => openSchedule(s)} className="AdminInterviews-button-28"><Calendar className="AdminInterviews-calendar-29" /> Schedule</button>}
                      {s.interviewStatus === 'scheduled' && <button onClick={() => openResult(s)} className="AdminInterviews-button-30"><MessageSquare className="AdminInterviews-calendar-29" /> Result</button>}
                      <button onClick={() => setSelected(s)} className="AdminInterviews-button-31">Details <ChevronRight className="AdminInterviews-chevronright-32" /></button>
                    </div></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="AdminInterviews-pagination">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1} className="AdminInterviews-page-btn">Previous</button>
              <div className="AdminInterviews-page-info">Page {pagination.page} of {pagination.pages} ({pagination.total} total)</div>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={pagination.page >= pagination.pages} className="AdminInterviews-page-btn">Next</button>
            </div>
          )}
        </div>
      ) : null}

      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Schedule Interview" icon={Calendar}>
        <div className="AdminInterviews-div-33">
          {selected && <div className="AdminInterviews-div-34"><div className="AdminInterviews-div-35">{(selected.name || '?')[0]}</div><div><p className="AdminInterviews-p-36">{selected.name}</p><p className="AdminInterviews-p-23">{selected.cnic}</p></div></div>}
          <div className="AdminInterviews-div-37">
            <FormField label="Interview Date" required><input type="date" value={scheduleForm.interviewDate} onChange={(e) => setScheduleForm({ ...scheduleForm, interviewDate: e.target.value })} className={inputCls} /></FormField>
            <FormField label="Interview Time" required><input type="time" value={scheduleForm.interviewTime} onChange={(e) => setScheduleForm({ ...scheduleForm, interviewTime: e.target.value })} className={inputCls} /></FormField>
          </div>
          <FormField label="Interviewer"><input type="text" value={scheduleForm.interviewer} onChange={(e) => setScheduleForm({ ...scheduleForm, interviewer: e.target.value })} className={inputCls} placeholder="e.g. Sir Bilal Hassan" /></FormField>
        </div>
        <div className="AdminInterviews-div-38">
          <button onClick={() => setScheduleOpen(false)} className="AdminInterviews-button-39">Cancel</button>
          <button onClick={handleSchedule} disabled={submitting} className="AdminInterviews-button-40">{submitting ? 'Scheduling...' : 'Schedule Interview'}</button>
        </div>
      </Modal>

      <Modal open={resultOpen} onClose={() => setResultOpen(false)} title="Record Interview Result" icon={MessageSquare}>
        <div className="AdminInterviews-div-33">
          {selected && <div className="AdminInterviews-div-34"><div className="AdminInterviews-div-41">{(selected.name || '?')[0]}</div><div><p className="AdminInterviews-p-36">{selected.name}</p><p className="AdminInterviews-p-23">{selected.cnic}</p></div></div>}
          <FormField label="Interview Result" required><select value={resultForm.result} onChange={(e) => setResultForm({ ...resultForm, result: e.target.value })} className={inputCls}><option value="passed">Passed</option><option value="failed">Failed</option></select></FormField>
          <FormField label="Notes / Feedback"><textarea rows={3} value={resultForm.notes} onChange={(e) => setResultForm({ ...resultForm, notes: e.target.value })} className={`${inputCls} AdminInterviews-textarea`} placeholder="Optional interview notes..." /></FormField>
        </div>
        <div className="AdminInterviews-div-38">
          <button onClick={() => setResultOpen(false)} className="AdminInterviews-button-39">Cancel</button>
          <button onClick={handleResult} disabled={submitting} className="AdminInterviews-button-42">{submitting ? 'Saving...' : 'Save Result'}</button>
        </div>
      </Modal>

      {selected && !scheduleOpen && !resultOpen && (
        <div className="AdminInterviews-div-43">
          <div className="AdminInterviews-div-44" onClick={() => setSelected(null)} />
          <div className="AdminInterviews-div-45">
            <div className="AdminInterviews-div-46"><div className="AdminInterviews-div-20"><MessageSquare className="AdminInterviews-messagesquare-47" /><h3 className="AdminInterviews-h3-48">Interview Details</h3></div><button onClick={() => setSelected(null)} className="AdminInterviews-button-49">&times;</button></div>
            <div className="AdminInterviews-div-50">
              <div className="AdminInterviews-div-51"><div className="AdminInterviews-div-52">{(selected.name || '?')[0]}</div><div><p className="AdminInterviews-p-53">{selected.name}</p><p className="AdminInterviews-p-23">{selected.cnic || 'No CNIC'}</p></div></div>
              <div className="AdminInterviews-div-54">
                <div><p className="AdminInterviews-p-23">Email</p><p className="AdminInterviews-p-55">{selected.email || '—'}</p></div>
                <div><p className="AdminInterviews-p-23">Phone</p><p className="AdminInterviews-p-55">{selected.phone || '—'}</p></div>
                <div><p className="AdminInterviews-p-23">Course</p><p className="AdminInterviews-p-55">{selected.course || '—'}</p></div>
                <div><p className="AdminInterviews-p-23">Test Status</p><span className={selected.testStatus === 'passed' ? 'AdminInterviews-span-25' : 'AdminInterviews-span-26'}>{selected.testStatus || '—'}</span></div>
                <div><p className="AdminInterviews-p-23">Interview Status</p><span className={`AdminInterviews-badge ${interviewStatusConfig[selected.interviewStatus]?.cls || ''}`}>{interviewStatusConfig[selected.interviewStatus]?.label || selected.interviewStatus}</span></div>
                <div><p className="AdminInterviews-p-23">Scheduled At</p><p className="AdminInterviews-p-55">{formatDateTime(selected.interview?.scheduledAt)}</p></div>
                <div><p className="AdminInterviews-p-23">Interviewer</p><p className="AdminInterviews-p-55">{selected.interview?.interviewer || '—'}</p></div>
                <div><p className="AdminInterviews-p-23">Remarks</p><p className="AdminInterviews-p-55">{selected.interview?.remarks || '—'}</p></div>
              </div>
              <div className="AdminInterviews-div-56">
                <p className="AdminInterviews-p-57">Actions</p>
                {(selected.interviewStatus === 'pending' || selected.interviewStatus === 'failed') && selected.testStatus === 'passed' && <button onClick={() => setScheduleOpen(true)} className="AdminInterviews-button-58"><Calendar className="AdminInterviews-calendar-59" /> Schedule Interview</button>}
                {selected.interviewStatus === 'scheduled' && <button onClick={() => setResultOpen(true)} className="AdminInterviews-button-60"><MessageSquare className="AdminInterviews-calendar-59" /> Record Result</button>}
                {selected.testStatus !== 'passed' && <div className="AdminInterviews-div-61"><p className="AdminInterviews-p-62">Student must pass the entry test before an interview can be scheduled.</p></div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
