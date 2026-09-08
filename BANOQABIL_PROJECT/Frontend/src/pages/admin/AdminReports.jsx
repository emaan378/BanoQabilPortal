import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast.jsx';
import PageHeader from '@/components/ui/PageHeader.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import LoadingSpinner from '@/components/ui/LoadingSpinner.jsx';
import { reportsApi } from '@/lib/api.js';
import { BarChart3, FileText, FileSpreadsheet, Users, Shield, Building2, BookOpen, Layers } from 'lucide-react';
import './AdminReports.css';

const statusSections = [
  { key: 'reg', title: 'Registration Status' },
  { key: 'test', title: 'Test Status' },
  { key: 'interview', title: 'Interview Status' },
  { key: 'allocation', title: 'Batch Allocation Status' },
  { key: 'fee', title: 'Fee Status' },
];

export default function AdminReports() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await reportsApi.overview();
      setData(res.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    const interval = setInterval(load, 30000);
    const onFocus = () => load();

    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const exportCsv = () => {
    if (!data) return;
    const rows = [['Section', 'Status', 'Count']];
    statusSections.forEach((section) => {
      Object.entries(data.breakdown[section.key] || {}).forEach(([key, count]) => {
        rows.push([section.title, key.replace(/-/g, ' '), count]);
      });
    });
    rows.push([], ['Batch', 'Course', 'Enrolled', 'Capacity']);
    data.batches.forEach((b) => rows.push([b.name, b.course, b.enrolled, b.capacity]));

    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bano-qabil-reports.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV report downloaded');
  };

  const exportPdf = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-6 text-slate-400 text-sm"><LoadingSpinner label="Loading reports..." /></div>;
  }

  const summaryCards = [
    { icon: Users, label: 'Total Students', value: data.summary.totalStudents, color: 'text-emerald-600' },
    { icon: Shield, label: 'Total Teachers', value: data.summary.totalTeachers, color: 'text-teal-600' },
    { icon: Building2, label: 'Total Campuses', value: data.summary.totalCampuses, color: 'text-amber-600' },
    { icon: BookOpen, label: 'Total Courses', value: data.summary.totalCourses, color: 'text-blue-600' },
    { icon: Layers, label: 'Total Batches', value: data.summary.totalBatches, color: 'text-purple-600' },
  ];

  return (
    <div className="AdminReports-div-1">
      <PageHeader title="Reports & Analytics" subtitle="Comprehensive overview of all campus operations" action={
        <div className="AdminReports-div-2">
          <button onClick={exportPdf} className="AdminReports-button-3"><FileText className="AdminReports-filetext-4" /> PDF</button>
          <button onClick={exportCsv} className="AdminReports-button-5"><FileSpreadsheet className="AdminReports-filetext-4" /> Excel</button>
        </div>
      } />

      <div className="AdminReports-div-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="AdminReports-div-7">
            <div className="AdminReports-div-8"><card.icon className={`w-4 h-4 ${card.color}`} /></div>
            <p className="AdminReports-p-9">{card.label}</p>
            <p className={`text-2xl font-extrabold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="AdminReports-div-10">
        {statusSections.map((section) => (
          <div key={section.key} className="AdminReports-div-11">
            <div className="AdminReports-div-12"><BarChart3 className="AdminReports-barchart3-13" /><h2 className="AdminReports-h2-14">{section.title}</h2></div>
            <div className="AdminReports-div-15">
              {Object.entries(data.breakdown[section.key] || {}).map(([key, count]) => (
                <div key={key} className="AdminReports-div-16"><span className="AdminReports-span-17">{key.replace(/-/g, ' ')}</span><span className="AdminReports-span-18">{count}</span></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="AdminReports-div-11">
        <div className="AdminReports-div-12"><Layers className="AdminReports-barchart3-13" /><h2 className="AdminReports-h2-14">Students per Batch</h2></div>
        {data.batches.length === 0 ? <EmptyState icon={Layers} message="No batches found." /> : (
          <div className="AdminReports-div-19">
            {data.batches.map((b) => (
              <div key={b._id} className="AdminReports-div-20">
                <div className="AdminReports-div-21"><Layers className="AdminReports-layers-22" /></div>
                <div className="AdminReports-div-23"><p className="AdminReports-p-24">{b.name}</p><p className="AdminReports-p-25">{b.course || 'No course'}</p></div>
                <div className="AdminReports-div-26"><p className="AdminReports-span-18">{b.enrolled}/{b.capacity}</p><p className="AdminReports-p-25">students</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
