import { Building2, Crown, Plus, Trash2, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog.jsx";
import EmptyState from "@/components/ui/EmptyState.jsx";
import FormField, { inputCls } from "@/components/ui/FormField.jsx";
import LoadingSpinner from "@/components/ui/LoadingSpinner.jsx";
import Modal from "@/components/ui/Modal.jsx";
import PageHeader from "@/components/ui/PageHeader.jsx";
import { useToast } from "@/components/ui/Toast.jsx";
import { catalogApi, getCurrentUser, studentApi, userApi } from "@/lib/api.js";
import "./AdminUsers.css";

const readableError = (error) =>
	Array.isArray(error.details) && error.details.length
		? error.details.join(", ")
		: error.message;

const emptyForm = {
	name: "",
	email: "",
	password: "",
	role: "campus_admin",
	campus: "",
	phone: "",
	specialization: "",
};

const roleMeta = {
	admin: { label: "Super Admin", cls: "super" },
	campus_admin: { label: "Campus Admin", cls: "campus" },
	teacher: { label: "Teacher", cls: "other" },
	student: { label: "Student", cls: "other" },
};

export default function AdminUsers() {
	const toast = useToast();
	const currentUser = getCurrentUser();
	const [users, setUsers] = useState([]);
	const [campuses, setCampuses] = useState([]);
	const [students, setStudents] = useState([]);
	const [studentsLoading, setStudentsLoading] = useState(false);
	const [loading, setLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [form, setForm] = useState(emptyForm);
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState(null);

	const loadStudents = useCallback(async () => {
		setStudentsLoading(true);
		try {
			const res = await studentApi.list({ limit: 100, page: 1 });
			setStudents((res.data || []).filter((s) => s.name && s.email));
		} catch {
			setStudents([]);
		} finally {
			setStudentsLoading(false);
		}
	}, []);

	const loadAll = useCallback(async () => {
		try {
			const [userRes, campusRes] = await Promise.all([
				userApi.list(),
				catalogApi.campuses.list(),
			]);
			setUsers(userRes.data || []);
			setCampuses(campusRes.data || []);
		} catch (error) {
			toast.error(readableError(error));
		} finally {
			setLoading(false);
		}
	}, [toast]);

	useEffect(() => {
		loadAll();
	}, [loadAll]);

	const openCreate = () => {
		setForm(emptyForm);
		setErrors({});
		setStudents([]);
		setStudentsLoading(false);
		setModalOpen(true);
	};

	const handleRoleChange = (role) => {
		if (role === "student" && students.length === 0) loadStudents();
		setForm({
			...form,
			role,
			campus: ["campus_admin", "teacher"].includes(role) ? form.campus : "",
			phone: role === "teacher" ? form.phone : "",
			specialization: role === "teacher" ? form.specialization : "",
		});
	};

	const handleStudentSelect = (id) => {
		const student = students.find((s) => s._id === id) || null;
		setForm((prev) => ({
			...prev,
			name: student?.name || "",
			email: student?.email || "",
			campus: "",
		}));
	};

	const handleSave = async () => {
		setSaving(true);
		setErrors({});
		try {
			await userApi.create(form);
			toast.success("User created successfully");
			setModalOpen(false);
			loadAll();
		} catch (error) {
			toast.error(readableError(error));
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		try {
			await userApi.remove(deleteTarget._id);
			toast.success("User deleted successfully");
			setDeleteTarget(null);
			loadAll();
		} catch (error) {
			toast.error(readableError(error));
		}
	};

	return (
		<div className="AdminUsers-div-1">
			<PageHeader
				title="Manage Users"
				subtitle="Create admin, teacher, and student accounts and manage portal access."
				action={
					<button type = 'button' onClick={openCreate} className="AdminUsers-button-2">
						<Plus className="AdminUsers-plus-3" /> New User
					</button>
				}
			/>

			{loading ? (
				<LoadingSpinner label="Loading users..." />
			) : users.length === 0 ? (
				<EmptyState icon={UsersRound} message="No users found." />
			) : (
				<div className="AdminUsers-div-5">
					<div className="AdminUsers-div-6">
						<table className="AdminUsers-table-7">
							<thead>
								<tr className="AdminUsers-tr-8">
									{["User", "Role", "Campus", "Actions"].map((h) => (
										<th key={h} className="AdminUsers-th-9">
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="AdminUsers-tbody-10">
								{users.map((u) => {
									const meta = roleMeta[u.role] || {
										label: u.role,
										cls: "other",
									};
									return (
										<tr key={u._id} className="AdminUsers-tr-11">
											<td className="AdminUsers-td-12">
												<div className="AdminUsers-div-13">
													<div className="AdminUsers-div-14">
														{(u.name || "?")[0].toUpperCase()}
													</div>
													<div>
														<p className="AdminUsers-p-15">{u.name}</p>
														<p className="AdminUsers-p-16">{u.email}</p>
													</div>
												</div>
											</td>
											<td className="AdminUsers-td-12">
												<span
													className={`AdminUsers-role-badge AdminUsers-role-${meta.cls}`}
												>
													{meta.cls === "super" && (
														<Crown className="AdminUsers-crown-17" />
													)}
													{meta.label}
												</span>
											</td>
											<td className="AdminUsers-td-12">
												{u.campus ? (
													<span className="AdminUsers-campus-badge">
														<Building2 className="AdminUsers-building-18" />
														{u.campus}
													</span>
												) : (
													<span className="AdminUsers-dash">—</span>
												)}
											</td>
											<td className="AdminUsers-td-12">
												{currentUser?._id !== u._id ? (
													<button
													type="button"
														onClick={() => setDeleteTarget(u)}
														className="AdminUsers-button-delete"
														title="Delete"
													>
														<Trash2 className="AdminUsers-trash-19" />
													</button>
												) : (
													<span className="AdminUsers-you-badge">You</span>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			<Modal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				title="New User"
				icon={UsersRound}
				footer={
					<>
						<button type = 'button'
							onClick={() => setModalOpen(false)}
							className="AdminUsers-button-cancel"
						>
							Cancel
						</button>
						<button   type = 'button'
							onClick={handleSave}
							disabled={saving}
							className="AdminUsers-button-save"
						>
							{saving ? "Saving..." : "Create User"}
						</button>
					</>
				}
			>
				<div className="AdminUsers-form-grid">
					<FormField label="Full Name" required error={errors.name}>
						<input
							className={inputCls}
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							placeholder="e.g. Ayesha Raza"
						/>
					</FormField>
					<FormField label="Email" required error={errors.email}>
						<input
							type="email"
							className={inputCls}
							value={form.email}
							onChange={(e) => setForm({ ...form, email: e.target.value })}
							placeholder="admin@banoquabil.com"
						/>
					</FormField>
					<FormField label="Password" required error={errors.password}>
						<input
							type="password"
							className={inputCls}
							value={form.password}
							onChange={(e) => setForm({ ...form, password: e.target.value })}
							placeholder="••••••••"
						/>
					</FormField>
					<FormField label="Role" required error={errors.role}>
						<select
							className={inputCls}
							value={form.role}
							onChange={(e) => handleRoleChange(e.target.value)}
						>
							<option value="campus_admin">Campus Admin</option>
							<option value="teacher">Teacher</option>
							<option value="student">Student</option>
							<option value="admin">Super Admin</option>
						</select>
					</FormField>
					{form.role === "student" && (
						<FormField label="Enrolled Student" required error={errors.name}>
							<select
								className={inputCls}
								value={students.find((s) => s.email === form.email)?._id || ""}
								onChange={(e) => handleStudentSelect(e.target.value)}
								disabled={studentsLoading}
							>
								<option value="">
									{studentsLoading ? "Loading students..." : "Select student..."}
								</option>
								{students.map((s) => (
									<option key={s._id} value={s._id}>
										{s.name}
										{s.rollNumber ? ` — ${s.rollNumber}` : ""}
										{s.email ? ` (${s.email})` : ""}
									</option>
								))}
							</select>
							<p className="AdminUsers-hint">
								{students.length === 0
									? "No students with an email address were found. You can still type the student's name and email manually below."
									: "Picking a student auto-fills their name and email so their student portal loads the correct data."}
							</p>
						</FormField>
					)}
					{form.role === "teacher" && (
						<>
							<FormField label="Phone" required error={errors.phone}>
								<input
									className={inputCls}
									value={form.phone}
									onChange={(e) => setForm({ ...form, phone: e.target.value })}
									placeholder="0300-1234567"
								/>
							</FormField>
							<FormField
								label="Specialization"
								required
								error={errors.specialization}
							>
								<input
									className={inputCls}
									value={form.specialization}
									onChange={(e) =>
										setForm({ ...form, specialization: e.target.value })
									}
									placeholder="e.g. Web Development"
								/>
							</FormField>
						</>
					)}
					{["campus_admin", "teacher"].includes(form.role) && (
						<FormField
							label="Campus"
							required={form.role === "campus_admin"}
							error={errors.campus}
						>
							<select
								className={inputCls}
								value={form.campus}
								onChange={(e) => setForm({ ...form, campus: e.target.value })}
							>
								<option value="">Select campus...</option>
								{campuses.map((c) => (
									<option key={c._id} value={c.name}>
										{c.name}
									</option>
								))}
							</select>
						</FormField>
					)}
				</div>
			</Modal>

			<ConfirmDialog
				open={!!deleteTarget}
				title="Delete User"
				message={`Are you sure you want to delete ${deleteTarget?.name}'s account? This cannot be undone.`}
				onConfirm={handleDelete}
				onCancel={() => setDeleteTarget(null)}
			/>
		</div>
	);
}
