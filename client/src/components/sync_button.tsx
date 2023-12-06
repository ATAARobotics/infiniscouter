import * as React from "react";
import Box from "@mui/joy/Box";
import Drawer from "@mui/joy/Drawer";
import Button from "@mui/joy/Button";
import List from "@mui/joy/List";
import Divider from "@mui/joy/Divider";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";

export function SyncButton() {
	const [loadingState, setLoadingState] = React.useState<"saved" | "saving">(
		"saved",
	);
	async function doSync() {
		setLoadingState("saving");
		const response = await fetch("/api/event/matches");
		localStorage.setItem("matchList", await response.text());
		const matchArray = [];
		for (let entry = 0; entry < localStorage.length; entry++) {
			const key: string | null = localStorage.key(entry);
			if (key !== null && key.startsWith("match-")) {
				matchArray.push(JSON.parse(localStorage.getItem(key)) as MatchEntryIdData);
			}
		}
		await fetch("/api/match_entry/data/all", {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(matchArray)});
		setLoadingState("saved");
	}

	return (
		<Button loading={loadingState === "saving"} onClick={doSync}>
			Save Data
		</Button>
	);
}
