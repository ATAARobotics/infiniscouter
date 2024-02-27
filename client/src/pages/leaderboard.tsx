import { Box, Table, Typography } from "@mui/joy";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "preact/hooks";
import { LoadIndicator } from "src/components/load_indicator";
import { Navbar } from "src/components/navbar";
import { scoutNameAtom } from "src/data/atoms";
import { LeaderboardInfo } from "src/generated/LeaderboardInfo";
import { LeaderboardPerson } from "src/generated/LeaderboardPerson";

/**
 * Compare two scouts for sorting
 */
function sortScouts(a: LeaderboardPerson, b: LeaderboardPerson): number {
	if (a.name.trim().length === 0) {
		return 1;
	} else if (b.name.trim().length === 0) {
		return -1;
	}
	return (
		b.matches_scouted +
		b.pits_scouted +
		b.drivers_scouted -
		(a.matches_scouted + a.pits_scouted + a.drivers_scouted)
	);
}

/**
 * Component for the leaderboard page.
 */
export function Leaderboard() {
	const [leaderboard, setLeaderboard] = useState<LeaderboardInfo>();

	const currentScout = useAtomValue(scoutNameAtom);

	useEffect(() => {
		fetch("/api/leaderboard")
			.then((response) => response.json())
			.then((data: LeaderboardInfo) => {
				setLeaderboard(data);
			});
	}, []);

	if (!leaderboard) {
		return <LoadIndicator title="Leaderboard" />;
	}

	return (
		<Box>
			<Navbar title="Leaderboard" />
			<Table
				hoverRow
				stickyHeader
				borderAxis="yBetween"
				variant="soft"
				stripe="even"
			>
				<thead>
					<tr>
						<th>Scout Name</th>
						<th>Total Scouted</th>
						<th>Matches Scouted</th>
						<th>Pits Scouted</th>
						<th>Driver Scouted</th>
						<th>Unique Teams Scouted</th>
						<th>Team Most Scouted</th>
					</tr>
				</thead>
				<tbody>
					{Object.values(leaderboard.leaderboard)
						.sort(sortScouts)
						.map((scout) => (
							<tr>
								<td>
									<Typography
										color={
											scout.name.trim().toLowerCase() ===
											currentScout?.trim().toLowerCase()
												? "primary"
												: "neutral"
										}
									>
										{scout.name.trim().length === 0
											? "Unknown"
											: scout.name}
									</Typography>
								</td>
								<td>
									{scout.matches_scouted +
										scout.pits_scouted +
										scout.drivers_scouted}
								</td>
								<td>{scout.matches_scouted}</td>
								<td>{scout.pits_scouted}</td>
								<td>{scout.drivers_scouted}</td>
								<td>{Object.entries(scout.teams_scouted).length}</td>
								<td>
									{(() => {
										const team = Object.entries(
											scout.teams_scouted,
										).sort((a, b) => b[1] - a[1])[0];
										return `Team ${team[0]}, ${team[1]} Time${
											team[1] !== 1 ? "s" : ""
										}`;
									})()}
								</td>
							</tr>
						))}
				</tbody>
			</Table>
		</Box>
	);
}
