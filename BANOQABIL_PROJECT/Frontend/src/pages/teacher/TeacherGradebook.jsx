import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Save, Loader2 } from 'lucide-react';
import { portalApi } from '@/lib/api.js';
import './TeacherGradebook.css';

const letterFor = (percentage) => {
  if (percentage === null) return { letter: '—', cls: 'text-slate-300' };
  if (percentage >= 90) return { letter: 'A', cls: 'text-emerald-600' };
  if (percentage >= 80) return { letter: 'A-', cls: 'text-emerald-600' };
  if (percentage >= 70) return { letter: 'B', cls: 'text-teal-600' };
  if (percentage >= 60) return { letter: 'C', cls: 'text-amber-600' };
  return { letter: 'F', cls: 'text-red-500' };
};

export default function TeacherGradebook() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [rows, setRows] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');

  const loadBatches = async () => {
    try {
      const response = await portalApi.teacher.batches();
      const data = response.data || [];
      setBatches(data);
      if (!selectedBatch && data[0]?._id) setSelectedBatch(data[0]._id);
    } catch (loadError) { setError(loadError.message); }
  };

  const loadGradebook = async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const response = await portalApi.teacher.gradebook(selectedBatch);
      const data = response.data || {};
      setRows(data.data || []);
      setAssessments(data.assessments || []);
      setError('');
    } catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
  };

  useEffect(() => { loadBatches(); }, []);
  useEffect(() => { loadGradebook(); }, [selectedBatch]);

  const gradeFor = (row, assessment) => row.grades.find((grade) => grade.assessment === assessment);
  const updateDraft = (studentId, assessment, field, value) => setDrafts((previous) => ({ ...previous, [`${studentId}:${assessment}`]: { ...previous[`${studentId}:${assessment}`], [field]: value } }));
  const save = async (row, assessment) => {
    const existing = gradeFor(row, assessment);
    const draft = drafts[`${row.student._id}:${assessment}`] || {};
    if (draft.score === undefined && !existing) return;
    setSaving(`${row.student._id}:${assessment}`);
    try {
      await portalApi.teacher.saveGrade({ batchId: selectedBatch, studentId: row.student._id, assessment, score: Number(draft.score ?? existing.score), maxScore: Number(draft.maxScore ?? existing.maxScore ?? 100), feedback: draft.feedback ?? existing.feedback ?? '' });
      await loadGradebook();
    } catch (saveError) { setError(saveError.message); } finally { setSaving(''); }
  };

  const totals = useMemo(() => rows.map((row) => {
    const grades = row.grades || [];
    const totalMax = grades.reduce((sum, grade) => sum + Number(grade.maxScore || 0), 0);
    const totalScore = grades.reduce((sum, grade) => sum + Number(grade.score || 0), 0);
    return totalMax ? Math.round((totalScore / totalMax) * 100) : null;
  }), [rows]);

  return (
    <div className="TeacherGradebook-div-1">
      <div className="TeacherGradebook-div-2"><div><h1 className="TeacherGradebook-h1-3">Gradebook</h1><p className="TeacherGradebook-p-4">Live assessment tracking for your assigned batch.</p></div><select value={selectedBatch} onChange={(event) => setSelectedBatch(event.target.value)} className="TeacherGradebook-button-5"><option value="">Select batch...</option>{batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.name}</option>)}</select></div>
      {error && <div className="portal-inline-error">{error}</div>}
      <div className="TeacherGradebook-div-7"><div className="TeacherGradebook-div-8"><BarChart3 className="TeacherGradebook-barchart3-9" /><h2 className="TeacherGradebook-h2-10">Assessment Sheet</h2></div><div className="TeacherGradebook-div-11">{loading ? <div className="TeacherGradebook-div-23"><Loader2 className="spin" /> Loading gradebook...</div> : !rows.length ? <div className="TeacherGradebook-div-23">No students or grades found for this batch.</div> : <table className="TeacherGradebook-table-12"><thead><tr className="TeacherGradebook-tr-13"><th className="TeacherGradebook-th-14">Student</th>{assessments.map((assessment) => <th key={assessment} className="TeacherGradebook-th-14">{assessment}</th>)}<th className="TeacherGradebook-th-14">Aggregate</th><th className="TeacherGradebook-th-14">Grade</th></tr></thead><tbody className="TeacherGradebook-tbody-15">{rows.map((row, index) => { const percentage = totals[index]; const letter = letterFor(percentage); return <tr key={row.student._id} className="TeacherGradebook-tr-16"><td className="TeacherGradebook-td-17"><p className="TeacherGradebook-p-18">{row.student.name}</p><p className="TeacherGradebook-p-19">{row.student.registrationId || row.student.rollNumber || '—'}</p></td>{assessments.map((assessment) => { const existing = gradeFor(row, assessment); const draft = drafts[`${row.student._id}:${assessment}`] || {}; const key = `${row.student._id}:${assessment}`; return <td key={assessment} className="TeacherGradebook-td-20"><input type="number" min="0" max={existing?.maxScore || 100} value={draft.score ?? existing?.score ?? ''} placeholder="—" onChange={(event) => updateDraft(row.student._id, assessment, 'score', event.target.value)} onBlur={() => save(row, assessment)} className="gradebook-score-input" />{saving === key ? <Save size={12} className="spin" /> : null}</td>; })}<td className="TeacherGradebook-td-17"><span className="TeacherGradebook-span-22">{percentage === null ? '—' : `${percentage}%`}</span></td><td className="TeacherGradebook-td-17"><span className={`text-sm font-extrabold ${letter.cls}`}>{letter.letter}</span></td></tr>; })}</tbody></table>}</div></div>
      <div className="TeacherGradebook-div-23"><h3 className="TeacherGradebook-h3-24">Grading Scale</h3><div className="TeacherGradebook-div-25">{[['A','90-100','text-emerald-600'],['A-','80-89','text-emerald-600'],['B','70-79','text-teal-600'],['C','60-69','text-amber-600'],['F','Below 60','text-red-500']].map(([letter, range, cls]) => <div key={letter} className="TeacherGradebook-div-26"><span className={`text-sm font-extrabold ${cls}`}>{letter}</span><span className="TeacherGradebook-p-19">{range}</span></div>)}</div></div>
    </div>
  );
}
