import { useState } from 'react';
import { GraduationCap, Award, CheckCircle2, Clock, Download, QrCode } from 'lucide-react';
import { certRequests } from '@/data/mockData.js';
import './AdminAcademics.css';

const statusStyle = {
  pending: { cls: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Pending Approval', icon: Clock },
  approved: { cls: 'bg-teal-50 text-teal-600 border-teal-100', label: 'Approved', icon: CheckCircle2 },
  issued: { cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Issued', icon: Award },
};

export default function AdminAcademics() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="AdminAcademics-div-1">
      <div>
        <h1 className="AdminAcademics-h1-2">Academics &amp; Certificates</h1>
        <p className="AdminAcademics-p-3">Approve results and issue QR-verified certificates</p>
      </div>

      <div className="AdminAcademics-div-4">
        {[
          { label: 'Pending Approval', value: String(certRequests.filter((c) => c.status === 'pending').length), color: 'text-amber-600' },
          { label: 'Approved', value: String(certRequests.filter((c) => c.status === 'approved').length), color: 'text-teal-600' },
          { label: 'Issued', value: String(certRequests.filter((c) => c.status === 'issued').length), color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="AdminAcademics-div-5">
            <p className="AdminAcademics-p-6">{s.label}</p>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="AdminAcademics-div-7">
        <div className="AdminAcademics-div-8">
          <GraduationCap className="AdminAcademics-graduationcap-9" />
          <h2 className="AdminAcademics-h2-10">Instructor Assignments</h2>
        </div>
        <div className="AdminAcademics-div-11">
          {[
            { instructor: 'Sir Bilal Hassan', courses: 'Web Development, Python Programming', batches: 'FSD-14, FSD-17' },
            { instructor: 'Ms. Sara Khan', courses: 'Graphic Design, Video Editing', batches: 'FSD-15, FSD-19' },
            { instructor: 'Mr. Imran Q.', courses: 'Digital Marketing, E-Commerce', batches: 'FSD-16, FSD-18' },
          ].map((t) => (
            <div key={t.instructor} className="AdminAcademics-div-12">
              <div className="AdminAcademics-div-13">
                {t.instructor.split(' ').map((w) => w[0]).join('')}
              </div>
              <div className="AdminAcademics-div-14">
                <p className="AdminAcademics-p-15">{t.instructor}</p>
                <p className="AdminAcademics-p-16">{t.courses}</p>
              </div>
              <span className="AdminAcademics-span-17">{t.batches}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="AdminAcademics-div-7">
        <div className="AdminAcademics-div-8">
          <Award className="AdminAcademics-graduationcap-9" />
          <h2 className="AdminAcademics-h2-10">Certificate Requests</h2>
        </div>
        <div className="AdminAcademics-div-18">
          <table className="AdminAcademics-table-19">
            <thead>
              <tr className="AdminAcademics-tr-20">
                {['Student', 'Course', 'Batch', 'Grade', 'Status', 'Action'].map((h) => (
                  <th key={h} className="AdminAcademics-th-21">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="AdminAcademics-div-11">
              {certRequests.map((c) => {
                const s = statusStyle[c.status];
                return (
                  <tr key={c.id} className="AdminAcademics-tr-22">
                    <td className="AdminAcademics-td-23"><p className="AdminAcademics-p-15">{c.student}</p><p className="AdminAcademics-p-16">{c.rollNo}</p></td>
                    <td className="AdminAcademics-td-24">{c.course}</td>
                    <td className="AdminAcademics-td-24">{c.batch}</td>
                    <td className="AdminAcademics-td-23"><span className="AdminAcademics-span-25">{c.grade}</span></td>
                    <td className="AdminAcademics-td-23"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.cls} flex items-center gap-1 w-fit`}><s.icon className="AdminAcademics-sicon-26" />{s.label}</span></td>
                    <td className="AdminAcademics-td-23"><button onClick={() => setSelected(c)} className="AdminAcademics-button-27">{c.status === 'pending' ? 'Review' : c.status === 'approved' ? 'Issue' : 'View'}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="AdminAcademics-div-28">
          <div className="AdminAcademics-div-29" onClick={() => setSelected(null)} />
          <div className="AdminAcademics-div-30">
            <div className="AdminAcademics-div-31">
              <div className="AdminAcademics-div-32"><QrCode className="AdminAcademics-graduationcap-9" /><h3 className="AdminAcademics-h2-10">Certificate Preview</h3></div>
              <button onClick={() => setSelected(null)} className="AdminAcademics-button-33">&times;</button>
            </div>
            <div className="AdminAcademics-div-34">
              <div className="AdminAcademics-div-35">
                <div className="AdminAcademics-div-36">
                  <div className="AdminAcademics-div-37"><GraduationCap className="AdminAcademics-graduationcap-38" /></div>
                  <div className="AdminAcademics-div-39"><p className="AdminAcademics-p-40">Bano Qabil</p><p className="AdminAcademics-p-41">FSD Campus</p></div>
                </div>
                <p className="AdminAcademics-p-42">Certificate of Completion</p>
                <p className="AdminAcademics-p-43">{selected.student}</p>
                <p className="AdminAcademics-p-44">has successfully completed</p>
                <p className="AdminAcademics-p-45">{selected.course}</p>
                <div className="AdminAcademics-div-46"><span>Grade: <strong className="AdminAcademics-strong-47">{selected.grade}</strong></span><span>·</span><span>Batch: <strong className="AdminAcademics-strong-47">{selected.batch}</strong></span></div>
                <div className="AdminAcademics-div-48"><div className="AdminAcademics-div-49"><QrCode className="AdminAcademics-qrcode-50" /></div></div>
                <p className="AdminAcademics-p-51">Scan QR to verify authenticity</p>
              </div>
            </div>
            <div className="AdminAcademics-div-52">
              <button onClick={() => setSelected(null)} className="AdminAcademics-button-53">Close</button>
              {selected.status === 'pending' && <button onClick={() => setSelected(null)} className="AdminAcademics-button-54">Approve</button>}
              {selected.status === 'approved' && <button onClick={() => setSelected(null)} className="AdminAcademics-button-55"><Download className="AdminAcademics-download-56" /> Issue &amp; Download</button>}
              {selected.status === 'issued' && <button onClick={() => setSelected(null)} className="AdminAcademics-button-57"><Download className="AdminAcademics-download-56" /> Download</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
