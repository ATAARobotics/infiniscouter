import { Box, Card, Stack, Typography } from "@mui/joy";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "preact/hooks";
import { Bar } from "react-chartjs-2";

import { DataValue } from "../components/data_value";
import { LoadIndicator } from "../components/load_indicator";
import { Navbar } from "../components/navbar";
import { SyncRequired } from "../components/sync_required";
import { matchListAtom } from "../data/atoms";
import { useCharts, useColorSchemes as useColors } from "../data/hooks";
import { MatchAnalysisInfo } from "../generated/MatchAnalysisInfo";
import { MatchAnalysisTeamInfo } from "../generated/MatchAnalysisTeamInfo";
import { formatMatchId } from "./match_list";

interface TeamPreviewProps extends MatchAnalysisTeamInfo {
	alliance: "red" | "blue";
	other_data_names: Array<string>;
	colors: Array<Array<string>>;
}

/**
 *
 */
function TeamPreview(props: TeamPreviewProps) {
	return (
		<>
			<Typography
				level="h3"
				color={props.alliance === "red" ? "danger" : "primary"}
				height={40}
				overflow="hidden"
				textOverflow="ellipsis"
			>
				{props.team_icon_uri && (
					<>
						<img width={40} height={40} src={props.team_icon_uri} style={{float: "left"}} />
						{" "}
					</>
				)}
				<a href={`/team/${props.team_number}`} title={props.team_name}>
					{props.team_number}
				</a>
				{" "}
				{props.team_name}
			</Typography>
			<Stack direction="row" flexWrap={"wrap"} gap={"25px"}>
				{props.other_data.map((data, idx) => {
					return (
						<Card sx={{ width: 120 }}>
							<Typography level="title-lg">
								{props.other_data_names[idx]}
							</Typography>
							<DataValue
								listView={false}
								value={data}
								colorScheme={props.colors[idx]}
							></DataValue>
						</Card>
					);
				})}
			</Stack>
		</>
	);
}

const rainbow = [
	"#e74c3c",
	"#f1c40f",
	"#2ecc71",
	"#3498db",
	"#9b59b6",
	"#e67e22",
];

interface AlliancePreviewProps {
	alliance: "red" | "blue";
	teams: Array<MatchAnalysisTeamInfo>;
	highestScore: number;
	other_data_names: Array<string>;
	colors: Array<Array<string>>;
}

/**
 *
 */
function AlliancePreview(props: AlliancePreviewProps) {
	const chartsReady = useCharts();

	const totalScore = props.teams.reduce(
		(sum, team) => sum + team.expected_score,
		0,
	);

	const scoreTypes = props.teams[0].expected_score_parts.map(
		(part) => part.name,
	);

	return (
		<Stack direction="column" sx={{ width: "auto" }}>
			<Typography
				level="h2"
				color={props.alliance === "red" ? "danger" : "primary"}
			>
				{props.alliance === "red" ? "RED" : "BLUE"}
			</Typography>
			<Typography level="h2">
				Expected Score {totalScore.toFixed(2)}
			</Typography>
			{chartsReady && (
				<Bar
					data={{
						labels: props.teams.map((teamInfo) => teamInfo.team_number),
						datasets: scoreTypes.map((type, idx) => ({
							label: type,
							data: props.teams.map(
								(team) =>
									team.expected_score_parts.find(
										(part) => part.name === type,
									)?.score,
							),
							backgroundColor: rainbow[idx],
						})),
					}}
					options={{
						font: {
							size: 20,
						},
						indexAxis: "y",
						plugins: { legend: { display: false, reverse: true } },
						scales: {
							x: {
								stacked: true,
								display: false,
								max: props.highestScore,
							},
							y: {
								stacked: true,
								ticks: {
									font: {
										size: 24,
									},
								},
							},
						},
					}}
				/>
			)}
			{props.teams.map((teamInfo) => (
				<TeamPreview
					{...teamInfo}
					alliance={props.alliance}
					other_data_names={props.other_data_names}
					colors={props.colors}
				></TeamPreview>
			))}
		</Stack>
	);
}

export interface MatchInfoProps {
	type: "qualification" | "practice" | "quarterfinal" | "semifinal" | "final";
	num: number;
	set: number;
}

/**
 * Match preview page
 */
export function MatchInfo(props: MatchInfoProps) {
	const matchList = useAtomValue(matchListAtom);
	const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysisInfo>();

	const colors = useColors(matchAnalysis?.other_data_names.length ?? 0);

	useEffect(() => {
		setMatchAnalysis(undefined);
		fetch(`/api/analysis/match/${props.type}/${props.num}/${props.set}`)
			.then((response) => response.json())
			.then((matchInfo: MatchAnalysisInfo) => {
				setMatchAnalysis(matchInfo);
			});
	}, [props]);

	if (!matchList) {
		return <SyncRequired></SyncRequired>;
	}
	if (!matchAnalysis) {
		return <LoadIndicator title="Match Preview"></LoadIndicator>;
	}

	const highestScore = Math.max(
		...matchAnalysis.blue_teams
			.concat(matchAnalysis.red_teams)
			.map((info) => info.expected_score),
	);

	return (
		<Box>
			<Navbar
				title={formatMatchId(
					{
						match_type: props.type,
						num: props.num,
						set: props.set,
					},
					matchList.year,
				)}
			/>
			<Stack
				direction="row"
				flexWrap={"wrap"}
				gap={"25px"}
				justifyContent={"space-evenly"}
			>
				<AlliancePreview
					alliance="red"
					teams={matchAnalysis.red_teams}
					highestScore={highestScore}
					other_data_names={matchAnalysis.other_data_names}
					colors={colors}
				></AlliancePreview>
				<AlliancePreview
					alliance="blue"
					teams={matchAnalysis.blue_teams}
					highestScore={highestScore}
					other_data_names={matchAnalysis.other_data_names}
					colors={colors}
				></AlliancePreview>
			</Stack>
		</Box>
	);
}
