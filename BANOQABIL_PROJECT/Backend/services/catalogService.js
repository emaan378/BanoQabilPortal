const Campus = require('../models/Campus');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Batch = require('../models/Batch');
const Testimonial = require('../models/Testimonial');
const Registration = require('../models/Registration');

const SEED_CAMPUSES = [
  { name: 'FSD Main Center', address: 'Main Boulevard, Faisalabad', phone: '0300-BANO-FSD', email: 'fsd@banoquabil.com', city: 'Faisalabad', region: 'Punjab', zip: '38000', establishedYear: 2021, capacity: 500, headName: 'Sir M. Tariq' },
  { name: 'FSD Satellite Campus', address: 'Satellite Town, Faisalabad', phone: '0301-BANO-SAT', email: 'satellite@banoquabil.com', city: 'Faisalabad', region: 'Punjab', zip: '38050', establishedYear: 2022, capacity: 350, headName: 'Ms. Ayesha Raza' },
];

const SEED_COURSES = [
  { name: 'Web Development', campus: 'FSD Main Center', duration: '6 Months', description: 'Full-stack web development with React' },
  { name: 'Graphic Design', campus: 'FSD Main Center', duration: '4 Months', description: 'Adobe Photoshop, Illustrator, branding' },
  { name: 'Digital Marketing', campus: 'FSD Main Center', duration: '3 Months', description: 'SEO, social media, Google Ads' },
  { name: 'Python Programming', campus: 'FSD Main Center', duration: '5 Months', description: 'Python fundamentals, data structures' },
  { name: 'E-Commerce', campus: 'FSD Main Center', duration: '4 Months', description: 'Online store setup, product management' },
  { name: 'Video Editing', campus: 'FSD Main Center', duration: '3 Months', description: 'Premiere Pro, After Effects' },
  { name: 'Web Development', campus: 'FSD Satellite Campus', duration: '6 Months', description: 'Full-stack web development with React' },
];

const SEED_TEACHERS = [
  { name: 'Sir Bilal Hassan', email: 'bilal@banoquabil.com', phone: '0300-1111111', specialization: 'Web Development, Python', campus: 'FSD Main Center' },
  { name: 'Ms. Sara Khan', email: 'sara@banoquabil.com', phone: '0301-2222222', specialization: 'Graphic Design, Video Editing', campus: 'FSD Main Center' },
  { name: 'Mr. Imran Q.', email: 'imran@banoquabil.com', phone: '0302-3333333', specialization: 'Digital Marketing, E-Commerce', campus: 'FSD Main Center' },
];

const SEED_BATCHES = [
  { name: 'FSD-14', course: 'Web Development', teacher: 'Sir Bilal Hassan', room: 'Lab 1', capacity: 40, days: 'MWF', time: '10:00 AM - 12:00 PM', status: 'open' },
  { name: 'FSD-15', course: 'Graphic Design', teacher: 'Ms. Sara Khan', room: 'Lab 2', capacity: 35, days: 'TTS', time: '01:00 PM - 03:00 PM', status: 'full' },
  { name: 'FSD-16', course: 'Digital Marketing', teacher: 'Mr. Imran Q.', room: 'Room 3', capacity: 40, days: 'MWF', time: '03:30 PM - 05:30 PM', status: 'open' },
  { name: 'FSD-17', course: 'Python Programming', teacher: 'Sir Bilal Hassan', room: 'Lab 1', capacity: 30, days: 'TTS', time: '10:00 AM - 12:00 PM', status: 'open' },
  { name: 'FSD-18', course: 'E-Commerce', teacher: 'Mr. Imran Q.', room: 'Room 3', capacity: 40, days: 'MWF', time: '06:00 PM - 08:00 PM', status: 'open' },
  { name: 'FSD-19', course: 'Video Editing', teacher: 'Ms. Sara Khan', room: 'Lab 2', capacity: 30, days: 'TTS', time: '03:30 PM - 05:30 PM', status: 'closed' },
];

const SEED_TESTIMONIALS = [
  { name: 'Fatima Malik', course: 'Web Development — Batch FSD-12', text: 'Bano Qabil transformed my life. I landed my first freelance client within two months of completing the course.', rating: 5, active: true },
  { name: 'Usman Tariq', course: 'Digital Marketing — Batch FSD-09', text: 'The instructors are incredibly knowledgeable and the learning environment at FSD campus is excellent.', rating: 5, active: true },
  { name: 'Hira Raza', course: 'Graphic Design — Batch FSD-11', text: 'Free, professional IT education in Faisalabad — Bano Qabil is truly empowering the youth of our city.', rating: 5, active: true },
];

const effectiveBatchStatus = (batch, enrolled) => {
  if (enrolled >= batch.capacity) return 'full';
  return batch.status === 'closed' ? 'closed' : 'open';
};

const getBatchCounts = async () => {
  const rows = await Registration.aggregate([
    { $match: { batch: { $exists: true, $ne: '' } } },
    { $group: { _id: '$batch', count: { $sum: 1 } } },
  ]);
  const counts = {};
  rows.forEach((row) => { counts[row._id] = row.count; });
  return counts;
};

const attachEnrollment = async (batches) => {
  const counts = await getBatchCounts();
  return batches.map((batch) => {
    const enrolled = counts[batch.name] || 0;
    return { ...batch, enrolled, status: effectiveBatchStatus(batch, enrolled) };
  });
};

const getOverview = async () => {
  const [campuses, courses, teachers, batches, studentTotal] = await Promise.all([
    Campus.find().sort({ name: 1 }).lean(),
    Course.find().sort({ name: 1 }).lean(),
    Teacher.find().sort({ name: 1 }).lean(),
    Batch.find().sort({ name: 1 }).lean(),
    Registration.countDocuments(),
  ]);

  const [batchesWithEnrollment, byCampus, byCourse] = await Promise.all([
    attachEnrollment(batches),
    Registration.aggregate([
      { $group: { _id: '$campus', students: { $sum: 1 }, enrolled: { $sum: { $cond: [{ $in: ['$stage', ['enrolled']] }, 1, 0] } } } },
    ]),
    Registration.aggregate([
      { $match: { course: { $exists: true, $ne: '' } } },
      { $group: { _id: '$course', students: { $sum: 1 } } },
    ]),
  ]);

  return {
    campuses,
    courses,
    teachers,
    batches: batchesWithEnrollment,
    stats: {
      students: studentTotal,
      campuses: campuses.length,
      courses: courses.length,
      teachers: teachers.length,
      batches: batchesWithEnrollment.length,
    },
    byCampus: byCampus.map((row) => ({ campus: row._id || 'Unassigned', students: row.students, enrolled: row.enrolled })),
    byCourse: byCourse.map((row) => ({ course: row._id, students: row.students })),
  };
};

const listCampuses = () => Campus.find().sort({ name: 1 }).lean();
const getCampus = (id) => Campus.findById(id).lean();
const createCampus = (payload) => Campus.create(payload);
const updateCampus = (id, payload) => Campus.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
const removeCampus = async (id) => {
  const campus = await Campus.findByIdAndDelete(id);
  if (!campus) return null;
  await Promise.all([
    Course.deleteMany({ campus: campus.name }),
    Teacher.deleteMany({ campus: campus.name }),
    Batch.deleteMany({ course: { $in: await Course.find({ campus: campus.name }).distinct('name') } }),
    Registration.updateMany({ campus: campus.name }, { $set: { campus: '' } }),
  ]);
  return campus;
};

const listCourses = (campusScope) => Course.find(campusScope ? { campus: campusScope } : {}).sort({ name: 1 }).lean();
const getCourse = (id, campusScope) => Course.findOne(campusScope ? { _id: id, campus: campusScope } : { _id: id }).lean();
const createCourse = (payload) => Course.create(payload);
const updateCourse = (id, payload) => Course.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
const removeCourse = async (id) => {
  const course = await Course.findByIdAndDelete(id);
  if (!course) return null;
  await Promise.all([
    Batch.deleteMany({ course: course.name }),
    Registration.updateMany({ course: course.name }, { $set: { course: '' } }),
  ]);
  return course;
};

const listTestimonials = () => Testimonial.find().sort({ createdAt: -1 }).lean();
const getTestimonial = (id) => Testimonial.findById(id).lean();
const createTestimonial = (payload) => Testimonial.create(payload);
const updateTestimonial = (id, payload) => Testimonial.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
const removeTestimonial = (id) => Testimonial.findByIdAndDelete(id);

const listPublicCourses = () =>
  Course.find({}, { name: 1, duration: 1, description: 1, campus: 1 }).sort({ name: 1 }).lean();

const listPublicCampuses = () =>
  Campus.find({}, { name: 1, city: 1, address: 1 }).sort({ name: 1 }).lean();

const listPublicTestimonials = () =>
  Testimonial.find({ active: true }, { name: 1, course: 1, text: 1, rating: 1 }).sort({ createdAt: -1 }).lean();

// Batch has no direct campus field — it belongs to a campus through its course,
// so we resolve "which course names belong to this campus" first.
const courseNamesForCampus = (campusScope) => Course.find({ campus: campusScope }).distinct('name');

const listBatches = async (campusScope) => {
  const query = {};
  if (campusScope) query.course = { $in: await courseNamesForCampus(campusScope) };
  return attachEnrollment(await Batch.find(query).sort({ name: 1 }).lean());
};
const getBatch = async (id, campusScope) => {
  const batch = await Batch.findById(id).lean();
  if (!batch) return null;
  if (campusScope) {
    const allowedCourses = await courseNamesForCampus(campusScope);
    if (!allowedCourses.includes(batch.course)) return null;
  }
  const [enrolled] = await attachEnrollment([batch]);
  return enrolled;
};
const createBatch = async (payload, campusScope) => {
  if (campusScope) {
    const allowedCourses = await courseNamesForCampus(campusScope);
    if (!allowedCourses.includes(payload.course)) return false; // course not in this admin's campus
  }
  return Batch.create(payload);
};
const updateBatch = async (id, payload, campusScope) => {
  const batch = await Batch.findById(id);
  if (!batch) return null;
  if (campusScope) {
    const allowedCourses = await courseNamesForCampus(campusScope);
    if (!allowedCourses.includes(batch.course)) return null;
  }
  if (payload.name && payload.name !== batch.name) {
    await Registration.updateMany({ batch: batch.name }, { $set: { batch: payload.name } });
  }
  return Batch.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};
const removeBatch = async (id, campusScope) => {
  const batch = await Batch.findById(id);
  if (!batch) return null;
  if (campusScope) {
    const allowedCourses = await courseNamesForCampus(campusScope);
    if (!allowedCourses.includes(batch.course)) return null;
  }
  await batch.deleteOne();
  await Registration.updateMany({ batch: batch.name }, { $set: { batch: '', batchAllocationStatus: 'pending' } });
  return batch;
};

const batchRoster = async (batchId, campusScope) => {
  const batch = await Batch.findById(batchId);
  if (!batch) return null;
  if (campusScope) {
    const allowedCourses = await courseNamesForCampus(campusScope);
    if (!allowedCourses.includes(batch.course)) return null;
  }
  return Registration.find({ batch: batch.name }).sort({ name: 1 }).lean();
};

const allocateStudents = async (batchId, studentIds, campusScope) => {
  const batch = await Batch.findById(batchId);
  if (!batch) return null;
  if (campusScope) {
    const allowedCourses = await courseNamesForCampus(campusScope);
    if (!allowedCourses.includes(batch.course)) return null;
  }

  const currentEnrolled = await Registration.countDocuments({ batch: batch.name });
  const availableSlots = Math.max(batch.capacity - currentEnrolled, 0);
  const candidateQuery = { _id: { $in: studentIds } };
  if (campusScope) candidateQuery.campus = campusScope;
  const candidates = await Registration.find(candidateQuery).lean();

  const toAllocate = candidates
    .filter((student) => student.batch !== batch.name && student.batchAllocationStatus !== 'allocated')
    .slice(0, availableSlots);

  for (const student of toAllocate) {
    await Registration.updateOne(
      { _id: student._id },
      { $set: { batch: batch.name, batchAllocationStatus: 'allocated' } }
    );
  }

  return { allocated: toAllocate.length, skipped: Math.max(studentIds.length - toAllocate.length, 0), slotsRemaining: Math.max(availableSlots - toAllocate.length, 0) };
};

const seed = async () => {
  const campusResult = await Campus.bulkWrite(
    SEED_CAMPUSES.map((doc) => ({ updateOne: { filter: { name: doc.name }, update: { $set: doc }, upsert: true } }))
  );
  const courseResult = await Course.bulkWrite(
    SEED_COURSES.map((doc) => ({ updateOne: { filter: { name: doc.name, campus: doc.campus }, update: { $set: doc }, upsert: true } }))
  );
  const teacherResult = await Teacher.bulkWrite(
    SEED_TEACHERS.map((doc) => ({ updateOne: { filter: { name: doc.name }, update: { $set: doc }, upsert: true } }))
  );
  const batchResult = await Batch.bulkWrite(
    SEED_BATCHES.map((doc) => ({ updateOne: { filter: { name: doc.name }, update: { $set: doc }, upsert: true } }))
  );
  const testimonialResult = await Testimonial.bulkWrite(
    SEED_TESTIMONIALS.map((doc) => ({ updateOne: { filter: { name: doc.name, text: doc.text }, update: { $set: doc }, upsert: true } }))
  );

  return {
    campuses: campusResult.upsertedCount + campusResult.modifiedCount,
    courses: courseResult.upsertedCount + courseResult.modifiedCount,
    teachers: teacherResult.upsertedCount + teacherResult.modifiedCount,
    batches: batchResult.upsertedCount + batchResult.modifiedCount,
    testimonials: testimonialResult.upsertedCount + testimonialResult.modifiedCount,
  };
};

module.exports = {
  getOverview,
  attachEnrollment,
  listCampuses,
  getCampus,
  createCampus,
  updateCampus,
  removeCampus,
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  removeCourse,
  listTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  removeTestimonial,
  listPublicCourses,
  listPublicCampuses,
  listPublicTestimonials,
  listBatches,
  getBatch,
  createBatch,
  updateBatch,
  removeBatch,
  batchRoster,
  allocateStudents,
  seed,
};
