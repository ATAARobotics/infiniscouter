import { Box } from "@mui/joy";
import {
	ArcElement,
	Chart as ChartJS,
	Legend,
	LinearScale,
	Tooltip,
} from "chart.js";
import { WordCloudController, WordElement } from "chartjs-chart-wordcloud";
import { atom, useAtom } from "jotai";
import { atomWithDefault } from "jotai/utils";
import { useEffect } from "react";
import { Chart, Pie } from "react-chartjs-2";

import { TeamInfoEntry } from "../generated/TeamInfoEntry";

interface DataValueProps {
	value: TeamInfoEntry;
	listView: boolean;
	forceColorScheme?: number;
}

const colorSchemes = [
	["#e74c3c", "#f1c40f", "#3498db", "#e67e22", "#2ecc71", "#9b59b6"],
	["#5bcffa", "#ff8eb2", "#ffffff"],
	["#fff433", "#9b59d0", "#2d2d2d", "#ffffff"],
	["#ff218c", "#ffd800", "#0094ff"],
	["#d60270", "#9b4f97", "#0038a7"],
	["#b9b9b9", "#b8f483", "#ffffff", "#000000"],
	["#e28d00", "#eccd00", "#65ace2", "#223756", "#ffffff"],
	["#3da542", "#a7d379", "#a9a9a9", "#ffffff", "#000000"],
	["#800080", "#808080", "#ffffff", "#000000"],
	["#d62900", "#a50062", "#ff9b55", "#d462a6", "#ffffff"],
	[
		"#089276",
		"#451d7e",
		"#2ad1ad",
		"#584fcf",
		"#9de9c3",
		"#81b0e4",
		"#f3f1ff",
	],
	["#b77fdd", "#4b821e", "#ffffff"],
	["#ff02bc", "#00d959", "#0092fd"],
	["#3437c1", "#cf00de", "#ff69a0", "#ffffff", "#000000"],
];

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
	"s",
];

const chartsReadyAtom = atom(false);

/**
 * Hook that returns true when charts can be used to ensure charts are not used before they are initialized.
 */
function useCharts(): boolean {
	const [chartsReady, setChartsReady] = useAtom(chartsReadyAtom);
	useEffect(() => {
		if (!chartsReady) {
			ChartJS.register(
				ArcElement,
				Tooltip,
				Legend,
				LinearScale,
				WordCloudController,
				WordElement,
			);
			setChartsReady(true);
		}
	}, [chartsReady, setChartsReady]);

	return chartsReady;
}

/**
 * Displays a data value for analysis.
 */
export function DataValue(props: DataValueProps) {
	const chartsReady = useCharts();
	switch (props.value.type) {
		case "team_name":
			return (
				<td>
					<p>
						<a href={`/team/${props.value.number}`}>
							{props.value.name} ({props.value.number})
						</a>
					</p>
				</td>
			);
		case "text":
			return (
				<td>
					<p>{props.value.display_text}</p>
				</td>
			);
		case "pie_chart": {
			return (
				<td>
					{chartsReady && (
						<Pie
							// @ts-expect-error style is missing from preact/compat, it seems
							style={{ width: "100px", height: "100px" }}
							data={{
								labels: props.value.options
									.reverse()
									.map((op) => op.label),
								datasets: [
									{
										label: "Data",
										data: props.value.options
											.reverse()
											.map((op) => op.value),
										backgroundColor:
											colorSchemes[
												Math.floor(
													Math.random() * colorSchemes.length,
												)
											],
									},
								],
							}}
							options={{
								plugins: { legend: { display: false, reverse: true } },
							}}
						/>
					)}
				</td>
			);
		}
		case "multi_text": {
			if (props.listView) {
				return (
					<td>
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
									Math.max(Math.round((wc[1] * 250) / total), 10),
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
												backgroundColor: `rgb(${
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
					</td>
				);
			} else {
				return (
					<td>
						{props.value.strings.map((text) => (
							<Box>{text}</Box>
						))}
					</td>
				);
			}
		}
		case "images": {
			if (props.listView) {
				return (
					<td>
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
					</td>
				);
			} else {
				return (
					<td>
						{props.value.images.map((image) => (
							<img
								width={256}
								src={`data:${image.image_mime};base64,${btoa(
									String.fromCharCode.apply(null, image.image_data),
								)}`}
							/>
						))}
					</td>
				);
			}
		}
	}
}
