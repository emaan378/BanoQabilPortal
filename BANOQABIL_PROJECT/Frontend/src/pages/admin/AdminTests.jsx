import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/Toast.jsx';
import Modal from '@/components/ui/Modal.jsx';
import PageHeader from '@/components/ui/PageHeader.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import FormField, { inputCls } from '@/components/ui/FormField.jsx';
import LoadingSpinner from '@/components/ui/LoadingSpinner.jsx';
import { testApi } from '@/lib/api.js';
import { ClipboardCheck, Search, Calendar, ChevronRight } from 'lucide-react';
import './AdminTests.css';

const testStatusConfig = {
  pending: { cls: 'AdminTests-badge--pending', label: 'Pending' },
  scheduled: { cls: 'AdminTests-badge--scheduled', label: 'Scheduled' },
  passed: { cls: 'AdminTests-badge--passed', label: 'Passed' },
  failed: { cls: 'AdminTests-badge--failed', label: 'Failed' },
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

const readableError = (error) => (Array.isArray(error.details) && error.details.length ? error.details.join(', ') : error.message);

export default function AdminTests() {
  const toast = useToast();
  const [tests, setTests] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, scheduled: 0, passed: 0, failed: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ testDate: '', testTime: '', testVenue: '' });
  const [gradeForm, setGradeForm] = useState({ score: '', result: 'passed' });

  const query = useMemo(
    () => ({ status: filter === 'all' ? '' : filter, search: search.trim(), page, limit: LIMIT }),
    [filter, search, page]
  );

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await testApi.list(query);
      setTests(res.data || []);
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
    const timer = setTimeout(() => fetchTests(), query.search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [query, fetchTests]);

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
    setScheduleForm({ testDate: '', testTime: '', testVenue: '' });
    setScheduleOpen(true);
  };

  const openGrade = (student) => {
    setSelected(student);
    setGradeForm({ score: '', result: 'passed' });
    setGradeOpen(true);
  };

  const handleSchedule = async () => {
    if (!scheduleForm.testDate || !scheduleForm.testTime) { toast.error('Please fill date and time'); return; }
    setSubmitting(true);
    try {
      await testApi.schedule(selected._id, {
        scheduledAt: new Date(`${scheduleForm.testDate}T${scheduleForm.testTime}`).toISOString(),
        venue: scheduleForm.testVenue || undefined,
      });
      toast.success('Test scheduled successfully');
      setScheduleOpen(false);
      fetchTests();
    } catch (err) {
      toast.error(readableError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async () => {
    const score = parseInt(gradeForm.score, 10);
    if (isNaN(score) || score < 0 || score > 100) { toast.error('Score must be between 0 and 100'); return; }
    setSubmitting(true);
    try {
      await testApi.recordResult(selected._id, score, gradeForm.result === 'passed' ? 'Passed' : 'Failed');
      toast.success('Test result saved successfully');
      setGradeOpen(false);
      fetchTests();
    } catch (err) {
      toast.error(readableError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="AdminTests-div-1">
      <PageHeader title="Entry Tests" subtitle="Schedule tests and record test results for students" />

      <div className="AdminTests-div-6">
        <div className="AdminTests-div-7"><Search className="AdminTests-search-8" /><input value={search} onChange={handleSearchChange} placeholder="Search by name, CNIC, or email..." className="AdminTests-input-9" /></div>
        <div className="AdminTests-div-10">{['all', 'pending', 'scheduled', 'passed', 'failed'].map((f) => <button key={f} onClick={() => changeFilter(f)} className={`AdminTests-filter-btn capitalize ${filter === f ? 'AdminTests-filter-btn--active' : ''}`}>{f} ({counts[f] || 0})</button>)}</div>
      </div>

      {error && (
        <div className="AdminTests-div-11">
          <div className="AdminTests-div-31">
            <p className="AdminTests-p-23">Unable to load tests: {error}</p>
            <button onClick={fetchTests} className="AdminTests-button-38">Retry</button>
          </div>
        </div>
      )}

      {loading && !error && tests.length === 0 ? (
        <div className="AdminTests-div-11"><LoadingSpinner label="Loading tests..." /></div>
      ) : !error && tests.length === 0 ? (
        <div className="AdminTests-div-11"><EmptyState icon={ClipboardCheck} message="No students found." /></div>
      ) : !error ? (
        <div className="AdminTests-div-12">
          <div className="AdminTests-div-13">
            <table className="AdminTests-table-14">
              <thead><tr className="AdminTests-tr-15">{['Student', 'CNIC', 'Course', 'Test Status', 'Actions'].map((h) => <th key={h} className="AdminTests-th-16">{h}</th>)}</tr></thead>
              <tbody className="AdminTests-tbody-17">
                {tests.map((s) => { const cfg = testStatusConfig[s.testStatus] || testStatusConfig.pending; return (
                  <tr key={s._id} className="AdminTests-tr-18">
                    <td className="AdminTests-td-19"><div className="AdminTests-div-20"><div className="AdminTests-div-21">{(s.name || '?')[0]}</div><div><p className="AdminTests-p-22">{s.name}</p><p className="AdminTests-p-23">{s.phone || s.email || '—'}</p></div></div></td>
                    <td className="AdminTests-td-24">{s.cnic || '—'}</td>
                    <td className="AdminTests-td-24">{s.course || '—'}</td>
                    <td className="AdminTests-td-19"><span className={`AdminTests-badge ${cfg.cls}`}>{cfg.label}</span></td>
                    <td className="AdminTests-td-19"><div className="AdminTests-div-25">
                      {(s.testStatus === 'pending' || s.testStatus === 'failed') && <button onClick={() => openSchedule(s)} className="AdminTests-button-26"><Calendar className="AdminTests-calendar-27" /> Schedule</button>}
                      {s.testStatus === 'scheduled' && <button onClick={() => openGrade(s)} className="AdminTests-button-28"><ClipboardCheck className="AdminTests-calendar-27" /> Grade</button>}
                      <button onClick={() => setSelected(s)} className="AdminTests-button-29">Details <ChevronRight className="AdminTests-chevronright-30" /></button>
                    </div></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="AdminTests-div-36">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1} className="AdminTests-button-37">Previous</button>
              <div className="AdminTests-p-23" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </div>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={pagination.page >= pagination.pages} className="AdminTests-button-37">Next</button>
            </div>
          )}
        </div>
      ) : null}

      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Schedule Entry Test" icon={Calendar}>
        <div className="AdminTests-div-31">
          {selected && <div className="AdminTests-div-32"><div className="AdminTests-div-33">{(selected.name || '?')[0]}</div><div><p className="AdminTests-p-34">{selected.name}</p><p className="AdminTests-p-23">{selected.cnic}</p></div></div>}
          <div className="AdminTests-div-35">
            <FormField label="Test Date" required><input type="date" value={scheduleForm.testDate} onChange={(e) => setScheduleForm({ ...scheduleForm, testDate: e.target.value })} className={inputCls} /></FormField>
            <FormField label="Test Time" required><input type="time" value={scheduleForm.testTime} onChange={(e) => setScheduleForm({ ...scheduleForm, testTime: e.target.value })} className={inputCls} /></FormField>
          </div>
          <FormField label="Venue / Lab"><input type="text" value={scheduleForm.testVenue} onChange={(e) => setScheduleForm({ ...scheduleForm, testVenue: e.target.value })} className={inputCls} placeholder="e.g. Lab 1" /></FormField>
        </div>
        <div className="AdminTests-div-36">
          <button onClick={() => setScheduleOpen(false)} className="AdminTests-button-37">Cancel</button>
          <button onClick={handleSchedule} disabled={submitting} className="AdminTests-button-38">{submitting ? 'Scheduling...' : 'Schedule Test'}</button>
        </div>
      </Modal>

      <Modal open={gradeOpen} onClose={() => setGradeOpen(false)} title="Record Test Result" icon={ClipboardCheck}>
        <div className="AdminTests-div-31">
          {selected && <div className="AdminTests-div-32"><div className="AdminTests-div-39">{(selected.name || '?')[0]}</div><div><p className="AdminTests-p-34">{selected.name}</p><p className="AdminTests-p-23">{selected.cnic}</p></div></div>}
          <FormField label="Test Score (0-100)" required><input type="number" min="0" max="100" value={gradeForm.score} onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })} className={inputCls} placeholder="e.g. 75" /></FormField>
          <FormField label="Result" required><select value={gradeForm.result} onChange={(e) => setGradeForm({ ...gradeForm, result: e.target.value })} className={inputCls}><option value="passed">Passed</option><option value="failed">Failed</option></select></FormField>
        </div>
        <div className="AdminTests-div-36">
          <button onClick={() => setGradeOpen(false)} className="AdminTests-button-37">Cancel</button>
          <button onClick={handleGrade} disabled={submitting} className="AdminTests-button-40">{submitting ? 'Saving...' : 'Save Result'}</button>
        </div>
      </Modal>

      {selected && !scheduleOpen && !gradeOpen && (
        <div className="AdminTests-div-41">
          <div className="AdminTests-div-42" onClick={() => setSelected(null)} />
          <div className="AdminTests-div-43">
            <div className="AdminTests-div-44"><div className="AdminTests-div-20"><ClipboardCheck className="AdminTests-clipboardcheck-45" /><h3 className="AdminTests-h3-46">Test Details</h3></div><button onClick={() => setSelected(null)} className="AdminTests-button-47">&times;</button></div>
            <div className="AdminTests-div-48">
              <div className="AdminTests-div-49"><div className="AdminTests-div-50">{(selected.name || '?')[0]}</div><div><p className="AdminTests-p-51">{selected.name}</p><p className="AdminTests-p-23">{selected.cnic || 'No CNIC'}</p></div></div>
              <div className="AdminTests-div-52">
                <div><p className="AdminTests-p-23">Email</p><p className="AdminTests-p-53">{selected.email || '—'}</p></div>
                <div><p className="AdminTests-p-23">Phone</p><p className="AdminTests-p-53">{selected.phone || '—'}</p></div>
                <div><p className="AdminTests-p-23">Course</p><p className="AdminTests-p-53">{selected.course || '—'}</p></div>
                <div><p className="AdminTests-p-23">Test Status</p><span className={`AdminTests-badge ${testStatusConfig[selected.testStatus]?.cls || ''}`}>{testStatusConfig[selected.testStatus]?.label || selected.testStatus}</span></div>
                <div><p className="AdminTests-p-23">Scheduled At</p><p className="AdminTests-p-53">{formatDateTime(selected.test?.scheduledAt)}</p></div>
                <div><p className="AdminTests-p-23">Venue / Lab</p><p className="AdminTests-p-53">{selected.test?.venue || '—'}</p></div>
                <div><p className="AdminTests-p-23">Score</p><p className="AdminTests-p-53">{selected.test?.score !== undefined && selected.test?.score !== null ? selected.test.score : '—'}</p></div>
              </div>
              <div className="AdminTests-div-54">
                <p className="AdminTests-p-55">Actions</p>
                {(selected.testStatus === 'pending' || selected.testStatus === 'failed') && <button onClick={() => openSchedule(selected)} className="AdminTests-button-56"><Calendar className="AdminTests-calendar-57" /> Schedule Test</button>}
                {selected.testStatus === 'scheduled' && <button onClick={() => openGrade(selected)} className="AdminTests-button-58"><ClipboardCheck className="AdminTests-calendar-57" /> Record Result</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
