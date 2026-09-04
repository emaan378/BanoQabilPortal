export interface Registration {
  id: string;
  name: string;
  cnic: string;
  phone: string;
  course: string;
  date: string;
  stage: 'registered' | 'test-scheduled' | 'interview-passed' | 'fee-verified' | 'enrolled';
  testDate?: string;
  testScore?: number;
  interviewDate?: string;
}

export interface Batch {
  id: string;
  course: string;
  instructor: string;
  room: string;
  capacity: number;
  enrolled: number;
  days: string;
  time: string;
  status: 'open' | 'full' | 'closed';
}

export interface Voucher {
  id: string;
  student: string;
  rollNo: string;
  desc: string;
  amount: number;
  date: string;
  status: 'paid' | 'unpaid' | 'overdue';
  trackingId: string;
}

export interface CertRequest {
  id: string;
  student: string;
  rollNo: string;
  course: string;
  batch: string;
  grade: string;
  status: 'pending' | 'approved' | 'issued';
  date: string;
}

export interface TeacherStudent {
  id: string;
  name: string;
  rollNo: string;
  status: 'present' | 'absent' | 'late' | null;
}

export interface TeacherAssignment {
  id: string;
  title: string;
  module: string;
  due: string;
  totalMarks: number;
  submissions: { student: string; rollNo: string; status: 'pending' | 'graded' | 'late'; grade?: number; feedback?: string }[];
}

export interface GradebookRow {
  rollNo: string;
  name: string;
  quiz: number | null;
  assignment: number | null;
  midterm: number | null;
  capstone: number | null;
  total: number | null;
}

export const registrations: Registration[] = [
  { id: 'R-0451', name: 'Ahmed Hassan', cnic: '33100-1234567-1', phone: '0300-1234567', course: 'Web Development', date: '02 Jul 2026', stage: 'enrolled', testDate: '10 Jul 2026', testScore: 82, interviewDate: '15 Jul 2026' },
  { id: 'R-0452', name: 'Fatima Malik', cnic: '33100-2345678-2', phone: '0301-2345678', course: 'Graphic Design', date: '03 Jul 2026', stage: 'fee-verified', testDate: '10 Jul 2026', testScore: 78, interviewDate: '15 Jul 2026' },
  { id: 'R-0453', name: 'Usman Tariq', cnic: '33100-3456789-3', phone: '0302-3456789', course: 'Digital Marketing', date: '04 Jul 2026', stage: 'interview-passed', testDate: '10 Jul 2026', testScore: 71, interviewDate: '16 Jul 2026' },
  { id: 'R-0454', name: 'Hira Raza', cnic: '33100-4567890-4', phone: '0303-4567890', course: 'Web Development', date: '05 Jul 2026', stage: 'test-scheduled', testDate: '12 Jul 2026', testScore: undefined },
  { id: 'R-0455', name: 'Bilal Sheikh', cnic: '33100-5678901-5', phone: '0304-5678901', course: 'Python Programming', date: '06 Jul 2026', stage: 'test-scheduled', testDate: '12 Jul 2026', testScore: undefined },
  { id: 'R-0456', name: 'Ayesha Khan', cnic: '33100-6789012-6', phone: '0305-6789012', course: 'Graphic Design', date: '06 Jul 2026', stage: 'registered' },
  { id: 'R-0457', name: 'Zain Ali', cnic: '33100-7890123-7', phone: '0306-7890123', course: 'E-Commerce', date: '07 Jul 2026', stage: 'registered' },
  { id: 'R-0458', name: 'Sana Javed', cnic: '33100-8901234-8', phone: '0307-8901234', course: 'Video Editing', date: '07 Jul 2026', stage: 'registered' },
];

export const batches: Batch[] = [
  { id: 'FSD-14', course: 'Web Development', instructor: 'Sir Bilal Hassan', room: 'Lab 1', capacity: 40, enrolled: 38, days: 'MWF', time: '10:00 AM - 12:00 PM', status: 'open' },
  { id: 'FSD-15', course: 'Graphic Design', instructor: 'Ms. Sara Khan', room: 'Lab 2', capacity: 35, enrolled: 35, days: 'TTS', time: '01:00 PM - 03:00 PM', status: 'full' },
  { id: 'FSD-16', course: 'Digital Marketing', instructor: 'Mr. Imran Q.', room: 'Room 3', capacity: 40, enrolled: 22, days: 'MWF', time: '03:30 PM - 05:30 PM', status: 'open' },
  { id: 'FSD-17', course: 'Python Programming', instructor: 'Sir Bilal Hassan', room: 'Lab 1', capacity: 30, enrolled: 12, days: 'TTS', time: '10:00 AM - 12:00 PM', status: 'open' },
  { id: 'FSD-18', course: 'E-Commerce', instructor: 'Mr. Imran Q.', room: 'Room 3', capacity: 40, enrolled: 0, days: 'MWF', time: '06:00 PM - 08:00 PM', status: 'open' },
  { id: 'FSD-19', course: 'Video Editing', instructor: 'Ms. Sara Khan', room: 'Lab 2', capacity: 30, enrolled: 0, days: 'TTS', time: '03:30 PM - 05:30 PM', status: 'closed' },
];

export const vouchers: Voucher[] = [
  { id: 'V-1001', student: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', desc: 'Security Deposit — Batch FSD-14', amount: 2000, date: '05 Jan 2026', status: 'paid', trackingId: 'TRK-2026-001' },
  { id: 'V-1002', student: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', desc: 'Library Card Fee', amount: 500, date: '10 Feb 2026', status: 'paid', trackingId: 'TRK-2026-002' },
  { id: 'V-1003', student: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', desc: 'July Batch Security Deposit', amount: 3000, date: '15 Jun 2026', status: 'overdue', trackingId: 'TRK-2026-003' },
  { id: 'V-1004', student: 'Fatima Malik', rollNo: 'BQ-FSD-2026-0452', desc: 'Security Deposit — Batch FSD-15', amount: 2000, date: '20 Jun 2026', status: 'paid', trackingId: 'TRK-2026-004' },
  { id: 'V-1005', student: 'Usman Tariq', rollNo: 'BQ-FSD-2026-0453', desc: 'Security Deposit — Batch FSD-16', amount: 2000, date: '22 Jun 2026', status: 'unpaid', trackingId: 'TRK-2026-005' },
  { id: 'V-1006', student: 'Hira Raza', rollNo: 'BQ-FSD-2026-0454', desc: 'Security Deposit — Batch FSD-14', amount: 2000, date: '25 Jun 2026', status: 'unpaid', trackingId: 'TRK-2026-006' },
  { id: 'V-1007', student: 'Bilal Sheikh', rollNo: 'BQ-FSD-2026-0455', desc: 'Security Deposit — Batch FSD-17', amount: 2000, date: '28 Jun 2026', status: 'overdue', trackingId: 'TRK-2026-007' },
];

export const certRequests: CertRequest[] = [
  { id: 'C-201', student: 'Ahmed Hassan', rollNo: 'BQ-FSD-2026-0451', course: 'HTML/CSS Foundations', batch: 'FSD-14', grade: 'A', status: 'issued', date: '15 Jun 2026' },
  { id: 'C-202', student: 'Fatima Malik', rollNo: 'BQ-FSD-2026-0452', course: 'Graphic Design', batch: 'FSD-15', grade: 'A-', status: 'pending', date: '28 Jul 2026' },
  { id: 'C-203', student: 'Usman Tariq', rollNo: 'BQ-FSD-2026-0453', course: 'Digital Marketing', batch: 'FSD-16', grade: 'B+', status: 'pending', date: '29 Jul 2026' },
  { id: 'C-204', student: 'Hira Raza', rollNo: 'BQ-FSD-2026-0454', course: 'JavaScript Fundamentals', batch: 'FSD-14', grade: 'A', status: 'approved', date: '30 Jul 2026' },
];

export const teacherStudents: TeacherStudent[] = [
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

export const teacherAssignments: TeacherAssignment[] = [
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

export const gradebook: GradebookRow[] = [
  { rollNo: 'BQ-FSD-2026-0451', name: 'Ahmed Hassan', quiz: 18, assignment: 85, midterm: 72, capstone: null, total: null },
  { rollNo: 'BQ-FSD-2026-0452', name: 'Fatima Malik', quiz: 20, assignment: 92, midterm: 88, capstone: null, total: null },
  { rollNo: 'BQ-FSD-2026-0453', name: 'Usman Tariq', quiz: 15, assignment: null, midterm: 65, capstone: null, total: null },
  { rollNo: 'BQ-FSD-2026-0454', name: 'Hira Raza', quiz: 19, assignment: 95, midterm: 80, capstone: null, total: null },
  { rollNo: 'BQ-FSD-2026-0455', name: 'Bilal Sheikh', quiz: 12, assignment: null, midterm: 55, capstone: null, total: null },
  { rollNo: 'BQ-FSD-2026-0456', name: 'Ayesha Khan', quiz: 17, assignment: 78, midterm: 70, capstone: null, total: null },
];

export const pipelineStages = [
  { key: 'registered', label: 'Registered', color: 'bg-slate-100 text-slate-600' },
  { key: 'test-scheduled', label: 'Test Scheduled', color: 'bg-blue-50 text-blue-600' },
  { key: 'interview-passed', label: 'Interview Passed', color: 'bg-amber-50 text-amber-600' },
  { key: 'fee-verified', label: 'Fee Verified', color: 'bg-teal-50 text-teal-600' },
  { key: 'enrolled', label: 'Enrolled', color: 'bg-emerald-50 text-emerald-600' },
] as const;
