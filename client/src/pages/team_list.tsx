import { Box, Stack, Table, Tooltip, Typography } from "@mui/joy";
import { useAtomValue } from "jotai/react";

import { Navbar } from "../components/navbar";
import { SyncRequired } from "../components/sync_required";
import { TbaTeamLink } from "../components/tba_links";
import { matchListAtom } from "../data/atoms";
import { getPitScout } from "../data/entries";

/**
 * Page that shows a list of all teams.
 */
export function TeamList() {
	const matchList = useAtomValue(matchListAtom);

	if (!matchList) {
		return <SyncRequired></SyncRequired>;
	}

	const teams = Object.values(matchList.team_infos);

	return (
		<Box>
			<Navbar title="Team List" />
			<Table hoverRow stickyHeader borderAxis="y" stripe="even">
				<thead>
					<th>Team</th>
					<th>Analysis</th>
					<th>Pit Scouting</th>
				</thead>
				<tbody>
					{teams.map((teamInfo) => {
						const pitScout = getPitScout(teamInfo.num);
						return (
							<>
								<tr>
									<td>
										<Stack direction="row">
											{teamInfo.num} {teamInfo.name}
											<TbaTeamLink
												team={teamInfo.num}
												year={matchList.year}
												style={{ marginLeft: "auto" }}
											></TbaTeamLink>
										</Stack>
									</td>
									<td>
										<a href={`/team/${teamInfo.num}`}>Team Data</a>{" "}
									</td>
									<td>
										<Stack direction="row">
											<a href={`/pit_entry/${teamInfo.num}`}>
												Pit Scouting
											</a>{" "}
											{pitScout && (
												<Tooltip
													title={`Scouted by ${pitScout}`}
													style={{ marginLeft: "auto" }}
												>
													<Typography>✅</Typography>
												</Tooltip>
											)}
										</Stack>
									</td>
								</tr>
							</>
						);
					})}
				</tbody>
			</Table>
		</Box>
	);
}
