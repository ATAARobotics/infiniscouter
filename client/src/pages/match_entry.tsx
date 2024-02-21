import {
	Box,
	Button,
	Input,
	Radio,
	RadioGroup,
	Stack,
	ToggleButtonGroup,
	Typography,
} from "@mui/joy";
import { useAtomValue } from "jotai/react";
import { ChangeEvent } from "preact/compat";
import { useState } from "preact/hooks";

import { MatchPage } from "../components/entry_components";
import { LoadIndicator } from "../components/load_indicator";
import { ScoutNameRequired } from "../components/scout_name_required";
import { SyncRequired } from "../components/sync_required";
import { matchFieldsAtom, matchListAtom, scoutNameAtom } from "../data/atoms";
import { getMatchKey, useEntries } from "../data/entries";
import { MatchEntry } from "../generated/MatchEntry";
import { MatchEntryIdData } from "../generated/MatchEntryIdData";
import { MatchInfo } from "../generated/MatchInfo";

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
			<h1>Match Entry</h1>
			<Stack direction={{ xs: "column", md: "row" }} gap="1em">
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
							sx={{
								width: "20em",
							}}
						/>
					}
				</Box>
				{teamsForMatch && (
					<ToggleButtonGroup
						onChange={(ev: ChangeEvent) =>
							setTeamId(parseInt((ev.target as HTMLInputElement).value))
						}
						value={teamId ?? null}
					>
						<Stack
							direction={{ xs: "column", md: "row" }}
							sx={{ border: "none !important" }}
						>
							<Stack direction="row">
								<Typography level="h2" color="danger" marginX="0.5em">
									RED
								</Typography>
								{teamsForMatch?.teams_red.map((team) => (
									<Button
										value={team}
										color="danger"
										label={team.toString()}
									>
										{team.toString()}
									</Button>
								))}
							</Stack>
							<Stack direction="row">
								<Typography level="h2" color="primary" marginX="0.5em">
									BLUE
								</Typography>
								{teamsForMatch?.teams_blue.map((team) => (
									<Button value={team} color="primary">
										{team.toString()}
									</Button>
								))}
							</Stack>
						</Stack>
					</ToggleButtonGroup>
				)}
			</Stack>
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
