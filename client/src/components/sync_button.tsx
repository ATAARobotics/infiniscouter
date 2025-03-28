import { Button } from "@mui/joy";
import { useAtom, useSetAtom } from "jotai/react";
import { useState } from "preact/hooks";
import { EventInfo } from "src/generated/EventInfo";

import {
	driverFieldsAtom,
	lastDriverSaveAtom,
	lastMatchSaveAtom,
	lastPitSaveAtom,
	matchFieldsAtom,
	matchListAtom,
	pitFieldsAtom,
} from "../data/atoms";
import {
	getAllDriverEntries,
	getAllMatchEntries,
	getAllPitEntries,
	getDriverKey,
	getMatchKey,
	getPitKey,
	saveDriver as saveDriverEntry,
	saveImageData,
	saveMatch as saveMatchEntry,
	savePit as savePitEntry,
} from "../data/entries";
import { DriverEntryIdData } from "../generated/DriverEntryIdData";
import { DriverEntryTimedId } from "../generated/DriverEntryTimedId";
import { MatchEntryIdData } from "../generated/MatchEntryIdData";
import { MatchEntryTimedId } from "../generated/MatchEntryTimedId";
import { PitEntryIdData } from "../generated/PitEntryIdData";
import { PitEntryTimedId } from "../generated/PitEntryTimedId";

/**
 *	A button that when clicked syncs important data from/to localStorage to/from the server
 *	@returns the component
 */
export function SyncButton() {
	const [loadingState, setLoadingState] = useState<"saved" | "saving">(
		"saved",
	);
	const [lastMatchSave, setLastMatchSave] = useAtom(lastMatchSaveAtom);
	const [lastPitSave, setLastPitSave] = useAtom(lastPitSaveAtom);
	const [lastDriverSave, setLastDriverSave] = useAtom(lastDriverSaveAtom);
	const setMatchList = useSetAtom(matchListAtom);
	const setMatchFields = useSetAtom(matchFieldsAtom);
	const setDriverFields = useSetAtom(driverFieldsAtom);
	const setPitFields = useSetAtom(pitFieldsAtom);

	/**
	 * Sync data by loading the field lists, saving all new entries to the
	 * server, loading all any entries that we do not have locally and then
	 * getting the latest match list.
	 */
	async function doSync() {
		if (loadingState === "saving") {
			return;
		}
		setLoadingState("saving");

		try {
			await fetch("/api/driver_entry/fields")
				.then((driverFieldsResponse) => driverFieldsResponse.json())
				.then((driverFields) => {
					setDriverFields(driverFields);
				});
			await fetch("/api/match_entry/fields")
				.then((matchFieldsResponse) => matchFieldsResponse.json())
				.then((matchFields) => {
					setMatchFields(matchFields);
				});
			await fetch("/api/pit_entry/fields")
				.then((pitFieldsResponse) => pitFieldsResponse.json())
				.then((pitFields) => {
					setPitFields(pitFields);
				});

			const matchList = await fetch("/api/event/matches")
				.then((matchesResponse) => matchesResponse.json()) as EventInfo;
			setMatchList(matchList);

			const matchSaveTime = Date.now();
			const matchArray = getAllMatchEntries(matchList.year, matchList.event);
			const matchesToSave = matchArray.filter(
				(entry) =>
					Object.values(entry.data.entries).findIndex(
						(value) => value.timestamp_ms > lastMatchSave,
					) >= 0,
			);
			if (matchesToSave.length > 0) {
				await saveImageData(matchesToSave, (matchEntry) =>
					getMatchKey(matchEntry.match_id, matchEntry.team_id),
				);

				await fetch("/api/match_entry/data/all", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(matchesToSave),
				}).then((response) => {
					if (response.ok) {
						setLastMatchSave(matchSaveTime);
					}
				});
			} else {
				setLastMatchSave(matchSaveTime);
			}

			const pitSaveTime = Date.now();
			const pitArray = getAllPitEntries(matchList.year, matchList.event);
			const pitEntriesToSave = pitArray.filter(
				(entry) =>
					Object.values(entry.data.entries).findIndex(
						(value) => value.timestamp_ms > lastPitSave,
					) >= 0,
			);
			if (pitEntriesToSave.length > 0) {
				await saveImageData(pitEntriesToSave, (pitEntry) =>
					getPitKey(pitEntry.team_id),
				);

				await fetch("/api/pit_entry/data/all", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(pitEntriesToSave),
				}).then((response) => {
					if (response.ok) {
						setLastPitSave(pitSaveTime);
					}
				});
			} else {
				setLastPitSave(pitSaveTime);
			}

			const driverSaveTime = Date.now();
			const driverArray = getAllDriverEntries(matchList.year, matchList.event);
			const driverEntriesToSave = driverArray.filter(
				(entry) =>
					Object.values(entry.data.entries).findIndex(
						(value) => value.timestamp_ms > lastDriverSave,
					) >= 0,
			);
			if (driverEntriesToSave.length > 0) {
				await saveImageData(driverEntriesToSave, (driverEntry) =>
					getDriverKey(driverEntry.match_id, driverEntry.team_id),
				);

				fetch("/api/driver_entry/data/all", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(driverEntriesToSave),
				}).then((response) => {
					if (response.ok) {
						setLastDriverSave(driverSaveTime);
					}
				});
			} else {
				setLastDriverSave(driverSaveTime);
			}

			const knownMatchEntries = matchArray
				.map<MatchEntryTimedId>((entry) => ({
					match_id: entry.match_id,
					team_id: entry.team_id,
					timestamp_ms: Object.values(entry.data.entries).reduce(
						(max_timestamp, value) =>
							Math.max(max_timestamp, value.timestamp_ms ?? 0),
						0,
					),
				}));
			await fetch("/api/match_entry/data/filtered", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(knownMatchEntries),
			})
				.then(
					(response) => response.json() as Promise<Array<MatchEntryIdData>>,
				)
				.then((newMatches) => {
					for (const match_entry of newMatches) {
						saveMatchEntry(match_entry);
					}
				});

			const knownPitEntries = pitArray
				.filter((entry) => entry.data.year === matchList.year
					&& entry.data.event === matchList.event)
                .map<PitEntryTimedId>((entry) => ({
                    team_id: entry.team_id,
                    timestamp_ms: Object.values(entry.data.entries).reduce(
                        (max_timestamp, value) =>
                            Math.max(max_timestamp, value.timestamp_ms ?? 0),
                        0,
                    ),
                }));
			await fetch("/api/pit_entry/data/filtered", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(knownPitEntries),
			})
				.then((response) => response.json() as Promise<Array<PitEntryIdData>>)
				.then((newPitEntries) => {
					for (const pit_entry of newPitEntries) {
						savePitEntry(pit_entry);
					}
				});

			const knownDriveres = driverArray
				.filter((entry) => entry.data.year === matchList.year
					&& entry.data.event === matchList.event)
                .map<DriverEntryTimedId>((entry) => ({
                    match_id: entry.match_id,
                    team_id: entry.team_id,
                    timestamp_ms: Object.values(entry.data.entries).reduce(
                        (max_timestamp, value) =>
                            Math.max(max_timestamp, value.timestamp_ms ?? 0),
                        0,
                    ),
                }));
			await fetch("/api/driver_entry/data/filtered", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(knownDriveres),
			})
				.then(
					(response) => response.json() as Promise<Array<DriverEntryIdData>>,
				)
				.then((newDriveres) => {
					for (const driver_entry of newDriveres) {
						saveDriverEntry(driver_entry);
					}
				});
		} catch(error) {
			console.error("Failed to save data.", error);
		} finally {
			setLoadingState("saved");
		}
	}

	return (
		<Button loading={loadingState === "saving"} onClick={doSync}>
			Save Data
		</Button>
	);
}
