import { Box } from "@mui/joy";
import { useAtomValue } from "jotai/react";
import { useState } from "preact/hooks";

import { MatchPage } from "../components/entry_components";
import { MatchAndTeamSelector } from "../components/match_and_team_selector";
import { Navbar } from "../components/navbar";
import { ScoutNameRequired } from "../components/scout_name_required";
import { SyncRequired } from "../components/sync_required";
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
	if (!matchList || !fields) {
		return <SyncRequired></SyncRequired>;
	}

	return (
		<Box>
			<Navbar title={"Match Entry"} />
			<MatchAndTeamSelector
				matchList={matchList}
				matchId={matchId}
				setMatchId={setMatchId}
				teamId={teamId}
				setTeamId={setTeamId}
			></MatchAndTeamSelector>
			{teamId &&
				fields.pages.map((page) => (
					<MatchPage
						page={page}
						entries={fields.entries}
						setEntry={setEntry}
						allEntries={dataEntries}
					></MatchPage>
				))}
		</Box>
	);
}
