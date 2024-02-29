import {
	ArcElement,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	Title,
	Tooltip,
} from "chart.js";
import { WordCloudController, WordElement } from "chartjs-chart-wordcloud";
import { atom, useAtom } from "jotai";
import { useEffect, useState } from "preact/hooks";

const chartsReadyAtom = atom(false);

/**
 * Hook that returns true when charts can be used to ensure charts are not used before they are initialized.
 */
export function useCharts(): boolean {
	const [chartsReady, setChartsReady] = useAtom(chartsReadyAtom);
	useEffect(() => {
		if (!chartsReady) {
			ChartJS.register(
				ArcElement,
				BarElement,
				CategoryScale,
				Legend,
				LinearScale,
				Title,
				Tooltip,
				WordCloudController,
				WordElement,
			);
			setChartsReady(true);
		}
	}, [chartsReady, setChartsReady]);

	return chartsReady;
}

// Pride color schemes -Veda
// White and gray have been added to some of these to make each at least 4 colors.
// Oh I commented out some that are similar to other ones
export const colorSchemes = [
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

/**
 * Returns a stable list of color schemes.
 *
 * Each color scheme is an array of hex color values.
 */
export function useColorSchemes(count: number): Array<Array<string>> {
	const [colors, setColors] = useState<Array<Array<string>>>([]);

	// possibly expand colors if needed
	const actualColors = colors.length < count ? colors.slice() : colors;

	while (actualColors.length < count) {
		actualColors.push(
			colorSchemes[
				Math.floor(Math.random() * colorSchemes.length) %
					colorSchemes.length
			],
		);
	}

	useEffect(() => {
		// if the colors were expanded, save them so they are stable
		if (colors !== actualColors) {
			setColors(actualColors);
		}
	}, [colors, actualColors]);

	return actualColors;
}
