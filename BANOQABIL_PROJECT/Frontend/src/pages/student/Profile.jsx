import { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, BookOpen, Hash, Upload, FileText, CheckCircle2, Clock, X, Download, Lock } from 'lucide-react';
import SpreadsheetActions from '@/components/ui/SpreadsheetActions.jsx';
import { portalApi, spreadsheetApi } from '@/lib/api.js';
import './Profile.css';

const docTypes = ['CNIC Copy', 'B-Form', 'Education Certificate', 'Passport Photo', 'Domicile'];

const docStatusStyle = {
  verified: { cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2, label: 'Verified' },
  pending: { cls: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock, label: 'Pending Review' },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    portalApi.student.profile().then((res) => {
      const d = res?.data ?? {};
      if (active) {
        setProfile(d);
        setDocs(d.documents || []);
      }
    }).catch((e) => {
      if (active) setError(e.message || 'Unable to load profile');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const name = profile?.name || '';
  const initials = name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'ST';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleUpload = async () => {
    if (!selectedType || !fileName) return;
    setSaving(true);
    setError('');
    try {
      const res = await portalApi.student.addDocument({ docType: selectedType, fileName });
      setDocs((prev) => [...prev, res?.data ?? {}]);
      setShowUpload(false);
      setSelectedType('');
      setFileName('');
    } catch (e) {
      setError(e.message || 'Unable to upload document');
    } finally {
      setSaving(false);
    }
  };

  const info = [
    { icon: User, label: 'Full Name', value: profile?.name },
    { icon: Hash, label: 'Roll Number', value: profile?.rollNumber },
    { icon: User, label: 'CNIC', value: profile?.cnic },
    { icon: Mail, label: 'Email', value: profile?.email },
    { icon: Phone, label: 'Phone', value: profile?.phone },
    { icon: MapPin, label: 'Address', value: profile?.address },
  ];

  const academic = [
    { icon: BookOpen, label: 'Course', value: profile?.course },
    { icon: User, label: 'Batch', value: profile?.batch },
    { icon: MapPin, label: 'Center', value: profile?.campus },
    { icon: Calendar, label: 'Admission Date', value: fmtDate(profile?.createdAt) },
  ];

  if (loading) {
    return (
      <div className="Profile-div-1">
        <h1 className="Profile-h1-2">My Profile</h1>
        <p className="Profile-p-3">Loading profile...</p>
      </div>
    );
  }

  const uploadedTypes = docs.map((d) => d.docType);
  const availableTypes = docTypes.filter((t) => !uploadedTypes.includes(t));

  return (
    <div className="Profile-div-1">
      <div className="profile-page-heading">
        <div>
          <h1 className="Profile-h1-2">My Profile</h1>
          <p className="Profile-p-3">View your personal and academic information</p>
        </div>
        <SpreadsheetActions onExport={spreadsheetApi.student.export} onImport={spreadsheetApi.student.import} exportName="student-portal-export.xlsx" label="student portal" />
      </div>

      {error && !profile && <p className="Profile-p-32">{error}</p>}

      {/* Profile header */}
      <div className="Profile-div-4">
        <div className="Profile-div-5" />
        <div className="Profile-div-6">
          <div className="Profile-div-7">
            <div className="Profile-div-8">
              {initials}
            </div>
            <div className="Profile-div-9">
              <h2 className="Profile-h2-10">{profile?.name}</h2>
              <p className="Profile-p-11">{profile?.rollNumber}{profile?.batch ? ` · ${profile.batch}` : ''}</p>
            </div>
            <div className="Profile-div-12">
              <Lock className="Profile-lock-13" />
              Read Only
            </div>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="Profile-div-4">
        <div className="Profile-div-14">
          <h3 className="Profile-h3-15">Personal Information</h3>
        </div>
        <div className="Profile-div-16">
          {info.map((f) => (
            <div key={f.label} className="Profile-div-17">
              <div className="Profile-div-18">
                <f.icon className="Profile-ficon-19" />
              </div>
              <div className="Profile-div-20">
                <p className="Profile-p-21">{f.label}</p>
                <p className="Profile-p-22">{f.value || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Academic info */}
      <div className="Profile-div-4">
        <div className="Profile-div-14">
          <h3 className="Profile-h3-15">Academic Information</h3>
        </div>
        <div className="Profile-div-16">
          {academic.map((f) => (
            <div key={f.label} className="Profile-div-17">
              <div className="Profile-div-23">
                <f.icon className="Profile-ficon-24" />
              </div>
              <div className="Profile-div-20">
                <p className="Profile-p-21">{f.label}</p>
                <p className="Profile-p-25">{f.value || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documents section */}
      <div className="Profile-div-4">
        <div className="Profile-div-26">
          <div className="Profile-div-27">
            <FileText className="Profile-filetext-28" />
            <h3 className="Profile-h3-15">My Documents</h3>
          </div>
          {availableTypes.length > 0 && (
            <button
              onClick={() => setShowUpload(true)}
              className="Profile-button-29"
            >
              <Upload className="Profile-lock-13" />
              Upload Document
            </button>
          )}
        </div>

        {!profile || docs.length === 0 ? (
          <div className="Profile-div-30">
            <FileText className="Profile-filetext-31" />
            <p className="Profile-p-32">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="Profile-div-33">
            {docs.map((doc) => {
              const s = (docStatusStyle[doc.status] || docStatusStyle.pending);
              return (
                <div key={doc._id || doc.docType} className="Profile-div-34">
                  <div className="Profile-div-35">
                    <FileText className="Profile-filetext-36" />
                  </div>
                  <div className="Profile-div-37">
                    <p className="Profile-p-38">{doc.docType}</p>
                    <p className="Profile-p-39">{doc.fileName} · Uploaded {fmtDate(doc.createdAt)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${s.cls} flex items-center gap-1 flex-shrink-0`}>
                    <s.icon className="Profile-sicon-40" />
                    {s.label}
                  </span>
                  <button className="Profile-button-41">
                    <Download className="Profile-download-42" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload progress indicator */}
        <div className="Profile-div-43">
          <p className="Profile-p-44">
            <span className="Profile-span-45">{docs.filter((d) => d.status === 'verified').length}</span> verified ·{' '}
            <span className="Profile-span-46">{docs.filter((d) => d.status === 'pending').length}</span> pending review ·{' '}
            <span className="Profile-span-47">{docTypes.length - docs.length}</span> remaining
          </p>
        </div>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="Profile-div-48">
          <div className="Profile-div-49" onClick={() => setShowUpload(false)} />
          <div className="Profile-div-50">
            <div className="Profile-div-51">
              <div className="Profile-div-27">
                <Upload className="Profile-filetext-28" />
                <h3 className="Profile-h3-15">Upload Document</h3>
              </div>
              <button onClick={() => setShowUpload(false)} className="Profile-button-52">&times;</button>
            </div>
            <div className="Profile-div-53">
              <div>
                <label className="Profile-label-54">Document Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="Profile-select-55"
                >
                  <option value="">Select document type...</option>
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="Profile-label-54">File</label>
                <label className="Profile-label-56">
                  <Upload className="Profile-upload-57" />
                  <span className="Profile-span-58">
                    {fileName || 'Click to select file (PDF, JPG, PNG)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="Profile-input-59"
                  />
                </label>
              </div>
              {error && <p className="Profile-p-32" style={{ color: 'rgb(220 38 38)' }}>{error}</p>}
              <p className="Profile-p-60">
                Uploaded documents will be reviewed by admin before verification.
              </p>
            </div>
            <div className="Profile-div-61">
              <button
                onClick={() => setShowUpload(false)}
                className="Profile-button-62"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedType || !fileName || saving}
                className="Profile-button-63"
              >
                {saving ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
