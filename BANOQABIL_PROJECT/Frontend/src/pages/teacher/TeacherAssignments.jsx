import { ClipboardList, Download, Plus, Star, Upload, Paperclip, Link2, FileText, X, Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { portalApi, resolveFileUrl } from '@/lib/api.js';
import './TeacherAssignments.css';

const subStatusStyle = {
  pending: 'bg-amber-50 text-amber-600 border-amber-100',
  submitted: 'bg-amber-50 text-amber-600 border-amber-100',
  graded: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  late: 'bg-red-50 text-red-600 border-red-100',
};

const emptyForm = { title: '', module: '', batchId: '', totalMarks: 100, dueAt: '', description: '' };

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [grades, setGrades] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const [extendTarget, setExtendTarget] = useState(null);
  const [newDeadline, setNewDeadline] = useState('');
  const [extendError, setExtendError] = useState('');
  const [extending, setExtending] = useState(false);

  const loadAssignments = () => {
    portalApi.teacher.assignments()
      .then((response) => setAssignments(response.data?.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      portalApi.teacher.assignments(),
      portalApi.teacher.batches(),
    ])
      .then(([assignmentsRes, batchesRes]) => {
        const batchList = batchesRes.data || [];
        setAssignments(assignmentsRes.data?.data || []);
        setBatches(batchList);
        setForm((prev) => ({ ...prev, batchId: batchList[0]?._id || batchList[0]?.id || '' }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const [submissions, setSubmissions] = useState([]);
  const [gradingId, setGradingId] = useState(null);

  const setGrade = (id, field, value) => {
    setGrades((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const openReview = (assignment) => {
    setSelected(assignment);
    setSubmissions([]);
    portalApi.teacher.submissions(assignment._id)
      .then((response) => setSubmissions(response.data?.data || []))
      .catch(() => {});
  };

  const submitGrade = async (submissionId) => {
    const entry = grades[submissionId];
    if (!entry?.grade) return;
    setGradingId(submissionId);
    try {
      await portalApi.teacher.gradeSubmission(submissionId, { score: Number(entry.grade), feedback: entry.feedback || '' });
      const response = await portalApi.teacher.submissions(selected._id);
      setSubmissions(response.data?.data || []);
      loadAssignments();
    } catch (err) {
      setError(err.message || 'Failed to save grade.');
    } finally {
      setGradingId(null);
    }
  };

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setError('');
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setForm({ ...emptyForm, batchId: batches[0]?._id || batches[0]?.id || '' });
    setShowCreate(true);
  };

  const openExtendDeadline = (assignment) => {
    setExtendError('');
    setExtendTarget(assignment);
    const currentDate = assignment.dueAt ? new Date(assignment.dueAt).toISOString().split('T')[0] : '';
    setNewDeadline(currentDate);
  };

  const handleExtendDeadline = async () => {
    setExtendError('');
    if (!newDeadline) return setExtendError('Please select a new deadline.');
    if (new Date(newDeadline) <= new Date()) return setExtendError('New deadline must be in the future.');
    setExtending(true);
    try {
      await portalApi.teacher.updateAssignment(extendTarget._id, { dueAt: new Date(newDeadline).toISOString() });
      setExtendTarget(null);
      loadAssignments();
    } catch (err) {
      setExtendError(err.message || 'Failed to update deadline.');
    } finally {
      setExtending(false);
    }
  };

  const handlePublish = async () => {
    setError('');
    if (!form.title.trim()) return setError('Title is required.');
    if (!form.batchId) return setError('Please select a batch.');
    if (!form.dueAt) return setError('Deadline is required.');
    setSaving(true);
    try {
      const data = new FormData();
      data.append('title', form.title.trim());
      data.append('module', form.module);
      data.append('batchId', form.batchId);
      data.append('totalMarks', String(Number(form.totalMarks) || 100));
      data.append('dueAt', new Date(form.dueAt).toISOString());
      data.append('description', form.description || '');
      data.append('published', 'true');
      if (attachment) data.append('file', attachment);
      await portalApi.teacher.createAssignment(data);
      setShowCreate(false);
      setAttachment(null);
      setForm(emptyForm);
      loadAssignments();
    } catch (err) {
      setError(err.message || 'Failed to publish assignment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="TeacherAssignments-div-1">
      <div className="TeacherAssignments-div-2">
        <div>
          <h1 className="TeacherAssignments-h1-3">Assignments</h1>
          <p className="TeacherAssignments-p-4">Create tasks, review submissions, and grade work</p>
        </div>
        <button type="button" onClick={openCreate} className="TeacherAssignments-button-5"><Plus className="TeacherAssignments-plus-6" />Create Assignment</button>
      </div>

      <div className="TeacherAssignments-div-7">
        {loading && <p className="TeacherAssignments-p-15">Loading assignments…</p>}
        {!loading && assignments.length === 0 && <p className="TeacherAssignments-p-15">No assignments yet. Create one to get started.</p>}
        {assignments.map((a) => {
          const pending = a.pendingSubmissions ?? 0;
          const dueLabel = a.dueAt ? new Date(a.dueAt).toLocaleDateString() : '—';
          return (
            <div key={a._id} className="TeacherAssignments-div-8">
              <div className="TeacherAssignments-div-9">
                <div className="TeacherAssignments-div-10">
                  <div className="TeacherAssignments-div-11"><ClipboardList className="TeacherAssignments-clipboardlist-12" /></div>
                  <div className="TeacherAssignments-div-13"><p className="TeacherAssignments-p-14">{a.title}</p><p className="TeacherAssignments-p-15">{a.module || a.batchName} · Due {dueLabel} · {a.totalMarks} marks</p></div>
                </div>
                <button type="button" onClick={() => openReview(a)} className="TeacherAssignments-button-16">Review {pending > 0 ? `(${pending})` : ''} <Download className="TeacherAssignments-download-17" /></button>
                <button type="button" onClick={() => openExtendDeadline(a)} className="TeacherAssignments-extend-btn"><Clock className="TeacherAssignments-download-17" />Extend Deadline</button>
              </div>
              <div className="TeacherAssignments-div-18">
                <span className="TeacherAssignments-span-19">{pending > 0 ? `${pending} Pending` : 'No submissions yet'}</span>
                {a.attachmentUrl && (
                  <a className="TeacherAssignments-file-link" href={resolveFileUrl(a.attachmentUrl)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    <Paperclip className="TeacherAssignments-file-icon" />
                    {a.attachmentName || 'Attachment'}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="TeacherAssignments-div-22">
          <div className="TeacherAssignments-div-23" onClick={() => setSelected(null)} />
          <div className="TeacherAssignments-div-24">
            <div className="TeacherAssignments-div-25">
              <div className="TeacherAssignments-div-26"><ClipboardList className="TeacherAssignments-clipboardlist-12" /><h3 className="TeacherAssignments-h3-27">Review Submissions</h3></div>
              <button type="button"	 onClick={() => setSelected(null)} className="TeacherAssignments-button-28">&times;</button>
            </div>
            <div className="TeacherAssignments-div-29">
              <div className="TeacherAssignments-div-30"><p className="TeacherAssignments-h3-27">{selected.title}</p><p className="TeacherAssignments-p-31">{selected.module} · {selected.totalMarks} marks</p></div>
              <div className="TeacherAssignments-div-32">
                {submissions.length === 0 && <p className="TeacherAssignments-p-31">No submissions yet.</p>}
                {submissions.map((sub) => {
                  const name = sub.student?.name || 'Student';
                  const rollNo = sub.student?.rollNumber || '';
                  return (
                    <div key={sub._id} className="TeacherAssignments-div-33">
<div className="TeacherAssignments-div-34">
                          <div className="TeacherAssignments-div-26">
                            <div className="TeacherAssignments-div-35">{name[0]}</div>
                            <div><p className="TeacherAssignments-p-36">{name}</p><p className="TeacherAssignments-p-31">{rollNo}</p></div>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${subStatusStyle[sub.status] || subStatusStyle.pending}`}>{sub.status}</span>
                        </div>
                        {(sub.fileUrl || sub.link || sub.note) && (
                          <div className="TeacherAssignments-attachment">
                            {sub.fileUrl && (
                              <a className="TeacherAssignments-file-link" href={resolveFileUrl(sub.fileUrl)} target="_blank" rel="noreferrer">
                                <Paperclip className="TeacherAssignments-file-icon" />
                                {sub.originalName || 'View uploaded file'}
                              </a>
                            )}
                            {sub.link && (
                              <a className="TeacherAssignments-file-link" href={sub.link} target="_blank" rel="noreferrer">
                                <Link2 className="TeacherAssignments-file-icon" />
                                Submission link
                              </a>
                            )}
                            {sub.note && <p className="TeacherAssignments-note">{sub.note}</p>}
                          </div>
                        )}
                      {sub.status === 'graded' && sub.score !== undefined && (
                        <div className="TeacherAssignments-div-37">
                          <div className="TeacherAssignments-div-26"><Star className="TeacherAssignments-star-38" /><span className="TeacherAssignments-span-39">{sub.score}/{selected.totalMarks}</span></div>
                          {sub.feedback && <p className="TeacherAssignments-p-40">{sub.feedback}</p>}
                        </div>
                      )}
                      {sub.status !== 'graded' && (
                        <>
                          <a className="TeacherAssignments-button-41" href={resolveFileUrl(sub.fileUrl)} target="_blank" rel="noreferrer"><Download className="TeacherAssignments-download-42" />{sub.fileUrl ? 'Open / Download file' : 'No file uploaded'}</a>
                          <div className="TeacherAssignments-div-43">
                            <div className="TeacherAssignments-div-44">
                              <label className="TeacherAssignments-label-45">Grade (/{selected.totalMarks})</label>
                              <input type="number" min="0" max={selected.totalMarks} value={grades[sub._id]?.grade ?? ''} onChange={(e) => setGrade(sub._id, 'grade', e.target.value)} placeholder="0" className="TeacherAssignments-input-46" />
                            </div>
                            <div className="TeacherAssignments-div-47">
                              <label className="TeacherAssignments-label-45">Feedback</label>
                              <input type="text" value={grades[sub._id]?.feedback ?? ''} onChange={(e) => setGrade(sub._id, 'feedback', e.target.value)} placeholder="Optional comment..." className="TeacherAssignments-input-46" />
                            </div>
                          </div>
                          <button type="button" onClick={() => submitGrade(sub._id)} disabled={gradingId === sub._id} className="TeacherAssignments-button-48">{gradingId === sub._id ? 'Saving…' : 'Submit Grade'}</button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="TeacherAssignments-div-49">
          <div className="TeacherAssignments-div-23" htmlFor='title' />
          <div className="TeacherAssignments-div-50">
            <div className="TeacherAssignments-div-51">
              <div className="TeacherAssignments-div-26"><Plus className="TeacherAssignments-clipboardlist-12" /><h3 className="TeacherAssignments-h3-27">Create Assignment</h3></div>
              <button type="button" onClick={() => setShowCreate(false)} className="TeacherAssignments-button-28">&times;</button>
            </div>
            <div className="TeacherAssignments-div-52">
              {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
              <div><label className="TeacherAssignments-label-53" htmlFor='title'>Title</label><input type="text" id='title' value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="e.g. React Component — Todo App" className="TeacherAssignments-input-54" /></div>
              <div className="TeacherAssignments-div-55">
                <div><label className="TeacherAssignments-label-53" htmlFor='module'>Module</label><input type="text" id='module' value={form.module} onChange={(e) => updateForm('module', e.target.value)} placeholder="e.g. HTML/CSS" className="TeacherAssignments-input-54" /></div>
                <div><label className="TeacherAssignments-label-53" htmlFor='totalMarks'>Total Marks</label><input type="number" id='totalMarks' value={form.totalMarks} onChange={(e) => updateForm('totalMarks', e.target.value)} className="TeacherAssignments-input-54" /></div>
              </div>
              <div><label className="TeacherAssignments-label-53" htmlFor='batch'>Batch</label><select id='batch' value={form.batchId} onChange={(e) => updateForm('batchId', e.target.value)} className="TeacherAssignments-select-56">
                {batches.length === 0 && <option value="">No batches assigned</option>}
                {batches.map((b) => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
              </select></div>
              <div><label className="TeacherAssignments-label-53" htmlFor='deadline'>Deadline</label><input type="date" name='deadline' id='deadline'	 value={form.dueAt} onChange={(e) => updateForm('dueAt', e.target.value)} className="TeacherAssignments-input-54" /></div>
              <div><label className="TeacherAssignments-label-53" htmlFor='instructions'>Instructions</label><textarea id='instructions' rows={3} value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Describe the assignment requirements..." className="TeacherAssignments-textarea-57" /></div>
              <div><label className="TeacherAssignments-label-53" htmlFor='attachment'>Attachment (optional — PDF or ZIP)</label>
                <input ref={fileInputRef} type="file" accept=".pdf,.zip,application/pdf,application/zip" className="hidden" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="TeacherAssignments-button-58"><Upload className="TeacherAssignments-upload-59" /><span className="TeacherAssignments-span-60">{attachment ? 'Choose another file' : 'Upload PDF or ZIP'}</span></button>
                {attachment && (
                  <div className="TeacherAssignments-attachment-preview">
                    <span className="TeacherAssignments-file-link">
                      <FileText className="TeacherAssignments-file-icon" />
                      {attachment.name}
                      <span className="TeacherAssignments-attachment-meta">{(attachment.size / 1024).toFixed(0)} KB</span>
                    </span>
                    <button type="button" onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="TeacherAssignments-attachment-clear">
                      <X className="TeacherAssignments-file-icon" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="TeacherAssignments-div-61">
              <button type="button" onClick={() => setShowCreate(false)} className="TeacherAssignments-button-62">Cancel</button>
              <button type="button" onClick={handlePublish} disabled={saving} className="TeacherAssignments-button-63">{saving ? 'Publishing…' : 'Publish'}</button>
            </div>
          </div>
        </div>
      )}

      {extendTarget && (
        <div className="TeacherAssignments-div-49">
          <div className="TeacherAssignments-div-23" onClick={() => setExtendTarget(null)} />
          <div className="TeacherAssignments-div-50">
            <div className="TeacherAssignments-div-51">
              <div className="TeacherAssignments-div-26"><Clock className="TeacherAssignments-clipboardlist-12" /><h3 className="TeacherAssignments-h3-27">Extend Deadline</h3></div>
              <button type="button" onClick={() => setExtendTarget(null)} className="TeacherAssignments-button-28">&times;</button>
            </div>
            <div className="TeacherAssignments-div-52">
              {extendError && <p className="text-xs font-semibold text-red-600">{extendError}</p>}
              <div><p className="TeacherAssignments-p-14">{extendTarget.title}</p></div>
              <div className="TeacherAssignments-extend-current">
                <p className="TeacherAssignments-label-53">Current Deadline</p>
                <p className="TeacherAssignments-p-36">{extendTarget.dueAt ? new Date(extendTarget.dueAt).toLocaleDateString() : '—'}</p>
              </div>
              <div><label className="TeacherAssignments-label-53" htmlFor='newDeadline'>New Deadline</label><input type="date" id='newDeadline' value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="TeacherAssignments-input-54" /></div>
            </div>
            <div className="TeacherAssignments-div-61">
              <button type="button" onClick={() => setExtendTarget(null)} className="TeacherAssignments-button-62">Cancel</button>
              <button type="button" onClick={handleExtendDeadline} disabled={extending} className="TeacherAssignments-button-63">{extending ? 'Updating…' : 'Update Deadline'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}