import { Box } from "@mui/joy";
import { useAtomValue } from "jotai/react";
import { useState } from "preact/hooks";

import { MatchPage } from "../components/entry_components";
import { ScoutNameRequired } from "../components/scout_name_required";
import { SyncRequired } from "../components/sync_required";
import { MatchAndTeamSelector } from "../components/match_and_team_selector";
import { matchFieldsAtom, matchListAtom, scoutNameAtom } from "../data/atoms";
import { getMatchKey, useEntries } from "../data/entries";
import { MatchEntry } from "../generated/MatchEntry";
import { MatchEntryIdData } from "../generated/MatchEntryIdData";

/**
 * The match entry page component.
 */
export function MatchEntry() {
	const [matchId, setMatchId] = useState<number>();
	const [teamId, setTeamId] = useState<number>();

	const scoutName = useAtomValue(scoutNameAtom);
	const matchList = useAtomValue(matchListAtom);
	const fields = useAtomValue(matchFieldsAtom);

	const [dataEntries, setEntry] = useEntries<MatchEntryIdData>(
		scoutName,
		matchId && teamId ? getMatchKey(matchId, teamId) : null,
		(data) => ({
			match_id: matchId?.toString() ?? "",
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
			<h1>Match Entry</h1>
			<MatchAndTeamSelector
				matchList={matchList}
				matchId={matchId}
				setMatchId={setMatchId}
				teamId={teamId}
				setTeamId={setTeamId}
			></MatchAndTeamSelector>
			{teamId &&
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
					<SyncRequired></SyncRequired>
				))}
		</Box>
	);
}
