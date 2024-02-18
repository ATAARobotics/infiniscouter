import { Autocomplete, Box } from "@mui/joy";
import { useAtomValue } from "jotai/react";
import { useState } from "preact/hooks";

import { MatchPage } from "../components/entry_components";
import { GetScoutName } from "../components/get_scout_name";
import { LoadIndicator } from "../components/load_indicator";
import { matchListAtom, pitFieldsAtom, scoutNameAtom } from "../data/atoms";
import { useEntries } from "../data/entries";
import { PitEntryIdData } from "../generated/PitEntryIdData";

/**
 * Pit Entry Page Component
 */
export function PitEntry() {
	const [teamId, setTeamId] = useState<number>();

	const scoutName = useAtomValue(scoutNameAtom);
	const event_info = useAtomValue(matchListAtom);
	const fields = useAtomValue(pitFieldsAtom);

	const [dataEntries, setEntry] = useEntries<PitEntryIdData>(
		scoutName,
		teamId ? `team-${teamId}` : null,
		(data) => ({
			team_id: teamId?.toString() ?? "",
			data,
		}),
	);

	if (!scoutName) {
		return <GetScoutName></GetScoutName>;
	}
	if (!event_info) {
		return <LoadIndicator></LoadIndicator>;
	}

	return (
		<Box>
			<h1>Pit Entry Page</h1>
			<Box>
				<Autocomplete
					placeholder={"Team Number"}
					options={Object.values(event_info.team_infos).map((team) => {
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
