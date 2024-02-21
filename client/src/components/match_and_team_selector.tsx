import {
	Box,
	Button,
	Input,
	Stack,
	ToggleButtonGroup,
	Typography,
} from "@mui/joy";
import { ChangeEvent } from "preact/compat";

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
							{teamsForMatch?.teams_red.map((team) => (
								<Button
									value={team.toString()}
									color="danger"
									label={team.toString()}
								>
									{team}
								</Button>
							))}
						</Stack>
						<Stack direction="row">
							<Typography level="h2" color="primary" marginX="0.5em">
								BLUE
							</Typography>
							{teamsForMatch?.teams_blue.map((team) => (
								<Button value={team.toString()} color="primary">
									{team}
								</Button>
							))}
						</Stack>
					</Stack>
				</ToggleButtonGroup>
			)}
		</Stack>
	);
}
