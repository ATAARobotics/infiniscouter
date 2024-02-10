import { atomWithStorage } from "jotai/utils";

import { EventInfo } from "../generated/EventInfo";
import { MatchEntryFields } from "../generated/MatchEntryFields";

export const matchListAtom = atomWithStorage<EventInfo | null>("matchList", null);
export const matchFieldsAtom = atomWithStorage<MatchEntryFields | null>("matchFields", null);
export const pitFieldsAtom = atomWithStorage<MatchEntryFields | null>("pitFields", null);