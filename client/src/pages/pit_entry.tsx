import { Autocomplete, Box, Typography } from "@mui/joy";
import { useAtomValue } from "jotai/react";
import { useState } from "preact/hooks";

import { MatchPage } from "../components/entry_components";
import { Navbar } from "../components/navbar";
import { ScoutNameRequired } from "../components/scout_name_required";
import { SyncRequired } from "../components/sync_required";
import { matchListAtom, pitFieldsAtom, scoutNameAtom } from "../data/atoms";
import { getPitKey, useEntries } from "../data/entries";
import { PitEntryIdData } from "../generated/PitEntryIdData";

export interface PitEntryProps {
	team?: number;
}

/**
 * The pit scouting entry page component.
 */
export function PitEntry(props: PitEntryProps) {
	const [teamId, setTeamId] = useState<number | undefined>(props.team);

	const scoutName = useAtomValue(scoutNameAtom);
	const matchList = useAtomValue(matchListAtom);
	const fields = useAtomValue(pitFieldsAtom);

	const [dataEntries, setEntry] = useEntries<PitEntryIdData>(
		scoutName,
		matchList?.year,
		matchList?.event,
		teamId ? getPitKey(teamId) : null,
		(data) => ({
			team_id: teamId?.toString() ?? "",
			data,
		}),
	);

	if (!scoutName) {
		return <ScoutNameRequired></ScoutNameRequired>;
	}
	if (!matchList || !fields) {
		return <SyncRequired></SyncRequired>;
	}

	return (
		<Box>
			<Navbar title="Pit Entry" />
			<Box>
				{props.team ? (
					<>
						<Typography level="h2">
							{props.team} {matchList.team_infos[props.team].name}
						</Typography>
						<p>
							Click <a href="/pit_entry">here</a> to scout a different
							team.
						</p>
					</>
				) : (
					<Autocomplete
						placeholder={"Team Number"}
						options={Object.values(matchList.team_infos).map((team) => {
							return {
								label: `${team.name} (${team.num})`,
								num: team.num,
							};
						})}
						onChange={(_ev, value) => {
							setTeamId(value?.num ?? 0);
						}}
						isOptionEqualToValue={(a, b) => a.num === b.num}
					/>
				)}
				{teamId &&
					fields.pages.map((page) => (
						<MatchPage
							scout={scoutName}
							page={page}
							entries={fields.entries}
							setEntry={setEntry}
							allEntries={dataEntries}
						></MatchPage>
					))}
			</Box>
		</Box>
	);
}
