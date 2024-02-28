import { Box, Typography } from "@mui/joy";
import { WordCloudController } from "chartjs-chart-wordcloud";
import { Chart, Pie } from "react-chartjs-2";

import { useCharts } from "../data/atoms";
import { TeamInfoEntry } from "../generated/TeamInfoEntry";

interface DataValueProps {
	value: TeamInfoEntry;
	listView: boolean;
	forceColorScheme?: number;
}

// Pride colour schemes -Veda
// White and gray have been added to some of these to make each at least 4 colours.
// Oh I commented out some that are similar to other ones
const colorSchemes = [
	// Rainbow
	["#e74c3c", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6", "#e67e22"],
	// Trans
	["#5bcffa", "#ff8eb2", "#ffffff", "#a9a9a9"],
	// Nonbinary
	["#9b59d0", "#fff433", "#2d2d2d", "#ffffff"],
	// Pan
	["#ff218c", "#ffd800", "#0094ff", "#2d2d2d"],
	// Bi
	["#d60270", "#9b4f97", "#0038a7", "#2d2d2d"],
	// Aro-ace
	["#e28d00", "#65ace2", "#eccd00", "#223756", "#ffffff"],
	// Aro/Agender
	["#3da542", "#b8f483", "#a9a9a9", "#ffffff", "#2d2d2d"],
	// Ace
	// ["#800080", "#808080", "#ffffff", "#2d2d2d"],
	// Lesbian
	["#a50062", "#ff9b55", "#d462a6", "#ffffff", "#d62900"],
	// Gay men
	[
		"#089276",
		"#451d7e",
		"#9de9c3",
		"#584fcf",
		"#ffffff",
		"#81b0e4",
		"#2ad1ad",
	],
	// Genderqueer
	// ["#b77fdd", "#4b821e", "#ffffff", "#a9a9a9"],
	// Polysexual
	// ["#ff02bc", "#00d959", "#0092fd", "#a9a9a9"],
	// Genderfluid
	["#3437c1", "#cf00de", "#ff69a0", "#ffffff", "#a9a9a9"],
];

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
				<Box sx={{ width: "100px", height: "100px" }}>
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
										backgroundColor:
											colorSchemes[
												(props.forceColorScheme ??
													Math.floor(
														Math.random() * colorSchemes.length,
													)) % colorSchemes.length
											],
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
					level="h1"
					style={{
						color: `rgb(${props.value.colour})`,
					}}
				>
					{props.value.graphic.number.toFixed(2)}
					{props.value.graphic.collected_std_dev
						? `(dev ${props.value.graphic.collected_std_dev.toFixed(2)})`
						: ""}
				</Typography>
			);
		}
	}
}
