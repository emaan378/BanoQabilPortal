import { AlertTriangle, Flag, Link2, Megaphone, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { portalApi } from "@/lib/api.js";
import { useTeacherNotices } from "@/context/TeacherNoticesContext.jsx";
import "./TeacherNotices.css";

const typeConfig = {
	announcement: {
		icon: Megaphone,
		cls: "bg-teal-50 text-teal-600",
		label: "Announcement",
	},
	resource: { icon: Link2, cls: "bg-blue-50 text-blue-600", label: "Resource" },
	flag: {
		icon: Flag,
		cls: "bg-amber-50 text-amber-600",
		label: "Student Flag",
	},
};

const timeAgo = (dateStr) => {
	if (!dateStr) return "";
	const diffMs = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diffMs / 60000);
	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.floor(hours / 24)}d ago`;
};

export default function TeacherNotices() {
	const { notices, addNotice, refresh } = useTeacherNotices();
	const [batches, setBatches] = useState([]);
	const [batchId, setBatchId] = useState("");
	const [msg, setMsg] = useState("");
	const [type, setType] = useState("announcement");
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState("");
	const [flags, setFlags] = useState([]);
	const [students, setStudents] = useState([]);
	const [flagBatchId, setFlagBatchId] = useState("");
	const [flagStudentId, setFlagStudentId] = useState("");
	const [flagReason, setFlagReason] = useState("");
	const [flagging, setFlagging] = useState(false);

	const loadFlags = (silent = true) => {
		portalApi.teacher
			.flags()
			.then((response) => {
				const list =
					response?.data?.data ?? response?.data ?? response ?? [];
				setFlags(Array.isArray(list) ? list : []);
			})
			.catch(() => {
				if (!silent) setError("Failed to load student flags.");
			});
	};

	const loadRoster = (batchIdValue) => {
		if (!batchIdValue) {
			setStudents([]);
			setFlagStudentId("");
			return;
		}
		portalApi.teacher
			.roster(batchIdValue)
			.then((response) => {
				const list = response?.data?.data ?? response?.data ?? [];
				setStudents(Array.isArray(list) ? list : []);
			})
			.catch(() => {
				setStudents([]);
				setError("Failed to load students.");
			});
	};

	const flagStudent = async () => {
		setError("");
		if (!flagStudentId || !flagReason.trim()) {
			setError("Select a student and enter a reason.");
			return;
		}
		setFlagging(true);
		try {
			await portalApi.teacher.createFlag({
				studentId: flagStudentId,
				reason: flagReason.trim(),
			});
			setFlagReason("");
			setFlagStudentId("");
			loadFlags();
		} catch (err) {
			setError(err.message || "Failed to flag student.");
		} finally {
			setFlagging(false);
		}
	};

	useEffect(() => {
		refresh();
		loadFlags();
		portalApi.teacher
			.batches()
			.then((response) => {
				const list = response.data || [];
				setBatches(list);
				setBatchId(list[0]?._id || list[0]?.id || "");
				setFlagBatchId(list[0]?._id || list[0]?.id || "");
				loadRoster(list[0]?._id || list[0]?.id || "");
			})
			.catch(() => {});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refresh]);

	const selectedBatch = batches.find((b) => (b._id || b.id) === batchId);

	const post = async () => {
		setError("");
		if (!msg.trim()) return;
		setPosting(true);
		try {
			await portalApi.teacher.createNotice({
				title: typeConfig[type].label,
				message: msg.trim(),
				audience: "student",
				batchId: batchId || undefined,
			});
			setMsg("");
			addNotice({
				_id: `local-${Date.now()}`,
				title: typeConfig[type].label,
				message: msg.trim(),
				batchName: selectedBatch?.name || "All batches",
				createdAt: new Date().toISOString(),
			});
			refresh();
		} catch (err) {
			setError(err.message || "Failed to post.");
		} finally {
			setPosting(false);
		}
	};

	return (
		<div className="TeacherNotices-div-1">
			<div>
				<h1 className="TeacherNotices-h1-2">Class Broadcast Board</h1>
				<p className="TeacherNotices-p-3">
					Post announcements, share resources, and flag students
				</p>
			</div>

			<div className="TeacherNotices-div-4">
				{error && <p className="text-xs font-semibold text-red-600">{error}</p>}
				<div className="TeacherNotices-div-5">
					<select
						value={batchId}
						onChange={(e) => setBatchId(e.target.value)}
						className="TeacherNotices-select-6"
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
					<select
						value={type}
						onChange={(e) => setType(e.target.value)}
						className="TeacherNotices-select-6"
					>
						<option value="announcement">Announcement</option>
						<option value="resource">Resource Link</option>
						<option value="flag">Flag Student</option>
					</select>
				</div>
				<textarea
					rows={3}
					value={msg}
					onChange={(e) => setMsg(e.target.value)}
					placeholder={
						type === "resource"
							? "Paste Google Drive / GitHub link here..."
							: "Type your message to the batch..."
					}
					className="TeacherNotices-textarea-7"
				/>
				<button
					type="button"
					onClick={post}
					className="TeacherNotices-button-8"
				>
					<Send className="TeacherNotices-send-9" />
					{posting ? "Posting…" : `Post to ${selectedBatch?.name || "batch"}`}
				</button>
			</div>

			<div className="TeacherNotices-div-10">
				{notices.length === 0 && (
					<p className="TeacherNotices-p-16">No notices posted yet.</p>
				)}
				{notices.map((n) => {
					const inferredType =
						n.title === typeConfig.resource.label
							? "resource"
							: n.title === typeConfig.flag.label
								? "flag"
								: "announcement";
					const cfg = typeConfig[inferredType];
					return (
						<div key={n._id} className="TeacherNotices-div-4">
							<div className="TeacherNotices-div-11">
								<div
									className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.cls}`}
								>
									<cfg.icon className="TeacherNotices-send-9" />
								</div>
								<div className="TeacherNotices-div-12">
									<div className="TeacherNotices-div-13">
										<span className="TeacherNotices-span-14">
											{n.batchName || "All batches"}
										</span>
										<span
											className={`text-[10px] font-semibold ${cfg.cls.split(" ")[1]}`}
										>
											{cfg.label}
										</span>
										<span className="TeacherNotices-span-15">
											{timeAgo(n.publishedAt || n.createdAt)}
										</span>
									</div>
									<p className="TeacherNotices-p-16">{n.message}</p>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="TeacherNotices-div-17">
				<div className="TeacherNotices-div-18">
					<AlertTriangle className="TeacherNotices-alerttriangle-19" />
					<h3 className="TeacherNotices-h3-20">
						Flag Students for Admin Follow-up
					</h3>
				</div>
				<div className="TeacherNotices-div-21">
					<div className="TeacherNotices-div-23">
						<select
							value={flagBatchId}
							onChange={(e) => {
								setFlagBatchId(e.target.value);
								loadRoster(e.target.value);
							}}
							className="TeacherNotices-select-6"
						>
							<option value="">Select batch</option>
							{batches.map((b) => (
								<option key={b._id || b.id} value={b._id || b.id}>
									{b.name}
								</option>
							))}
						</select>
						<select
							value={flagStudentId}
							onChange={(e) => setFlagStudentId(e.target.value)}
							className="TeacherNotices-select-6"
						>
							<option value="">Select student</option>
							{students.map((s) => (
								<option key={s._id} value={s._id}>
									{s.name} ({s.rollNumber || "—"})
								</option>
							))}
						</select>
					</div>
					<textarea
						rows={2}
						value={flagReason}
						onChange={(e) => setFlagReason(e.target.value)}
						placeholder="Reason for flagging (e.g. 3 consecutive absences)…"
						className="TeacherNotices-textarea-7"
					/>
					<button
						type="button"
						onClick={flagStudent}
						disabled={flagging}
						className="TeacherNotices-button-28"
					>
						<Flag className="TeacherNotices-flag-29" />
						{flagging ? "Flagging…" : "Flag Student"}
					</button>
					{error && <p className="TeacherNotices-p-16">{error}</p>}
					{flags.length === 0 && (
						<p className="TeacherNotices-p-16">No students flagged yet.</p>
					)}
					{flags.map((f) => (
						<div key={f._id} className="TeacherNotices-div-22">
							<div className="TeacherNotices-div-23">
								<div className="TeacherNotices-div-24">
									{(f.studentName || "?")[0]}
								</div>
								<div>
									<p className="TeacherNotices-p-25">
										{f.studentName} {f.batchName ? `· ${f.batchName}` : ""}
									</p>
									<p className="TeacherNotices-p-26">
										{f.rollNumber || "—"} ·{" "}
										{f.status === "resolved" ? "Resolved" : "Open"}
									</p>
								</div>
							</div>
							<div className="TeacherNotices-div-23">
								<span className="TeacherNotices-span-27">{f.reason}</span>
								{f.status === "open" && (
									<button
										type="button"
										onClick={() =>
											portalApi.teacher
												.resolveFlag(f._id)
												.then(() => loadFlags())
												.catch(() => setError("Failed to resolve flag."))
										}
										className="TeacherNotices-button-28"
									>
										Resolve
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
