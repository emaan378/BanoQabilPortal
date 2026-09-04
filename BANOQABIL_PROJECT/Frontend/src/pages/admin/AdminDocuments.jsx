import { useState } from 'react';
import { useToast } from '@/components/ui/Toast.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import Modal from '@/components/ui/Modal.jsx';
import PageHeader from '@/components/ui/PageHeader.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { documents as initialDocs, students, teachers } from '@/data/mockData.js';
import { FileText, Search, CheckCircle2, Clock, Download, Eye, X, Users, Shield } from 'lucide-react';
import './AdminDocuments.css';

const docStatusStyle = {
  verified: { cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2, label: 'Verified' },
  pending: { cls: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock, label: 'Pending Review' },
  rejected: { cls: 'bg-red-50 text-red-600 border-red-100', icon: X, label: 'Rejected' },
};

export default function AdminDocuments() {
  const toast = useToast();
  const [docs, setDocs] = useState(initialDocs);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleVerify = (docId) => { setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: 'verified' } : d)); toast.success('Document verified'); setSelected(null); };
  const handleReject = (docId) => { setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: 'rejected' } : d)); toast.success('Document rejected'); setSelected(null); };
  const handleDelete = () => { setDocs((prev) => prev.filter((d) => d.id !== deleteTarget.id)); toast.success('Document deleted'); setDeleteTarget(null); };

  const getOwnerName = (doc) => {
    if (doc.ownerType === 'student') return students.find((s) => s.id === doc.ownerId)?.name || 'Unknown Student';
    return teachers.find((t) => t.id === doc.ownerId)?.name || 'Unknown Teacher';
  };

  const filtered = docs.filter((d) => {
    const matchSearch = !search || (d.docType || '').toLowerCase().includes(search.toLowerCase()) || (d.fileName || '').toLowerCase().includes(search.toLowerCase()) || getOwnerName(d).toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || d.status === filter;
    const matchOwner = ownerFilter === 'all' || d.ownerType === ownerFilter;
    return matchSearch && matchFilter && matchOwner;
  });

  const verifiedCount = docs.filter((d) => d.status === 'verified').length;
  const pendingCount = docs.filter((d) => d.status === 'pending').length;

  return (
    <div className="AdminDocuments-div-1">
      <PageHeader title="Student & Teacher Documents" subtitle="Review, verify, and manage all uploaded documents" />

      <div className="AdminDocuments-div-2">
        {[{ label: 'Total Documents', value: String(docs.length), color: 'text-slate-900' }, { label: 'Verified', value: String(verifiedCount), color: 'text-emerald-600' }, { label: 'Pending Review', value: String(pendingCount), color: 'text-amber-600' }].map((s) => (
          <div key={s.label} className="AdminDocuments-div-3"><p className="AdminDocuments-p-4">{s.label}</p><p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p></div>
        ))}
      </div>

      <div className="AdminDocuments-div-5">
        <div className="AdminDocuments-div-6"><Search className="AdminDocuments-search-7" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by document type, file name, or owner..." className="AdminDocuments-input-8" /></div>
        <div className="AdminDocuments-div-9">
          <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="AdminDocuments-select-10"><option value="all">All Owners</option><option value="student">Students</option><option value="teacher">Teachers</option></select>
          {['all', 'verified', 'pending', 'rejected'].map((f) => <button key={f} onClick={() => setFilter(f)} className={`text-xs font-semibold px-3 py-2 rounded-lg capitalize transition-all ${filter === f ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>{f}</button>)}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="AdminDocuments-div-11"><EmptyState icon={FileText} message="No documents found." /></div>
      ) : (
        <div className="AdminDocuments-div-12">
          <div className="AdminDocuments-div-13">
            <table className="AdminDocuments-table-14">
              <thead><tr className="AdminDocuments-tr-15">{['Type', 'Owner', 'File', 'Upload Date', 'Status', 'Actions'].map((h) => <th key={h} className="AdminDocuments-th-16">{h}</th>)}</tr></thead>
              <tbody className="AdminDocuments-tbody-17">
                {filtered.map((d) => { const s = docStatusStyle[d.status] || docStatusStyle.pending; return (
                  <tr key={d.id} className="AdminDocuments-tr-18">
                    <td className="AdminDocuments-td-19">{d.docType}</td>
                    <td className="AdminDocuments-td-20"><div className="AdminDocuments-div-21"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${d.ownerType === 'teacher' ? 'bg-teal-50 text-teal-600' : 'bg-emerald-50 text-emerald-600'}`}>{d.ownerType === 'teacher' ? <Shield className="AdminDocuments-shield-22" /> : <Users className="AdminDocuments-shield-22" />}{getOwnerName(d)}</span></div></td>
                    <td className="AdminDocuments-td-20"><div className="AdminDocuments-div-21"><div className="AdminDocuments-div-23"><FileText className="AdminDocuments-filetext-24" /></div><span className="AdminDocuments-span-25">{d.fileName}</span></div></td>
                    <td className="AdminDocuments-td-26">{d.uploadedAt}</td>
                    <td className="AdminDocuments-td-20"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.cls} flex items-center gap-1 w-fit`}><s.icon className="AdminDocuments-shield-22" />{s.label}</span></td>
                    <td className="AdminDocuments-td-20"><div className="AdminDocuments-div-27">
                      <button onClick={() => setSelected(d)} className="AdminDocuments-button-28"><Eye className="AdminDocuments-eye-29" /></button>
                      {d.status === 'pending' && <button onClick={() => handleVerify(d.id)} className="AdminDocuments-button-30">Verify</button>}
                      <button onClick={() => setDeleteTarget(d)} className="AdminDocuments-button-31"><X className="AdminDocuments-x-32" /></button>
                    </div></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title="Document Review" icon={FileText} size="sm">
          <div className="AdminDocuments-div-33">
            <div className="AdminDocuments-div-34"><div className="AdminDocuments-div-35"><FileText className="AdminDocuments-filetext-36" /></div><div><p className="AdminDocuments-p-37">{selected.docType}</p><p className="AdminDocuments-p-38">{selected.fileName}</p></div></div>
            <div className="AdminDocuments-div-39">
              <div><p className="AdminDocuments-p-38">Owner</p><p className="AdminDocuments-p-40">{getOwnerName(selected)}</p></div>
              <div><p className="AdminDocuments-p-38">Owner Type</p><p className="AdminDocuments-p-41">{selected.ownerType}</p></div>
              <div><p className="AdminDocuments-p-38">Upload Date</p><p className="AdminDocuments-p-40">{selected.uploadedAt}</p></div>
              <div><p className="AdminDocuments-p-38">Status</p><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${docStatusStyle[selected.status]?.cls || ''}`}>{docStatusStyle[selected.status]?.label || selected.status}</span></div>
            </div>
            <div className="AdminDocuments-div-42"><FileText className="AdminDocuments-filetext-43" /><p className="AdminDocuments-p-38">{selected.fileName}</p><button className="AdminDocuments-button-44"><Download className="AdminDocuments-download-45" /> Download File</button></div>
          </div>
          <div className="AdminDocuments-div-46">
            <button onClick={() => setSelected(null)} className="AdminDocuments-button-47">Close</button>
            {selected.status === 'pending' && <><button onClick={() => handleReject(selected.id)} className="AdminDocuments-button-48">Reject</button><button onClick={() => handleVerify(selected.id)} className="AdminDocuments-button-49">Verify</button></>}
          </div>
        </Modal>
      )}

      <ConfirmDialog open={!!deleteTarget} title="Delete Document?" message={`Are you sure you want to delete "${deleteTarget?.fileName}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
