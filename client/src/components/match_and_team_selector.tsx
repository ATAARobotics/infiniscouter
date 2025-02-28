import {
	Box,
	Button,
	Input,
	Stack,
	ToggleButtonGroup,
	Typography,
} from "@mui/joy";
import { ChangeEvent } from "preact/compat";
import { getAllMatchEntries } from "src/data/entries";

import { EventInfo } from "../generated/EventInfo";
import { MatchInfo } from "../generated/MatchInfo";

interface MatchAndTeamSelectorProps {
	matchId?: number;
	setMatchId: (matchId: number | undefined) => void;
	teamId?: number;
	setTeamId: (teamId: number | undefined) => void;
	matchList: EventInfo;
}

/**
 *
 */
export function MatchAndTeamSelector(props: MatchAndTeamSelectorProps) {
	const allMatches = getAllMatchEntries(props.matchList.year, props.matchList.event);

	const teamsForMatch: MatchInfo | undefined | 0 = props.matchId
		? props.matchList.match_infos.filter(
				(match) =>
					match.id.match_type === "qualification" &&
					match.id.num === props.matchId,
		  )[0]
		: undefined;

	return (
		<Stack direction={{ xs: "column", md: "row" }} gap="1em">
			<Box>
				{
					// @ts-expect-error Input seems to want a component for some reason?
					<Input
						type="number"
						placeholder={"Qualification Match Number"}
						onChange={(ev: InputEvent) => {
							props.setMatchId(
								parseInt((ev.target as HTMLInputElement).value),
							);
							props.setTeamId(undefined);
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
						props.setTeamId(
							parseInt((ev.target as HTMLInputElement).value),
						)
					}
					value={props.teamId?.toString()}
				>
					<Stack
						direction={{ xs: "column", md: "row" }}
						sx={{ border: "none !important" }}
					>
						<Stack direction="row">
							<Typography level="h2" color="danger" marginX="0.5em">
								RED
							</Typography>
							{teamsForMatch?.teams_red.map((team) => {
								const scouting_count = allMatches.filter(m => m.team_id === team.toString()).length;
								return (
									<Button
											value={team.toString()}
											color="danger"
											label={`${team} (scouted ${scouting_count} times)`}
									>
											{team} {scouting_count > 0 ? "" : "*"}
									</Button>
								);
							})}
						</Stack>
						<Stack direction="row">
							<Typography level="h2" color="primary" marginX="0.5em">
								BLUE
							</Typography>
							{teamsForMatch?.teams_blue.map((team) => {
								const scouting_count = allMatches.filter(m => m.team_id === team.toString()).length;
								return (
									<Button
											value={team.toString()}
											color="primary"
											label={`${team} (scouted ${scouting_count} times)`}
									>
											{team} {scouting_count > 0 ? "" : "*"}
									</Button>
								);
							})}
						</Stack>
					</Stack>
				</ToggleButtonGroup>
			)}
		</Stack>
	);
}
