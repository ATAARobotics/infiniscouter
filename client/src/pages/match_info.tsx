import { Box, Card, Stack, Typography } from "@mui/joy";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "preact/hooks";
import { Bar } from "react-chartjs-2";

import { DataValue } from "../components/data_value";
import { LoadIndicator } from "../components/load_indicator";
import { Navbar } from "../components/navbar";
import { SyncRequired } from "../components/sync_required";
import { matchListAtom, useCharts } from "../data/atoms";
import { MatchAnalysisInfo } from "../generated/MatchAnalysisInfo";
import { MatchAnalysisTeamInfo } from "../generated/MatchAnalysisTeamInfo";
import { formatMatchId } from "./match_list";

interface TeamPreviewProps extends MatchAnalysisTeamInfo {
	alliance: "red" | "blue";
	other_data_names: Array<string>;
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
			>
				{props.team_icon_uri && (
					<img width={40} height={40} src={props.team_icon_uri} />
				)}
				{props.team_number}
			</Typography>
			<Stack direction="row" flexWrap={"wrap"} gap={"25px"}>
				{props.other_data.map((data, idx) => {
					return (
						<Card sx={{ width: 120 }}>
							<Typography level="title-lg">
								{props.other_data_names[idx]}
							</Typography>
							<DataValue listView={false} value={data}></DataValue>
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
	other_data_names: Array<string>;
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

	return (
		<Box>
			<Navbar
				title={`Match Preview for ${formatMatchId(
					{
						match_type: props.type,
						num: props.num,
						set: props.set,
					},
					matchList.year,
				)}`}
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
					other_data_names={matchAnalysis.other_data_names}
				></AlliancePreview>
				<AlliancePreview
					alliance="blue"
					teams={matchAnalysis.blue_teams}
					other_data_names={matchAnalysis.other_data_names}
				></AlliancePreview>
			</Stack>
		</Box>
	);
}
