import { useEffect, useState } from "preact/hooks";

import { DriverEntryIdData } from "../generated/DriverEntryIdData";
import { FullEntryData } from "../generated/FullEntryData";
import { MatchEntryIdData } from "../generated/MatchEntryIdData";
import { MatchEntryValue } from "../generated/MatchEntryValue";
import { PitEntryIdData } from "../generated/PitEntryIdData";
import { getImage } from "../images";

export const matchPrefix = "match-";
export const pitPrefix = "team-";
export const driverPrefix = "driver-";

export interface AnyEntryId {
	data: FullEntryData;
}

/**
 * Hook to use data stored in local storage with a key.
 */
export function useEntries<T extends AnyEntryId>(
	scoutName: string | null,
	year: number | undefined,
	eventCode: string | undefined,
	key: string | null,
	maker: (inner_data: FullEntryData) => T,
): [
	Record<string, MatchEntryValue>,
	(id: string, value: MatchEntryValue | undefined) => void,
] {
	const [data, setData] = useState<FullEntryData>({
		year: year ?? 0,
		event: eventCode ?? "",
		entries: {},
		timestamp_ms: 0,
	});
	const [changed, setChanged] = useState<boolean>(false);

	useEffect(() => {
		if (changed && key && scoutName && Object.keys(data.entries).length > 0) {
			const saveData: T = maker({ ...data });
			localStorage.setItem(key, JSON.stringify(saveData));
		}
	}, [data, scoutName]);
	useEffect(() => {
		if (key) {
			const newData: T | null = JSON.parse(
				localStorage.getItem(key) ?? "null",
			);
			if (newData !== null && newData.data.year === year && newData.data.event === eventCode) {
				setChanged(false);
				setData(newData.data);
			} else {
				setChanged(false);
				setData({
					year: year ?? 0,
					event: eventCode ?? "",
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
			setChanged(true);
			setData({
				year: year ?? 0,
				event: eventCode ?? "",
				entries: newEntries,
				timestamp_ms: 0,
			});
		},
	];
}

/**
 * Gets all image data that was stored in indexed DB for the given entries.
 */
export async function saveImageData<T extends AnyEntryId>(
	entries: Array<T>,
	getKey: (entry: T) => string,
): Promise<boolean> {
	for (const entry of entries) {
		for (const value of Object.values(entry.data.entries)) {
			if (value.type === "image") {
				for (const image of value.images) {
					if ((image as unknown as { local: true | undefined }).local) {
						console.log("Sending image..." + image.image_id);
						try {
							const imageData = await getImage(image.image_id);

							const response = await fetch("/api/images", {
								method: "PUT",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify([imageData]),
							});

							if (response.ok) {
								(
									image as unknown as { local: boolean | undefined }
								).local = false;
								localStorage.setItem(
									getKey(entry),
									JSON.stringify(entry),
								);
							}
						} catch {
							// ignore for now...
						}
					}
				}
			}
		}
	}

	// if (images.length === 0) {
	// 	return true;
	// }

	// const response = await fetch("/api/images", {
	// 	method: "PUT",
	// 	headers: { "Content-Type": "application/json" },
	// 	body: JSON.stringify(images),
	// });

	// if (response.ok) {
	// 	for (const entry of entries) {
	// 		let needToSave = false;
	// 		for (const value of Object.values(entry.data.entries)) {
	// 			if (value.type === "image") {
	// 				for (const image of value.images) {
	// 					(image as unknown as { local: boolean | undefined }).local =
	// 						false;
	// 				}
	// 				needToSave = true;
	// 			}
	// 		}

	// 		if (needToSave) {
	// 			localStorage.setItem(getKey(entry), JSON.stringify(entry));
	// 		}
	// 	}
	// }

	return true;
}

/**
 * Get all match entires stored in local storage.
 * Note that these will be missing the image data.
 */
export function getAllMatchEntries(year: number, eventCode: string): Array<MatchEntryIdData> {
	return getEntries(matchPrefix, year, eventCode);
}

/**
 * Get all pit entires stored in local storage.
 * Note that these will be missing the image data.
 */
export function getAllPitEntries(year: number, eventCode: string): Array<PitEntryIdData> {
	return getEntries(pitPrefix, year, eventCode);
}

/**
 * Get all driver entires stored in local storage.
 * Note that these will be missing the image data.
 */
export function getAllDriverEntries(year: number, eventCode: string): Array<DriverEntryIdData> {
	return getEntries(driverPrefix, year, eventCode);
}

/**
 * Get scout that scouted a team in a match (if there is scouting data for that match and team).
 */
export function getMatchScouts(matchId: number, teamId: number, year: number, eventCode: string): Array<string> {
	const matchEntry = getMatchEntry(matchId, teamId);

	if (!matchEntry || matchEntry.data.year !== year || matchEntry.data.event !== eventCode) {
		return [];
	}

	const scouts: Record<string, true> = {};

	for (const value of Object.values(matchEntry.data.entries)) {
		scouts[value.scout || "Unknown"] = true;
	}

	return Object.keys(scouts);
}

/**
 * Loads a single match entry from local storage.
 */
function getMatchEntry(
	matchId: number,
	teamId: number,
): MatchEntryIdData | null {
	return JSON.parse(
		localStorage.getItem(getMatchKey(matchId, teamId)) ?? "null",
	) as MatchEntryIdData;
}

/**
 * Get key used for a match entry.
 */
export function getMatchKey(
	matchId: string | number,
	teamId: string | number,
): string {
	return `${matchPrefix}-${matchId}-${teamId}`;
}

/**
 * Get scout that scouted a team in the pits (if there is scouting data for that team).
 */
export function getPitScouts(teamId: number, year: number, eventCode: string): Array<string> {
	const pitEntry = getPitEntry(teamId);

	if (!pitEntry || pitEntry.data.year !== year || pitEntry.data.event !== eventCode) {
		return [];
	}

	const scouts: Record<string, true> = {};

	for (const value of Object.values(pitEntry.data.entries)) {
		scouts[value.scout || "Unknown"] = true;
	}

	return Object.keys(scouts);
}

/**
 * Loads a single pit entry from local storage.
 */
function getPitEntry(teamId: number): PitEntryIdData | null {
	return JSON.parse(
		localStorage.getItem(getPitKey(teamId)) ?? "null",
	) as PitEntryIdData;
}

/**
 * Get key used for a match entry.
 */
export function getPitKey(teamId: string | number): string {
	return `${pitPrefix}-${teamId}`;
}

/**
 * Get key used for a match entry.
 */
export function getDriverKey(
	matchId: string | number,
	teamId: string | number,
): string {
	return `${driverPrefix}-${matchId}-${teamId}`;
}

/**
 * Save the given match entry to local storage.
 */
export function saveMatch(match_entry: MatchEntryIdData): void {
	localStorage.setItem(
		getMatchKey(match_entry.match_id, match_entry.team_id),
		JSON.stringify(match_entry),
	);
}

/**
 * Save the given pit entry to local storage.
 */
export function savePit(pit_entry: PitEntryIdData): void {
	localStorage.setItem(
		getPitKey(pit_entry.team_id),
		JSON.stringify(pit_entry),
	);
}

/**
 * Save the given driver entry to local storage.
 */
export function saveDriver(driver_entry: DriverEntryIdData): void {
	localStorage.setItem(
		getDriverKey(driver_entry.match_id, driver_entry.team_id),
		JSON.stringify(driver_entry),
	);
}

/**
 * Get all data stored in local storage with the given prefix.
 */
function getEntries<T extends AnyEntryId>(prefix: string, year: number, eventCode: string): Array<T> {
	const entryArray: T[] = [];

	for (let entry = 0; entry < localStorage.length; entry++) {
		const key: string | null = localStorage.key(entry);
		if (key !== null && key.startsWith(prefix)) {
			const match_entry = JSON.parse(localStorage.getItem(key) ?? "") as T;
			if (match_entry.data.year === year && match_entry.data.event === eventCode) {
				entryArray.push(match_entry);
			}
		}
	}

	return entryArray;
}
