import { Box, Typography } from "@mui/joy";
import { WordCloudController } from "chartjs-chart-wordcloud";
import { Chart, Pie } from "react-chartjs-2";

import { useCharts } from "../data/hooks";
import { TeamInfoEntry } from "../generated/TeamInfoEntry";

interface DataValueProps {
	value: TeamInfoEntry;
	listView: boolean;
	colorScheme: string[];
}

// These shouldn't go in the word cloud
const excludeWords = [
	"the",
	"of",
	"it",
	"in",
	"and",
	"or",
	"by",
	"is",
	"a",
	"this",
	"that",
	"then",
	// s is a word now because contractions
	"s",
];

/**
 * Displays a data value for analysis.
 */
export function DataValue(props: DataValueProps) {
	const chartsReady = useCharts();
	switch (props.value.graphic?.type) {
		case undefined:
			return (
				<Typography
					level="h1"
					style={{
						color: `rgb(${props.value.colour})`,
					}}
				>
					{props.value.text}
				</Typography>
			);
		case "team_name":
			return (
				<a href={`/team/${props.value.graphic.number}`}>
					<Typography level="h3">
						{props.value.graphic.icon_uri !== null && (
							<img
								width={40}
								height={40}
								src={props.value.graphic.icon_uri}
							/>
						)}{" "}
						{props.value.graphic.number} {props.value.graphic.name}
					</Typography>
				</a>
			);
		case "pie_chart": {
			return (
				<Box
					sx={{
						width: "100px",
						height: "100px",
						marginLeft: "50%",
						translate: "-50%",
					}}
				>
					{chartsReady && (
						<Pie
							data={{
								labels: props.value.graphic.options.map(
									(op) => op.label,
								),
								datasets: [
									{
										label: "Data",
										data: props.value.graphic.options.map(
											(op) => op.value,
										),
										backgroundColor: props.colorScheme,
									},
								],
							}}
							options={{
								plugins: { legend: { display: false, reverse: true } },
							}}
						/>
					)}
				</Box>
			);
		}
		case "multi_text": {
			if (props.listView) {
				return (
					<>
						{(() => {
							const words: { [word: string]: number } = {};
							for (const string of props.value.graphic.strings) {
								for (const wordUp of string.split(/[^\w]+/)) {
									const word = wordUp.toLowerCase();
									if (excludeWords.indexOf(word) === -1) {
										words[word] = (words[word] ?? 0) + 1;
									}
								}
							}
							const labelsAndWordCounts = Object.entries(words);
							if (labelsAndWordCounts.length === 0) {
								return <></>;
							}
							labelsAndWordCounts.sort((a, b) => b[1] - a[1]);
							labelsAndWordCounts.length = Math.min(
								labelsAndWordCounts.length,
								15,
							);
							let total = 0;
							for (const wc of labelsAndWordCounts) {
								total += wc[1];
							}
							for (const wc of labelsAndWordCounts) {
								wc[1] = Math.min(
									Math.max(Math.round((wc[1] * 300) / total), 15),
									100,
								);
							}
							return (
								<Chart
									type={WordCloudController.id}
									data={{
										labels: labelsAndWordCounts.map((lw) => lw[0]),
										datasets: [
											{
												label: "Data",
												data: labelsAndWordCounts.map(
													(lw) => lw[1],
												),
												color: `rgb(${
													Math.min(
														Math.max(
															-props.value.graphic.sentiment,
															0,
														),
														2,
													) * 128
												}, 128, ${
													Math.min(
														Math.max(
															props.value.graphic.sentiment,
															0,
														),
														2,
													) * 128
												})`,
											},
										],
									}}
									options={{
										plugins: {
											legend: { display: false, reverse: true },
										},
									}}
								/>
							);
						})()}
					</>
				);
			} else {
				return (
					<>
						{props.value.graphic.strings.map((text) => (
							<Box>{text}</Box>
						))}
					</>
				);
			}
		}
		case "images": {
			if (props.listView) {
				return (
					props.value.graphic.images[0] && (
						<a
							href={`/image/full/${props.value.graphic.images[0].image_id}`}
							target="_blank"
							style={{
								transform: "translateX(-50%)",
								display: "inline-block",
								marginLeft: "50%",
							}}
						>
							<img
								height={100}
								src={`/image/small/${props.value.graphic.images[0].image_id}`}
							/>
						</a>
					)
				);
			} else {
				return (
					<>
						{props.value.graphic.images.map((image) => (
							<a href={`/image/full/${image.image_id}`}>
								<img
									width={256}
									src={`/image/small/${image.image_id}`}
								/>
							</a>
						))}
					</>
				);
			}
		}
		case "numeric": {
			return (
				<Typography
					level="h2"
					style={{
						color: `rgb(${props.value.colour})`,
					}}
				>
					{props.value.graphic.number.toFixed(2)}
					{props.value.graphic.collected_std_dev !== null
						? ` σ${props.value.graphic.collected_std_dev.toFixed(1)}`
						: ""}
				</Typography>
			);
		}
	}
}
