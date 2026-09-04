import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Shield, User, Hash, Mail, Phone, MapPin, BookOpen, Layers3,
  Building2, CreditCard, FileText, Upload, CheckCircle2, Clock, X, Trash2,
} from 'lucide-react';
import { studentApi } from '@/lib/api.js';
import { useToast } from '@/components/ui/Toast.jsx';
import Modal from '@/components/ui/Modal.jsx';
import FormField, { inputCls } from '@/components/ui/FormField.jsx';
import { peekStudentContext, peekReturnPage } from '@/lib/studentContext.js';

const docStatusStyle = {
  verified: { cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2, label: 'Verified' },
  pending: { cls: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock, label: 'Pending Review' },
  rejected: { cls: 'bg-red-50 text-red-600 border-red-100', icon: X, label: 'Rejected' },
};

const pipelineFields = [
  { field: 'regStatus', label: 'Registration', options: ['registered', 'test-scheduled', 'interview-passed', 'fee-verified', 'enrolled'] },
  { field: 'testStatus', label: 'Test', options: ['pending', 'scheduled', 'passed', 'failed'] },
  { field: 'interviewStatus', label: 'Interview', options: ['pending', 'scheduled', 'passed', 'failed'] },
  { field: 'batchAllocationStatus', label: 'Batch Allocation', options: ['pending', 'allocated'] },
  { field: 'feeStatus', label: 'Fee', options: ['unpaid', 'partial', 'paid'] },
];

const optionLabel = (opt) => opt.charAt(0).toUpperCase() + opt.slice(1).replace('-', ' ');

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().split('T')[0];
};

const buildTestPayload = (status, scheduledAt) => {
  if (status === 'passed') return { testResult: 'Passed' };
  if (status === 'failed') return { testResult: 'Failed' };
  if (status === 'scheduled') return { testResult: 'Awaiting', testScheduledAt: scheduledAt || new Date().toISOString() };
  return { testResult: 'Awaiting', testScheduledAt: null };
};

const buildInterviewPayload = (status, scheduledAt) => {
  if (status === 'passed') return { interviewDecision: 'Passed' };
  if (status === 'failed') return { interviewDecision: 'Failed' };
  if (status === 'scheduled') return { interviewDecision: 'Awaiting', interviewScheduledAt: scheduledAt || new Date().toISOString() };
  return { interviewDecision: 'Awaiting', interviewScheduledAt: null };
};

export default function AdminStudentProfile({ navigate }) {
  const toast = useToast();
  const studentId = peekStudentContext();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ docType: '', fileName: '' });

  const loadStudent = useCallback(async () => {
    try {
      const res = await studentApi.get(studentId);
      setStudent(res.data);
    } catch (error) {
      toast.error(error.message);
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }, [studentId, toast]);

  useEffect(() => {
    if (studentId) loadStudent();
  }, [studentId, loadStudent]);

  const goBack = () => navigate?.(peekReturnPage('admin-students'));

  const statusValue = (field) => {
    if (field === 'regStatus') return student.stage;
    if (field === 'testStatus') return student.testStatus;
    if (field === 'interviewStatus') return student.interviewStatus;
    return student[field];
  };

  const updateStage = async (field, value) => {
    let payload;
    switch (field) {
      case 'regStatus':
        payload = { stage: value };
        break;
      case 'testStatus':
        payload = buildTestPayload(value, student.test?.scheduledAt);
        break;
      case 'interviewStatus':
        payload = buildInterviewPayload(value, student.interview?.scheduledAt);
        break;
      case 'batchAllocationStatus':
        payload = { batchAllocationStatus: value };
        break;
      case 'feeStatus':
        payload = { feeStatus: value };
        break;
      default:
        return;
    }
    try {
      await studentApi.updateStatus(student._id, payload);
      toast.success('Status updated successfully');
      loadStudent();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleVerifyDoc = async (docId) => {
    try {
      await studentApi.updateDocumentStatus(docId, 'verified');
      toast.success('Document verified');
      loadStudent();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteDoc = async (docId) => {
    try {
      await studentApi.removeDocument(docId);
      toast.success('Document deleted');
      loadStudent();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.docType || !uploadForm.fileName) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      await studentApi.addDocument(student._id, uploadForm.docType, uploadForm.fileName);
      toast.success('Document uploaded');
      setUploadOpen(false);
      setUploadForm({ docType: '', fileName: '' });
      loadStudent();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6 w-full">
        <button onClick={goBack} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center text-slate-400">Loading student profile...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 w-full">
        <button onClick={goBack} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center text-slate-400">
          Student not found.
        </div>
      </div>
    );
  }

  const studentDocs = student.documents || [];
  const initials = student.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="p-6 space-y-6 w-full">
      <button onClick={goBack} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Profile</h1>
        <p className="text-sm text-slate-400 mt-1">Full record, pipeline status, and documents</p>
      </div>

      {/* Header banner */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-orange-500 to-amber-400" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 border-4 border-white shadow-md flex items-center justify-center text-white text-xl font-bold">
                {initials}
              </div>
              <div className="pb-1">
                <h2 className="text-lg font-bold text-slate-900">{student.name}</h2>
                <p className="text-sm text-slate-400">{student.registrationId || student.rollNumber || student._id} · {student.batch || 'No batch'}</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 text-xs font-bold border border-amber-100">
              <Shield className="w-3.5 h-3.5" /> Admin View
            </span>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-4">Personal Information</h3>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          {[
            { icon: User, label: 'Full Name', value: student.name },
            { icon: Hash, label: 'CNIC', value: student.cnic || '—' },
            { icon: Mail, label: 'Email', value: student.email || '—' },
            { icon: Phone, label: 'Phone', value: student.phone || '—' },
            { icon: MapPin, label: 'Address', value: student.address || '—' },
          ].map((f) => (
            <div key={f.label} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{f.label}</p>
                <p className="text-sm font-semibold text-slate-700">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Academic Information */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-4">Academic Information</h3>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          {[
            { icon: BookOpen, label: 'Course', value: student.course || '—' },
            { icon: Layers3, label: 'Batch', value: student.batch || '—' },
            { icon: Building2, label: 'Campus', value: student.campus || '—' },
            { icon: CreditCard, label: 'Fee', value: `Rs. ${student.feePaid ?? 0} / ${student.feeAmount ?? 0}` },
          ].map((f) => (
            <div key={f.label} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{f.label}</p>
                <p className="text-sm font-semibold text-slate-700">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Status */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-4">Pipeline Status</h3>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          {pipelineFields.map((step) => (
            <div key={step.field}>
              <label className="block text-xs text-slate-400 mb-1.5">{step.label}</label>
              <select
                value={statusValue(step.field) || ''}
                onChange={(e) => updateStage(step.field, e.target.value)}
                className={inputCls}
              >
                {step.options.map((opt) => <option key={opt} value={opt}>{optionLabel(opt)}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-900">Documents</h3>
          </div>
          <button onClick={() => setUploadOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors">
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        </div>

        {studentDocs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No documents uploaded.</p>
        ) : (
          <div className="space-y-3">
            {studentDocs.map((doc) => {
              const s = docStatusStyle[doc.status] || docStatusStyle.pending;
              return (
                <div key={doc._id || doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{doc.docType}</p>
                    <p className="text-xs text-slate-400 truncate">{doc.fileName} · Uploaded {formatDate(doc.uploadedAt || doc.createdAt)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 flex-shrink-0 ${s.cls}`}>
                    <s.icon className="w-3 h-3" /> {s.label}
                  </span>
                  {doc.status === 'pending' && (
                    <button onClick={() => handleVerifyDoc(doc._id || doc.id)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex-shrink-0">Verify</button>
                  )}
                  <button onClick={() => handleDeleteDoc(doc._id || doc.id)} className="w-8 h-8 rounded-lg border border-red-200 flex items-center justify-center hover:bg-red-50 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Student Document" icon={Upload} size="sm">
        <div className="p-6 space-y-4">
          <FormField label="Document Type" required>
            <select value={uploadForm.docType} onChange={(e) => setUploadForm({ ...uploadForm, docType: e.target.value })} className={inputCls}>
              <option value="">Select type...</option>
              <option>CNIC Copy</option>
              <option>B-Form</option>
              <option>Education Certificate</option>
              <option>Passport Photo</option>
              <option>Domicile</option>
              <option>Other</option>
            </select>
          </FormField>
          <FormField label="File" required>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => { const f = e.target.files[0]; setUploadForm({ ...uploadForm, fileName: f ? f.name : '' }); }} className={inputCls} />
            {uploadForm.fileName && <p className="text-xs text-slate-500 mt-1">Selected: {uploadForm.fileName}</p>}
          </FormField>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={() => setUploadOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-500 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleUpload} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors">Upload</button>
        </div>
      </Modal>
    </div>
  );
}
