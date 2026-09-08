import { CalendarCheck, ChevronRight, Clock, Megaphone, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCurrentUser, portalApi } from '@/lib/api.js';
import { useTeacherNotices } from '@/context/TeacherNoticesContext.jsx';
import './TeacherDashboard.css';

const initials = (name = 'Teacher') =>
	name
		.split(' ')
		.map((part) => part[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();

const defaultStats = [
	{ label: 'Batches', value: '—' },
	{ label: 'Students', value: '—' },
	{ label: 'Assignments', value: '—' },
	{ label: 'Pending Grades', value: '—' },
];

const defaultSchedule = [
	{ time: '09:00', course: 'Web Development', room: 'Lab A', students: 24 },
	{ time: '11:00', course: 'JavaScript', room: 'Lab B', students: 21 },
	{ time: '14:00', course: 'React Basics', room: 'Lab A', students: 18 },
];

export default function TeacherDashboard({ navigate }) {
	const user = getCurrentUser() || {};
	const { notices } = useTeacherNotices();
	const [stats, setStats] = useState(defaultStats);
	const [schedule, setSchedule] = useState(defaultSchedule);
	const [gradePending, setGradePending] = useState(0);
	const [assignmentsCount, setAssignmentsCount] = useState(0);

	const loadDashboard = () => {
		Promise.all([
			portalApi.teacher.dashboard().catch(() => null),
			portalApi.teacher.batches().catch(() => ({ data: [] })),
			portalApi.teacher.assignments().catch(() => ({ data: { data: [] } })),
		]).then(([dash, batchesRes, assignRes]) => {
			const batches = batchesRes?.data || [];
			const assignments = assignRes?.data?.data || [];
			const dashData = dash?.data || {};
			const dashboardBatches = Array.isArray(dashData.batches) ? dashData.batches : batches;

			let totalStudents = Number(dashData.stats?.totalStudents) || 0;
			const batchSchedule = [];
			(dashboardBatches || []).forEach((b) => {
				const students = b.enrolled ?? b.studentCount ?? b.studentsCount ?? 0;
				if (!dashData.stats?.totalStudents) totalStudents += Number(students) || 0;
				batchSchedule.push({
					time: b.startTime || b.schedule || b.time || '—',
					course: b.name || b.course || 'Batch',
					room: b.room || b.campus || '—',
					students: Number(students) || 0,
				});
			});

			const pending = assignments.reduce(
				(sum, a) => sum + (a.pendingSubmissions ?? 0),
				0,
			);

			setStats([
				{ label: 'Batches', value: dashboardBatches.length || '—' },
				{ label: 'Students', value: totalStudents || '—' },
				{ label: 'Assignments', value: assignments.length || '—' },
				{ label: 'Pending Grades', value: pending || '—' },
			]);
			setSchedule(batchSchedule.length ? batchSchedule : defaultSchedule);
			setGradePending(pending);
			setAssignmentsCount(assignments.length);

			if (dashData && typeof dashData === 'object') {
				const mapped = [
					{ label: 'Batches', value: dashData.batches },
					{ label: 'Students', value: dashData.students },
					{ label: 'Assignments', value: dashData.assignments },
					{ label: 'Pending Grades', value: dashData.pendingGrades },
				];
				if (mapped.every((m) => m.value !== undefined)) setStats(mapped);
			}
		});
	};

	useEffect(() => {
		loadDashboard();

		const interval = setInterval(loadDashboard, 30000);
		const onFocus = () => loadDashboard();

		window.addEventListener('focus', onFocus);

		return () => {
			clearInterval(interval);
			window.removeEventListener('focus', onFocus);
		};
	}, []);

	return (
		<div className="TeacherDashboard-div-1">
			<div className="TeacherDashboard-div-2">
				<div>
					<h1 className="TeacherDashboard-h1-3">Dashboard</h1>
					<p className="TeacherDashboard-p-4">
						Welcome back, {user.name || 'Teacher'}. Here's your class overview.
					</p>
				</div>
				<div className="TeacherDashboard-div-5">
					<div className="TeacherDashboard-div-6">{initials(user.name)}</div>
					<span className="TeacherDashboard-span-7">
						{user.name || 'Teacher'}
					</span>
				</div>
			</div>

			<div className="TeacherDashboard-div-8">
				{stats.map((s) => (
					<div key={s.label} className="TeacherDashboard-div-9">
						<p className="TeacherDashboard-p-10">{s.label}</p>
						<p className="TeacherDashboard-h1-3">{s.value}</p>
					</div>
				))}
			</div>

			<div className="TeacherDashboard-div-11">
				<div className="TeacherDashboard-div-12">
					<Clock className="TeacherDashboard-clock-13" />
					<h2 className="TeacherDashboard-h2-14">Today's Schedule</h2>
				</div>
				<div className="TeacherDashboard-div-15">
					{schedule.map((s) => (
						<div key={s.course} className="TeacherDashboard-div-16">
							<div className="TeacherDashboard-div-17">
								<p className="TeacherDashboard-p-18">{s.time}</p>
								<p className="TeacherDashboard-p-19">{s.room}</p>
							</div>
							<div className="TeacherDashboard-div-20" />
							<div className="TeacherDashboard-div-21">
								<p className="TeacherDashboard-p-22">{s.course}</p>
								<div className="TeacherDashboard-div-23">
									<span className="TeacherDashboard-span-24">
										<Users className="TeacherDashboard-users-25" /> {s.students}{' '}
										students
									</span>
									<span className="TeacherDashboard-span-26">Today</span>
								</div>
							</div>
							<button
								type="button"
								onClick={() => navigate('teacher-attendance')}
								className="TeacherDashboard-button-27"
							>
								Mark Attendance
							</button>
						</div>
					))}
				</div>
			</div>

			<div className="TeacherDashboard-div-28">
				<div className="TeacherDashboard-div-29">
					<div className="TeacherDashboard-div-30">
						<CalendarCheck className="TeacherDashboard-users-25" />
						<h2 className="TeacherDashboard-h2-14">Assignments</h2>
					</div>
					<div className="TeacherDashboard-div-31">
						<span className="TeacherDashboard-span-34">{assignmentsCount} Active</span>
						<span className="TeacherDashboard-span-34">
							{gradePending} Pending Grades
						</span>
					</div>
					<div className="TeacherDashboard-div-32">
						<button
							type="button"
							onClick={() => navigate('teacher-assignments')}
							className="TeacherDashboard-button-37"
						>
							Go to Assignments <ChevronRight className="TeacherDashboard-users-25" />
						</button>
					</div>
				</div>

				<div className="TeacherDashboard-div-29">
					<div className="TeacherDashboard-div-30">
						<Megaphone className="TeacherDashboard-users-25" />
						<h2 className="TeacherDashboard-h2-14">Recent Notices</h2>
					</div>
					{notices.length === 0 && (
						<div className="TeacherDashboard-div-33">
							<span className="TeacherDashboard-span-34">No notices yet</span>
							<p className="TeacherDashboard-p-35">
								Post an announcement to share updates with your students.
							</p>
						</div>
					)}
					{notices.slice(0, 3).map((n, idx) => (
						<div key={n?._id ?? idx} className="TeacherDashboard-div-33">
							<span className="TeacherDashboard-span-34">{n.title || 'Announcement'}</span>
							<p className="TeacherDashboard-p-35">{n.message || n.text || ''}</p>
						</div>
					))}
					<div className="TeacherDashboard-div-36">
						<button
							type="button"
							onClick={() => navigate('teacher-notices')}
							className="TeacherDashboard-button-37"
						>
							Post New Announcement{' '}
							<ChevronRight className="TeacherDashboard-users-25" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
