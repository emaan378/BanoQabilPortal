export const pipelineStages = [
  { key: 'registered', label: 'Registered', color: 'bg-slate-100 text-slate-600' },
  { key: 'test-scheduled', label: 'Test Scheduled', color: 'bg-blue-50 text-blue-600' },
  { key: 'interview-passed', label: 'Interview Passed', color: 'bg-amber-50 text-amber-600' },
  { key: 'fee-verified', label: 'Fee Verified', color: 'bg-teal-50 text-teal-600' },
  { key: 'enrolled', label: 'Enrolled', color: 'bg-emerald-50 text-emerald-600' },
];

export const stageOrder = ['registered', 'test-scheduled', 'interview-passed', 'fee-verified', 'enrolled'];

export const campuses = [
  { id: 'C1', name: 'FSD Main Center', address: 'Main Boulevard, Faisalabad', phone: '0300-BANO-FSD', email: 'fsd@banoquabil.com' },
  { id: 'C2', name: 'FSD Satellite Campus', address: 'Satellite Town, Faisalabad', phone: '0301-BANO-SAT', email: 'satellite@banoquabil.com' },
];

export const courses = [
  { id: 'CR1', campusId: 'C1', name: 'Web Development', duration: '6 Months', description: 'Full-stack web development with React' },
  { id: 'CR2', campusId: 'C1', name: 'Graphic Design', duration: '4 Months', description: 'Adobe Photoshop, Illustrator, branding' },
  { id: 'CR3', campusId: 'C1', name: 'Digital Marketing', duration: '3 Months', description: 'SEO, social media, Google Ads' },
  { id: 'CR4', campusId: 'C1', name: 'Python Programming', duration: '5 Months', description: 'Python fundamentals, data structures' },
  { id: 'CR5', campusId: 'C1', name: 'E-Commerce', duration: '4 Months', description: 'Online store setup, product management' },
  { id: 'CR6', campusId: 'C1', name: 'Video Editing', duration: '3 Months', description: 'Premiere Pro, After Effects' },
  { id: 'CR7', campusId: 'C2', name: 'Web Development', duration: '6 Months', description: 'Full-stack web development with React' },
];

export const teachers = [
  { id: 'T1', name: 'Sir Bilal Hassan', email: 'bilal@banoquabil.com', phone: '0300-1111111', specialization: 'Web Development, Python', campusId: 'C1' },
  { id: 'T2', name: 'Ms. Sara Khan', email: 'sara@banoquabil.com', phone: '0301-2222222', specialization: 'Graphic Design, Video Editing', campusId: 'C1' },
  { id: 'T3', name: 'Mr. Imran Q.', email: 'imran@banoquabil.com', phone: '0302-3333333', specialization: 'Digital Marketing, E-Commerce', campusId: 'C1' },
];

export const batches = [
  { id: 'B1', courseId: 'CR1', teacherId: 'T1', name: 'FSD-14', room: 'Lab 1', capacity: 40, enrolled: 38, days: 'MWF', time: '10:00 AM - 12:00 PM', status: 'open' },
  { id: 'B2', courseId: 'CR2', teacherId: 'T2', name: 'FSD-15', room: 'Lab 2', capacity: 35, enrolled: 35, days: 'TTS', time: '01:00 PM - 03:00 PM', status: 'full' },
  { id: 'B3', courseId: 'CR3', teacherId: 'T3', name: 'FSD-16', room: 'Room 3', capacity: 40, enrolled: 22, days: 'MWF', time: '03:30 PM - 05:30 PM', status: 'open' },
  { id: 'B4', courseId: 'CR4', teacherId: 'T1', name: 'FSD-17', room: 'Lab 1', capacity: 30, enrolled: 12, days: 'TTS', time: '10:00 AM - 12:00 PM', status: 'open' },
  { id: 'B5', courseId: 'CR5', teacherId: 'T3', name: 'FSD-18', room: 'Room 3', capacity: 40, enrolled: 0, days: 'MWF', time: '06:00 PM - 08:00 PM', status: 'open' },
  { id: 'B6', courseId: 'CR6', teacherId: 'T2', name: 'FSD-19', room: 'Lab 2', capacity: 30, enrolled: 0, days: 'TTS', time: '03:30 PM - 05:30 PM', status: 'closed' },
];

export const students = [
  { id: 'S1', name: 'Ahmed Hassan', email: 'ahmed@example.com', phone: '0300-1234567', cnic: '33100-1234567-1', address: 'Street 12, People Colony, FSD', campusId: 'C1', courseId: 'CR1', batchId: 'B1', regStatus: 'enrolled', testStatus: 'passed', interviewStatus: 'passed', batchAllocationStatus: 'allocated', feeStatus: 'paid', feeAmount: 2000, feePaid: 2000 },
  { id: 'S2', name: 'Fatima Malik', email: 'fatima@example.com', phone: '0301-2345678', cnic: '33100-2345678-2', address: 'D-Ground, People Colony, FSD', campusId: 'C1', courseId: 'CR2', batchId: 'B2', regStatus: 'fee-verified', testStatus: 'passed', interviewStatus: 'passed', batchAllocationStatus: 'allocated', feeStatus: 'paid', feeAmount: 2000, feePaid: 2000 },
  { id: 'S3', name: 'Usman Tariq', email: 'usman@example.com', phone: '0302-3456789', cnic: '33100-3456789-3', address: 'Jaranwala Road, FSD', campusId: 'C1', courseId: 'CR3', batchId: 'B3', regStatus: 'interview-passed', testStatus: 'passed', interviewStatus: 'passed', batchAllocationStatus: 'pending', feeStatus: 'unpaid', feeAmount: 2000, feePaid: 0 },
  { id: 'S4', name: 'Hira Raza', email: 'hira@example.com', phone: '0303-4567890', cnic: '33100-4567890-4', address: 'Gulberg, FSD', campusId: 'C1', courseId: 'CR1', batchId: null, regStatus: 'test-scheduled', testStatus: 'scheduled', interviewStatus: 'pending', batchAllocationStatus: 'pending', feeStatus: 'unpaid', feeAmount: 2000, feePaid: 0 },
  { id: 'S5', name: 'Bilal Sheikh', email: 'bilal@example.com', phone: '0304-5678901', cnic: '33100-5678901-5', address: 'D-Type Colony, FSD', campusId: 'C1', courseId: 'CR4', batchId: null, regStatus: 'test-scheduled', testStatus: 'scheduled', interviewStatus: 'pending', batchAllocationStatus: 'pending', feeStatus: 'unpaid', feeAmount: 2000, feePaid: 0 },
  { id: 'S6', name: 'Ayesha Khan', email: 'ayesha@example.com', phone: '0305-6789012', cnic: '33100-6789012-6', address: 'Madina Town, FSD', campusId: 'C1', courseId: null, batchId: null, regStatus: 'registered', testStatus: 'pending', interviewStatus: 'pending', batchAllocationStatus: 'pending', feeStatus: 'unpaid', feeAmount: 0, feePaid: 0 },
  { id: 'S7', name: 'Zain Ali', email: 'zain@example.com', phone: '0306-7890123', cnic: '33100-7890123-7', address: 'Susan Road, FSD', campusId: 'C1', courseId: null, batchId: null, regStatus: 'registered', testStatus: 'pending', interviewStatus: 'pending', batchAllocationStatus: 'pending', feeStatus: 'unpaid', feeAmount: 0, feePaid: 0 },
  { id: 'S8', name: 'Sana Javed', email: 'sana@example.com', phone: '0307-8901234', cnic: '33100-8901234-8', address: 'Kohinoor City, FSD', campusId: 'C1', courseId: null, batchId: null, regStatus: 'registered', testStatus: 'pending', interviewStatus: 'pending', batchAllocationStatus: 'pending', feeStatus: 'unpaid', feeAmount: 0, feePaid: 0 },
];

export const documents = [
  { id: 'D1', ownerType: 'student', ownerId: 'S1', docType: 'CNIC Copy', fileName: 'cnic_ahmed.pdf', status: 'verified', uploadedAt: '2026-01-05' },
  { id: 'D2', ownerType: 'student', ownerId: 'S1', docType: 'B-Form', fileName: 'bform_ahmed.pdf', status: 'verified', uploadedAt: '2026-01-05' },
  { id: 'D3', ownerType: 'student', ownerId: 'S1', docType: 'Education Certificate', fileName: 'matric_ahmed.jpg', status: 'pending', uploadedAt: '2026-01-06' },
  { id: 'D4', ownerType: 'student', ownerId: 'S2', docType: 'CNIC Copy', fileName: 'cnic_fatima.pdf', status: 'verified', uploadedAt: '2026-01-10' },
  { id: 'D5', ownerType: 'student', ownerId: 'S2', docType: 'B-Form', fileName: 'bform_fatima.pdf', status: 'pending', uploadedAt: '2026-01-10' },
  { id: 'D6', ownerType: 'student', ownerId: 'S3', docType: 'CNIC Copy', fileName: 'cnic_usman.pdf', status: 'verified', uploadedAt: '2026-01-12' },
  { id: 'D7', ownerType: 'student', ownerId: 'S4', docType: 'CNIC Copy', fileName: 'cnic_hira.pdf', status: 'pending', uploadedAt: '2026-01-15' },
  { id: 'D8', ownerType: 'student', ownerId: 'S4', docType: 'Education Certificate', fileName: 'matric_hira.jpg', status: 'pending', uploadedAt: '2026-01-15' },
  { id: 'D9', ownerType: 'teacher', ownerId: 'T1', docType: 'CNIC Copy', fileName: 'cnic_bilal.pdf', status: 'verified', uploadedAt: '2026-01-03' },
  { id: 'D10', ownerType: 'teacher', ownerId: 'T1', docType: 'Degree Certificate', fileName: 'degree_bilal.pdf', status: 'verified', uploadedAt: '2026-01-03' },
  { id: 'D11', ownerType: 'teacher', ownerId: 'T2', docType: 'CNIC Copy', fileName: 'cnic_sara.pdf', status: 'pending', uploadedAt: '2026-01-08' },
  { id: 'D12', ownerType: 'teacher', ownerId: 'T3', docType: 'Resume / CV', fileName: 'cv_imran.pdf', status: 'verified', uploadedAt: '2026-01-04' },
];

// Legacy data for existing pages (registrations, finance, academics, teacher pages)
export const registrations = [
  { id: 'R-0451', name: 'Ahmed Hassan', cnic: '33100-1234567-1', phone: '0300-1234567', course: 'Web Development', date: '02 Jul 2026', stage: 'enrolled', testDate: '10 Jul 2026', testScore: 82, interviewDate: '15 Jul 2026' },
  { id: 'R-0452', name: 'Fatima Malik', cnic: '33100-2345678-2', phone: '0301-2345678', course: 'Graphic Design', date: '03 Jul 2026', stage: 'fee-verified', testDate: '10 Jul 2026', testScore: 78, interviewDate: '15 Jul 2026' },
  { id: 'R-0453', name: 'Usman Tariq', cnic: '33100-3456789-3', phone: '0302-3456789', course: 'Digital Marketing', date: '04 Jul 2026', stage: 'interview-passed', testDate: '10 Jul 2026', testScore: 71, interviewDate: '16 Jul 2026' },
  { id: 'R-0454', name: 'Hira Raza', cnic: '33100-4567890-4', phone: '0303-4567890', course: 'Web Development', date: '05 Jul 2026', stage: 'test-scheduled', testDate: '12 Jul 2026', testScore: undefined },
  { id: 'R-0455', name: 'Bilal Sheikh', cnic: '33100-5678901-5', phone: '0304-5678901', course: 'Python Programming', date: '06 Jul 2026', stage: 'test-scheduled', testDate: '12 Jul 2026', testScore: undefined },
  { id: 'R-0456', name: 'Ayesha Khan', cnic: '33100-6789012-6', phone: '0305-6789012', course: 'Graphic Design', date: '06 Jul 2026', stage: 'registered' },
  { id: 'R-0457', name: 'Zain Ali', cnic: '33100-7890123-7', phone: '0306-7890123', course: 'E-Commerce', date: '07 Jul 2026', stage: 'registered' },
  { id: 'R-0458', name: 'Sana Javed', cnic: '33100-8901234-8', phone: '0307-8901234', course: 'Video Editing', date: '07 Jul 2026', stage: 'registered' },
];

export const vouchers = [
  { id: 'V-1001', student: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', desc: 'Security Deposit — Batch FSD-14', amount: 2000, date: '05 Jan 2026', status: 'paid', trackingId: 'TRK-2026-001' },
  { id: 'V-1002', student: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', desc: 'Library Card Fee', amount: 500, date: '10 Feb 2026', status: 'paid', trackingId: 'TRK-2026-002' },
  { id: 'V-1003', student: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', desc: 'July Batch Security Deposit', amount: 3000, date: '15 Jun 2026', status: 'overdue', trackingId: 'TRK-2026-003' },
  { id: 'V-1004', student: 'Fatima Malik', rollNo: 'BQ-FSD-2026-0452', desc: 'Security Deposit — Batch FSD-15', amount: 2000, date: '20 Jun 2026', status: 'paid', trackingId: 'TRK-2026-004' },
  { id: 'V-1005', student: 'Usman Tariq', rollNo: 'BQ-FSD-2026-0453', desc: 'Security Deposit — Batch FSD-16', amount: 2000, date: '22 Jun 2026', status: 'unpaid', trackingId: 'TRK-2026-005' },
  { id: 'V-1006', student: 'Hira Raza', rollNo: 'BQ-FSD-2026-0454', desc: 'Security Deposit — Batch FSD-14', amount: 2000, date: '25 Jun 2026', status: 'unpaid', trackingId: 'TRK-2026-006' },
  { id: 'V-1007', student: 'Bilal Sheikh', rollNo: 'BQ-FSD-2026-0455', desc: 'Security Deposit — Batch FSD-17', amount: 2000, date: '28 Jun 2026', status: 'overdue', trackingId: 'TRK-2026-007' },
];

export const certRequests = [
  { id: 'C-201', student: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', course: 'HTML/CSS Foundations', batch: 'FSD-14', grade: 'A', status: 'issued', date: '15 Jun 2026' },
  { id: 'C-202', student: 'Fatima Malik', rollNo: 'BQ-FSD-2026-0452', course: 'Graphic Design', batch: 'FSD-15', grade: 'A-', status: 'pending', date: '28 Jul 2026' },
  { id: 'C-203', student: 'Usman Tariq', rollNo: 'BQ-FSD-2026-0453', course: 'Digital Marketing', batch: 'FSD-16', grade: 'B+', status: 'pending', date: '29 Jul 2026' },
  { id: 'C-204', student: 'Hira Raza', rollNo: 'BQ-FSD-2026-0454', course: 'JavaScript Fundamentals', batch: 'FSD-14', grade: 'A', status: 'approved', date: '30 Jul 2026' },
];

export const teacherStudents = [
  { id: 'S1', name: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', status: 'present' },
  { id: 'S2', name: 'Fatima Malik', rollNo: 'BQ-FSD-2026-0452', status: 'present' },
  { id: 'S3', name: 'Usman Tariq', rollNo: 'BQ-FSD-2026-0453', status: 'late' },
  { id: 'S4', name: 'Hira Raza', rollNo: 'BQ-FSD-2026-0454', status: 'present' },
  { id: 'S5', name: 'Bilal Sheikh', rollNo: 'BQ-FSD-2026-0455', status: 'absent' },
  { id: 'S6', name: 'Ayesha Khan', rollNo: 'BQ-FSD-2026-0456', status: 'present' },
  { id: 'S7', name: 'Zain Ali', rollNo: 'BQ-FSD-2026-0457', status: 'present' },
  { id: 'S8', name: 'Sana Javed', rollNo: 'BQ-FSD-2026-0458', status: 'absent' },
  { id: 'S9', name: 'Kamran Raza', rollNo: 'BQ-FSD-2026-0459', status: 'present' },
  { id: 'S10', name: 'Nida Aslam', rollNo: 'BQ-FSD-2026-0460', status: 'present' },
  { id: 'S11', name: 'Omar Farooq', rollNo: 'BQ-FSD-2026-0461', status: 'late' },
  { id: 'S12', name: 'Rabia Anwar', rollNo: 'BQ-FSD-2026-0462', status: 'present' },
];

export const teacherAssignments = [
  {
    id: 'A1', title: 'HTML Layout — Personal Portfolio Page', module: 'HTML/CSS', due: '20 Jul 2026', totalMarks: 100,
    submissions: [
      { student: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', status: 'graded', grade: 85, feedback: 'Good structure, minor CSS issues.' },
      { student: 'Fatima Malik', rollNo: 'BQ-FSD-2026-0452', status: 'graded', grade: 92, feedback: 'Excellent work!' },
      { student: 'Usman Tariq', rollNo: 'BQ-FSD-2026-0453', status: 'late', grade: undefined, feedback: undefined },
      { student: 'Hira Raza', rollNo: 'BQ-FSD-2026-0454', status: 'pending', grade: undefined, feedback: undefined },
    ],
  },
  {
    id: 'A2', title: 'CSS Flexbox & Grid Challenge', module: 'HTML/CSS', due: '25 Jul 2026', totalMarks: 100,
    submissions: [
      { student: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', status: 'graded', grade: 88, feedback: 'Solid grid usage.' },
      { student: 'Fatima Malik', rollNo: 'BQ-FSD-2026-0452', status: 'pending', grade: undefined, feedback: undefined },
      { student: 'Usman Tariq', rollNo: 'BQ-FSD-2026-0453', status: 'pending', grade: undefined, feedback: undefined },
      { student: 'Hira Raza', rollNo: 'BQ-FSD-2026-0454', status: 'graded', grade: 95, feedback: 'Outstanding!' },
    ],
  },
  {
    id: 'A3', title: 'JavaScript DOM Manipulation Task', module: 'JavaScript', due: '02 Aug 2026', totalMarks: 100,
    submissions: [
      { student: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', status: 'pending', grade: undefined, feedback: undefined },
      { student: 'Fatima Malik', rollNo: 'BQ-FSD-2026-0452', status: 'pending', grade: undefined, feedback: undefined },
      { student: 'Usman Tariq', rollNo: 'BQ-FSD-2026-0453', status: 'pending', grade: undefined, feedback: undefined },
      { student: 'Hira Raza', rollNo: 'BQ-FSD-2026-0454', status: 'pending', grade: undefined, feedback: undefined },
    ],
  },
];

export const gradebook = [
  { rollNo: 'BQ-FSD-2026-0451', name: 'Ahmed Hassan', quiz: 18, assignment: 85, midterm: 72, capstone: null, total: null },
  { rollNo: 'BQ-FSD-2026-0452', name: 'Fatima Malik', quiz: 20, assignment: 92, midterm: 88, capstone: null, total: null },
  { rollNo: 'BQ-FSD-2026-0453', name: 'Usman Tariq', quiz: 15, assignment: null, midterm: 65, capstone: null, total: null },
  { rollNo: 'BQ-FSD-2026-0454', name: 'Hira Raza', quiz: 19, assignment: 95, midterm: 80, capstone: null, total: null },
  { rollNo: 'BQ-FSD-2026-0455', name: 'Bilal Sheikh', quiz: 12, assignment: null, midterm: 55, capstone: null, total: null },
  { rollNo: 'BQ-FSD-2026-0456', name: 'Ayesha Khan', quiz: 17, assignment: 78, midterm: 70, capstone: null, total: null },
];

export const studentDocuments = [
  { id: 'D1', student: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', docType: 'CNIC Copy', fileName: 'cnic_ahmed.pdf', uploadDate: '05 Jan 2026', status: 'verified' },
  { id: 'D2', student: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', docType: 'B-Form', fileName: 'bform_ahmed.pdf', uploadDate: '05 Jan 2026', status: 'verified' },
  { id: 'D3', student: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', docType: 'Education Certificate', fileName: 'matric_ahmed.jpg', uploadDate: '06 Jan 2026', status: 'pending' },
  { id: 'D4', student: 'Fatima Malik', rollNo: 'BQ-FSD-2026-0452', docType: 'CNIC Copy', fileName: 'cnic_fatima.pdf', uploadDate: '10 Jan 2026', status: 'verified' },
  { id: 'D5', student: 'Fatima Malik', rollNo: 'BQ-FSD-2026-0452', docType: 'B-Form', fileName: 'bform_fatima.pdf', uploadDate: '10 Jan 2026', status: 'pending' },
  { id: 'D6', student: 'Usman Tariq', rollNo: 'BQ-FSD-2026-0453', docType: 'CNIC Copy', fileName: 'cnic_usman.pdf', uploadDate: '12 Jan 2026', status: 'verified' },
  { id: 'D7', student: 'Hira Raza', rollNo: 'BQ-FSD-2026-0454', docType: 'CNIC Copy', fileName: 'cnic_hira.pdf', uploadDate: '15 Jan 2026', status: 'pending' },
  { id: 'D8', student: 'Hira Raza', rollNo: 'BQ-FSD-2026-0454', docType: 'Education Certificate', fileName: 'matric_hira.jpg', uploadDate: '15 Jan 2026', status: 'pending' },
];
