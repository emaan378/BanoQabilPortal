import { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Users, MapPin, Clock, Calendar, X, UserPlus, ClipboardList, Search, Pencil, Trash2 } from 'lucide-react';
import { catalogApi, studentApi } from '@/lib/api.js';
import { useToast } from '@/components/ui/Toast.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import './AdminBatches.css';

const statusStyle = {
  open: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  full: 'bg-red-50 text-red-600 border-red-100',
  closed: 'bg-slate-100 text-slate-400 border-slate-200',
};

const nextBatchName = (batches) => {
  const numbers = batches
    .map((b) => /FSD-(\d+)/.exec(b.name || ''))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));
  const max = numbers.length ? Math.max(...numbers) : 13;
  return `FSD-${max + 1}`;
};

const mapServerErrors = (errors) => {
  if (!Array.isArray(errors) || errors.length === 0) return {};
  const mapped = {};
  errors.forEach((message) => {
    const text = String(message);
    if (/capacity/i.test(text)) mapped.capacity = text;
    else if (/course/i.test(text)) mapped.course = text;
    else if (/status/i.test(text)) mapped.status = text;
    else if (/name/i.test(text)) mapped.name = text;
    else if (/room/i.test(text)) mapped.room = text;
    else if (/days/i.test(text)) mapped.days = text;
    else if (/time/i.test(text)) mapped.time = text;
  });
  return mapped;
};

const readableError = (error) => (Array.isArray(error.details) && error.details.length ? error.details.join(', ') : error.message);

export default function AdminBatches() {
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [instructor, setInstructor] = useState('');
  const [room, setRoom] = useState('');
  const [capacity, setCapacity] = useState('');
  const [days, setDays] = useState('');
  const [time, setTime] = useState('');
  const [batchErrors, setBatchErrors] = useState({});

  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [allocateBatch, setAllocateBatch] = useState(null);
  const [rosterBatch, setRosterBatch] = useState(null);
  const [rosterStudents, setRosterStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [batchRes, courseRes, studentPage] = await Promise.all([
        catalogApi.batches.list(),
        catalogApi.courses.list(),
        studentApi.list({ limit: 200 }),
      ]);
      setBatches(batchRes.data || []);
      setCourses((courseRes.data || []).map((c) => c.name));
      setStudents(studentPage.data || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openCreate = () => {
    setEditingBatchId(null);
    setShowCreate(true);
    setCourse('');
    setInstructor('');
    setRoom('');
    setCapacity('');
    setDays('');
    setTime('');
    setBatchErrors({});
    setName(nextBatchName(batches));
  };

  const openEdit = (batch) => {
    setEditingBatchId(batch._id);
    setShowCreate(true);
    setName(batch.name);
    setCourse(batch.course || '');
    setInstructor(batch.teacher || '');
    setRoom(batch.room || '');
    setCapacity(String(batch.capacity || ''));
    setDays(batch.days || '');
    setTime(batch.time || '');
    setBatchErrors({});
  };

  const closeForm = () => {
    setShowCreate(false);
    setEditingBatchId(null);
    setBatchErrors({});
  };

  const openAllocate = (batch) => {
    setAllocateBatch(batch);
    setSearchTerm('');
    setSelectedStudentIds([]);
  };

  const openRoster = async (batch) => {
    setRosterBatch(batch);
    setRosterStudents([]);
    try {
      const res = await catalogApi.roster(batch._id);
      setRosterStudents(res.data || []);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const eligibleStudents = allocateBatch
    ? students.filter((s) => {
        const notInThisBatch = s.batch !== allocateBatch.name;
        const matchesSearch =
          (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const eligible = s.batchAllocationStatus !== 'allocated' || s.batch !== allocateBatch.name;
        return notInThisBatch && matchesSearch && eligible;
      })
    : [];

  const liveRosterBatch = rosterBatch ? batches.find((b) => b._id === rosterBatch._id) || rosterBatch : null;

  const rosterMembers = rosterStudents;

  const toggleStudentSelection = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const createBatch = async () => {
    const e = {};
    if (!name.trim()) e.name = 'Batch name is required';
    if (!course) e.course = 'Course is required';
    if (capacity === '' || Number(capacity) < 1 || Number.isNaN(Number(capacity))) e.capacity = 'Capacity must be a positive number';
    setBatchErrors(e);
    if (Object.keys(e).length > 0) return;
    const payload = {
      name,
      course,
      teacher: instructor,
      room,
      capacity: Number(capacity),
      days,
      time,
    };
    try {
      if (editingBatchId) {
        await catalogApi.batches.update(editingBatchId, payload);
        toast.success('Batch updated successfully');
      } else {
        await catalogApi.batches.create({ ...payload, status: 'open' });
        toast.success('Batch created successfully');
      }
      setShowCreate(false);
      setEditingBatchId(null);
      loadAll();
    } catch (error) {
      setBatchErrors((prev) => ({ ...prev, ...mapServerErrors(error.details) }));
      toast.error(readableError(error));
    }
  };

  const handleDeleteBatch = async () => {
    if (!deleteTarget) return;
    try {
      await catalogApi.batches.remove(deleteTarget._id);
      toast.success('Batch deleted successfully');
      setDeleteTarget(null);
      loadAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const confirmAllocation = async () => {
    if (!allocateBatch || selectedStudentIds.length === 0) return;
    try {
      const result = await catalogApi.allocate(allocateBatch._id, selectedStudentIds);
      toast.success(result.message || 'Students allocated successfully');
      setAllocateBatch(null);
      setSelectedStudentIds([]);
      loadAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeFromRoster = async (studentId) => {
    if (!rosterBatch) return;
    try {
      await studentApi.updateStatus(studentId, { batch: null, batchAllocationStatus: 'pending' });
      toast.success('Student removed from batch');
      const res = await catalogApi.roster(rosterBatch._id);
      setRosterStudents(res.data || []);
      loadAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-slate-400 text-sm">Loading batches...</div>
    );
  }

  return (
    <div className="AdminBatches-div-1">
      <div className="AdminBatches-div-2">
        <div>
          <h1 className="AdminBatches-h1-3">Batch Allocation</h1>
          <p className="AdminBatches-p-4">Create batches and allocate students to available slots</p>
        </div>
        <button
          onClick={openCreate}
          className="AdminBatches-button-5"
        >
          <Plus className="AdminBatches-plus-6" />
          Create Batch
        </button>
      </div>

      <div className="AdminBatches-div-7">
        {batches.map((b) => {
          const pct = Math.round((b.enrolled / b.capacity) * 100);
          return (
            <div key={b._id} className="AdminBatches-div-8">
              <div className="AdminBatches-div-9">
                <div>
                  <p className="AdminBatches-p-10">{b.name}</p>
                  <p className="AdminBatches-p-11">{b.course}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle[b.status]}`}>
                  {b.status.toUpperCase()}
                </span>
              </div>

              <div className="AdminBatches-div-12">
                <div className="AdminBatches-div-13">
                  <Users className="AdminBatches-users-14" /> {b.teacher || '—'}
                </div>
                <div className="AdminBatches-div-13">
                  <MapPin className="AdminBatches-users-14" /> {b.room}
                </div>
                <div className="AdminBatches-div-13">
                  <Calendar className="AdminBatches-users-14" /> {b.days}
                </div>
                <div className="AdminBatches-div-13">
                  <Clock className="AdminBatches-users-14" /> {b.time}
                </div>
              </div>

              <div className="AdminBatches-div-15">
                <div className="AdminBatches-div-16">
                  <span className="AdminBatches-p-11">Capacity</span>
                  <span className="AdminBatches-span-17">{b.enrolled}/{b.capacity}</span>
                </div>
                <div className="AdminBatches-div-18">
                  <div
                    className={`h-full rounded-full ${pct === 100 ? 'bg-red-400' : pct > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="AdminBatches-div-19">
                <button
                  className="AdminBatches-button-20"
                  onClick={() => openAllocate(b)}
                  disabled={b.status === 'full' || b.status === 'closed'}
                  style={b.status === 'full' || b.status === 'closed' ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                >
                  Allocate
                </button>
                <button className="AdminBatches-button-20" onClick={() => openRoster(b)}>
                  Roster
                </button>
                <button className="AdminBatches-button-37" onClick={() => openEdit(b)} title="Edit Batch">
                  <Pencil className="AdminBatches-icon-38" />
                </button>
                <button className="AdminBatches-button-37 AdminBatches-button-37--danger" onClick={() => setDeleteTarget(b)} title="Delete Batch">
                  <Trash2 className="AdminBatches-icon-38" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <div className="AdminBatches-div-21">
          <div className="AdminBatches-div-22" onClick={closeForm} />
          <div className="AdminBatches-div-23">
            <div className="AdminBatches-div-24">
              <div className="AdminBatches-div-25">
                <Layers className="AdminBatches-layers-26" />
                <h3 className="AdminBatches-p-10">{editingBatchId ? `Edit Batch — ${name}` : 'Create New Batch'}</h3>
              </div>
              <button onClick={closeForm} className="AdminBatches-button-27">&times;</button>
            </div>
            <div className="AdminBatches-div-28">
              <div className="AdminBatches-div-29">
                <div>
                  <label className="AdminBatches-label-30">Batch Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="AdminBatches-input-32" />
                  {batchErrors.name && <p className="AdminBatches-error-36">{batchErrors.name}</p>}
                </div>
                <div>
                  <label className="AdminBatches-label-30">Course</label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="AdminBatches-select-31"
                  >
                    <option value="">Select...</option>
                    {courses.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  {batchErrors.course && <p className="AdminBatches-error-36">{batchErrors.course}</p>}
                </div>
                <div>
                  <label className="AdminBatches-label-30">Instructor</label>
                  <input type="text" value={instructor} onChange={(e) => setInstructor(e.target.value)} placeholder="e.g. Sir Bilal Hassan" className="AdminBatches-input-32" />
                </div>
                <div>
                  <label className="AdminBatches-label-30">Room / Lab</label>
                  <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Lab 1" className="AdminBatches-input-32" />
                  {batchErrors.room && <p className="AdminBatches-error-36">{batchErrors.room}</p>}
                </div>
                <div>
                  <label className="AdminBatches-label-30">Capacity</label>
                  <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 40" className="AdminBatches-input-32" />
                  {batchErrors.capacity && <p className="AdminBatches-error-36">{batchErrors.capacity}</p>}
                </div>
                <div>
                  <label className="AdminBatches-label-30">Days</label>
                  <select value={days} onChange={(e) => setDays(e.target.value)} className="AdminBatches-select-31">
                    <option value="">Select...</option>
                    <option>MWF</option>
                    <option>TTS</option>
                    <option>Weekend</option>
                  </select>
                  {batchErrors.days && <p className="AdminBatches-error-36">{batchErrors.days}</p>}
                </div>
                <div>
                  <label className="AdminBatches-label-30">Time Slot</label>
                  <input type="text" value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 10:00 AM - 12:00 PM" className="AdminBatches-input-32" />
                  {batchErrors.time && <p className="AdminBatches-error-36">{batchErrors.time}</p>}
                </div>
              </div>
            </div>
            <div className="AdminBatches-div-33">
              <button onClick={closeForm} className="AdminBatches-button-34">Cancel</button>
              <button onClick={createBatch} className="AdminBatches-button-35">{editingBatchId ? 'Save Changes' : 'Create Batch'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Allocate Modal */}
      {allocateBatch && (
        <div className="AdminBatches-div-21">
          <div className="AdminBatches-div-22" onClick={() => setAllocateBatch(null)} />
          <div className="AdminBatches-div-23" style={{ maxWidth: '36rem' }}>
            <div className="AdminBatches-div-24">
              <div className="AdminBatches-div-25">
                <UserPlus className="AdminBatches-layers-26" />
                <h3 className="AdminBatches-p-10">
                  Allocate Students — {allocateBatch.name} ({allocateBatch.course})
                </h3>
              </div>
              <button onClick={() => setAllocateBatch(null)} className="AdminBatches-button-27">
                <X size={18} />
              </button>
            </div>

            <div className="AdminBatches-div-28">
              <p className="AdminBatches-p-11" style={{ marginBottom: '0.75rem' }}>
                {allocateBatch.enrolled}/{allocateBatch.capacity} seats filled &middot; {Math.max(allocateBatch.capacity - allocateBatch.enrolled, 0)} slots available &middot; {allocateBatch.teacher || '—'} &middot; {allocateBatch.room} &middot; {allocateBatch.days} &middot; {allocateBatch.time}
              </p>

              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="AdminBatches-input-32"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>

              <div style={{ maxHeight: '18rem', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}>
                {eligibleStudents.length === 0 && (
                  <p className="AdminBatches-p-11" style={{ padding: '1rem', textAlign: 'center' }}>
                    No matching students found.
                  </p>
                )}
                {eligibleStudents.map((s) => {
                  const checked = selectedStudentIds.includes(s._id);
                  return (
                    <label
                      key={s._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.625rem 0.875rem',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        backgroundColor: checked ? '#fffbeb' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStudentSelection(s._id)}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>{s.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {s.email} &middot; {s.course || 'No course yet'}
                          {s.batch ? ` · currently in ${s.batch}` : ''}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <p className="AdminBatches-p-11" style={{ marginTop: '0.5rem' }}>
                {selectedStudentIds.length} student(s) selected
              </p>
            </div>

            <div className="AdminBatches-div-33">
              <button onClick={() => setAllocateBatch(null)} className="AdminBatches-button-34">Cancel</button>
              <button
                onClick={confirmAllocation}
                className="AdminBatches-button-35"
                disabled={selectedStudentIds.length === 0}
                style={selectedStudentIds.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
              >
                Allocate {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roster Modal */}
      {rosterBatch && (
        <div className="AdminBatches-div-21">
          <div className="AdminBatches-div-22" onClick={() => setRosterBatch(null)} />
          <div className="AdminBatches-div-23" style={{ maxWidth: '36rem' }}>
            <div className="AdminBatches-div-24">
              <div className="AdminBatches-div-25">
                <ClipboardList className="AdminBatches-layers-26" />
                <h3 className="AdminBatches-p-10">
                  Roster — {rosterBatch.name} ({rosterBatch.course})
                </h3>
              </div>
              <button onClick={() => setRosterBatch(null)} className="AdminBatches-button-27">
                <X size={18} />
              </button>
            </div>

            <div className="AdminBatches-div-28">
              <p className="AdminBatches-p-11" style={{ marginBottom: '0.75rem' }}>
                {rosterMembers.length}/{liveRosterBatch.capacity} students &middot; {liveRosterBatch.teacher || '—'} &middot; {liveRosterBatch.room} &middot; {liveRosterBatch.days} &middot; {liveRosterBatch.time}
              </p>

              <div style={{ maxHeight: '20rem', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}>
                {rosterMembers.length === 0 && (
                  <p className="AdminBatches-p-11" style={{ padding: '1rem', textAlign: 'center' }}>
                    No students allocated to this batch yet.
                  </p>
                )}
                {rosterMembers.map((s) => (
                  <div
                    key={s._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      padding: '0.625rem 0.875rem',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>{s.name}</p>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {s.email} &middot; {s.phone} &middot; Fee: {s.feeStatus}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromRoster(s._id)}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#ef4444',
                        border: '1px solid #fecaca',
                        borderRadius: '0.5rem',
                        padding: '0.375rem 0.625rem',
                        backgroundColor: '#fef2f2',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="AdminBatches-div-33">
              <button onClick={() => setRosterBatch(null)} className="AdminBatches-button-35" style={{ flex: 'unset', width: '100%' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Batch?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Allocated students will be returned to the pending pool.`}
        onConfirm={handleDeleteBatch}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
