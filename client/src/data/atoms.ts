import { atomWithStorage } from "jotai/utils";

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

export const analysisColumnsAtom = atomWithStorage<Array<number> | null>(
	"anlysisColumns",
	null,
);
export const scoutNameAtom = atomWithStorage<string | null>("scoutName", null);
export const textModeAtom = atomWithStorage<boolean>("textMode", false);

export const lastMatchSaveAtom = atomWithStorage<number>("lastMatchSave", 0);
export const lastPitSaveAtom = atomWithStorage<number>("lastPitSave", 0);
export const lastDriverSaveAtom = atomWithStorage<number>("lastDriverSave", 0);
