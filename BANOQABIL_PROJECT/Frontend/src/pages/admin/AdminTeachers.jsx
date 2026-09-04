import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import Modal from '@/components/ui/Modal.jsx';
import PageHeader from '@/components/ui/PageHeader.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import FormField, { inputCls } from '@/components/ui/FormField.jsx';
import LoadingSpinner from '@/components/ui/LoadingSpinner.jsx';
import SpreadsheetActions from '@/components/ui/SpreadsheetActions.jsx';
import { catalogApi, teacherApi, spreadsheetApi, getCurrentUser } from '@/lib/api.js';
import { Shield, Plus, Pencil, Trash2, Eye, FileText, Upload, CheckCircle2, Clock, X, Search } from 'lucide-react';
import './AdminTeachers.css';

const docStatusStyle = {
  verified: { cls: 'verified', icon: CheckCircle2, label: 'Verified' },
  pending: { cls: 'pending', icon: Clock, label: 'Pending' },
  rejected: { cls: 'rejected', icon: X, label: 'Rejected' },
};

const mapServerErrors = (errors) => {
  if (!Array.isArray(errors) || errors.length === 0) return {};
  const mapped = {};
  errors.forEach((message) => {
    const text = String(message);
    if (/phone/i.test(text)) mapped.phone = text;
    else if (/specialization/i.test(text)) mapped.specialization = text;
    else if (/email/i.test(text)) mapped.email = text;
    else if (/name/i.test(text)) mapped.name = text;
  });
  return mapped;
};

const readableError = (error) => (Array.isArray(error.details) && error.details.length ? error.details.join(', ') : error.message);

const emptyForm = { name: '', email: '', phone: '', specialization: '', campus: '' };

export default function AdminTeachers() {
  const toast = useToast();
  const currentUser = getCurrentUser();
  const isSuperAdmin = currentUser?.role === 'admin';
  const [teachers, setTeachers] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [profileTeacher, setProfileTeacher] = useState(null);
  const [profileDocs, setProfileDocs] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ docType: '', fileName: '' });
  const [uploading, setUploading] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [teacherRes, campusRes] = await Promise.all([
        teacherApi.list({ search: search.trim() }),
        isSuperAdmin ? catalogApi.campuses.list() : Promise.resolve({ data: [] }),
      ]);
      setTeachers(teacherRes.data || []);
      setCampuses(campusRes.data || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [toast, isSuperAdmin, search]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openProfile = async (teacher) => {
    setProfileTeacher(teacher);
    setProfileDocs([]);
    setProfileLoading(true);
    try {
      const res = await teacherApi.get(teacher._id);
      setProfileTeacher(res.data);
      setProfileDocs(res.data.documents || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (teacher) => { setEditing(teacher); setForm({ name: teacher.name, email: teacher.email || '', phone: teacher.phone || '', specialization: teacher.specialization || '', campus: teacher.campus || '' }); setErrors({}); setModalOpen(true); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (form.phone.length < 7) e.phone = 'Invalid phone number';
    if (!form.specialization.trim()) e.specialization = 'Specialization is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await teacherApi.update(editing._id, form);
        toast.success('Teacher updated successfully');
      } else {
        await teacherApi.create(form);
        toast.success('Teacher created successfully');
      }
      setModalOpen(false);
      loadAll();
    } catch (error) {
      setErrors(mapServerErrors(error.details));
      toast.error(readableError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await teacherApi.remove(deleteTarget._id);
      toast.success('Teacher deleted successfully');
      setDeleteTarget(null);
      loadAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSpreadsheetImport = async (file) => {
    const response = await spreadsheetApi.admin.importTeachers(file);
    await loadAll();
    return response;
  };

  const handleUpload = async () => {
    if (!uploadForm.docType || !uploadForm.fileName) { toast.error('Please select a file and choose a document type'); return; }
    setUploading(true);
    try {
      await teacherApi.documents.add(profileTeacher._id, uploadForm.docType, uploadForm.fileName);
      toast.success('Document uploaded successfully');
      setUploadOpen(false);
      setUploadForm({ docType: '', fileName: '' });
      openProfile(profileTeacher);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    try {
      await teacherApi.documents.remove(docId);
      toast.success('Document deleted');
      openProfile(profileTeacher);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleVerifyDoc = async (docId) => {
    try {
      await teacherApi.documents.updateStatus(docId, 'verified');
      toast.success('Document verified');
      openProfile(profileTeacher);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredTeachers = teachers;

  if (loading) {
    return <div className="p-6 text-slate-400 text-sm"><LoadingSpinner label="Loading teachers..." /></div>;
  }

  return (
    <div className="AdminTeachers-div-1">
      <PageHeader title="Teacher Management" subtitle="Add, edit, and manage teacher profiles, IDs, and documents" action={<div className="page-header-actions"><SpreadsheetActions onExport={() => spreadsheetApi.admin.exportTeachers(search)} onImport={handleSpreadsheetImport} exportName="bano-qabil-teachers.xlsx" label="teachers" /><button onClick={openCreate} className="AdminTeachers-button-2"><Plus className="AdminTeachers-plus-3" /> Add Teacher</button></div>} />

      <div className="AdminTeachers-search-wrap">
        <Search className="AdminTeachers-search-icon" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Teacher ID, MongoDB ID, name, email, phone, or specialization..."
          className="AdminTeachers-search-input"
        />
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="AdminTeachers-div-4"><EmptyState icon={Shield} message="No teachers found." /></div>
      ) : (
        <div className="AdminTeachers-div-5">
          <div className="AdminTeachers-div-6">
            <table className="AdminTeachers-table-7">
              <thead><tr className="AdminTeachers-tr-8">{['Teacher ID', 'Name', 'Specialization', 'Campus', 'Phone', 'Actions'].map((h) => <th key={h} className="AdminTeachers-th-9">{h}</th>)}</tr></thead>
              <tbody className="AdminTeachers-tbody-10">
                {filteredTeachers.map((t) => (
                  <tr key={t._id} className="AdminTeachers-tr-11">
                    <td className="AdminTeachers-td-17"><span className="record-id">{t.teacherId || String(t._id).slice(-8)}</span></td>
                    <td className="AdminTeachers-td-12"><div className="AdminTeachers-div-13"><div className="AdminTeachers-div-14">{t.name[0]}</div><div><p className="AdminTeachers-p-15">{t.name}</p>{t.email && <p className="AdminTeachers-p-16">{t.email}</p>}</div></div></td>
                    <td className="AdminTeachers-td-17">{t.specialization || '—'}</td>
                    <td className="AdminTeachers-td-17">{t.campus || '—'}</td>
                    <td className="AdminTeachers-td-17">{t.phone || '—'}</td>
                    <td className="AdminTeachers-td-12"><div className="AdminTeachers-div-18">
                      <button onClick={() => openProfile(t)} className="AdminTeachers-button-19" title="View Profile"><Eye className="AdminTeachers-eye-20" /></button>
                      <button onClick={() => openEdit(t)} className="AdminTeachers-button-19" title="Edit"><Pencil className="AdminTeachers-eye-20" /></button>
                      <button onClick={() => setDeleteTarget(t)} className="AdminTeachers-button-21" title="Delete"><Trash2 className="AdminTeachers-trash2-22" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Teacher' : 'Add Teacher'} icon={Shield}>
        <div className="AdminTeachers-div-23">
          <FormField label="Full Name" error={errors.name} required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Sir Bilal Hassan" /></FormField>
          <div className="AdminTeachers-div-24">
            <FormField label="Email" error={errors.email}><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="teacher@example.com" /></FormField>
            <FormField label="Phone" error={errors.phone} required><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="0300-XXXXXXX" /></FormField>
          </div>
          <FormField label="Specialization" error={errors.specialization} required><input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className={inputCls} placeholder="e.g. Web Development, Python" /></FormField>
          <FormField label="Campus">
            {isSuperAdmin ? (
              <select value={form.campus} onChange={(e) => setForm({ ...form, campus: e.target.value })} className={inputCls}>
                <option value="">No campus assigned</option>
                {campuses.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            ) : (
              <input value={currentUser?.campus || ''} disabled className={inputCls} />
            )}
          </FormField>
        </div>
        <div className="AdminTeachers-div-25">
          <button onClick={() => setModalOpen(false)} className="AdminTeachers-button-26">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="AdminTeachers-button-27">{saving ? 'Saving...' : (editing ? 'Update' : 'Create')}</button>
        </div>
      </Modal>

      {profileTeacher && (
        <div className="AdminTeachers-div-28">
          <div className="AdminTeachers-div-29" onClick={() => setProfileTeacher(null)} />
          <div className="AdminTeachers-div-30">
            <div className="AdminTeachers-div-31"><h3 className="AdminTeachers-h3-32">Teacher Profile</h3><button onClick={() => setProfileTeacher(null)} className="AdminTeachers-button-33"><X className="AdminTeachers-x-34" /></button></div>
            <div className="AdminTeachers-div-35">
              <div className="AdminTeachers-div-36"><div className="AdminTeachers-div-37">{profileTeacher.name[0]}</div><div><p className="AdminTeachers-p-38">{profileTeacher.name}</p><p className="AdminTeachers-p-16">{profileTeacher.specialization || 'No specialization'}</p></div></div>
              <div className="AdminTeachers-div-39">
                <div><p className="AdminTeachers-p-16">Email</p><p className="AdminTeachers-p-40">{profileTeacher.email || '—'}</p></div>
                <div><p className="AdminTeachers-p-16">Phone</p><p className="AdminTeachers-p-40">{profileTeacher.phone || '—'}</p></div>
                <div><p className="AdminTeachers-p-16">Campus</p><p className="AdminTeachers-p-40">{profileTeacher.campus || '—'}</p></div>
              </div>
              <div>
                <div className="AdminTeachers-div-41"><h4 className="AdminTeachers-h3-32">Documents</h4><button onClick={() => setUploadOpen(true)} className="AdminTeachers-button-42"><Upload className="AdminTeachers-upload-43" /> Upload</button></div>
                {profileLoading ? <div className="AdminTeachers-p-44"><LoadingSpinner label="Loading documents..." size="lg" /></div> : profileDocs.length === 0 ? <p className="AdminTeachers-p-44">No documents uploaded.</p> : (
                  <div className="AdminTeachers-div-45">
                    {profileDocs.map((doc) => { const s = docStatusStyle[doc.status] || docStatusStyle.pending; return (
                      <div key={doc._id || doc.id} className="AdminTeachers-div-46">
                        <div className="AdminTeachers-div-47"><FileText className="AdminTeachers-filetext-48" /></div>
                        <div className="AdminTeachers-div-49"><p className="AdminTeachers-p-15">{doc.docType}</p><p className="AdminTeachers-p-50">{doc.fileName}</p></div>
                        <span className={`AdminTeachers-doc-badge AdminTeachers-doc-badge--${s.cls}`}><s.icon className="AdminTeachers-sicon-51" />{s.label}</span>
                        {doc.status === 'pending' && <button onClick={() => handleVerifyDoc(doc._id)} className="AdminTeachers-button-52">Verify</button>}
                        <button onClick={() => handleDeleteDoc(doc._id)} className="AdminTeachers-button-53"><Trash2 className="AdminTeachers-upload-43" /></button>
                      </div>
                    );})}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Document" icon={Upload} size="sm">
        <div className="AdminTeachers-div-23">
          <FormField label="Document Type" required><select value={uploadForm.docType} onChange={(e) => setUploadForm({ ...uploadForm, docType: e.target.value })} className={inputCls}><option value="">Select type...</option><option>CNIC Copy</option><option>Degree Certificate</option><option>Resume / CV</option><option>Experience Letter</option><option>Other</option></select></FormField>
          <FormField label="File" required>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => { const f = e.target.files[0]; setUploadForm({ ...uploadForm, fileName: f ? f.name : '' }); }} className={inputCls} />
            {uploadForm.fileName && <p className="AdminTeachers-p-16">Selected: {uploadForm.fileName}</p>}
          </FormField>
        </div>
        <div className="AdminTeachers-div-25">
          <button onClick={() => setUploadOpen(false)} className="AdminTeachers-button-26">Cancel</button>
          <button onClick={handleUpload} disabled={uploading} className="AdminTeachers-button-54">{uploading ? 'Uploading...' : 'Upload'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete Teacher?" message={`Are you sure you want to delete "${deleteTarget?.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
