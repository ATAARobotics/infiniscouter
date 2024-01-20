import { useState, useEffect } from "preact/hooks";

import { MatchEntryData } from "../generated/MatchEntryData";
import {
  Box,
  Typography,
} from "@mui/joy";
import { EventInfo } from "../generated/EventInfo";
import { MatchEntryIdData } from "../generated/MatchEntryIdData";
import { MatchEntryFields } from "../generated/MatchEntryFields";

/**
 * Pit Entry Page Component
 */
export function PitEntry() {
  const [teamId, setTeamId] = useState<number>();

  const [data, setData] = useState<MatchEntryData>({
    entries: {},
    timestamp_ms: BigInt(0),
  });
  useEffect(() => {
    if (teamId !== undefined) {
      const saveData: MatchEntryIdData = {
        match_id: matchId.toString(),
        team_id: teamId.toString(),
        data,
      };
      localStorage.setItem(
        "team-" + teamId?.toString(),
        JSON.stringify(saveData),
      );
    }
  }, [data]);
  useEffect(() => {
    if (matchId !== undefined && teamId !== undefined) {
      const newData: MatchEntryIdData | null = JSON.parse(
        localStorage.getItem(
          "team-" + teamId?.toString(),
        ) ?? "null",
      );
      if (newData !== null) {
        setData(newData.data);
      } else {
        setData({ entries: {}, timestamp_ms: BigInt(0) });
      }
    }
  }, [matchId, teamId]);

  const event_info: EventInfo | null = JSON.parse(
    localStorage.getItem("matchList") ?? "null",
  );
  const fields: MatchEntryFields | null = JSON.parse(
    localStorage.getItem("pitFields") ?? "null",
  );
  if (!event_info) {
    return (
      <Box>
        <Typography>Click "Save Data" to get list of teams...</Typography>
      </Box>
    );
  }
}
