import { useEffect, useState } from 'react';
import { CreditCard, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import './FeePayments.css';
import { portalApi } from '@/lib/api.js';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '');

export default function FeePayments() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    portalApi.student.fees().then((res) => {
      if (active) setList(res?.data?.data ?? res?.data ?? []);
    }).catch((e) => {
      if (active) setError(e.message || 'Unable to load fee details');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const totalPaid = list.filter((v) => v.displayStatus === 'paid').reduce((s, v) => s + v.amount, 0);
  const outstanding = list.filter((v) => v.displayStatus !== 'paid').reduce((s, v) => s + v.amount, 0);
  const nextDue = list
    .filter((v) => v.displayStatus !== 'paid' && v.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  const dueBanner = list.find((v) => v.displayStatus === 'overdue') || nextDue;

  return (
    <div className="FeePayments-div-1">
      <div>
        <h1 className="FeePayments-h1-2">Fee & Payments</h1>
        <p className="FeePayments-p-3">Your fee receipts and payment history</p>
      </div>

      <div className="FeePayments-div-4">
        <div className="FeePayments-div-5">
          <div className="FeePayments-div-6">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="FeePayments-p-7">Total Paid</p>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">PKR {totalPaid.toLocaleString()}</p>
        </div>
        <div className="FeePayments-div-5">
          <div className="FeePayments-div-6">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="FeePayments-p-7">Outstanding</p>
          </div>
          <p className="text-2xl font-extrabold text-red-600">PKR {outstanding.toLocaleString()}</p>
        </div>
        <div className="FeePayments-div-5">
          <div className="FeePayments-div-6">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <p className="FeePayments-p-7">Next Due</p>
          </div>
          <p className="text-2xl font-extrabold text-amber-600">
            {nextDue ? fmt(nextDue.dueDate) : '—'}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="FeePayments-empty">Loading payment history...</p>
      ) : error && list.length === 0 ? (
        <p className="FeePayments-empty">{error}</p>
      ) : list.length === 0 ? (
        <p className="FeePayments-empty">No fee vouchers found for your account.</p>
      ) : (
        <>
          {dueBanner && (
            <div className="FeePayments-div-8">
              <div className="FeePayments-div-9">
                <AlertCircle className="FeePayments-alertcircle-10" />
              </div>
              <div className="FeePayments-div-11">
                <p className="FeePayments-p-12">Payment Due — PKR {dueBanner.amount.toLocaleString()}</p>
                <p className="FeePayments-p-13">
                  {dueBanner.description}{dueBanner.dueDate ? ` · Due by ${fmt(dueBanner.dueDate)}` : ''}
                </p>
              </div>
              <button className="FeePayments-button-14">Pay Now</button>
            </div>
          )}

          <div className="FeePayments-div-15">
            <div className="FeePayments-div-16">
              <h2 className="FeePayments-h2-17">Payment History</h2>
            </div>
            <div className="FeePayments-div-18">
              {list.map((r, i) => (
                <div key={r._id || i} className="FeePayments-div-19">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    r.displayStatus === 'paid' ? 'bg-emerald-50' : 'bg-red-50'
                  }`}>
                    {r.displayStatus === 'paid'
                      ? <CheckCircle2 className="FeePayments-checkcircle2-20" />
                      : <AlertCircle className="FeePayments-alertcircle-21" />}
                  </div>
                  <div className="FeePayments-div-22">
                    <p className="FeePayments-p-23">{r.description}</p>
                    <p className="FeePayments-p-24">{r.paidAt ? `Paid ${fmt(r.paidAt)}` : fmt(r.dueDate)}</p>
                  </div>
                  <div className="FeePayments-div-25">
                    <p className={`font-bold text-sm ${r.displayStatus === 'paid' ? 'text-slate-900' : 'text-red-600'}`}>PKR {r.amount.toLocaleString()}</p>
                    <span className={`text-xs font-semibold ${
                      r.displayStatus === 'paid' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {r.displayStatus === 'paid' ? 'Paid' : r.displayStatus === 'overdue' ? 'Overdue' : 'Due'}
                    </span>
                  </div>
                  {r.displayStatus === 'paid' && (
                    <button className="FeePayments-button-26">
                      <Download className="FeePayments-download-27" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
