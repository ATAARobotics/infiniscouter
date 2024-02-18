import { Box, Input, Radio, RadioGroup, Stack, Typography } from "@mui/joy";
import { useAtomValue } from "jotai/react";
import { ChangeEvent } from "preact/compat";
import { useState } from "preact/hooks";

import { MatchPage } from "../components/entry_components";
import { GetScoutName } from "../components/get_scout_name";
import { LoadIndicator } from "../components/load_indicator";
import { matchFieldsAtom, matchListAtom, scoutNameAtom } from "../data/atoms";
import { useEntries } from "../data/entries";
import { MatchEntry } from "../generated/MatchEntry";
import { MatchEntryIdData } from "../generated/MatchEntryIdData";
import { MatchInfo } from "../generated/MatchInfo";

/**
 * Match Entry Page Component
 */
export function MatchEntry() {
	const [matchId, setMatchId] = useState<number>();
	const [teamId, setTeamId] = useState<number>();

	const scoutName = useAtomValue(scoutNameAtom);
	const matchTeams = useAtomValue(matchListAtom);
	const fields = useAtomValue(matchFieldsAtom);

	const [dataEntries, setEntry] = useEntries<MatchEntryIdData>(
		scoutName,
		matchId && teamId ? `match-${matchId}-${teamId}` : null,
		(data) => ({
			match_id: matchId?.toString() ?? "",
			team_id: teamId?.toString() ?? "",
			data,
		}),
	);

	if (!scoutName) {
		return <GetScoutName></GetScoutName>;
	}
	if (!matchTeams) {
		return <LoadIndicator></LoadIndicator>;
	}

	const teamsForMatch: MatchInfo | undefined | 0 =
		matchId !== undefined
			? matchTeams.match_infos.filter(
					(match) =>
						match.id.match_type === "qualification" &&
						match.id.num === matchId,
			  )[0]
			: undefined;

	return (
		<Box>
			<h1>Match Entry Page</h1>
			<Box>
				{
					// @ts-expect-error Input seems to want a component for some reason?
					<Input
						type="number"
						placeholder={"Qualification Match Number"}
						onChange={(ev: InputEvent) => {
							setMatchId(
								parseInt((ev.target as HTMLInputElement).value),
							);
							setTeamId(undefined);
						}}
					/>
				}
			</Box>
			{teamsForMatch && (
				<Box>
					<RadioGroup
						onChange={(ev: ChangeEvent) =>
							setTeamId(parseInt((ev.target as HTMLInputElement).value))
						}
						value={teamId ?? null}
					>
						<Stack direction="row">
							<Stack direction="column">
								<Typography>RED</Typography>
								{teamsForMatch?.teams_red.map((team) => (
									<Radio value={team} label={team.toString()} />
								))}
							</Stack>
							<Stack direction="column">
								<Typography>BLUE</Typography>
								{teamsForMatch?.teams_blue.map((team) => (
									<Radio value={team} label={team.toString()} />
								))}
							</Stack>
						</Stack>
					</RadioGroup>
				</Box>
			)}
			{teamsForMatch &&
				teamId !== undefined &&
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
	);
}
