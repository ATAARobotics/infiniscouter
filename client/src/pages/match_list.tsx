import { Box, Stack, Table } from "@mui/joy";
import { useAtomValue } from "jotai/react";

import { Navbar } from "../components/navbar";
import { SyncRequired } from "../components/sync_required";
import { TbaMatchLink } from "../components/tba_links";
import { matchListAtom } from "../data/atoms";
import { getMatchScout } from "../data/entries";
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
}

/**
 * Cell to show a single team's information.
 */
function TeamCell(props: TeamCellProps) {
	const team_info = props.matchList.team_infos[props.team];
	const isQuals = props.match.id.match_type === "qualification";
	const scout = isQuals ? getMatchScout(props.match.id.num, props.team) : null;
	return (
		<td>
			<Stack direction="row">
				{team_info ? (
					<a href={`/team/${team_info.num}`} title={team_info.name}>
						{team_info.num}
					</a>
				) : (
					props.team
				)}{" "}
				{isQuals && scout ? (
					<a title={`Scouted by ${scout}`} style={{ marginLeft: "auto" }}>
						✅
					</a>
				) : (
					props.match.result !== "Tbd" && (
						<a title="No scouting data" style={{ marginLeft: "auto" }}>
							❌
						</a>
					)
				)}
			</Stack>
		</td>
	);
}

/**
 * Page that shows a list of all matches.
 */
export function MatchList() {
	const matchList = useAtomValue(matchListAtom);

	if (!matchList) {
		return <SyncRequired></SyncRequired>;
	}

	return (
		<Box>
			<Navbar title="Match List" />
			<Table hoverRow stickyHeader borderAxis="y" stripe="even">
				<thead>
					<th style={{ width: "150px" }}>Match</th>
					<th colSpan={3}>Red Alliance</th>
					<th style={{ width: "50px" }}></th>
					<th colSpan={3}>Blue Alliance</th>
					<th style={{ width: "50px" }}></th>
					<th style={{ width: "100px" }}>Winner</th>
				</thead>
				<tbody>
					{matchList.match_infos.map((match) => (
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
							<TeamCell
								team={match.teams_red[0]}
								match={match}
								matchList={matchList}
							></TeamCell>
							<TeamCell
								team={match.teams_red[1]}
								match={match}
								matchList={matchList}
							></TeamCell>
							<TeamCell
								team={match.teams_red[2]}
								match={match}
								matchList={matchList}
							></TeamCell>
							<td style={{ textAlign: "right" }}>
								{match.result === "Red" ? (
									<b>{match.score_red}</b>
								) : match.result === "Blue" ? (
									match.score_red
								) : (
									""
								)}
							</td>
							<TeamCell
								team={match.teams_blue[0]}
								match={match}
								matchList={matchList}
							></TeamCell>
							<TeamCell
								team={match.teams_blue[1]}
								match={match}
								matchList={matchList}
							></TeamCell>
							<TeamCell
								team={match.teams_blue[2]}
								match={match}
								matchList={matchList}
							></TeamCell>
							<td style={{ textAlign: "right" }}>
								{match.result === "Blue" ? (
									<b>{match.score_blue}</b>
								) : match.result === "Red" ? (
									match.score_blue
								) : (
									""
								)}
							</td>
							<td>{match.result === "Tbd" ? "" : match.result}</td>
						</tr>
					))}
				</tbody>
			</Table>
		</Box>
	);
}
