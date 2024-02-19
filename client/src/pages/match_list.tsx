import { Box, Table } from "@mui/joy";
import { useAtomValue } from "jotai/react";

import { LoadIndicator } from "../components/load_indicator";
import { TbaLink } from "../components/tba_link";
import { matchListAtom } from "../data/atoms";
import { getMatchScout } from "../data/entries";
import { EventInfo } from "../generated/EventInfo";
import { MatchId } from "../generated/MatchId";
import { MatchInfo } from "../generated/MatchInfo";

/**
 * Format a match ID for display.
 */
function formatMatchId(matchId: MatchId): string {
	if (matchId.match_type === "practice") {
		return `Practice ${matchId.num}`;
	} else if (matchId.match_type === "qualification") {
		return `Quals ${matchId.num}`;
	} else if (matchId.match_type === "quarterfinal") {
		return `Quarters ${matchId.num} ${
			matchId.set > 1 ? ` (Round ${matchId.set}})` : ""
		}`;
	} else if (matchId.match_type === "semifinal") {
		return `Semis ${matchId.num} ${
			matchId.set > 1 ? ` (Round ${matchId.set}})` : ""
		}`;
	} else if (matchId.match_type === "final") {
		return `Finals ${matchId.num}`;
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
			{team_info ? (
				<a href={`/team/${team_info.num}`} title={team_info.name}>
					{team_info.num}
				</a>
			) : (
				props.team
			)}{" "}
			{isQuals &&
				props.match.result !== "Tbd" &&
				(scout ? (
					<a title={`Scouted by ${scout}`}>✅</a>
				) : (
					<a title="No scouting data">❌</a>
				))}
		</td>
	);
}

/**
 * Page that shows a list of all matches.
 */
export function MatchList() {
	const matchList = useAtomValue(matchListAtom);

	if (!matchList) {
		return <LoadIndicator></LoadIndicator>;
	}

	return (
		<Box>
			<h1>Match List</h1>
			<Table hoverRow stickyHeader borderAxis="y" stripe="even">
				<thead>
					<th style={{ width: "150px" }}>Match</th>
					<th colSpan={4}>Red Alliance</th>
					<th colSpan={4}>Blue Alliance</th>
					<th style={{ width: "100px" }}>Winner</th>
				</thead>
				<tbody>
					{matchList.match_infos.map((match) => (
						<tr>
							<td>
								<a
									href={`/match/${match.id.match_type}/${match.id.num}/${match.id.set}`}
									title="Match Preview"
								>
									{formatMatchId(match.id)}
								</a>{" "}
								<TbaLink matchId={match.id} event="2022bcvi"></TbaLink>
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
							<td>
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
							<td>
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
