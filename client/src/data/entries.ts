import { useEffect, useState } from "preact/hooks";

import { DriverEntryIdData } from "../generated/DriverEntryIdData";
import { MatchEntryData } from "../generated/MatchEntryData";
import { MatchEntryIdData } from "../generated/MatchEntryIdData";
import { MatchEntryValue } from "../generated/MatchEntryValue";
import { PitEntryIdData } from "../generated/PitEntryIdData";
import { getImage } from "../images";

export const matchPrefix = "match-";
export const pitPrefix = "team-";
export const driverPrefix = "driver-";

export interface AnyEntryId {
	data: MatchEntryData;
}

/**
 * Hook to use data stored in local storage with a key.
 */
export function useEntries<T extends AnyEntryId>(
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

/**
 * Adds image data that was stored in indexed DB.
 */
export async function addImageData<T extends AnyEntryId>(
	entries: Array<T>,
): Promise<void> {
	for (const entry of entries) {
		for (const value of Object.values(entry.data.entries)) {
			if (value.type === "image") {
				for (const image of value.images) {
					// @ts-expect-error Again this is like bad and dumb but whatever lol
					const imageData = await getImage(image.image_uuid);
					// @ts-expect-error MY TYPESCRIPT BINDINGS ARE WRONG OWIEE!!!! -Papyrus from undertale
					image.image_data = [...new Uint8Array(imageData)];
				}
			}
		}
	}
}

/**
 * Get all match entires stored in local storage.
 * Note that these will be missing the image data.
 */
export function getAllMatchEntries(): Array<MatchEntryIdData> {
	return getEntries(matchPrefix);
}

/**
 * Get all pit entires stored in local storage.
 * Note that these will be missing the image data.
 */
export function getAllPitEntries(): Array<PitEntryIdData> {
	return getEntries(pitPrefix);
}

/**
 * Get all driver entires stored in local storage.
 * Note that these will be missing the image data.
 */
export function getAllDriverEntries(): Array<DriverEntryIdData> {
	return getEntries(driverPrefix);
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
function getEntries<T>(prefix: string): Array<T> {
	const entryArray = [];

	for (let entry = 0; entry < localStorage.length; entry++) {
		const key: string | null = localStorage.key(entry);
		if (key !== null && key.startsWith(prefix)) {
			const match_entry = JSON.parse(localStorage.getItem(key) ?? "") as T;
			entryArray.push(match_entry);
		}
	}

	return entryArray;
}
