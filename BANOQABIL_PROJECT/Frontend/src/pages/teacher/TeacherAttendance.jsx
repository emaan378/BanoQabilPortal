import {
	AlertTriangle,
	CalendarCheck,
	CheckCheck,
	Lock,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { portalApi } from "@/lib/api.js";
import "./TeacherAttendance.css";

const statusConfig = {
	present: {
		label: "Present",
		cls: "text-emerald-600",
		activeCls: "bg-emerald-500 text-white",
	},
	absent: {
		label: "Absent",
		cls: "text-red-500",
		activeCls: "bg-red-500 text-white",
	},
	late: {
		label: "Late",
		cls: "text-amber-600",
		activeCls: "bg-amber-400 text-white",
	},
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function TeacherAttendance() {
	const [batches, setBatches] = useState([]);
	const [batchId, setBatchId] = useState("");
	const [date, setDate] = useState(todayStr());
	const [students, setStudents] = useState([]);
	const [locked, setLocked] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		portalApi.teacher
			.batches()
			.then((response) => {
				const list = response.data || [];
				setBatches(list);
				setBatchId(list[0]?._id || list[0]?.id || "");
			})
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (!batchId || !date) return;
		setLoading(true);
		setError("");
		Promise.all([
			portalApi.teacher.roster(batchId),
			portalApi.teacher.attendance({ batchId, date }),
		])
			.then(([rosterRes, attendanceRes]) => {
				const roster = rosterRes.data?.data || [];
				const records = attendanceRes.data?.data || [];
				const statusByStudent = {};
				records.forEach((r) => {
					statusByStudent[r.student?._id || r.student] = r.status;
				});
				setStudents(
					roster.map((s) => ({
						id: s._id,
						name: s.name,
						rollNo: s.rollNumber,
						status: statusByStudent[s._id] || "present",
					})),
				);
				setLocked(records.length > 0);
			})
			.catch((err) => setError(err.message || "Failed to load attendance."))
			.finally(() => setLoading(false));
	}, [batchId, date]);

	const setStatus = (id, status) => {
		if (locked) return;
		setStudents((prev) =>
			prev.map((s) => (s.id === id ? { ...s, status } : s)),
		);
	};

	const markAllPresent = () => {
		if (locked) return;
		setStudents((prev) => prev.map((s) => ({ ...s, status: "present" })));
	};

	const submit = async () => {
		if (!batchId || students.length === 0) return;
		setError("");
		setSaving(true);
		try {
			await portalApi.teacher.saveAttendance({
				batchId,
				date,
				records: students.map((s) => ({ studentId: s.id, status: s.status })),
			});
			setLocked(true);
		} catch (err) {
			setError(err.message || "Failed to save attendance.");
		} finally {
			setSaving(false);
		}
	};

	const present = students.filter((s) => s.status === "present").length;
	const absent = students.filter((s) => s.status === "absent").length;
	const late = students.filter((s) => s.status === "late").length;

	return (
		<div className="TeacherAttendance-div-1">
			<div>
				<h1 className="TeacherAttendance-h1-2">Mark Attendance</h1>
				<p className="TeacherAttendance-p-3">
					Fast 1-click attendance for today's class
				</p>
			</div>

			<div className="TeacherAttendance-div-4">
				<select
					value={batchId}
					onChange={(e) => setBatchId(e.target.value)}
					className="TeacherAttendance-select-5"
				>
					{batches.length === 0 && (
						<option value="">No batches assigned</option>
					)}
					{batches.map((b) => (
						<option key={b._id || b.id} value={b._id || b.id}>
							{b.name}
						</option>
					))}
				</select>
				<input
					type="date"
					value={date}
					onChange={(e) => setDate(e.target.value)}
					className="TeacherAttendance-select-5"
				/>
				<div className="TeacherAttendance-div-6">
					<Users className="TeacherAttendance-users-7" />
					{students.length} students
				</div>
			</div>

			{error && <p className="text-xs font-semibold text-red-600">{error}</p>}
			{loading && <p className="TeacherAttendance-p-11">Loading attendance…</p>}

			{!loading && (
				<div className="TeacherAttendance-div-8">
					<div className="TeacherAttendance-div-9">
						{["present", "absent", "late"].map((st) => (
							<div key={st} className="TeacherAttendance-div-10">
								<p className={`text-lg font-extrabold ${statusConfig[st].cls}`}>
									{st === "present" ? present : st === "absent" ? absent : late}
								</p>
								<p className="TeacherAttendance-p-11">
									{statusConfig[st].label}
								</p>
							</div>
						))}
					</div>
					<div className="TeacherAttendance-div-12">
						<button type="button"
							onClick={markAllPresent}
							disabled={locked}
							className="TeacherAttendance-button-13"
						>
							<CheckCheck className="TeacherAttendance-checkcheck-14" />
							Mark All Present
						</button>
						<button type="button"
							onClick={submit}
							disabled={locked || saving || students.length === 0}
							className="TeacherAttendance-button-15"
						>
							{locked ? (
								<Lock className="TeacherAttendance-checkcheck-14" />
							) : (
								<CalendarCheck className="TeacherAttendance-checkcheck-14" />
							)}
							{locked ? "Locked" : saving ? "Saving…" : "Submit & Lock"}
						</button>
					</div>
				</div>
			)}

			{locked && (
				<div className="TeacherAttendance-div-16">
					<Lock className="TeacherAttendance-lock-17" />
					<p className="TeacherAttendance-p-18">
						Attendance submitted and locked. Contact admin to request changes.
					</p>
				</div>
			)}

			{!loading && (
				<div className="TeacherAttendance-div-19">
					<div className="TeacherAttendance-div-20">
						{students.map((s, idx) => (
							<div key={s.id} className="TeacherAttendance-div-21">
								<span className="TeacherAttendance-span-22">
									{String(idx + 1).padStart(2, "0")}
								</span>
								<div className="TeacherAttendance-div-23">{s.name[0]}</div>
								<div className="TeacherAttendance-div-24">
									<p className="TeacherAttendance-p-25">{s.name}</p>
									<p className="TeacherAttendance-p-11">{s.rollNo}</p>
								</div>
								<div className="TeacherAttendance-div-26">
									{["present", "absent", "late"].map((st) => (
										<button type="button"
											key={st}
											onClick={() => setStatus(s.id, st)}
											disabled={locked}
											className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all disabled:cursor-not-allowed ${s.status === st ? statusConfig[st].activeCls : `bg-slate-50 ${statusConfig[st].cls} hover:bg-slate-100`}`}
										>
											{statusConfig[st].label}
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="TeacherAttendance-div-27">
				<div className="TeacherAttendance-div-28">
					<AlertTriangle className="TeacherAttendance-alerttriangle-29" />
					<h3 className="TeacherAttendance-h3-30">
						Students Needing Attention
					</h3>
				</div>
				<div className="TeacherAttendance-div-31">
					{students.filter((s) => s.status !== "present").length === 0 && (
						<p className="TeacherAttendance-p-34">
							No attendance concerns today for this batch.
						</p>
					)}
					{students
						.filter((s) => s.status !== "present")
						.map((f) => (
							<div key={f.id} className="TeacherAttendance-div-32">
								<div>
									<p className="TeacherAttendance-p-33">{f.name}</p>
									<p className="TeacherAttendance-p-34">{f.rollNo}</p>
								</div>
								<span className="TeacherAttendance-span-35">
									{f.status === "late" ? "Late today" : "Absent today"}
								</span>
							</div>
						))}
				</div>
			</div>
		</div>
	);
}
