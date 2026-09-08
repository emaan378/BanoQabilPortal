import { useEffect, useState } from 'react';
import { ClipboardList, Upload, CheckCircle2, Clock, AlertCircle, X, Link2, FileText, Paperclip } from 'lucide-react';
import './Assignments.css';
import { portalApi, resolveFileUrl } from '@/lib/api.js';

const statusMap = {
  submitted: { icon: Clock, cls: 'bg-blue-50 text-blue-600 border-blue-100', label: 'Submitted' },
  late: { icon: Clock, cls: 'bg-orange-50 text-orange-600 border-orange-100', label: 'Late' },
  graded: { icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Graded' },
  pending: { icon: AlertCircle, cls: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Pending' },
};

function deriveStatus(a) {
  const dueAt = new Date(a.dueAt);
  const isLate = !a.submission && dueAt < new Date();
  return isLate ? 'late' : a.submission ? a.submission.status : 'pending';
}

export default function Assignments() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(null);
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    portalApi.student.assignments().then((res) => {
      if (active) setList(res?.data?.data ?? res?.data ?? []);
    }).catch((e) => {
      if (active) setError(e.message || 'Unable to load assignments');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const counts = {
    submitted: list.filter((a) => deriveStatus(a) === 'submitted' || deriveStatus(a) === 'late').length,
    graded: list.filter((a) => deriveStatus(a) === 'graded').length,
    pending: list.filter((a) => deriveStatus(a) === 'pending').length,
  };

  const openSubmit = (assignment) => {
    setSubmitting(assignment);
    setLink('');
    setNote('');
    setSelectedFile(null);
  };

  const handleSubmit = async () => {
    if (!submitting) return;
    if (!selectedFile && !link && !note) { setError('Add a file or a link before submitting.'); return; }
    setBusy(true);
    setError('');
    try {
      await portalApi.student.submitAssignment(submitting._id, { file: selectedFile, link, note });
      const res = await portalApi.student.assignments();
      setList(res?.data?.data ?? res?.data ?? []);
      setSubmitting(null);
    } catch (e) {
      setError(e.message || 'Unable to submit assignment');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="Assignments-div-1">
      <div className="Assignments-head">
        <div>
          <h1 className="Assignments-h1-2">Assignments</h1>
          <p className="Assignments-p-3">Submit and track your coursework</p>
        </div>
      </div>

      <div className="Assignments-div-4">
        <div className="Assignments-div-5">
          <p className="Assignments-p-6">Submitted</p>
          <p className="text-2xl font-extrabold text-blue-600">{counts.submitted}</p>
        </div>
        <div className="Assignments-div-5">
          <p className="Assignments-p-6">Graded</p>
          <p className="text-2xl font-extrabold text-emerald-600">{counts.graded}</p>
        </div>
        <div className="Assignments-div-5">
          <p className="Assignments-p-6">Pending</p>
          <p className="text-2xl font-extrabold text-amber-600">{counts.pending}</p>
        </div>
      </div>

      {loading ? (
        <p className="Assignments-empty">Loading assignments...</p>
      ) : error && list.length === 0 ? (
        <p className="Assignments-empty">{error}</p>
      ) : list.length === 0 ? (
        <p className="Assignments-empty">No assignments published for your batch yet.</p>
      ) : (
        <div className="Assignments-div-7">
          {list.map((a) => {
            const status = deriveStatus(a);
            const s = statusMap[status];
            const grade = a.submission && a.submission.score != null ? `${a.submission.score}/${a.totalMarks ?? a.submission.maxScore ?? 100}` : null;
            return (
              <div key={a._id} className="Assignments-div-5">
                <div className="Assignments-div-8">
                  <div className="Assignments-div-9">
                    <div className="Assignments-div-10">
                      <ClipboardList className="Assignments-clipboardlist-11" />
                    </div>
                    <div className="Assignments-div-12">
                      <p className="Assignments-p-13">{a.title}</p>
                      <p className="Assignments-p-14">
                        {a.module ? `${a.module} · ` : ''}Due {new Date(a.dueAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      {a.attachmentUrl && (
                        <a className="Assignments-file-link" href={resolveFileUrl(a.attachmentUrl)} target="_blank" rel="noreferrer">
                          <Paperclip className="Assignments-sicon-17" />
                          {a.attachmentName || 'Attachment'}
                        </a>
                      )}
                      {a.submission && (
                        <div className="Assignments-files">
                          {a.submission.fileUrl && (
                            <a className="Assignments-file-link" href={resolveFileUrl(a.submission.fileUrl)} target="_blank" rel="noreferrer">
                              <Paperclip className="Assignments-sicon-17" />
                              {a.submission.originalName || 'View file'}
                            </a>
                          )}
                          {a.submission.link && (
                            <a className="Assignments-file-link" href={a.submission.link} target="_blank" rel="noreferrer">
                              <Link2 className="Assignments-sicon-17" />
                              Submission link
                            </a>
                          )}
                        </div>
                      )}
                      {grade && <p className="Assignments-p-15">Grade: {grade}{a.submission.feedback ? ' · ' + a.submission.feedback : ''}</p>}
                    </div>
                  </div>
                  <div className="Assignments-div-16">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s.cls} flex items-center gap-1`}>
                      <s.icon className="Assignments-sicon-17" />
                      {s.label}
                    </span>
                    {(status === 'pending' || status === 'late') && (
                      <button className="Assignments-button-18" onClick={() => openSubmit(a)}>
                        <Upload className="Assignments-sicon-17" />
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {submitting && (
        <div className="Assignments-modal">
          <div className="Assignments-modalBackdrop" onClick={() => setSubmitting(null)} />
          <div className="Assignments-modalCard">
            <div className="Assignments-modalHead">
              <h3 className="Assignments-h1-2">Submit Assignment</h3>
              <button className="Assignments-modalClose" onClick={() => setSubmitting(null)}><X className="w-4 h-4" /></button>
            </div>
            <p className="Assignments-modalSubTitle">{submitting.title}</p>
            <div className="Assignments-modalBody">
              <div>
                <label className="Assignments-modalLabel">Upload file</label>
                <div className="Assignments-modalField">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <input
                    className="Assignments-modalInput file"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  />
                  {selectedFile && <span className="Assignments-file-name">{selectedFile.name}</span>}
                </div>
              </div>
              <div>
                <label className="Assignments-modalLabel">Submission link (optional)</label>
                <div className="Assignments-modalField">
                  <Link2 className="w-4 h-4 text-slate-400" />
                  <input
                    className="Assignments-modalInput"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="e.g. https://github.com/..."
                  />
                </div>
              </div>
              <div>
                <label className="Assignments-modalLabel">Note (optional)</label>
                <div className="Assignments-modalField">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <textarea
                    className="Assignments-modalInput"
                    rows="2"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a short note for your teacher"
                  />
                </div>
              </div>
              <p className="Assignments-p-6">Upload a file, or provide a link/file name to submit your work.</p>
              {error && <p className="Assignments-empty" style={{ color: 'rgb(220 38 38)' }}>{error}</p>}
            </div>
            <div className="Assignments-modalFoot">
              <button className="Assignments-modalCancel" onClick={() => setSubmitting(null)} disabled={busy}>Cancel</button>
              <button className="Assignments-button-18" onClick={handleSubmit} disabled={busy}>
                {busy ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
