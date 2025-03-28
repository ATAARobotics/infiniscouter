import { Box, Input, Stack, Table, Tooltip, Typography } from "@mui/joy";
import { useAtomValue } from "jotai/react";
import { useState } from "preact/hooks";

import { Navbar } from "../components/navbar";
import { SyncRequired } from "../components/sync_required";
import { TbaMatchLink } from "../components/tba_links";
import { matchListAtom } from "../data/atoms";
import { getMatchScouts } from "../data/entries";
import { EventInfo } from "../generated/EventInfo";
import { MatchId } from "../generated/MatchId";
import { MatchInfo } from "../generated/MatchInfo";

/**
 * Format a match ID for display.
 */
export function formatMatchId(matchId: MatchId, year: number): string {
	if (matchId.match_type === "practice") {
		return `Practice\u00A0${matchId.num}`;
	} else if (matchId.match_type === "qualification") {
		return `Quals\u00A0${matchId.num}`;
	} else if (matchId.match_type === "quarterfinal") {
		return year >= 2023
			? `Quarters\u00A0${matchId.set}`
			: `Quarters\u00A0${matchId.num} Match\u00A0${matchId.set}`;
	} else if (matchId.match_type === "semifinal") {
		return year >= 2023
			? `Semis\u00A0${matchId.set}`
			: `Semis\u00A0${matchId.num} Match\u00A0${matchId.set}`;
	} else if (matchId.match_type === "final") {
		return `Finals\u00A0${matchId.num}`;
	}
	return "";
}

interface TeamCellProps {
	team: number;
	match: MatchInfo;
	matchList: EventInfo;
	filterValue?: string;
}

/**
 * Cell to show a single team's information.
 */
function TeamCell(props: TeamCellProps) {
	const team_info = props.matchList.team_infos[props.team];
	const isQuals = props.match.id.match_type === "qualification";
	const isRed = props.match.teams_red.includes(props.team);
	const scouts = isQuals ? getMatchScouts(props.match.id.num, props.team, props.matchList.year, props.matchList.event) : [];
	const highlight = props.filterValue && props.team.toString().indexOf(props.filterValue) >= 0;
	const color = highlight ? "#DDDDDD" : isRed ? "#E47474" : "#0B6BCB";

	return (
		<Stack direction="row" width="100%">
			{scouts.length > 0 && (
				<Tooltip
					title={`Scouted by ${scouts.join(", ")}`}
					style={{ marginRight: "5px" }}
				>
					<Typography>✅</Typography>
				</Tooltip>
			)}
			{team_info ? (
				<a href={`/team/${team_info.num}`} title={team_info.name} style={{color, fontWeight: highlight ? "bold" : "normal"}}>
					{team_info.num}
				</a>
			) : (
				props.team
			)}
			{" "}
		</Stack>
	);
}

/**
 * Page that shows a list of all matches.
 */
export function MatchList() {
	const matchList = useAtomValue(matchListAtom);
	const [filterValue, setFilterValue] = useState("");

	if (!matchList) {
		return <SyncRequired></SyncRequired>;
	}

	return (
		<>
			<Box>
				<Navbar title="Match List" component={
					// @ts-expect-error Input seems to want a component for some reason?
					<Input
						type="text"
						placeholder="Filter Team #"
						onChange={(ev: InputEvent) => {
							setFilterValue((ev.target as HTMLInputElement).value) ?? "";
						}}
						value={filterValue}
					/>
				} />
				<Table hoverRow stickyHeader borderAxis="y" stripe="even">
					<thead>
						<th style={{ width: "100px" }}>Match</th>
						<th>Red Alliance</th>
						<th>Blue Alliance</th>
						<th style={{ width: "75px" }}>Winner</th>
					</thead>
					<tbody>
						{matchList.match_infos
							.filter((match) => match.teams_blue.some(team => team.toString().indexOf(filterValue) >= 0)
								|| match.teams_red.some(team => team.toString().indexOf(filterValue) >= 0))
							.map((match) => (
							<tr>
								<td>
									<Stack direction="row">
										<a
											href={`/match/${match.id.match_type}/${match.id.num}/${match.id.set}`}
											title="Match Preview"
										>
											{formatMatchId(match.id, matchList.year)}
										</a>{" "}
										<TbaMatchLink
											matchId={match.id}
											event={matchList.event}
											style={{ marginLeft: "auto" }}
										></TbaMatchLink>
									</Stack>
								</td>
								<td>
									<Stack direction="row">
										<Stack
											direction={{ xs: "column", sm: "row" }}
											width="100%"
										>
											<TeamCell
												team={match.teams_red[0]}
												match={match}
												matchList={matchList}
												filterValue={filterValue}
											></TeamCell>
											<TeamCell
												team={match.teams_red[1]}
												match={match}
												matchList={matchList}
												filterValue={filterValue}
											></TeamCell>
											<TeamCell
												team={match.teams_red[2]}
												match={match}
												matchList={matchList}
												filterValue={filterValue}
											></TeamCell>
										</Stack>
										<Typography
											style={{
												textAlign: "right",
												width: "50px",
												marginLeft: "auto",
												marginTop: "auto",
												marginBottom: "auto",
											}}
											gridArea="score"
										>
											{match.result === "Red" ? (
												<b>{match.score_red}</b>
											) : (
												match.score_red ?? ""
											)}
										</Typography>
									</Stack>
								</td>
								<td>
									<Stack direction="row">
										<Stack
											direction={{ xs: "column", sm: "row" }}
											width="100%"
										>
											<TeamCell
												team={match.teams_blue[0]}
												match={match}
												matchList={matchList}
												filterValue={filterValue}
											></TeamCell>
											<TeamCell
												team={match.teams_blue[1]}
												match={match}
												matchList={matchList}
												filterValue={filterValue}
											></TeamCell>
											<TeamCell
												team={match.teams_blue[2]}
												match={match}
												matchList={matchList}
												filterValue={filterValue}
											></TeamCell>
										</Stack>
										<Typography
											style={{
												textAlign: "right",
												width: "50px",
												marginLeft: "auto",
												marginTop: "auto",
												marginBottom: "auto",
											}}
											gridArea="score"
										>
											{match.result === "Blue" ? (
												<b>{match.score_blue}</b>
											) : (
												match.score_blue ?? ""
											)}
										</Typography>
									</Stack>
								</td>
								<td>{match.result === "Tbd" ? "" : match.result}</td>
							</tr>
						))}
					</tbody>
				</Table>
			</Box>
		</>
	);
}
