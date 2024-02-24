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
import { atomWithStorage } from "jotai/utils";
import { useEffect } from "preact/hooks";

import { EventInfo } from "../generated/EventInfo";
import { MatchEntryFields } from "../generated/MatchEntryFields";

export const matchListAtom = atomWithStorage<EventInfo | null>(
	"matchList",
	null,
);
export const matchFieldsAtom = atomWithStorage<MatchEntryFields | null>(
	"matchFields",
	null,
);
export const driverFieldsAtom = atomWithStorage<MatchEntryFields | null>(
	"driverFields",
	null,
);
export const pitFieldsAtom = atomWithStorage<MatchEntryFields | null>(
	"pitFields",
	null,
);

export const scoutNameAtom = atomWithStorage<string | null>("scoutName", null);

export const lastMatchSaveAtom = atomWithStorage<number>("lastMatchSave", 0);
export const lastPitSaveAtom = atomWithStorage<number>("lastPitSave", 0);
export const lastDriverSaveAtom = atomWithStorage<number>("lastDriverSave", 0);

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
