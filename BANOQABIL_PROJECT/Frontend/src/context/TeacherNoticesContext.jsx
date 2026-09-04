import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { portalApi } from "@/lib/api.js";

const TeacherNoticesContext = createContext({
	notices: [],
	refresh: () => {},
	addNotice: () => {},
});

export function TeacherNoticesProvider({ children }) {
	const [notices, setNotices] = useState([]);
	const [loaded, setLoaded] = useState(false);

	const refresh = useCallback(() => {
		portalApi.teacher
			.notices()
			.then((response) => {
				const list = response?.data?.data ?? response?.data ?? response ?? [];
				const serverList = Array.isArray(list) ? list : [];
				const serverIds = new Set(serverList.map((n) => n?._id));
				setNotices((prev) => {
					const localOnly = (prev || []).filter(
						(n) =>
							n?._id?.toString().startsWith("local-") &&
							!serverIds.has(n?._id),
					);
					return [...localOnly, ...serverList];
				});
			})
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (!loaded) {
			refresh();
			setLoaded(true);
		}
	}, [loaded, refresh]);

	const addNotice = useCallback((notice) => {
		setNotices((prev) => [notice, ...prev]);
	}, []);

	return (
		<TeacherNoticesContext.Provider value={{ notices, refresh, addNotice }}>
			{children}
		</TeacherNoticesContext.Provider>
	);
}

export function useTeacherNotices() {
	return useContext(TeacherNoticesContext);
}
