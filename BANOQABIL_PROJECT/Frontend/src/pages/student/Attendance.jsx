import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import './Attendance.css';
import { portalApi } from '@/lib/api.js';

const statusStyle = {
  present: 'bg-emerald-500 text-white',
  late: 'bg-amber-400 text-slate-900',
  absent: 'bg-red-500 text-white',
  excused: 'bg-slate-300 text-slate-700',
  none: 'bg-white text-slate-300 border border-slate-100',
  future: 'bg-white text-slate-300 border border-slate-100',
};

const statusLabel = { present: 'Present', late: 'Late', absent: 'Absent', excused: 'Excused' };

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [batchName, setBatchName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    let active = true;
    portalApi.student.attendance().then((res) => {
      const d = res?.data ?? {};
      if (active) {
        setRecords(d.records ?? []);
        setSummary(d.summary ?? null);
        const firstBatch = d.records?.[0]?.batch;
        setBatchName(firstBatch?.name ? `${firstBatch?.course || 'Course'} — ${firstBatch?.name}` : '');
      }
    }).catch((e) => {
      if (active) setError(e.message || 'Unable to load attendance');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setSelectedDay(null);
  }, [monthOffset]);

  const today = new Date();
  const now = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = (new Date(year, month, 1).getDay() + 6) % 7;

  const byDay = useMemo(() => {
    const map = {};
    for (const r of records) {
      const dt = new Date(r.date);
      if (dt.getFullYear() === year && dt.getMonth() === month) map[dt.getDate()] = r;
    }
    return map;
  }, [records, year, month]);

  const monthLabel = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const summaryRate = summary?.rate ?? '—';
  const selectedRecords = selectedDay ? (byDay[selectedDay] ? [byDay[selectedDay]] : []) : [];

  const dayStatus = (day) => {
    if (byDay[day]) return byDay[day].status;
    if (new Date(year, month, day) > today) return 'future';
    return 'none';
  };

  const cells = [];
  for (let i = 0; i < startDay; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  return (
    <div className="Attendance-div-1">
      <div>
        <h1 className="Attendance-h1-2">Attendance</h1>
        <p className="Attendance-p-3">{batchName || 'Your attendance record'}</p>
      </div>

      {loading ? (
        <p className="Attendance-p-3">Loading attendance...</p>
      ) : error && records.length === 0 ? (
        <p className="Attendance-p-3">{error}</p>
      ) : (
        <>
          <div className="Attendance-div-4">
            <div className="Attendance-div-5">
              <p className="Attendance-p-6">Total Sessions</p>
              <p className="text-2xl font-extrabold text-slate-900">{summary?.total ?? records.length}</p>
            </div>
            <div className="Attendance-div-5">
              <p className="Attendance-p-6">Present</p>
              <p className="text-2xl font-extrabold text-emerald-600">{summary?.present ?? 0}</p>
            </div>
            <div className="Attendance-div-5">
              <p className="Attendance-p-6">Absent</p>
              <p className="text-2xl font-extrabold text-red-500">{summary?.absent ?? 0}</p>
            </div>
            <div className="Attendance-div-5">
              <p className="Attendance-p-6">Attendance %</p>
              <p className="text-2xl font-extrabold text-emerald-600">{summaryRate}{summaryRate !== '—' ? '%' : ''}</p>
            </div>
          </div>

          <div className="Attendance-div-7">
            <div className="Attendance-div-8">
              <div className="Attendance-div-9">
                <CalendarCheck className="Attendance-calendarcheck-10" />
                <h2 className="Attendance-h2-11">{monthLabel}</h2>
              </div>
              <div className="Attendance-div-9">
                <button className="Attendance-button-12" onClick={() => setMonthOffset((o) => o - 1)}>
                  <ChevronLeft className="Attendance-chevronleft-13" />
                </button>
                <button className="Attendance-button-12" onClick={() => setMonthOffset((o) => o + 1)}>
                  <ChevronRight className="Attendance-chevronleft-13" />
                </button>
              </div>
            </div>

            <div className="Attendance-div-14">
              <div className="Attendance-div-15">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d} className="Attendance-div-16">{d}</div>
                ))}
              </div>

              <div className="Attendance-div-17">
                {cells.map((day, i) =>
                  day === null ? (
                    <div key={`b${i}`} />
                  ) : (
                    <button
                      key={day}
                      onClick={() => dayStatus(day) !== 'future' && dayStatus(day) !== 'none' && setSelectedDay(day)}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-semibold transition-all ${
                        selectedDay === day ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
                      } ${statusStyle[dayStatus(day)]}`}
                    >
                      {day}
                    </button>
                  )
                )}
              </div>

              <div className="Attendance-div-18">
                {[
                  { label: 'Present', cls: 'bg-emerald-500' },
                  { label: 'Late', cls: 'bg-amber-400' },
                  { label: 'Absent', cls: 'bg-red-500' },
                  { label: 'Upcoming', cls: 'bg-white border border-slate-200' },
                ].map((l) => (
                  <div key={l.label} className="Attendance-div-9">
                    <span className={`w-3 h-3 rounded ${l.cls}`} />
                    <span className="Attendance-span-19">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedDay &&
            (selectedRecords.length > 0 ? (
              <div className="Attendance-div-20">
                <h3 className="Attendance-h3-21">
                  {selectedDay} {monthLabel} — Details
                </h3>
                <div className="Attendance-div-22">
                  {selectedRecords.map((r, i) => (
                    <div key={i} className="Attendance-div-23">
                      <span className="Attendance-span-24">
                        {statusLabel[r.status] || r.status}
                        {r.notes ? ` · ${r.notes}` : ''}
                      </span>
                      <span className="Attendance-span-25">{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="Attendance-div-20">
                <h3 className="Attendance-h3-21">{selectedDay} {monthLabel} — No records</h3>
                <p className="Attendance-p-3">No attendance recorded for this day.</p>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
