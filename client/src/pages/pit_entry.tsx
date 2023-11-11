import { useState, useEffect } from "preact/hooks";
import { MatchEntryFields } from "../generated/MatchEntryFields";
import { MatchEntryPage } from "../generated/MatchEntryPage";
import { MatchEntry } from "../generated/MatchEntry";
import { AbilityMetric } from "../generated/AbilityMetric";
import { EnumMetric } from "../generated/EnumMetric";
import { BoolMetric } from "../generated/BoolMetric";
import { TimerMetric } from "../generated/TimerMetric";
import Button from "@mui/joy/Button";
import IconButton from "@mui/joy/IconButton";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import Box from "@mui/joy/Box";
import { MatchEntryData } from "src/generated/MatchEntryData";
import { MatchEntryValue } from "src/generated/MatchEntryValue";
import { CircularProgress, Textarea, textareaClasses } from "@mui/joy";

// Pit Entry Page Component
export function PitEntry() {
  return (
    <Box>
      <h1>Pit entry checklist</h1>
      <div>
        {" "}
        Last years list: Confidence Amount of people in pit X Chaos level X
        Bumper type Vision type X Human player pickup range G Stacking type and
        Range G Preferred Offence or Defence Amount of batteries Amount of
        Motors X Balance time G Drive Train Auto settngs Other comments
      </div>
    </Box>
  );
}
