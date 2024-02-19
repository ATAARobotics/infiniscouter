import { Box, Input, Radio, RadioGroup, Stack, Typography } from "@mui/joy";
import { useAtomValue } from "jotai/react";
import { ChangeEvent } from "preact/compat";
import { useState } from "preact/hooks";

import { MatchPage } from "../components/entry_components";
import { LoadIndicator } from "../components/load_indicator";
import { ScoutNameRequired } from "../components/scout_name_required";
import { SyncRequired } from "../components/sync_required";
import { driverFieldsAtom, matchListAtom, scoutNameAtom } from "../data/atoms";
import { getDriverKey, useEntries } from "../data/entries";
import { DriverEntryIdData } from "../generated/DriverEntryIdData";
import { MatchInfo } from "../generated/MatchInfo";

/**
 * The driver scouting page component.
 */
export function DriverEntry() {
	const [matchId, setMatchId] = useState<number>();
	const [teamId, setTeamId] = useState<number>();

	const scoutName = useAtomValue(scoutNameAtom);
	const matchList = useAtomValue(matchListAtom);
	const fields = useAtomValue(driverFieldsAtom);

	const [dataEntries, setEntry] = useEntries<DriverEntryIdData>(
		scoutName,
		matchId && teamId ? getDriverKey(matchId, teamId) : null,
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

	const teamsForMatch: MatchInfo | undefined | 0 =
		matchId !== undefined
			? matchList.match_infos.filter(
					(match) =>
						match.id.match_type === "qualification" &&
						match.id.num === matchId,
			  )[0]
			: undefined;

	return (
		<Box>
			<h1>Driver Entry</h1>
			<p>
				This page is for entry of feedback for teammates by the drive team.
				For general scouting go <a href="/match_entry">here</a> and for pit
				scouting go <a href="/pit_entry">here</a>.
			</p>
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
