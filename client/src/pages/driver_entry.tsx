import { Box, Typography } from "@mui/joy";
import { useAtomValue } from "jotai/react";
import { useState } from "preact/hooks";
import { TeamInfo } from "src/generated/TeamInfo";

import { MatchPage } from "../components/entry_components";
import { MatchAndTeamSelector } from "../components/match_and_team_selector";
import { Navbar } from "../components/navbar";
import { ScoutNameRequired } from "../components/scout_name_required";
import { SyncRequired } from "../components/sync_required";
import { driverFieldsAtom, matchListAtom, scoutNameAtom } from "../data/atoms";
import { getDriverKey, useEntries } from "../data/entries";
import { DriverEntryIdData } from "../generated/DriverEntryIdData";

/**
 * The driver scouting page component.
 */
export function DriverEntry() {
	const [matchId, setMatchId] = useState<number>();
	const [team, setTeam] = useState<TeamInfo>();

	const scoutName = useAtomValue(scoutNameAtom);
	const matchList = useAtomValue(matchListAtom);
	const fields = useAtomValue(driverFieldsAtom);

	const [dataEntries, setEntry] = useEntries<DriverEntryIdData>(
		scoutName,
		matchList?.year,
		matchList?.event,
		matchId && team?.num ? getDriverKey(matchId, team?.num) : null,
		(data) => ({
			match_id: matchId?.toString() ?? "",
			team_id: team?.num?.toString() ?? "",
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
			<Navbar title={"Driver Entry"} />
			<p>
				This page is for entry of feedback for teammates by the drive team.
				For general scouting go <a href="/match_entry">here</a> and for pit
				scouting go <a href="/pit_entry">here</a>.
			</p>
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
				(fields ? (
					fields.pages.map((page) => (
						<MatchPage
							scout={scoutName}
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
