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
	switch (props.value.type) {
		case "team_name":
			return (
				<a href={`/team/${props.value.number}`}>
					<Typography level="h3">
						{props.value.icon_uri !== null && (
							<img width={40} height={40} src={props.value.icon_uri} />
						)}{" "}
						{props.value.number} {props.value.name}
					</Typography>
				</a>
			);
		case "text":
			return <p>{props.value.display_text}</p>;
		case "pie_chart": {
			return (
				<>
					{chartsReady && (
						<Pie
							// @ts-expect-error style is missing from preact/compat, it seems
							style={{ width: "100px", height: "100px" }}
							data={{
								labels: props.value.options.map((op) => op.label),
								datasets: [
									{
										label: "Data",
										data: props.value.options.map((op) => op.value),
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
				</>
			);
		}
		case "multi_text": {
			if (props.listView) {
				return (
					<>
						{(() => {
							const words: { [word: string]: number } = {};
							for (const string of props.value.strings) {
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
														Math.max(-props.value.sentiment, 0),
														2,
													) * 128
												}, 128, ${
													Math.min(
														Math.max(props.value.sentiment, 0),
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
						{props.value.strings.map((text) => (
							<Box>{text}</Box>
						))}
					</>
				);
			}
		}
		case "images": {
			if (props.listView) {
				return (
					<>
						{
							props.value.images.map((image) => (
								<img
									height={100}
									src={`data:${image.image_mime};base64,${btoa(
										String.fromCharCode.apply(null, image.image_data),
									)}`}
								/>
							))[0]
						}
					</>
				);
			} else {
				return (
					<>
						{props.value.images.map((image) => (
							<img
								width={256}
								src={`data:${image.image_mime};base64,${btoa(
									String.fromCharCode.apply(null, image.image_data),
								)}`}
							/>
						))}
					</>
				);
			}
		}
		case "numeric": {
			const mma = props.value.min_max_avg ?? {
				avg: props.value.number,
				min: props.value.number - 1,
				max: props.value.number + 1,
			};
			const spread = (mma.avg - mma.min) / 2 + (mma.max - mma.avg) / 2;
			const goodness = (props.value.number - mma.avg) / spread;
			return (
				<Typography
					level="h1"
					style={{
						color: `rgb(${Math.min(1 - goodness, 1) * 255}, ${
							Math.min(goodness + 1, 1) * 255
						}, ${(1 - Math.abs(goodness)) * 255})`,
					}}
				>
					{props.value.number.toFixed(2)}
				</Typography>
			);
		}
	}
}
