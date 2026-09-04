import {
	BarChart3,
	CalendarCheck,
	ClipboardList,
	Gauge,
	LayoutDashboard,
	LogOut,
	Megaphone,
	Menu,
	Shield,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { clearAuthSession, getCurrentUser } from "@/lib/api.js";
import "./TeacherLayout.css";

const navItems = [
	{ label: "Dashboard", page: "teacher-dashboard", icon: LayoutDashboard },
	{ label: "Attendance", page: "teacher-attendance", icon: CalendarCheck },
	{ label: "Assignments", page: "teacher-assignments", icon: ClipboardList },
	{ label: "Gradebook", page: "teacher-gradebook", icon: BarChart3 },
	{ label: "Performance", page: "teacher-performance", icon: Gauge },
	{ label: "Notices", page: "teacher-notices", icon: Megaphone },
];

const initials = (name = "Teacher") =>
	name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

export default function TeacherLayout({ children, currentPage, navigate }) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const user = getCurrentUser() || {};
	const displayName = user.name || "Teacher";
	const badge = useMemo(() => initials(displayName), [displayName]);
	const signOut = () => {
		clearAuthSession();
		navigate("landing");
	};

	const SidebarContent = () => (
		<div className="TeacherLayout-div-1">
			<div className="TeacherLayout-div-2">
				<div className="TeacherLayout-div-3">
					<img
						src="/logo.png"
						alt="Bano Qabil"
						className="TeacherLayout-logo-4"
					/>
					<div>
						<span className="TeacherLayout-span-6">Bano Qabil</span>
						<span className="TeacherLayout-span-7">Teacher Portal</span>
					</div>
				</div>
			</div>

			<nav className="TeacherLayout-nav-8">
				<p className="TeacherLayout-p-9">CLASSROOM</p>
				{navItems.map((item) => {
					const active = currentPage === item.page;
					return (
						<button
							type="button"
							key={item.page}
							onClick={() => {
								navigate(item.page);
								setSidebarOpen(false);
							}}
							className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all ${
								active
									? "bg-teal-600 text-white shadow-lg shadow-teal-600/20"
									: "text-slate-400 hover:text-white hover:bg-slate-700/60"
							}`}
						>
							<item.icon className="TeacherLayout-itemicon-10" />
							{item.label}
						</button>
					);
				})}
			</nav>

			<div className="TeacherLayout-div-12">
				<div className="TeacherLayout-div-13">
					<div className="TeacherLayout-div-14">{badge}</div>
					<div className="TeacherLayout-div-15">
						<p className="TeacherLayout-p-16">{displayName}</p>
						<p className="TeacherLayout-p-17">
							{user.email || "Teacher account"}
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={signOut}
					className="TeacherLayout-button-18"
				>
					<LogOut className="TeacherLayout-logout-19" />
					Sign Out
				</button>
			</div>
		</div>
	);

	return (
		<div className="TeacherLayout-div-20">
			<aside className="TeacherLayout-aside-21">
				<SidebarContent />
			</aside>

			{sidebarOpen && (
				<div className="TeacherLayout-div-22">
					<div className="TeacherLayout-div-23">
						<div className="TeacherLayout-div-24">
							<button type="button" onClick={() => setSidebarOpen(false)}>
								<X className="TeacherLayout-x-25" />
							</button>
						</div>
						<SidebarContent />
					</div>
					<div
						className="TeacherLayout-div-26"
						onClick={() => setSidebarOpen(false)}
					/>
				</div>
			)}

			<div className="TeacherLayout-div-27">
				<div className="TeacherLayout-div-28">
					<button type="button" onClick={() => setSidebarOpen(true)}>
						<Menu className="TeacherLayout-menu-29" />
					</button>
					<div className="TeacherLayout-div-3">
						<div className="TeacherLayout-div-30">
							<Shield className="TeacherLayout-shield-31" />
						</div>
						<span className="TeacherLayout-span-32">Teacher Portal</span>
					</div>
				</div>

				<main className="TeacherLayout-main-33">{children}</main>
			</div>
		</div>
	);
}
