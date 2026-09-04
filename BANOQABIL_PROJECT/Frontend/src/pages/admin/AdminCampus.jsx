import { useState, useEffect, useCallback } from 'react';
import './AdminCampus.css';
import { useToast } from '@/components/ui/Toast.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import Modal from '@/components/ui/Modal.jsx';
import PageHeader from '@/components/ui/PageHeader.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import FormField, { inputCls } from '@/components/ui/FormField.jsx';
import { catalogApi, studentApi, teacherApi } from '@/lib/api.js';
import { pipelineStages as regStages } from '@/data/mockData.js';
import { MapPin, Plus, Pencil, Trash2, ChevronRight, BookOpen, Layers, ArrowLeft, Building2, Users, Shield, UserPlus, ClipboardCheck, Layers3, CreditCard, Eye, Search, ArrowRight, Calendar, CheckCircle, X } from 'lucide-react';
import { setStudentContext } from '@/lib/studentContext.js';

const nextActionMap = {
  'registered': { label: 'Schedule Entry Test', icon: Calendar, cls: 'text-blue-600 bg-blue-50' },
  'test-scheduled': { label: 'Conduct Test', icon: ClipboardCheck, cls: 'text-amber-600 bg-amber-50' },
  'interview-passed': { label: 'Verify Fee', icon: CreditCard, cls: 'text-teal-600 bg-teal-50' },
  'fee-verified': { label: 'Enroll Student', icon: Users, cls: 'text-emerald-600 bg-emerald-50' },
  'enrolled': { label: 'Completed', icon: CheckCircle, cls: 'text-slate-500 bg-slate-100' },
};

const formatCnic = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

const readableError = (error) => (Array.isArray(error.details) && error.details.length ? error.details.join(', ') : error.message);

const mapServerErrors = (errors, setErrors) => {
  if (!Array.isArray(errors) || errors.length === 0) return;
  const mapped = {};
  errors.forEach((message) => {
    const text = String(message);
    if (/cnic/i.test(text)) mapped.cnic = text;
    else if (/course/i.test(text)) mapped.courseId = text;
    else if (/capacity/i.test(text)) mapped.capacity = text;
    else if (/established year/i.test(text)) mapped.establishedYear = text;
    else if (/specialization/i.test(text)) mapped.specialization = text;
    else if (/duration/i.test(text)) mapped.duration = text;
    else if (/city/i.test(text)) mapped.city = text;
    else if (/zip/i.test(text)) mapped.zip = text;
    else if (/phone/i.test(text)) mapped.phone = text;
    else if (/email/i.test(text)) mapped.email = text;
    else if (/address/i.test(text)) mapped.address = text;
    else if (/status/i.test(text)) mapped.status = text;
    else if (/room/i.test(text)) mapped.room = text;
    else if (/days/i.test(text)) mapped.days = text;
    else if (/time/i.test(text)) mapped.time = text;
    else if (/name/i.test(text)) mapped.name = text;
  });
  setErrors((prev) => ({ ...prev, ...mapped }));
};

export default function AdminCampus({ navigate }) {
  const toast = useToast();
  const [campuses, setCampuses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [expandedCard, setExpandedCard] = useState(null);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', phone: '', specialization: '' });
  const [teacherErrors, setTeacherErrors] = useState({});
  const [deleteTeacherTarget, setDeleteTeacherTarget] = useState(null);

  const [studentSearch, setStudentSearch] = useState('');
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: '', email: '', phone: '', cnic: '', address: '', courseId: '', batchId: '' });
  const [studentErrors, setStudentErrors] = useState({});
  const [deleteStudentTarget, setDeleteStudentTarget] = useState(null);

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({ name: '', courseId: '', teacherId: '', room: '', capacity: '', days: '', time: '', status: 'open' });
  const [batchErrors, setBatchErrors] = useState({});
  const [deleteBatchTarget, setDeleteBatchTarget] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', city: '', address: '', phone: '', email: '', region: '', zip: '', establishedYear: '', capacity: '', headName: '' });
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({ name: '', duration: '', description: '' });
  const [courseErrors, setCourseErrors] = useState({});
  const [deleteCourseTarget, setDeleteCourseTarget] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [overview, studentPage] = await Promise.all([
        catalogApi.overview(),
        studentApi.list({ limit: 200 }),
      ]);
      setCampuses(overview.data.campuses || []);
      setCourses(overview.data.courses || []);
      setBatches(overview.data.batches || []);
      setTeachers(overview.data.teachers || []);
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

  const openCampus = (campus) => { setSelectedCampus(campus); setExpandedCard(null); setView('dashboard'); };
  const openCourse = (course) => { setSelectedCourse(course); setView('batches'); };

  const goToCampusStudents = () => setView('students');
  const goToCampusTeachers = () => setView('teachers');
  const goToCampusBatches = () => setView('campus-batches');

  const openStudentProfile = (student) => { setStudentContext(student._id, 'admin-campus'); navigate?.('admin-student-profile'); };

  const courseName = (id) => courses.find((c) => c._id === id)?.name || '';
  const batchName = (id) => batches.find((b) => b._id === id)?.name || '';
  const teacherName = (id) => teachers.find((t) => t._id === id)?.name || '';

  const openCreateStudent = () => { setEditingStudent(null); setStudentForm({ name: '', email: '', phone: '', cnic: '', address: '', courseId: '', batchId: '' }); setStudentErrors({}); setStudentModalOpen(true); };
  const openEditStudent = (student) => {
    const course = courses.find((c) => c.name === student.course);
    const batch = batches.find((b) => b.name === student.batch);
    setEditingStudent(student);
    setStudentForm({ name: student.name, email: student.email || '', phone: student.phone || '', cnic: student.cnic || '', address: student.address || '', courseId: course?._id || '', batchId: batch?._id || '' });
    setStudentErrors({});
    setStudentModalOpen(true);
  };

  const validateStudent = () => {
    const e = {};
    if (!studentForm.name.trim()) e.name = 'Name is required';
    if (!/^\d{5}-\d{7}-\d$/.test(studentForm.cnic.trim())) e.cnic = 'CNIC must be in 00000-0000000-0 format';
    if (!studentForm.phone.trim()) e.phone = 'Phone is required';
    else if (studentForm.phone.length < 7) e.phone = 'Invalid phone number';
    if (studentForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentForm.email)) e.email = 'Invalid email';
    if (!courseName(studentForm.courseId)) e.courseId = 'Course is required';
    setStudentErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveStudent = async () => {
    if (!validateStudent()) return;
    const course = courseName(studentForm.courseId);
    const batch = batchName(studentForm.batchId);
    const payload = {
      name: studentForm.name,
      email: studentForm.email,
      phone: studentForm.phone,
      cnic: studentForm.cnic,
      address: studentForm.address,
      course,
      campus: selectedCampus.name,
    };
    if (batch) payload.batch = batch;
    try {
      if (editingStudent) {
        await studentApi.update(editingStudent._id, payload);
        toast.success('Student updated successfully');
      } else {
        await studentApi.create(payload);
        toast.success('Student created successfully');
      }
      setStudentModalOpen(false);
      loadAll();
    } catch (error) {
      mapServerErrors(error.details, setStudentErrors);
      toast.error(readableError(error));
    }
  };

  const handleDeleteStudent = async () => {
    try {
      await studentApi.remove(deleteStudentTarget._id);
      toast.success('Student deleted successfully');
      setDeleteStudentTarget(null);
      loadAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openCreateBatch = () => { setEditingBatch(null); setBatchForm({ name: '', courseId: '', teacherId: '', room: '', capacity: '', days: '', time: '', status: 'open' }); setBatchErrors({}); setBatchModalOpen(true); };
  const openEditBatch = (batch) => {
    const course = courses.find((c) => c.name === batch.course);
    const teacher = teachers.find((t) => t.name === batch.teacher);
    setEditingBatch(batch);
    setBatchForm({ name: batch.name, courseId: course?._id || '', teacherId: teacher?._id || '', room: batch.room || '', capacity: batch.capacity || '', days: batch.days || '', time: batch.time || '', status: batch.status || 'open' });
    setBatchErrors({});
    setBatchModalOpen(true);
  };

  const validateBatch = () => {
    const e = {};
    if (!batchForm.name.trim()) e.name = 'Batch name is required';
    if (!courseName(batchForm.courseId)) e.courseId = 'Course is required';
    if (batchForm.capacity !== '' && (Number(batchForm.capacity) < 1 || Number.isNaN(Number(batchForm.capacity)))) e.capacity = 'Capacity must be a positive number';
    setBatchErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveBatch = async () => {
    if (!validateBatch()) return;
    const payload = {
      name: batchForm.name,
      course: courseName(batchForm.courseId),
      teacher: teacherName(batchForm.teacherId),
      room: batchForm.room,
      capacity: Number(batchForm.capacity) || 0,
      days: batchForm.days,
      time: batchForm.time,
      status: batchForm.status,
    };
    try {
      if (editingBatch) {
        await catalogApi.batches.update(editingBatch._id, payload);
        toast.success('Batch updated successfully');
      } else {
        await catalogApi.batches.create(payload);
        toast.success('Batch created successfully');
      }
      setBatchModalOpen(false);
      loadAll();
    } catch (error) {
      mapServerErrors(error.details, setBatchErrors);
      toast.error(readableError(error));
    }
  };

  const handleDeleteBatch = async () => {
    try {
      await catalogApi.batches.remove(deleteBatchTarget._id);
      toast.success('Batch deleted successfully');
      setDeleteBatchTarget(null);
      loadAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openCreateTeacher = () => { setEditingTeacher(null); setTeacherForm({ name: '', email: '', phone: '', specialization: '' }); setTeacherErrors({}); setTeacherModalOpen(true); };
  const openEditTeacher = (teacher) => { setEditingTeacher(teacher); setTeacherForm({ name: teacher.name, email: teacher.email || '', phone: teacher.phone || '', specialization: teacher.specialization || '' }); setTeacherErrors({}); setTeacherModalOpen(true); };

  const validateTeacher = () => {
    const e = {};
    if (!teacherForm.name.trim()) e.name = 'Name is required';
    if (!teacherForm.phone.trim()) e.phone = 'Phone number is required';
    else if (teacherForm.phone.length < 7) e.phone = 'Invalid phone number';
    if (!teacherForm.specialization.trim()) e.specialization = 'Specialization is required';
    if (teacherForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teacherForm.email)) e.email = 'Invalid email';
    setTeacherErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveTeacher = async () => {
    if (!validateTeacher()) return;
    const payload = { ...teacherForm, campus: editingTeacher?.campus || selectedCampus.name };
    try {
      if (editingTeacher) {
        await teacherApi.update(editingTeacher._id, payload);
        toast.success('Teacher updated successfully');
      } else {
        await teacherApi.create(payload);
        toast.success('Teacher created successfully');
      }
      setTeacherModalOpen(false);
      loadAll();
    } catch (error) {
      mapServerErrors(error.details, setTeacherErrors);
      toast.error(readableError(error));
    }
  };

  const handleDeleteTeacher = async () => {
    try {
      await teacherApi.remove(deleteTeacherTarget._id);
      toast.success('Teacher deleted successfully');
      setDeleteTeacherTarget(null);
      loadAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openCreateCourse = () => { setEditingCourse(null); setCourseForm({ name: '', duration: '', description: '' }); setCourseErrors({}); setCourseModalOpen(true); };
  const openEditCourse = (course) => { setEditingCourse(course); setCourseForm({ name: course.name, duration: course.duration || '', description: course.description || '' }); setCourseErrors({}); setCourseModalOpen(true); };

  const validateCourse = () => {
    const e = {};
    if (!courseForm.name.trim()) e.name = 'Course name is required';
    if (!courseForm.duration.trim()) e.duration = 'Course duration is required';
    setCourseErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveCourse = async () => {
    if (!validateCourse()) return;
    const payload = { ...courseForm, campus: editingCourse?.campus || selectedCampus.name };
    try {
      if (editingCourse) {
        await catalogApi.courses.update(editingCourse._id, payload);
        toast.success('Course updated successfully');
      } else {
        await catalogApi.courses.create(payload);
        toast.success('Course created successfully');
      }
      setCourseModalOpen(false);
      loadAll();
    } catch (error) {
      mapServerErrors(error.details, setCourseErrors);
      toast.error(readableError(error));
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await catalogApi.courses.remove(deleteCourseTarget._id);
      toast.success('Course deleted successfully');
      setDeleteCourseTarget(null);
      loadAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openCreate = () => { setEditing(null); setForm({ name: '', city: '', address: '', phone: '', email: '', region: '', zip: '', establishedYear: '', capacity: '', headName: '' }); setErrors({}); setModalOpen(true); };
  const openEdit = (campus) => { setEditing(campus); setForm({ name: campus.name, city: campus.city || '', address: campus.address || '', phone: campus.phone || '', email: campus.email || '', region: campus.region || '', zip: campus.zip || '', establishedYear: campus.establishedYear || '', capacity: campus.capacity || '', headName: campus.headName || '' }); setErrors({}); setModalOpen(true); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Campus name is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    if (form.capacity !== '' && (Number(form.capacity) < 1 || Number.isNaN(Number(form.capacity)))) e.capacity = 'Capacity must be a positive number';
    if (form.establishedYear !== '' && !/^\d{4}$/.test(String(form.establishedYear).trim())) e.establishedYear = 'Established year must be a 4-digit year';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      if (editing) {
        await catalogApi.campuses.update(editing._id, form);
        toast.success('Campus updated successfully');
      } else {
        await catalogApi.campuses.create(form);
        toast.success('Campus created successfully');
      }
      setModalOpen(false);
      loadAll();
    } catch (error) {
      mapServerErrors(error.details, setErrors);
      toast.error(readableError(error));
    }
  };

  const handleDelete = async () => {
    try {
      await catalogApi.campuses.remove(deleteTarget._id);
      toast.success('Campus deleted successfully');
      setDeleteTarget(null);
      loadAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const campusCourses = selectedCampus ? courses.filter((c) => c.campus === selectedCampus.name) : [];
  const courseBatches = selectedCourse ? batches.filter((b) => b.course === selectedCourse.name) : [];

  if (loading) {
    return <div className="p-6 text-slate-400 text-sm">Loading campus data...</div>;
  }

  if (view === 'list') {
    return (
      <div className="p-6 space-y-6 w-full">
        <PageHeader
          title="Campus Management"
          subtitle="Manage all campuses — click a campus to view its courses and batches"
          action={
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Add Campus
            </button>
          }
        />

        {campuses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <EmptyState icon={Building2} message="No campuses yet. Click 'Add Campus' to create one." />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campuses.map((c) => (
              <div key={c._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                    <button onClick={() => setDeleteTarget(c)} className="w-7 h-7 rounded-lg border border-red-200 flex items-center justify-center hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{c.name}</h3>
                {c.headName && <p className="text-xs text-slate-400 mb-1">Head: {c.headName}</p>}
                {c.city && <p className="text-xs text-slate-400 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> {c.city}{c.region ? `, ${c.region}` : ''}</p>}
                {c.address && <p className="text-xs text-slate-400 mb-1">{c.address}</p>}
                <p className="text-xs text-slate-400 flex flex-wrap gap-x-3">
                  {c.phone && <span>{c.phone}</span>}
                  {c.email && <span>{c.email}</span>}
                  {c.establishedYear && <span>Est. {c.establishedYear}</span>}
                  {c.capacity && <span>Capacity {c.capacity}</span>}
                </p>
                <button onClick={() => openCampus(c)} className="mt-4 w-full flex items-center justify-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 py-2 border border-slate-200 rounded-lg hover:bg-amber-50 transition-colors">
                  View Details <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Campus' : 'Add Campus'} icon={Building2} size="lg">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Campus Name" error={errors.name} required>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. FSD Main Center" />
              </FormField>
              <FormField label="City" error={errors.city} required>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} placeholder="e.g. Faisalabad" />
              </FormField>
            </div>
            <FormField label="Address">
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} placeholder="Campus address" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Phone">
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="0300-XXXXXXX" />
              </FormField>
              <FormField label="Email" error={errors.email}>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="campus@example.com" />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Region / Province">
                <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className={inputCls} placeholder="e.g. Punjab" />
              </FormField>
              <FormField label="ZIP / Postal Code" error={errors.zip}>
                <input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className={inputCls} placeholder="e.g. 38000" />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Established Year" error={errors.establishedYear}>
                <input value={form.establishedYear} onChange={(e) => setForm({ ...form, establishedYear: e.target.value })} className={inputCls} placeholder="e.g. 2021" />
              </FormField>
              <FormField label="Max Student Capacity" error={errors.capacity}>
                <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className={inputCls} placeholder="e.g. 500" />
              </FormField>
            </div>
            <FormField label="Campus Head">
              <input value={form.headName} onChange={(e) => setForm({ ...form, headName: e.target.value })} className={inputCls} placeholder="e.g. Sir M. Tariq" />
            </FormField>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-500 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors">{editing ? 'Update' : 'Create'}</button>
          </div>
        </Modal>

        <ConfirmDialog open={!!deleteTarget} title="Delete Campus?" message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all courses and batches in this campus.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      </div>
    );
  }

  if (view === 'dashboard') {
    const campusStudents = students.filter((s) => s.campus === selectedCampus.name);
    const campusTeachers = teachers.filter((t) => t.campus === selectedCampus.name);
    const campusCourseNames = campusCourses.map((c) => c.name);
    const campusBatches = batches.filter((b) => campusCourseNames.includes(b.course));

    const registeredStudents = campusStudents.filter((s) => s.stage === 'registered');
    const interviewPendingStudents = campusStudents.filter((s) => s.interviewStatus === 'pending' || s.interviewStatus === 'scheduled');
    const batchPendingStudents = campusStudents.filter((s) => s.batchAllocationStatus === 'pending');
    const feePendingStudents = campusStudents.filter((s) => s.feeStatus === 'unpaid' || s.feeStatus === 'partial');

    const statCards = [
      { icon: Users, label: 'Total Students', value: campusStudents.length, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', onClick: goToCampusStudents },
      { icon: Shield, label: 'Total Teachers', value: campusTeachers.length, iconBg: 'bg-teal-100', iconColor: 'text-teal-600', onClick: goToCampusTeachers },
      { icon: BookOpen, label: 'Total Courses', value: campusCourses.length, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', onClick: () => setView('courses') },
      { icon: Layers, label: 'Total Batches', value: campusBatches.length, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', onClick: goToCampusBatches },
      { icon: UserPlus, label: 'Pending Registrations', value: registeredStudents.length, iconBg: 'bg-slate-100', iconColor: 'text-slate-600', data: registeredStudents },
      { icon: ClipboardCheck, label: 'Pending Interviews', value: interviewPendingStudents.length, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', data: interviewPendingStudents },
      { icon: Layers3, label: 'Pending Batch Allocations', value: batchPendingStudents.length, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', data: batchPendingStudents },
      { icon: CreditCard, label: 'Pending Fee Payments', value: feePendingStudents.length, iconBg: 'bg-red-100', iconColor: 'text-red-600', data: feePendingStudents },
    ];

    const activeCard = statCards.find((c) => c.label === expandedCard && c.data);

    return (
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setView('list')} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"><ArrowLeft className="w-4 h-4" /> Campuses</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-semibold text-slate-700">{selectedCampus?.name}</span>
        </div>
        <PageHeader title={selectedCampus?.name} subtitle="Campus overview — click a card to manage that data" />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <button
              key={card.label}
              onClick={card.data ? () => setExpandedCard((prev) => (prev === card.label ? null : card.label)) : card.onClick}
              className={`text-left bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow ${expandedCard === card.label ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-100'}`}
            >
              <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}><card.icon className={`w-4 h-4 ${card.iconColor}`} /></div>
              <p className="text-xs font-semibold text-slate-500 mb-0.5">{card.label}</p>
              <p className="text-xl font-extrabold text-slate-900">{card.value}</p>
            </button>
          ))}
        </div>

        {activeCard && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">{activeCard.label} <span className="text-slate-400 font-normal">({activeCard.data.length})</span></h3>
              <button onClick={() => setExpandedCard(null)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"><X className="w-3.5 h-3.5 text-slate-500" /></button>
            </div>
            {activeCard.data.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No students in this category.</p>
            ) : (
              <div className="space-y-2">
                {activeCard.data.map((s) => (
                  <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600 flex-shrink-0">{s.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.cnic || '—'} · {s.course || 'No course'}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${regStages.find((r) => r.key === s.stage)?.color || 'bg-slate-100 text-slate-400'}`}>{regStages.find((r) => r.key === s.stage)?.label || s.stage}</span>
                    <button onClick={() => openStudentProfile(s)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 flex-shrink-0" title="View Profile"><Eye className="w-3.5 h-3.5 text-slate-500" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (view === 'students') {
    const campusStudents = students.filter((s) => s.campus === selectedCampus.name);
    const filteredStudents = campusStudents.filter((s) => {
      const q = studentSearch.toLowerCase();
      return !q || (s.name || '').toLowerCase().includes(q) || (s.cnic || '').includes(studentSearch) || (s.email || '').toLowerCase().includes(q);
    });
    const availableStudentBatches = courseName(studentForm.courseId) ? batches.filter((b) => b.course === courseName(studentForm.courseId)) : [];

    return (
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setView('list')} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"><ArrowLeft className="w-4 h-4" /> Campuses</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-slate-700 transition-colors">{selectedCampus?.name}</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-semibold text-slate-700">Students</span>
        </div>
        <PageHeader
          title={`Students — ${selectedCampus?.name}`}
          subtitle={`${campusStudents.length} student${campusStudents.length === 1 ? '' : 's'} in this campus`}
          action={<button onClick={openCreateStudent} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors"><Plus className="w-4 h-4" /> Add Student</button>}
        />

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search by name, CNIC, or email..." className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 bg-white" />
        </div>

        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm"><EmptyState icon={Users} message="No students in this campus yet." /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-slate-50 border-b border-slate-100">{['Student', 'CNIC', 'Course', 'Current Stage', 'Next Action', ''].map((h, i) => <th key={h || i} className={`text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 ${i === 5 ? 'w-px' : ''}`}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map((s) => {
                    const action = nextActionMap[s.stage] || { label: '—', icon: ArrowRight, cls: 'text-slate-400 bg-slate-50' };
                    return (
                    <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600 flex-shrink-0">{(s.name || '?')[0]}</div><div><p className="text-sm font-semibold text-slate-900">{s.name}</p><p className="text-xs text-slate-400">{s.phone || s.email || '—'}</p></div></div></td>
                      <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">{s.cnic || '—'}</td>
                      <td className="px-5 py-3 text-sm text-slate-600">{s.course || '—'}</td>
                      <td className="px-5 py-3"><span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${regStages.find((r) => r.key === s.stage)?.color || 'bg-slate-100 text-slate-400'}`}>{regStages.find((r) => r.key === s.stage)?.label || s.stage}</span></td>
                      <td className="px-5 py-3"><div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap ${action.cls}`}><action.icon className="w-3.5 h-3.5 flex-shrink-0" />{action.label}</div></td>
                      <td className="px-5 py-3"><div className="flex gap-1">
                        <button onClick={() => openStudentProfile(s)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50" title="View Profile"><Eye className="w-3.5 h-3.5 text-slate-500" /></button>
                        <button onClick={() => openEditStudent(s)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50" title="Edit"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                        <button onClick={() => setDeleteStudentTarget(s)} className="w-8 h-8 rounded-lg border border-red-200 flex items-center justify-center hover:bg-red-50" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                      </div></td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Modal open={studentModalOpen} onClose={() => setStudentModalOpen(false)} title={editingStudent ? 'Edit Student' : 'Add Student'} icon={Users} size="lg">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Full Name" error={studentErrors.name} required><input value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} className={inputCls} placeholder="e.g. Ahmed Hassan" /></FormField>
              <FormField label="CNIC" error={studentErrors.cnic} required><input value={studentForm.cnic} onChange={(e) => setStudentForm({ ...studentForm, cnic: formatCnic(e.target.value) })} className={inputCls} placeholder="33100-1234567-1" /></FormField>
              <FormField label="Email" error={studentErrors.email}><input value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} className={inputCls} placeholder="student@example.com" /></FormField>
              <FormField label="Phone" error={studentErrors.phone} required><input value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} className={inputCls} placeholder="0300-XXXXXXX" /></FormField>
            </div>
            <FormField label="Address"><input value={studentForm.address} onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })} className={inputCls} placeholder="Student address" /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Course" error={studentErrors.courseId} required><select value={studentForm.courseId} onChange={(e) => setStudentForm({ ...studentForm, courseId: e.target.value, batchId: '' })} className={inputCls}><option value="">No course</option>{campusCourses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></FormField>
              <FormField label="Batch"><select value={studentForm.batchId} onChange={(e) => setStudentForm({ ...studentForm, batchId: e.target.value })} className={inputCls} disabled={!courseName(studentForm.courseId)}><option value="">No batch</option>{availableStudentBatches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></FormField>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
            <button onClick={() => setStudentModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-500 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleSaveStudent} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors">{editingStudent ? 'Update' : 'Create'}</button>
          </div>
        </Modal>

        <ConfirmDialog open={!!deleteStudentTarget} title="Delete Student?" message={`Are you sure you want to delete "${deleteStudentTarget?.name}"?`} onConfirm={handleDeleteStudent} onCancel={() => setDeleteStudentTarget(null)} />
      </div>
    );
  }

  if (view === 'campus-batches') {
    const campusCourseNames = campusCourses.map((c) => c.name);
    const campusBatchList = batches.filter((b) => campusCourseNames.includes(b.course));

    return (
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setView('list')} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"><ArrowLeft className="w-4 h-4" /> Campuses</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-slate-700 transition-colors">{selectedCampus?.name}</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-semibold text-slate-700">Batches</span>
        </div>
        <PageHeader
          title={`Batches — ${selectedCampus?.name}`}
          subtitle={`${campusBatchList.length} batch${campusBatchList.length === 1 ? '' : 'es'} across all courses`}
          action={<button onClick={openCreateBatch} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors"><Plus className="w-4 h-4" /> Add Batch</button>}
        />

        {campusBatchList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm"><EmptyState icon={Layers} message="No batches in this campus yet." /></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campusBatchList.map((b) => {
              const teacher = teachers.find((t) => t.name === b.teacher);
              const pct = b.capacity ? Math.round((b.enrolled / b.capacity) * 100) : 0;
              return (
                <div key={b._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div><p className="font-bold text-slate-900 text-sm">{b.name}</p><p className="text-xs text-slate-400 mt-0.5">{b.course}</p>{teacher && <p className="text-xs text-slate-400">{teacher.name}</p>}</div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${b.status === 'open' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : b.status === 'full' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{b.status?.toUpperCase()}</span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {b.room && <p className="text-xs text-slate-400">Room: {b.room}</p>}
                    {b.days && <p className="text-xs text-slate-400">{b.days} · {b.time}</p>}
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-400">Capacity</span><span className="text-xs font-bold text-slate-600">{b.enrolled}/{b.capacity}</span></div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct === 100 ? 'bg-red-400' : pct > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditBatch(b)} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-800 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                    <button onClick={() => setDeleteBatchTarget(b)} className="w-9 h-9 rounded-lg border border-red-200 flex items-center justify-center hover:bg-red-50 flex-shrink-0"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal open={batchModalOpen} onClose={() => setBatchModalOpen(false)} title={editingBatch ? 'Edit Batch' : 'Add Batch'} icon={Layers}>
          <div className="p-6 space-y-4">
            <FormField label="Batch Name" error={batchErrors.name} required><input value={batchForm.name} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })} className={inputCls} placeholder="e.g. FSD-20" /></FormField>
            <FormField label="Course" error={batchErrors.courseId} required><select value={batchForm.courseId} onChange={(e) => setBatchForm({ ...batchForm, courseId: e.target.value })} className={inputCls}><option value="">Select course...</option>{campusCourses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></FormField>
            <FormField label="Teacher"><select value={batchForm.teacherId} onChange={(e) => setBatchForm({ ...batchForm, teacherId: e.target.value })} className={inputCls}><option value="">Unassigned</option>{teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Room" error={batchErrors.room}><input value={batchForm.room} onChange={(e) => setBatchForm({ ...batchForm, room: e.target.value })} className={inputCls} placeholder="e.g. Lab 1" /></FormField>
              <FormField label="Capacity" error={batchErrors.capacity}><input type="number" value={batchForm.capacity} onChange={(e) => setBatchForm({ ...batchForm, capacity: e.target.value })} className={inputCls} placeholder="e.g. 40" /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Days" error={batchErrors.days}><input value={batchForm.days} onChange={(e) => setBatchForm({ ...batchForm, days: e.target.value })} className={inputCls} placeholder="e.g. MWF" /></FormField>
              <FormField label="Time" error={batchErrors.time}><input value={batchForm.time} onChange={(e) => setBatchForm({ ...batchForm, time: e.target.value })} className={inputCls} placeholder="e.g. 10:00 AM - 12:00 PM" /></FormField>
            </div>
            <FormField label="Status" error={batchErrors.status}><select value={batchForm.status} onChange={(e) => setBatchForm({ ...batchForm, status: e.target.value })} className={inputCls}><option value="open">Open</option><option value="full">Full</option><option value="closed">Closed</option></select></FormField>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
            <button onClick={() => setBatchModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-500 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleSaveBatch} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors">{editingBatch ? 'Update' : 'Create'}</button>
          </div>
        </Modal>

        <ConfirmDialog open={!!deleteBatchTarget} title="Delete Batch?" message={`Are you sure you want to delete "${deleteBatchTarget?.name}"?`} onConfirm={handleDeleteBatch} onCancel={() => setDeleteBatchTarget(null)} />
      </div>
    );
  }

  if (view === 'teachers') {
    const campusTeachers = teachers.filter((t) => t.campus === selectedCampus.name);
    const filteredTeachers = campusTeachers.filter((t) => {
      const q = teacherSearch.toLowerCase();
      return !q || (t.name || '').toLowerCase().includes(q) || (t.email || '').toLowerCase().includes(q) || (t.specialization || '').toLowerCase().includes(q) || (t.phone || '').includes(teacherSearch);
    });
    return (
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setView('list')} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"><ArrowLeft className="w-4 h-4" /> Campuses</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-slate-700 transition-colors">{selectedCampus?.name}</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-semibold text-slate-700">Teachers</span>
        </div>
        <PageHeader
          title={`Teachers — ${selectedCampus?.name}`}
          subtitle={`${campusTeachers.length} teacher${campusTeachers.length === 1 ? '' : 's'} in this campus`}
          action={<button onClick={openCreateTeacher} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors"><Plus className="w-4 h-4" /> Add Teacher</button>}
        />

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={teacherSearch} onChange={(e) => setTeacherSearch(e.target.value)} placeholder="Search by name, email, specialization, or phone..." className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 bg-white" />
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm"><EmptyState icon={Shield} message="No teachers in this campus yet." /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-slate-50 border-b border-slate-100">{['Name', 'Specialization', 'Phone', ''].map((h, i) => <th key={h || i} className={`text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 ${i === 3 ? 'w-px' : ''}`}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTeachers.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-600 flex-shrink-0">{(t.name || '?')[0]}</div><div><p className="text-sm font-semibold text-slate-900">{t.name}</p>{t.email && <p className="text-xs text-slate-400">{t.email}</p>}</div></div></td>
                      <td className="px-5 py-3 text-sm text-slate-600">{t.specialization || '—'}</td>
                      <td className="px-5 py-3 text-sm text-slate-600">{t.phone || '—'}</td>
                      <td className="px-5 py-3"><div className="flex gap-1">
                        <button onClick={() => openEditTeacher(t)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50" title="Edit"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                        <button onClick={() => setDeleteTeacherTarget(t)} className="w-8 h-8 rounded-lg border border-red-200 flex items-center justify-center hover:bg-red-50" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Modal open={teacherModalOpen} onClose={() => setTeacherModalOpen(false)} title={editingTeacher ? 'Edit Teacher' : 'Add Teacher'} icon={Shield}>
          <div className="p-6 space-y-4">
            <FormField label="Full Name" error={teacherErrors.name} required>
              <input value={teacherForm.name} onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })} className={inputCls} placeholder="e.g. Sir Bilal Hassan" />
            </FormField>
            <FormField label="Email" error={teacherErrors.email}>
              <input value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} className={inputCls} placeholder="teacher@example.com" />
            </FormField>
            <FormField label="Phone" error={teacherErrors.phone} required>
              <input value={teacherForm.phone} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} className={inputCls} placeholder="0300-XXXXXXX" />
            </FormField>
            <FormField label="Specialization" error={teacherErrors.specialization} required>
              <input value={teacherForm.specialization} onChange={(e) => setTeacherForm({ ...teacherForm, specialization: e.target.value })} className={inputCls} placeholder="e.g. Web Development, Python" />
            </FormField>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
            <button onClick={() => setTeacherModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-500 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleSaveTeacher} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors">{editingTeacher ? 'Update' : 'Create'}</button>
          </div>
        </Modal>

        <ConfirmDialog open={!!deleteTeacherTarget} title="Delete Teacher?" message={`Are you sure you want to delete "${deleteTeacherTarget?.name}"?`} onConfirm={handleDeleteTeacher} onCancel={() => setDeleteTeacherTarget(null)} />
      </div>
    );
  }

  if (view === 'courses') {
    return (
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setView('list')} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"><ArrowLeft className="w-4 h-4" /> Campuses</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-slate-700 transition-colors">{selectedCampus?.name}</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-semibold text-slate-700">Courses</span>
        </div>
        <PageHeader
          title={`Courses — ${selectedCampus?.name}`}
          subtitle="Click a course to view its batches"
          action={
            <button onClick={openCreateCourse} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Add Course
            </button>
          }
        />
        {campusCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm"><EmptyState icon={BookOpen} message="No courses in this campus yet." /></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campusCourses.map((c) => (
              <div key={c._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><BookOpen className="w-5 h-5 text-emerald-600" /></div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditCourse(c)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                    <button onClick={() => setDeleteCourseTarget(c)} className="w-7 h-7 rounded-lg border border-red-200 flex items-center justify-center hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{c.name}</h3>
                {c.duration && <p className="text-xs text-slate-400 mb-1">Duration: {c.duration}</p>}
                {c.description && <p className="text-xs text-slate-400">{c.description}</p>}
                <button onClick={() => openCourse(c)} className="mt-4 w-full flex items-center justify-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 py-2 border border-slate-200 rounded-lg hover:bg-emerald-50 transition-colors">View Batches <ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}

        <Modal open={courseModalOpen} onClose={() => setCourseModalOpen(false)} title={editingCourse ? 'Edit Course' : 'Add Course'} icon={BookOpen}>
          <div className="p-6 space-y-4">
            <FormField label="Course Name" error={courseErrors.name} required>
              <input value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} className={inputCls} placeholder="e.g. Web Development" />
            </FormField>
            <FormField label="Duration" error={courseErrors.duration} required>
              <input value={courseForm.duration} onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })} className={inputCls} placeholder="e.g. 6 Months" />
            </FormField>
            <FormField label="Description">
              <input value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} className={inputCls} placeholder="Short course description" />
            </FormField>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
            <button onClick={() => setCourseModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-500 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleSaveCourse} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors">{editingCourse ? 'Update' : 'Create'}</button>
          </div>
        </Modal>

        <ConfirmDialog open={!!deleteCourseTarget} title="Delete Course?" message={`Are you sure you want to delete "${deleteCourseTarget?.name}"? This will also affect its batches.`} onConfirm={handleDeleteCourse} onCancel={() => setDeleteCourseTarget(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => setView('list')} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"><ArrowLeft className="w-4 h-4" /> Campuses</button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-slate-700 transition-colors">{selectedCampus?.name}</button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <button onClick={() => { setView('courses'); setSelectedCourse(null); }} className="text-slate-400 hover:text-slate-700 transition-colors">Courses</button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="font-semibold text-slate-700">{selectedCourse?.name}</span>
      </div>
      <PageHeader title={`Batches — ${selectedCourse?.name}`} subtitle="All batches for this course" />
      {courseBatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm"><EmptyState icon={Layers} message="No batches for this course yet." /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseBatches.map((b) => {
            const teacher = b.teacher;
            const pct = b.capacity ? Math.round((b.enrolled / b.capacity) * 100) : 0;
            return (
              <div key={b._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div><p className="font-bold text-slate-900 text-sm">{b.name}</p>{teacher && <p className="text-xs text-slate-400 mt-0.5">{teacher}</p>}</div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${b.status === 'open' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : b.status === 'full' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{b.status?.toUpperCase()}</span>
                </div>
                <div className="space-y-1 mb-3">
                  {b.room && <p className="text-xs text-slate-400">Room: {b.room}</p>}
                  {b.days && <p className="text-xs text-slate-400">{b.days} · {b.time}</p>}
                </div>
                <div className="mb-1">
                  <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-400">Capacity</span><span className="text-xs font-bold text-slate-600">{b.enrolled}/{b.capacity}</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct === 100 ? 'bg-red-400' : pct > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} /></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
