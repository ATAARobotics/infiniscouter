import { useEffect, useState } from "preact/hooks";

import { MatchEntryData } from "../generated/MatchEntryData";
import { MatchEntryValue } from "../generated/MatchEntryValue";

/**
 * Hook to use data stored in local storage with a key.
 */
export function useEntries<T extends { data: MatchEntryData }>(
	scoutName: string | null,
	key: string | null,
	maker: (inner_data: MatchEntryData) => T,
): [
	Record<string, MatchEntryValue>,
	(id: string, value: MatchEntryValue | undefined) => void,
] {
	const [data, setData] = useState<Omit<MatchEntryData, "scout">>({
		entries: {},
		timestamp_ms: 0,
	});

	useEffect(() => {
		if (key && scoutName) {
			const saveData: T = maker({ ...data, scout: scoutName });
			localStorage.setItem(key, JSON.stringify(saveData));
		}
	}, [data, scoutName]);
	useEffect(() => {
		if (key) {
			const newData: T | null = JSON.parse(
				localStorage.getItem(key) ?? "null",
			);
			if (newData !== null) {
				setData(newData.data);
			} else {
				setData({
					entries: {},
					timestamp_ms: 0,
				});
			}
		}
	}, [key]);

	return [
		data.entries,
		(id, value) => {
			const newEntries = { ...data.entries };
			if (!value) {
				delete newEntries[id];
			} else {
				newEntries[id] = value;
			}
			setData({
				timestamp_ms: Date.now(),
				entries: newEntries,
			});
		},
	];
}
