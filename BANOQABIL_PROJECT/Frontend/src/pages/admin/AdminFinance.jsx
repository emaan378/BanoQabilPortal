import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Download, Search, CheckCircle2, AlertCircle, Users, Clock } from 'lucide-react';
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

export default function AdminFinance() {
  const toast = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [summary, setSummary] = useState({ totalCollected: 0, outstanding: 0, overdueCount: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('fees');
  const [feeStudents, setFeeStudents] = useState([]);
  const [feeStatus, setFeeStatus] = useState('all');
  const [feeSearch, setFeeSearch] = useState('');
  const [feeSummary, setFeeSummary] = useState({ all: 0, paid: 0, unpaid: 0, partial: 0 });
  const [feeLoading, setFeeLoading] = useState(true);
  const [updatingFee, setUpdatingFee] = useState(null);
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [feeModalStudent, setFeeModalStudent] = useState(null);
  const [feeModalAmount, setFeeModalAmount] = useState('');

  const fetchFeeData = useCallback(async () => {
    setFeeLoading(true);
    try {
      const [all, paid, unpaid, partial, listRes] = await Promise.all([
        studentApi.list({ page: 1, limit: 1 }),
        studentApi.list({ feeStatus: 'paid', page: 1, limit: 1 }),
        studentApi.list({ feeStatus: 'unpaid', page: 1, limit: 1 }),
        studentApi.list({ feeStatus: 'partial', page: 1, limit: 1 }),
        studentApi.list({ search: feeSearch.trim(), feeStatus: feeStatus === 'all' ? '' : feeStatus, page: 1, limit: 50 }),
      ]);
      setFeeSummary({
        all: all.pagination?.total || 0,
        paid: paid.pagination?.total || 0,
        unpaid: unpaid.pagination?.total || 0,
        partial: partial.pagination?.total || 0,
      });
      setFeeStudents(listRes.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setFeeLoading(false);
    }
  }, [feeSearch, feeStatus, toast]);

  useEffect(() => {
    const timer = setTimeout(() => fetchFeeData(), feeSearch ? 400 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeSearch, feeStatus]);

  const applyFeeLocalUpdate = (student, nextStatus, nextPaid) => {
    setFeeStudents((prev) => {
      const matchesFilter = feeStatus === 'all' || nextStatus === feeStatus;
      const next = prev.map((s) => (s._id === student._id ? { ...s, feeStatus: nextStatus, feePaid: nextPaid } : s));
      return matchesFilter ? next : next.filter((s) => s._id !== student._id);
    });
    setFeeSummary((prev) => {
      const from = student.feeStatus;
      if (from === nextStatus) return prev;
      return {
        ...prev,
        [from]: Math.max(0, (prev[from] || 0) - 1),
        [nextStatus]: (prev[nextStatus] || 0) + 1,
      };
    });
  };

  const handleMarkUnpaid = async (student) => {
    setUpdatingFee(student._id);
    try {
      await studentApi.updateStatus(student._id, { feeStatus: 'unpaid' });
      toast.success(`${student.name} marked as Unpaid`);
      applyFeeLocalUpdate(student, 'unpaid', student.feePaid || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingFee(null);
    }
  };

  const openFeeModal = (student) => {
    const outstanding = Math.max((student.feeAmount || 0) - (student.feePaid || 0), 0);
    setFeeModalStudent(student);
    setFeeModalAmount(outstanding > 0 ? String(outstanding) : String(student.feePaid || ''));
    setFeeModalOpen(true);
  };

  const submitFeePayment = async () => {
    const amount = Number(feeModalAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error('Please enter a valid paid amount');
      return;
    }
    setUpdatingFee(feeModalStudent._id);
    try {
      await studentApi.updateStatus(feeModalStudent._id, { feeStatus: 'paid', feePaid: amount });
      toast.success(`${feeModalStudent.name} marked as Paid (Rs. ${amount.toLocaleString()})`);
      applyFeeLocalUpdate(feeModalStudent, 'paid', amount);
      setFeeModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingFee(null);
    }
  };

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

  const handleMarkPaid = async (v) => {
    try {
      const res = await financeApi.markPaid(v._id);
      const updated = res.data || { ...v, status: 'paid', paidAt: new Date().toISOString(), displayStatus: 'paid' };
      setVouchers((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      setSummary((prev) => ({
        totalCollected: prev.totalCollected + v.amount,
        outstanding: Math.max(0, prev.outstanding - v.amount),
        overdueCount: Math.max(0, prev.overdueCount - (v.displayStatus === 'overdue' ? 1 : 0)),
      }));
      toast.success('Voucher marked as paid');
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
      `Amount: Rs. ${v.amount.toLocaleString()}`,
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
          <h1 className="AdminFinance-h1-3">Finance &amp; Fee Management</h1>
          <p className="AdminFinance-p-4">Track student fee status and reconcile payments</p>
        </div>
      </div>

      <div className="AdminFinance-tabs">
        <button type="button" onClick={() => setView('fees')} className={`AdminFinance-tabs-btn ${view === 'fees' ? 'AdminFinance-tabs-btn--active' : ''}`}>Student Fee Status</button>
        <button type="button" onClick={() => setView('vouchers')} className={`AdminFinance-tabs-btn ${view === 'vouchers' ? 'AdminFinance-tabs-btn--active' : ''}`}>Vouchers</button>
      </div>

      {view === 'fees' && (
        <>
        <div className="AdminFinance-div-7">
          {[
            { label: 'Total Students', value: String(feeSummary.all), color: 'text-slate-700', icon: Users },
            { label: 'Fee Paid', value: String(feeSummary.paid), color: 'text-emerald-600', icon: CheckCircle2 },
            { label: 'Partial', value: String(feeSummary.partial), color: 'text-amber-600', icon: Clock },
            { label: 'Unpaid', value: String(feeSummary.unpaid), color: 'text-red-600', icon: AlertCircle },
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
            <input type="text" value={feeSearch} onChange={(e) => setFeeSearch(e.target.value)} placeholder="Search by name, ID, or CNIC..." className="AdminFinance-input-22" />
          </div>
          <div className="AdminFinance-div-23">
            {['all', 'paid', 'unpaid', 'partial'].map((f) => (
              <button key={f} onClick={() => setFeeStatus(f)} className={`text-xs font-semibold px-3 py-2 rounded-lg capitalize transition-all ${feeStatus === f ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}>{f}</button>
            ))}
          </div>
        </div>

        {feeLoading ? (
          <LoadingSpinner label="Loading student fees..." />
        ) : feeStudents.length === 0 ? (
          <EmptyState icon={CreditCard} message="No students found with this fee status" />
        ) : (
          <div className="AdminFinance-div-24">
            <div className="AdminFinance-div-25">
              <table className="AdminFinance-table-26">
                <thead>
                  <tr className="AdminFinance-tr-27">
                    {['Student', 'Registration ID', 'Course', 'Fee Amount', 'Fee Status', ''].map((h) => (
                      <th key={h} className="AdminFinance-th-28">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="AdminFinance-tbody-29">
                  {feeStudents.map((s) => {
                    const isPaid = s.feeStatus === 'paid';
                    return (
                      <tr key={s._id} className="AdminFinance-tr-30">
                        <td className="AdminFinance-td-32"><p className="AdminFinance-p-33">{s.name}</p><p className="AdminFinance-p-34">{s.cnic || '—'}</p></td>
                        <td className="AdminFinance-td-31">{s.registrationId}</td>
                        <td className="AdminFinance-td-35">{s.course || '—'}</td>
                        <td className="AdminFinance-td-36">Rs. {(s.feePaid || 0).toLocaleString()} paid{s.feeAmount > 0 ? <span className="AdminFinance-p-34"> · Rs. {(s.feeAmount || 0).toLocaleString()} total</span> : null}</td>
                        <td className="AdminFinance-td-32"><span className={`AdminFinance-fee-badge AdminFinance-fee-badge--${s.feeStatus || 'unpaid'}`}>{(s.feeStatus || 'unpaid').charAt(0).toUpperCase() + (s.feeStatus || 'unpaid').slice(1)}</span></td>
                        <td className="AdminFinance-td-32">
                          {isPaid ? (
                            <button onClick={() => handleMarkUnpaid(s)} disabled={updatingFee === s._id} className="AdminFinance-fee-toggle AdminFinance-fee-toggle--unmark">{updatingFee === s._id ? 'Updating...' : 'Mark Unpaid'}</button>
                          ) : (
                            <button onClick={() => openFeeModal(s)} disabled={updatingFee === s._id} className="AdminFinance-fee-toggle AdminFinance-fee-toggle--mark">{updatingFee === s._id ? 'Updating...' : 'Mark Paid'}</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
      )}

      {view === 'vouchers' && (
      <>
      <div className="AdminFinance-div-7">
        {[
          { label: 'Total Collected', value: `Rs. ${summary.totalCollected.toLocaleString()}`, color: 'text-emerald-600', icon: CheckCircle2 },
          { label: 'Outstanding', value: `Rs. ${summary.outstanding.toLocaleString()}`, color: 'text-amber-600', icon: AlertCircle },
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
                    <td className="AdminFinance-td-36">Rs. {v.amount.toLocaleString()}</td>
                    <td className="AdminFinance-td-37">{formatDate(v.createdAt)}</td>
                    <td className="AdminFinance-td-32"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle[v.displayStatus].cls}`}>{statusStyle[v.displayStatus].label}</span></td>
                    <td className="AdminFinance-td-32">
                      {v.displayStatus === 'paid' ? (
                        <button onClick={() => handleDownload(v)} className="AdminFinance-button-38"><Download className="AdminFinance-download-39" /></button>
                      ) : (
                        <button onClick={() => handleMarkPaid(v)} className="AdminFinance-button-40">Mark Paid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </>
      )}

      {feeModalOpen && feeModalStudent && (
        <div className="AdminFinance-div-41">
          <div className="AdminFinance-div-42" onClick={() => setFeeModalOpen(false)} />
          <div className="AdminFinance-div-43">
            <div className="AdminFinance-div-44">
              <div className="AdminFinance-div-45"><CheckCircle2 className="AdminFinance-creditcard-46" /><h3 className="AdminFinance-h3-47">Mark Fee Paid</h3></div>
              <button onClick={() => setFeeModalOpen(false)} className="AdminFinance-button-48">&times;</button>
            </div>
            <div className="AdminFinance-div-49">
              <p className="AdminFinance-p-33">{feeModalStudent.name}</p>
              <p className="AdminFinance-p-34">{feeModalStudent.registrationId} · {feeModalStudent.course || 'No course'}</p>
              <div style={{ marginTop: '1rem' }}>
                <label className="AdminFinance-label-50">Amount Paid (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  value={feeModalAmount}
                  onChange={(e) => setFeeModalAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="AdminFinance-input-51"
                />
              </div>
            </div>
            <div className="AdminFinance-div-52">
              <button onClick={() => setFeeModalOpen(false)} className="AdminFinance-button-53">Cancel</button>
              <button disabled={updatingFee === feeModalStudent._id} onClick={submitFeePayment} className="AdminFinance-button-54">{updatingFee === feeModalStudent._id ? 'Saving...' : 'Confirm Payment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
