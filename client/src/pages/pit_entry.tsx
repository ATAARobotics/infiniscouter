import { Autocomplete, Box } from "@mui/joy";
import { useAtomValue } from "jotai/react";
import { useState } from "preact/hooks";

import { MatchPage } from "../components/entry_components";
import { LoadIndicator } from "../components/load_indicator";
import { ScoutNameRequired } from "../components/scout_name_required";
import { SyncRequired } from "../components/sync_required";
import { matchListAtom, pitFieldsAtom, scoutNameAtom } from "../data/atoms";
import { getPitKey, useEntries } from "../data/entries";
import { PitEntryIdData } from "../generated/PitEntryIdData";

/**
 * The pit scouting entry page component.
 */
export function PitEntry() {
	const [teamId, setTeamId] = useState<number>();

	const scoutName = useAtomValue(scoutNameAtom);
	const matchList = useAtomValue(matchListAtom);
	const fields = useAtomValue(pitFieldsAtom);

	const [dataEntries, setEntry] = useEntries<PitEntryIdData>(
		scoutName,
		teamId ? getPitKey(teamId) : null,
		(data) => ({
			team_id: teamId?.toString() ?? "",
			data,
		}),
	);

	if (!scoutName) {
		return <ScoutNameRequired></ScoutNameRequired>;
	}
	if (!matchList) {
		return <SyncRequired></SyncRequired>;
	}

	return (
		<Box>
			<h1>Pit Entry</h1>
			<Box>
				<Autocomplete
					placeholder={"Team Number"}
					options={Object.values(matchList.team_infos).map((team) => {
						return { label: `${team.name} (${team.num})`, num: team.num };
					})}
					onChange={(_ev, value) => {
						setTeamId(value?.num ?? 0);
					}}
				/>
				{teamId !== undefined &&
					(fields ? (
						fields.pages.map((page) => (
							<MatchPage
								page={page}
								entries={fields.entries}
								setEntry={setEntry}
								allEntries={dataEntries}
							></MatchPage>
						))
					) : (
						<LoadIndicator></LoadIndicator>
					))}
			</Box>
		</Box>
	);
}
