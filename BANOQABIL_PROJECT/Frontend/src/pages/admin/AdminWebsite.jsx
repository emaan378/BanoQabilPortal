import { useState, useEffect, useCallback } from 'react';
import { Globe, BookOpen, MessageSquareQuote, Plus, Pencil, Trash2, Star } from 'lucide-react';
import { catalogApi } from '@/lib/api.js';
import { useToast } from '@/components/ui/Toast.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import Modal from '@/components/ui/Modal.jsx';
import PageHeader from '@/components/ui/PageHeader.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import FormField, { inputCls } from '@/components/ui/FormField.jsx';
import './AdminWebsite.css';

const readableError = (error) => (Array.isArray(error.details) && error.details.length ? error.details.join(', ') : error.message);

const mapServerErrors = (errors, setErrors) => {
  if (!Array.isArray(errors) || errors.length === 0) return;
  const mapped = {};
  errors.forEach((message) => {
    const text = String(message);
    if (/duration/i.test(text)) mapped.duration = text;
    else if (/campus/i.test(text)) mapped.campus = text;
    else if (/name/i.test(text)) mapped.name = text;
    else if (/rating/i.test(text)) mapped.rating = text;
    else if (/text/i.test(text)) mapped.text = text;
  });
  setErrors((prev) => ({ ...prev, ...mapped }));
};

export default function AdminWebsite() {
  const toast = useToast();
  const [tab, setTab] = useState('courses');
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({ name: '', duration: '', description: '', campus: '' });
  const [courseErrors, setCourseErrors] = useState({});
  const [deleteCourseTarget, setDeleteCourseTarget] = useState(null);

  const [testimonials, setTestimonials] = useState([]);
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [testimonialForm, setTestimonialForm] = useState({ name: '', course: '', text: '', rating: '5', active: true });
  const [testimonialErrors, setTestimonialErrors] = useState({});
  const [deleteTestimonialTarget, setDeleteTestimonialTarget] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [courseRes, campusRes, testimonialRes] = await Promise.all([
        catalogApi.courses.list(),
        catalogApi.campuses.list(),
        catalogApi.testimonials.list(),
      ]);
      setCourses(courseRes.data || []);
      setCampuses(campusRes.data || []);
      setTestimonials(testimonialRes.data || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm({ name: '', duration: '', description: '', campus: campuses[0]?.name || '' });
    setCourseErrors({});
    setCourseModalOpen(true);
  };

  const openEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({ name: course.name, duration: course.duration || '', description: course.description || '', campus: course.campus || campuses[0]?.name || '' });
    setCourseErrors({});
    setCourseModalOpen(true);
  };

  const validateCourse = () => {
    const e = {};
    if (!courseForm.name.trim()) e.name = 'Course name is required';
    if (!courseForm.duration.trim()) e.duration = 'Course duration is required';
    if (!courseForm.campus) e.campus = 'Campus is required';
    setCourseErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveCourse = async () => {
    if (!validateCourse()) return;
    try {
      if (editingCourse) {
        await catalogApi.courses.update(editingCourse._id, courseForm);
        toast.success('Course updated successfully');
      } else {
        await catalogApi.courses.create(courseForm);
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

  const openCreateTestimonial = () => {
    setEditingTestimonial(null);
    setTestimonialForm({ name: '', course: '', text: '', rating: '5', active: true });
    setTestimonialErrors({});
    setTestimonialModalOpen(true);
  };

  const openEditTestimonial = (testimonial) => {
    setEditingTestimonial(testimonial);
    setTestimonialForm({ name: testimonial.name, course: testimonial.course || '', text: testimonial.text || '', rating: String(testimonial.rating || 5), active: testimonial.active !== false });
    setTestimonialErrors({});
    setTestimonialModalOpen(true);
  };

  const validateTestimonial = () => {
    const e = {};
    if (!testimonialForm.name.trim()) e.name = 'Student name is required';
    if (!testimonialForm.course.trim()) e.course = 'Course is required';
    if (!testimonialForm.text.trim()) e.text = 'Testimonial text is required';
    if (Number.isNaN(Number(testimonialForm.rating)) || Number(testimonialForm.rating) < 1 || Number(testimonialForm.rating) > 5) {
      e.rating = 'Rating must be between 1 and 5';
    }
    setTestimonialErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveTestimonial = async () => {
    if (!validateTestimonial()) return;
    const payload = {
      name: testimonialForm.name,
      course: testimonialForm.course,
      text: testimonialForm.text,
      rating: Number(testimonialForm.rating),
      active: testimonialForm.active,
    };
    try {
      if (editingTestimonial) {
        await catalogApi.testimonials.update(editingTestimonial._id, payload);
        toast.success('Testimonial updated successfully');
      } else {
        await catalogApi.testimonials.create(payload);
        toast.success('Testimonial created successfully');
      }
      setTestimonialModalOpen(false);
      loadAll();
    } catch (error) {
      mapServerErrors(error.details, setTestimonialErrors);
      toast.error(readableError(error));
    }
  };

  const handleDeleteTestimonial = async () => {
    try {
      await catalogApi.testimonials.remove(deleteTestimonialTarget._id);
      toast.success('Testimonial deleted successfully');
      setDeleteTestimonialTarget(null);
      loadAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleTestimonialActive = async (testimonial) => {
    try {
      await catalogApi.testimonials.update(testimonial._id, { ...testimonial, active: !testimonial.active });
      toast.success(testimonial.active ? 'Testimonial hidden from website' : 'Testimonial shown on website');
      loadAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-400 text-sm">Loading website content...</div>;
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <PageHeader
        title="Website Content"
        subtitle="Manage the courses and success stories shown on the public landing page"
        action={
          <button
            onClick={tab === 'courses' ? openCreateCourse : openCreateTestimonial}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add {tab === 'courses' ? 'Course' : 'Success Story'}
          </button>
        }
      />

      <div className="AdminWebsite-tabs">
        <button onClick={() => setTab('courses')} className={`AdminWebsite-tab ${tab === 'courses' ? 'AdminWebsite-tab--active' : ''}`}>
          <BookOpen className="w-4 h-4" /> Courses
        </button>
        <button onClick={() => setTab('testimonials')} className={`AdminWebsite-tab ${tab === 'testimonials' ? 'AdminWebsite-tab--active' : ''}`}>
          <MessageSquareQuote className="w-4 h-4" /> Success Stories
        </button>
      </div>

      {tab === 'courses' ? (
        courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <EmptyState icon={BookOpen} message="No courses yet. Click 'Add Course' to show one on the website." />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div key={course._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditCourse(course)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                    <button onClick={() => setDeleteCourseTarget(course)} className="w-7 h-7 rounded-lg border border-red-200 flex items-center justify-center hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{course.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Duration: {course.duration || '—'}</p>
                {course.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{course.description}</p>}
                <span className="mt-3 inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">{course.campus || 'No campus'}</span>
              </div>
            ))}
          </div>
        )
      ) : testimonials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <EmptyState icon={MessageSquareQuote} message="No success stories yet. Click 'Add Success Story' to show one on the website." />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((testimonial) => (
            <div key={testimonial._id} className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow ${testimonial.active ? 'border-slate-100' : 'border-slate-200 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <MessageSquareQuote className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditTestimonial(testimonial)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50" title="Edit"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                  <button onClick={() => setDeleteTestimonialTarget(testimonial)} className="w-7 h-7 rounded-lg border border-red-200 flex items-center justify-center hover:bg-red-50" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                </div>
              </div>
              <p className="AdminWebsite-quote">"{testimonial.text}"</p>
              <div className="AdminWebsite-stars mt-3">
                {Array.from({ length: Math.min(Math.max(testimonial.rating || 5, 1), 5) }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="mt-2">
                <p className="text-sm font-semibold text-slate-900">{testimonial.name}</p>
                <p className="text-xs text-slate-400">{testimonial.course}</p>
              </div>
              <button
                onClick={() => toggleTestimonialActive(testimonial)}
                className={`mt-3 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${testimonial.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}
              >
                {testimonial.active ? 'Visible on website' : 'Hidden from website'}
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={courseModalOpen} onClose={() => setCourseModalOpen(false)} title={editingCourse ? 'Edit Course' : 'Add Course'} icon={BookOpen} size="lg">
        <div className="p-6 space-y-4">
          <FormField label="Course Name" error={courseErrors.name} required>
            <input value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} className={inputCls} placeholder="e.g. Web Development" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Duration" error={courseErrors.duration} required>
              <input value={courseForm.duration} onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })} className={inputCls} placeholder="e.g. 6 Months" />
            </FormField>
            <FormField label="Campus" error={courseErrors.campus} required>
              <select value={courseForm.campus} onChange={(e) => setCourseForm({ ...courseForm, campus: e.target.value })} className={inputCls}>
                {campuses.length === 0 && <option value="">No campus found</option>}
                {campuses.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Description">
            <textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} className={`${inputCls} min-h-[5rem] resize-y`} placeholder="Short description shown on the website" />
          </FormField>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={() => setCourseModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-500 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSaveCourse} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors">{editingCourse ? 'Update' : 'Create'}</button>
        </div>
      </Modal>

      <Modal open={testimonialModalOpen} onClose={() => setTestimonialModalOpen(false)} title={editingTestimonial ? 'Edit Success Story' : 'Add Success Story'} icon={MessageSquareQuote} size="lg">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Student Name" error={testimonialErrors.name} required>
              <input value={testimonialForm.name} onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })} className={inputCls} placeholder="e.g. Fatima Malik" />
            </FormField>
            <FormField label="Course / Batch" error={testimonialErrors.course} required>
              <input value={testimonialForm.course} onChange={(e) => setTestimonialForm({ ...testimonialForm, course: e.target.value })} className={inputCls} placeholder="e.g. Web Development — Batch FSD-12" />
            </FormField>
          </div>
          <FormField label="Testimonial Text" error={testimonialErrors.text} required>
            <textarea value={testimonialForm.text} onChange={(e) => setTestimonialForm({ ...testimonialForm, text: e.target.value })} className={`${inputCls} min-h-[6rem] resize-y`} placeholder="What did the student say about Bano Qabil?" />
          </FormField>
          <div className="grid grid-cols-2 gap-4 items-end">
            <FormField label="Rating" error={testimonialErrors.rating}>
              <select value={testimonialForm.rating} onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: e.target.value })} className={inputCls}>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
              </select>
            </FormField>
            <label className="flex items-center gap-2 pb-2.5 cursor-pointer">
              <input type="checkbox" checked={testimonialForm.active} onChange={(e) => setTestimonialForm({ ...testimonialForm, active: e.target.checked })} className="w-4 h-4 accent-amber-500" />
              <span className="text-sm text-slate-600 font-medium">Show on website</span>
            </label>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={() => setTestimonialModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-500 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSaveTestimonial} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors">{editingTestimonial ? 'Update' : 'Create'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteCourseTarget} title="Delete Course?" message={`Are you sure you want to delete "${deleteCourseTarget?.name}"? It will be removed from the website.`} onConfirm={handleDeleteCourse} onCancel={() => setDeleteCourseTarget(null)} />
      <ConfirmDialog open={!!deleteTestimonialTarget} title="Delete Success Story?" message={`Are you sure you want to delete the story from "${deleteTestimonialTarget?.name}"?`} onConfirm={handleDeleteTestimonial} onCancel={() => setDeleteTestimonialTarget(null)} />
    </div>
  );
}
