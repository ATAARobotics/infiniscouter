import { Button } from "@mui/joy";
import { useAtom, useSetAtom } from "jotai/react";
import { useEffect, useState } from "preact/hooks";

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
	addImageData,
	getAllDriverEntries,
	getAllMatchEntries,
	getAllPitEntries,
	saveDriver as saveDriverEntry,
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

	useEffect(() => {
		const controller = new AbortController();

		fetch("/api/event/matches", { signal: controller.signal })
			.then((matchesResponse) => matchesResponse.json())
			.then((matchList) => {
				setMatchList(matchList);
			});
		fetch("/api/driver_entry/fields", { signal: controller.signal })
			.then((driverFieldsResponse) => driverFieldsResponse.json())
			.then((driverFields) => {
				setDriverFields(driverFields);
			});
		fetch("/api/match_entry/fields", { signal: controller.signal })
			.then((matchFieldsResponse) => matchFieldsResponse.json())
			.then((matchFields) => {
				setMatchFields(matchFields);
			});
		fetch("/api/pit_entry/fields", { signal: controller.signal })
			.then((pitFieldsResponse) => pitFieldsResponse.json())
			.then((pitFields) => {
				setPitFields(pitFields);
			});

		return () => controller.abort();
	}, []);

	/**
	 * Sync data by loading event and game info from the server, sending local data, and fetching remote data.
	 */
	async function doSync() {
		if (loadingState === "saving") {
			return;
		}
		setLoadingState("saving");

		const matchSaveTime = Date.now();
		const matchArray = getAllMatchEntries();
		const matchesToSave = matchArray.filter(
			(entry) => entry.data.timestamp_ms > lastMatchSave,
		);
		addImageData(matchesToSave);
		if (matchesToSave.length > 0) {
			await fetch("/api/match_entry/data/all", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(matchesToSave),
			}).then((response) => {
				if (response.ok) {
					setLastMatchSave(matchSaveTime);
				}
			});
		}

		const pitSaveTime = Date.now();
		const pitArray = getAllPitEntries();
		const pitEntriesToSave = pitArray.filter(
			(entry) => entry.data.timestamp_ms > lastPitSave,
		);
		addImageData(pitEntriesToSave);
		if (pitEntriesToSave.length > 0) {
			await fetch("/api/pit_entry/data/all", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(pitEntriesToSave),
			}).then((response) => {
				if (response.ok) {
					setLastPitSave(pitSaveTime);
				}
			});
		}

		const driverSaveTime = Date.now();
		const driverArray = getAllDriverEntries();
		const driverEntriesToSave = driverArray.filter(
			(entry) => entry.data.timestamp_ms > lastDriverSave,
		);
		addImageData(driverEntriesToSave);
		if (driverEntriesToSave.length > 0) {
			await fetch("/api/driver_entry/data/all", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(driverEntriesToSave),
			}).then((response) => {
				if (response.ok) {
					setLastDriverSave(driverSaveTime);
				}
			});
		}

		const knownMatchEntries = matchArray.map<MatchEntryTimedId>((entry) => ({
			match_id: entry.match_id,
			team_id: entry.team_id,
			timestamp_ms: entry.data.timestamp_ms,
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

		const knownPitEntries = pitArray.map<PitEntryTimedId>((entry) => ({
			team_id: entry.team_id,
			timestamp_ms: entry.data.timestamp_ms,
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

		const knownDriveres = driverArray.map<DriverEntryTimedId>((entry) => ({
			match_id: entry.match_id,
			team_id: entry.team_id,
			timestamp_ms: entry.data.timestamp_ms,
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

		setLoadingState("saved");
	}

	return (
		<Button loading={loadingState === "saving"} onClick={doSync}>
			Save Data
		</Button>
	);
}
