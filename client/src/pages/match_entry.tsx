import { Box, Typography } from "@mui/joy";
import { useAtomValue } from "jotai/react";
import { useState } from "preact/hooks";
import { TeamInfo } from "src/generated/TeamInfo";

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
	const [team, setTeam] = useState<TeamInfo>();

	const scoutName = useAtomValue(scoutNameAtom);
	const matchList = useAtomValue(matchListAtom);
	const fields = useAtomValue(matchFieldsAtom);

	const [dataEntries, setEntry] = useEntries<MatchEntryIdData>(
		scoutName,
		matchList?.year,
		matchList?.event,
		matchId && team?.num ? getMatchKey(matchId, team?.num) : null,
		(data) => ({
			match_id: matchId?.toString() ?? "",
			team_id: team?.num?.toString() ?? "",
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
				team={team}
				setTeam={setTeam}
			></MatchAndTeamSelector>
			{team && (
				<Typography level="h2">
					{team.num} {team.name}
				</Typography>
			)}
			{team &&
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
	);
}
