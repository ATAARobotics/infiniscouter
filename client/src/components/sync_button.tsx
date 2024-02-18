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
import { DriverEntryIdData } from "../generated/DriverEntryIdData";
import { MatchEntryIdData } from "../generated/MatchEntryIdData";
import { PitEntryIdData } from "../generated/PitEntryIdData";
import { getImage } from "../images";

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
		setLoadingState("saving");

		const matchSaveTime = Date.now();
		const matchArray = [];
		for (let entry = 0; entry < localStorage.length; entry++) {
			const key: string | null = localStorage.key(entry);
			if (key !== null && key.startsWith("match-")) {
				const match_entry = JSON.parse(
					localStorage.getItem(key) ?? "",
				) as MatchEntryIdData;
				if (match_entry.data.timestamp_ms < lastMatchSave) {
					continue;
				}
				for (const value of Object.values(match_entry.data.entries)) {
					if (value.type === "image") {
						for (const image of value.images) {
							// @ts-expect-error Again this is like bad and dumb but whatever lol
							const imageData = await getImage(image.image_uuid);
							// @ts-expect-error MY TYPESCRIPT BINDINGS ARE WRONG OWIEE!!!! -Papyrus from undertale
							image.image_data = [...new Uint8Array(imageData)];
						}
					}
				}
				matchArray.push(match_entry);
			}
		}
		if (matchArray.length > 0) {
			await fetch("/api/match_entry/data/all", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(matchArray),
			}).then((response) => {
				if (response.ok) {
					setLastMatchSave(matchSaveTime);
				}
			});
		}

		const pitSaveTime = Date.now();
		const pitArray = [];
		for (let entry = 0; entry < localStorage.length; entry++) {
			const key: string | null = localStorage.key(entry);
			if (key !== null && key.startsWith("team-")) {
				const pit_entry = JSON.parse(
					localStorage.getItem(key) ?? "",
				) as PitEntryIdData;
				if (pit_entry.data.timestamp_ms < lastPitSave) {
					continue;
				}
				for (const value of Object.values(pit_entry.data.entries)) {
					if (value.type === "image") {
						for (const image of value.images) {
							// @ts-expect-error Again this is like bad and dumb but whatever lol
							const imageData = await getImage(image.image_uuid);
							// @ts-expect-error MY TYPESCRIPT BINDINGS ARE WRONG OWIEE!!!! -Papyrus from undertale
							image.image_data = [...new Uint8Array(imageData)];
						}
					}
				}
				pitArray.push(pit_entry);
			}
		}
		if (pitArray.length > 0) {
			await fetch("/api/pit_entry/data/all", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(pitArray),
			}).then((response) => {
				if (response.ok) {
					setLastPitSave(pitSaveTime);
				}
			});
		}

		const driverSaveTime = Date.now();
		const driverArray = [];
		for (let entry = 0; entry < localStorage.length; entry++) {
			const key: string | null = localStorage.key(entry);
			if (key !== null && key.startsWith("driver-")) {
				const driver_entry = JSON.parse(
					localStorage.getItem(key) ?? "",
				) as DriverEntryIdData;
				if (driver_entry.data.timestamp_ms < lastDriverSave) {
					continue;
				}
				for (const value of Object.values(driver_entry.data.entries)) {
					if (value.type === "image") {
						for (const image of value.images) {
							// @ts-expect-error Again this is like bad and dumb but whatever lol
							const imageData = await getImage(image.image_uuid);
							// @ts-expect-error MY TYPESCRIPT BINDINGS ARE WRONG OWIEE!!!! -Papyrus from undertale
							image.image_data = [...new Uint8Array(imageData)];
						}
					}
				}
				driverArray.push(driver_entry);
			}
		}
		if (driverArray.length > 0) {
			await fetch("/api/driver_entry/data/all", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(driverArray),
			}).then((response) => {
				if (response.ok) {
					setLastDriverSave(driverSaveTime);
				}
			});
		}

		setLoadingState("saved");
	}

	return (
		<Button loading={loadingState === "saving"} onClick={doSync}>
			Save Data
		</Button>
	);
}
