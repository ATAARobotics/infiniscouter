import { Box, Input, Radio, RadioGroup, Stack, Typography } from "@mui/joy";
import { useAtomValue } from "jotai/react";
import { ChangeEvent } from "preact/compat";
import { useEffect, useState } from "preact/hooks";

import { MatchPage } from "../components/entry_components";
import { GetScoutName } from "../components/get_scout_name";
import { LoadIndicator } from "../components/load_indicator";
import { driverFieldsAtom, matchListAtom, scoutNameAtom } from "../data/atoms";
import { DriverEntryIdData } from "../generated/DriverEntryIdData";
import { MatchEntryData } from "../generated/MatchEntryData";
import { MatchInfo } from "../generated/MatchInfo";

/**
 * Driver scouting entry page
 */
export function DriverEntry() {
	const [matchId, setMatchId] = useState<number>();
	const [teamId, setTeamId] = useState<number>();

	const [data, setData] = useState<Omit<MatchEntryData, "scout">>({
		entries: {},
		timestamp_ms: 0,
	});

	const scoutName = useAtomValue(scoutNameAtom);
	const matchTeams = useAtomValue(matchListAtom);
	const fields = useAtomValue(driverFieldsAtom);

	useEffect(() => {
		if (matchId && teamId && scoutName) {
			const saveData: DriverEntryIdData = {
				match_id: matchId.toString(),
				team_id: teamId.toString(),
				data: {
					...data,
					scout: scoutName,
				},
			};
			localStorage.setItem(
				"drive-" + matchId?.toString() + "-" + teamId?.toString(),
				JSON.stringify(saveData),
			);
		}
	}, [data, scoutName]);
	useEffect(() => {
		if (matchId && teamId) {
			const newData: DriverEntryIdData | null = JSON.parse(
				localStorage.getItem(
					"drive-" + matchId?.toString() + "-" + teamId?.toString(),
				) ?? "null",
			);
			if (newData !== null) {
				setData(newData.data);
			} else {
				setData({
					entries: {},
					timestamp_ms: 0,
				});
			}
		}
	}, [matchId, teamId]);

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
			<h1>Driver Entry Page</h1>
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
							setEntry={(id, value) => {
								const newEntries = { ...data.entries };
								if (!value) {
									delete newEntries[id];
								} else {
									newEntries[id] = value;
								}
								setData({
									timestamp_ms: Date.now(),
									entries: newEntries,
								});
							}}
							allEntries={data.entries}
						></MatchPage>
					))
				) : (
					<LoadIndicator></LoadIndicator>
				))}
		</Box>
	);
}
