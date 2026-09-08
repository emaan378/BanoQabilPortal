import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/Toast.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import Modal from '@/components/ui/Modal.jsx';
import PageHeader from '@/components/ui/PageHeader.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import FormField, { inputCls } from '@/components/ui/FormField.jsx';
import LoadingSpinner from '@/components/ui/LoadingSpinner.jsx';
import SpreadsheetActions from '@/components/ui/SpreadsheetActions.jsx';
import { studentApi, spreadsheetApi, catalogApi } from '@/lib/api.js';
import { nextActionFor } from '@/lib/workflow.js';
import { courses, pipelineStages as regStages } from '@/data/mockData.js';
import { Users, Plus, Pencil, Trash2, Eye, FileText, Upload, CheckCircle2, Clock, X, Search, CheckCircle } from 'lucide-react';
import './AdminStudents.css';

const LIMIT = 20;
const courseOptions = [...new Set(courses.map((c) => c.name))].sort();

const docStatusStyle = {
  verified: { cls: 'verified', icon: CheckCircle2, label: 'Verified' },
  pending: { cls: 'pending', icon: Clock, label: 'Pending' },
  rejected: { cls: 'rejected', icon: X, label: 'Rejected' },
};

const statusBadgeStyle = {
  pending: { cls: 'AdminStudents-status-badge--pending', label: 'Pending' },
  scheduled: { cls: 'AdminStudents-status-badge--scheduled', label: 'Scheduled' },
  passed: { cls: 'AdminStudents-status-badge--passed', label: 'Passed' },
  failed: { cls: 'AdminStudents-status-badge--failed', label: 'Failed' },
};

const emptyForm = { name: '', email: '', phone: '', cnic: '', address: '', campus: '', course: '', batch: '' };

const formatCnic = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

const mapServerErrors = (details) => {
  const mapped = {};
  details.forEach((message) => {
    if (/cnic/i.test(message)) mapped.cnic = message;
    else if (/course/i.test(message)) mapped.course = message;
    else if (/name/i.test(message)) mapped.name = message;
    else if (/phone/i.test(message)) mapped.phone = message;
    else if (/email/i.test(message)) mapped.email = message;
    else if (/document/i.test(message)) mapped.fileName = message;
  });
  return mapped;
};

export default function AdminStudents() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [profileStudent, setProfileStudent] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ docType: '', fileName: '' });
  const [uploading, setUploading] = useState(false);
  const [campusOptions, setCampusOptions] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([catalogApi.campuses.list(), catalogApi.batches.list()])
      .then(([campusRes, batchRes]) => {
        if (!active) return;
        setCampusOptions((campusRes.data || []).map((c) => c.name));
        setBatchOptions((batchRes.data || []).map((b) => b.name));
      })
      .catch(() => { if (active) { setCampusOptions([]); setBatchOptions([]); } });
    return () => { active = false; };
  }, []);

  const query = useMemo(() => ({ search: search.trim(), page, limit: LIMIT }), [search, page]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentApi.list(query);
      setStudents(res.data || []);
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
    const timer = setTimeout(() => fetchStudents(), query.search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [query, fetchStudents]);

  const fetchProfile = useCallback(async (id) => {
    setProfileLoading(true);
    try {
      const res = await studentApi.get(id);
      setProfileStudent(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProfileLoading(false);
    }
  }, [toast]);

  const openProfile = (student) => {
    setProfileStudent(student);
    fetchProfile(student._id);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (student) => {
    setEditing(student);
    setForm({
      name: student.name,
      email: student.email || '',
      phone: student.phone || '',
      cnic: student.cnic || '',
      address: student.address || '',
      campus: student.campus || '',
      course: student.course || '',
      batch: student.batch || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^\d{5}-\d{7}-\d$/.test(form.cnic.trim())) e.cnic = 'CNIC must be in 00000-0000000-0 format';
    if (!form.course) e.course = 'Course is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    else if (form.phone.length < 7) e.phone = 'Invalid phone';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await studentApi.update(editing._id, form);
        toast.success('Student updated successfully');
      } else {
        await studentApi.create(form);
        toast.success('Student created successfully');
      }
      setModalOpen(false);
      fetchStudents();
    } catch (err) {
      if (Array.isArray(err.details) && err.details.length) {
        setErrors(mapServerErrors(err.details));
        toast.error(err.details.join(', '));
      } else {
        toast.error(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await studentApi.remove(deleteTarget._id);
      toast.success('Student deleted successfully');
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStatusChange = async (field, value) => {
    const payload = { [field]: value };
    try {
      const res = await studentApi.updateStatus(profileStudent._id, payload);
      setProfileStudent(res.data);
      toast.success('Status updated successfully');
      fetchStudents();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSpreadsheetImport = async (file) => {
    const response = await spreadsheetApi.admin.importStudents(file);
    await fetchStudents();
    return response;
  };

  const handleUpload = async () => {
    if (!uploadForm.docType || !uploadForm.fileName) { toast.error('Please fill all fields'); return; }
    setUploading(true);
    try {
      await studentApi.addDocument(profileStudent._id, uploadForm.docType, uploadForm.fileName);
      toast.success('Document uploaded');
      setUploadOpen(false);
      setUploadForm({ docType: '', fileName: '' });
      fetchProfile(profileStudent._id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (doc) => {
    try {
      await studentApi.removeDocument(doc._id);
      toast.success('Document deleted');
      fetchProfile(profileStudent._id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleVerifyDoc = async (doc) => {
    try {
      await studentApi.updateDocumentStatus(doc._id, 'verified');
      toast.success('Document verified');
      fetchProfile(profileStudent._id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="AdminStudents-div-1">
      <PageHeader title="Student Management" subtitle="Manage student profiles, registration workflow, documents, and bulk records" action={<div className="page-header-actions"><SpreadsheetActions onExport={() => spreadsheetApi.admin.exportStudents(search)} onImport={handleSpreadsheetImport} exportName="bano-qabil-students.xlsx" label="students" /><button onClick={openCreate} className="AdminStudents-button-2"><Plus className="AdminStudents-plus-3" /> Add Student</button></div>} />

      <div className="AdminStudents-div-5"><Search className="AdminStudents-search-6" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by Student ID, roll number, name, CNIC, or email..." className="AdminStudents-input-7" /></div>

      {error && (
        <div className="AdminStudents-div-9">
          <div className="AdminStudents-div-29">
            <div className="AdminStudents-error-row">
              <p className="AdminStudents-p-20">Unable to load students: {error}</p>
              <button onClick={fetchStudents} className="AdminStudents-retry-btn">Retry</button>
            </div>
          </div>
        </div>
      )}

      {loading && !error && students.length === 0 ? (
        <div className="AdminStudents-div-9"><LoadingSpinner label="Loading students..." /></div>
      ) : !error && students.length === 0 ? (
        <div className="AdminStudents-div-9"><EmptyState icon={Users} message="No students found." /></div>
      ) : !error ? (
        <div className="AdminStudents-div-10">
          <div className="AdminStudents-div-11">
            <table className="AdminStudents-table-12">
              <thead><tr className="AdminStudents-tr-13">{['Student', 'Student ID', 'CNIC', 'Course', 'Current Stage', 'Next Action', ''].map((h, i) => <th key={h || i} className={`AdminStudents-th ${i === 5 ? 'AdminStudents-th--action' : ''}`}>{h}</th>)}</tr></thead>
              <tbody className="AdminStudents-tbody-14">
                {students.map((s) => {
                  const action = nextActionFor(s);
                  return (
                  <tr key={s._id} className="AdminStudents-tr-15">
                    <td className="AdminStudents-td-16"><div className="AdminStudents-div-17"><div className="AdminStudents-div-18">{(s.name || '?')[0]}</div><div><p className="AdminStudents-p-19">{s.name}</p><p className="AdminStudents-p-20">{s.phone || s.email || '—'}</p></div></div></td>
                    <td className="AdminStudents-td-21"><span className="record-id">{s.registrationId || s.rollNumber || String(s._id).slice(-8)}</span></td>
                    <td className="AdminStudents-td-21">{s.cnic || '—'}</td>
                    <td className="AdminStudents-td-22">{s.course || '—'}</td>
                    <td className="AdminStudents-td-16"><span className={`AdminStudents-stage-badge AdminStudents-stage-badge--${s.stage || 'default'}`}>{regStages.find((r) => r.key === s.stage)?.label || s.stage}</span></td>
                    <td className="AdminStudents-td-16"><div className={`AdminStudents-action-pill AdminStudents-action-pill--${action.cls}`}><action.icon className="AdminStudents-actionicon-23" />{action.label}</div></td>
                    <td className="AdminStudents-td-16"><div className="AdminStudents-div-24">
                      <button onClick={() => openProfile(s)} className="AdminStudents-button-25" title="View Profile"><Eye className="AdminStudents-eye-26" /></button>
                      <button onClick={() => openEdit(s)} className="AdminStudents-button-25" title="Edit"><Pencil className="AdminStudents-eye-26" /></button>
                      <button onClick={() => setDeleteTarget(s)} className="AdminStudents-button-27" title="Delete"><Trash2 className="AdminStudents-trash2-28" /></button>
                    </div></td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="AdminStudents-pagination">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1} className="AdminStudents-page-btn">Previous</button>
              <div className="AdminStudents-page-info">Page {pagination.page} of {pagination.pages} ({pagination.total} total)</div>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={pagination.page >= pagination.pages} className="AdminStudents-page-btn">Next</button>
            </div>
          )}
        </div>
      ) : null}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add Student'} icon={Users} size="lg">
        <div className="AdminStudents-div-29">
          <div className="AdminStudents-div-30">
            <FormField label="Full Name" error={errors.name} required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Ahmed Hassan" /></FormField>
            <FormField label="CNIC" error={errors.cnic} required><input value={form.cnic} onChange={(e) => setForm({ ...form, cnic: formatCnic(e.target.value) })} className={inputCls} placeholder="33100-1234567-1" /></FormField>
            <FormField label="Email" error={errors.email}><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="student@example.com" /></FormField>
            <FormField label="Phone" error={errors.phone} required><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="0300-XXXXXXX" /></FormField>
          </div>
          <FormField label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} placeholder="Student address" /></FormField>
          <div className="AdminStudents-div-31">
            <FormField label="Campus"><select value={form.campus} onChange={(e) => setForm({ ...form, campus: e.target.value })} className={inputCls}><option value="">No campus</option>{campusOptions.map((name) => <option key={name} value={name}>{name}</option>)}</select></FormField>
            <FormField label="Course" error={errors.course} required><select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} className={inputCls}><option value="">No course</option>{courseOptions.map((name) => <option key={name} value={name}>{name}</option>)}</select></FormField>
            <FormField label="Batch"><input list="admin-batch-options" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} className={inputCls} placeholder="e.g. FSD-14" /><datalist id="admin-batch-options">{batchOptions.map((name) => <option key={name} value={name} />)}</datalist></FormField>
          </div>
        </div>
        <div className="AdminStudents-div-32">
          <button onClick={() => setModalOpen(false)} className="AdminStudents-button-33">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="AdminStudents-button-34">{saving ? 'Saving...' : (editing ? 'Update' : 'Create')}</button>
        </div>
      </Modal>

      {profileStudent && (
        <div className="AdminStudents-div-35">
          <div className="AdminStudents-div-36" onClick={() => setProfileStudent(null)} />
          <div className="AdminStudents-div-37">
            <div className="AdminStudents-div-38"><h3 className="AdminStudents-h3-39">Student Profile</h3><button onClick={() => setProfileStudent(null)} className="AdminStudents-button-40"><X className="AdminStudents-x-41" /></button></div>
            <div className="AdminStudents-div-42">
              <div className="AdminStudents-div-43"><div className="AdminStudents-div-44">{(profileStudent.name || '?')[0]}</div><div><p className="AdminStudents-p-45">{profileStudent.name}</p><p className="AdminStudents-p-20">{profileStudent.cnic || 'No CNIC'}</p></div></div>
              <div className="AdminStudents-div-46">
                <div><p className="AdminStudents-p-20">Email</p><p className="AdminStudents-p-47">{profileStudent.email || '—'}</p></div>
                <div><p className="AdminStudents-p-20">Phone</p><p className="AdminStudents-p-47">{profileStudent.phone || '—'}</p></div>
                <div><p className="AdminStudents-p-20">Campus</p><p className="AdminStudents-p-47">{profileStudent.campus || '—'}</p></div>
                <div><p className="AdminStudents-p-20">Course</p><p className="AdminStudents-p-47">{profileStudent.course || '—'}</p></div>
                <div><p className="AdminStudents-p-20">Batch</p><p className="AdminStudents-p-47">{profileStudent.batch || '—'}</p></div>
                <div><p className="AdminStudents-p-20">Address</p><p className="AdminStudents-p-47">{profileStudent.address || '—'}</p></div>
              </div>
              <div className="AdminStudents-div-48">
                <h4 className="AdminStudents-h4-49">Workflow Status</h4>
                {(() => { const a = nextActionFor(profileStudent) || { label: 'No action needed', icon: CheckCircle, cls: 'default' }; return (
                  <div className={`AdminStudents-action-banner AdminStudents-action-banner--${a.cls}`}><a.icon className="AdminStudents-plus-3" />{a.label}</div>
                ); })()}
                <div className="AdminStudents-div-50">
                  <div>
                    <label className="AdminStudents-label-51">Registration Stage</label>
                    <select value={profileStudent.stage || ''} onChange={(e) => handleStatusChange('stage', e.target.value)} className="AdminStudents-select-52">{regStages.map((opt) => <option key={opt.key} value={opt.key}>{opt.label}</option>)}</select>
                  </div>
                  <div>
                    <label className="AdminStudents-label-51">Test</label>
                    <div><span className={`AdminStudents-status-badge ${statusBadgeStyle[profileStudent.testStatus]?.cls || 'AdminStudents-status-badge--pending'}`}>{statusBadgeStyle[profileStudent.testStatus]?.label || profileStudent.testStatus}</span></div>
                  </div>
                  <div>
                    <label className="AdminStudents-label-51">Interview</label>
                    <div><span className={`AdminStudents-status-badge ${statusBadgeStyle[profileStudent.interviewStatus]?.cls || 'AdminStudents-status-badge--pending'}`}>{statusBadgeStyle[profileStudent.interviewStatus]?.label || profileStudent.interviewStatus}</span></div>
                  </div>
                  <div>
                    <label className="AdminStudents-label-51">Batch Allocation</label>
                    <select value={profileStudent.batchAllocationStatus || ''} onChange={(e) => handleStatusChange('batchAllocationStatus', e.target.value)} className="AdminStudents-select-52">{['pending', 'allocated'].map((opt) => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}</select>
                  </div>
                  <div>
                    <label className="AdminStudents-label-51">Fee Status</label>
                    <select value={profileStudent.feeStatus || ''} onChange={(e) => handleStatusChange('feeStatus', e.target.value)} className="AdminStudents-select-52">{['unpaid', 'partial', 'paid'].map((opt) => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}</select>
                  </div>
                  <div>
                    <label className="AdminStudents-label-51">Fee Amount (PKR)</label>
                    <input type="number" min="0" value={profileStudent.feeAmount || 0} onChange={(e) => handleStatusChange('feeAmount', e.target.value)} className="AdminStudents-select-52" />
                  </div>
                  <div>
                    <label className="AdminStudents-label-51">Fee Paid (PKR)</label>
                    <input type="number" min="0" value={profileStudent.feePaid || 0} onChange={(e) => handleStatusChange('feePaid', e.target.value)} className="AdminStudents-select-52" />
                  </div>
                  <div>
                    <label className="AdminStudents-label-51">Batch</label>
                    <input list="admin-profile-batch-options" value={profileStudent.batch || ''} onChange={(e) => handleStatusChange('batch', e.target.value)} className="AdminStudents-select-52" /><datalist id="admin-profile-batch-options">{batchOptions.map((name) => <option key={name} value={name} />)}</datalist>
                  </div>
                </div>
              </div>
              <div>
                <div className="AdminStudents-div-53"><h4 className="AdminStudents-h3-39">Documents</h4><button onClick={() => setUploadOpen(true)} className="AdminStudents-button-54"><Upload className="AdminStudents-upload-55" /> Upload</button></div>
                {profileLoading ? <div className="AdminStudents-p-56"><LoadingSpinner label="Loading documents..." size="lg" /></div> : (profileStudent.documents || []).length === 0 ? <p className="AdminStudents-p-56">No documents uploaded.</p> : (
                  <div className="AdminStudents-div-57">
                    {(profileStudent.documents || []).map((doc) => { const s = docStatusStyle[doc.status] || docStatusStyle.pending; return (
                      <div key={doc._id} className="AdminStudents-div-58">
                        <div className="AdminStudents-div-59"><FileText className="AdminStudents-filetext-60" /></div>
                        <div className="AdminStudents-div-61"><p className="AdminStudents-p-19">{doc.docType}</p><p className="AdminStudents-p-62">{doc.fileName}</p></div>
                        <span className={`AdminStudents-doc-badge AdminStudents-doc-badge--${s.cls}`}><s.icon className="AdminStudents-sicon-63" />{s.label}</span>
                        {doc.status === 'pending' && <button onClick={() => handleVerifyDoc(doc)} className="AdminStudents-button-64">Verify</button>}
                        <button onClick={() => handleDeleteDoc(doc)} className="AdminStudents-button-65"><Trash2 className="AdminStudents-upload-55" /></button>
                      </div>
                    );})}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Student Document" icon={Upload} size="sm">
        <div className="AdminStudents-div-29">
          <FormField label="Document Type" required><select value={uploadForm.docType} onChange={(e) => setUploadForm({ ...uploadForm, docType: e.target.value })} className={inputCls}><option value="">Select type...</option><option>CNIC Copy</option><option>B-Form</option><option>Education Certificate</option><option>Passport Photo</option><option>Domicile</option><option>Other</option></select></FormField>
          <FormField label="File" required>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => { const f = e.target.files[0]; setUploadForm({ ...uploadForm, fileName: f ? f.name : '' }); }} className={inputCls} />
            {uploadForm.fileName && <p className="AdminStudents-p-62">Selected: {uploadForm.fileName}</p>}
          </FormField>
        </div>
        <div className="AdminStudents-div-32">
          <button onClick={() => setUploadOpen(false)} className="AdminStudents-button-33">Cancel</button>
          <button onClick={handleUpload} disabled={uploading} className="AdminStudents-button-66">{uploading ? 'Uploading...' : 'Upload'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete Student?" message={`Are you sure you want to delete "${deleteTarget?.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
