import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Plus, Download, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast.jsx';
import LoadingSpinner from '@/components/ui/LoadingSpinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { financeApi, studentApi } from '@/lib/api.js';
import './AdminFinance.css';

const statusStyle = {
  paid: { cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Paid' },
  unpaid: { cls: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Unpaid' },
  overdue: { cls: 'bg-red-50 text-red-600 border-red-100', label: 'Overdue' },
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const readableError = (error) => (Array.isArray(error.details) && error.details.length ? error.details.join(', ') : error.message);

export default function AdminFinance() {
  const toast = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [summary, setSummary] = useState({ totalCollected: 0, outstanding: 0, overdueCount: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showVoucher, setShowVoucher] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ studentId: '', desc: '', amount: '', dueDate: '' });
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        financeApi.list({ search: search.trim(), status: filter === 'all' ? '' : filter }),
        financeApi.summary(),
      ]);
      setVouchers(listRes.data || []);
      setSummary(summaryRes.data || { totalCollected: 0, outstanding: 0, overdueCount: 0 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, filter, toast]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), search ? 400 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter]);

  const loadStudents = useCallback(async (query) => {
    setStudentsLoading(true);
    try {
      const res = await studentApi.list({ search: query.trim(), limit: 50 });
      setStudents(res.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStudentsLoading(false);
    }
  }, [toast]);

  const openVoucherModal = () => {
    setShowVoucher(true);
    setStudentSearch('');
    loadStudents('');
  };

  useEffect(() => {
    if (!showVoucher) return;
    const timer = setTimeout(() => loadStudents(studentSearch), studentSearch ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentSearch, showVoucher]);

  const handleGenerateVoucher = async () => {
    if (!form.studentId || !form.desc.trim() || !form.amount) {
      toast.error('Please select a student, and fill in description and amount');
      return;
    }
    setSubmitting(true);
    try {
      await financeApi.create({
        studentId: form.studentId,
        description: form.desc.trim(),
        amount: Number(form.amount),
        dueDate: form.dueDate || undefined,
      });
      toast.success('Voucher generated successfully');
      setForm({ studentId: '', desc: '', amount: '', dueDate: '' });
      setShowVoucher(false);
      fetchData();
    } catch (err) {
      toast.error(readableError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await financeApi.markPaid(id);
      toast.success('Voucher marked as paid');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDownload = (v) => {
    const receipt = [
      'BANO QABIL — PAYMENT RECEIPT',
      '-----------------------------',
      `Tracking ID: ${v.trackingId}`,
      `Student: ${v.studentName}`,
      `Roll No: ${v.rollNumber || '—'}`,
      `Description: ${v.description}`,
      `Amount: PKR ${v.amount.toLocaleString()}`,
      `Date: ${formatDate(v.createdAt)}`,
      `Status: ${statusStyle[v.displayStatus].label}`,
    ].join('\n');
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${v.trackingId}-receipt.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Receipt downloaded');
  };

  return (
    <div className="AdminFinance-div-1">
      <div className="AdminFinance-div-2">
        <div>
          <h1 className="AdminFinance-h1-3">Finance &amp; Voucher Engine</h1>
          <p className="AdminFinance-p-4">Generate vouchers, reconcile payments, and manage defaulters</p>
        </div>
        <button onClick={openVoucherModal} className="AdminFinance-button-5">
          <Plus className="AdminFinance-plus-6" /> Generate Voucher
        </button>
      </div>

      <div className="AdminFinance-div-7">
        {[
          { label: 'Total Collected', value: `PKR ${summary.totalCollected.toLocaleString()}`, color: 'text-emerald-600', icon: CheckCircle2 },
          { label: 'Outstanding', value: `PKR ${summary.outstanding.toLocaleString()}`, color: 'text-amber-600', icon: AlertCircle },
          { label: 'Overdue Vouchers', value: String(summary.overdueCount), color: 'text-red-600', icon: AlertCircle },
        ].map((s) => (
          <div key={s.label} className="AdminFinance-div-8">
            <div className="AdminFinance-div-9">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <p className="AdminFinance-p-10">{s.label}</p>
            </div>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="AdminFinance-div-19">
        <div className="AdminFinance-div-20">
          <Search className="AdminFinance-search-21" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student, roll no, or tracking ID..." className="AdminFinance-input-22" />
        </div>
        <div className="AdminFinance-div-23">
          {['all', 'paid', 'unpaid', 'overdue'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`text-xs font-semibold px-3 py-2 rounded-lg capitalize transition-all ${filter === f ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}>{f}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading vouchers..." />
      ) : vouchers.length === 0 ? (
        <EmptyState icon={CreditCard} message="No vouchers found" />
      ) : (
        <div className="AdminFinance-div-24">
          <div className="AdminFinance-div-25">
            <table className="AdminFinance-table-26">
              <thead>
                <tr className="AdminFinance-tr-27">
                  {['Tracking ID', 'Student', 'Description', 'Amount', 'Date', 'Status', ''].map((h) => (
                    <th key={h} className="AdminFinance-th-28">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="AdminFinance-tbody-29">
                {vouchers.map((v) => (
                  <tr key={v._id} className="AdminFinance-tr-30">
                    <td className="AdminFinance-td-31">{v.trackingId}</td>
                    <td className="AdminFinance-td-32"><p className="AdminFinance-p-33">{v.studentName}</p><p className="AdminFinance-p-34">{v.rollNumber}</p></td>
                    <td className="AdminFinance-td-35">{v.description}</td>
                    <td className="AdminFinance-td-36">PKR {v.amount.toLocaleString()}</td>
                    <td className="AdminFinance-td-37">{formatDate(v.createdAt)}</td>
                    <td className="AdminFinance-td-32"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle[v.displayStatus].cls}`}>{statusStyle[v.displayStatus].label}</span></td>
                    <td className="AdminFinance-td-32">
                      {v.displayStatus === 'paid' ? (
                        <button onClick={() => handleDownload(v)} className="AdminFinance-button-38"><Download className="AdminFinance-download-39" /></button>
                      ) : (
                        <button onClick={() => handleMarkPaid(v._id)} className="AdminFinance-button-40">Mark Paid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showVoucher && (
        <div className="AdminFinance-div-41">
          <div className="AdminFinance-div-42" onClick={() => setShowVoucher(false)} />
          <div className="AdminFinance-div-43">
            <div className="AdminFinance-div-44">
              <div className="AdminFinance-div-45"><CreditCard className="AdminFinance-creditcard-46" /><h3 className="AdminFinance-h3-47">Generate Voucher</h3></div>
              <button onClick={() => setShowVoucher(false)} className="AdminFinance-button-48">&times;</button>
            </div>
            <div className="AdminFinance-div-49">
              <div>
                <label className="AdminFinance-label-50">Student</label>
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by name, CNIC, or registration ID..."
                  className="AdminFinance-input-51"
                />
                <select
                  value={form.studentId}
                  onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                  className="AdminFinance-input-51"
                  style={{ marginTop: '0.5rem' }}
                  size={Math.min(Math.max(students.length, 3), 6)}
                >
                  {studentsLoading && <option value="" disabled>Loading students...</option>}
                  {!studentsLoading && students.length === 0 && <option value="" disabled>No students found</option>}
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — {s.registrationId || s._id.slice(-6)}{s.course ? ` · ${s.course}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div><label className="AdminFinance-label-50">Description</label><input type="text" value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} placeholder="e.g. Security Deposit — Batch FSD-14" className="AdminFinance-input-51" /></div>
              <div><label className="AdminFinance-label-50">Amount (PKR)</label><input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="e.g. 2000" className="AdminFinance-input-51" /></div>
              <div><label className="AdminFinance-label-50">Due Date</label><input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className="AdminFinance-input-51" /></div>
            </div>
            <div className="AdminFinance-div-52">
              <button onClick={() => { setShowVoucher(false); setForm({ studentId: '', desc: '', amount: '', dueDate: '' }); }} className="AdminFinance-button-53">Cancel</button>
              <button disabled={submitting} onClick={handleGenerateVoucher} className="AdminFinance-button-54">{submitting ? 'Generating...' : 'Generate'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
