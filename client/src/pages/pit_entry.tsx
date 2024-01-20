import { useState, useEffect } from "preact/hooks";

import { MatchEntryData } from "../generated/MatchEntryData";
import { Autocomplete, Box, CircularProgress, Typography } from "@mui/joy";
import { EventInfo } from "../generated/EventInfo";
import { MatchEntryIdData } from "../generated/MatchEntryIdData";
import { MatchEntryFields } from "../generated/MatchEntryFields";
import { PitEntryIdData } from "src/generated/PitEntryIdData";
import { MatchPage } from "src/components/entry_components";

/**
 * Pit Entry Page Component
 */
export function PitEntry() {
  const [teamId, setTeamId] = useState<number>();

  const [data, setData] = useState<MatchEntryData>({
    entries: {},
    timestamp_ms: 0,
  });
  useEffect(() => {
    if (teamId !== undefined) {
      const saveData: PitEntryIdData = {
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
    if (teamId !== undefined) {
      const newData: MatchEntryIdData | null = JSON.parse(
        localStorage.getItem("team-" + teamId?.toString()) ?? "null",
      );
      if (newData !== null) {
        setData(newData.data);
      } else {
        setData({ entries: {}, timestamp_ms: 0 });
      }
    }
  }, [teamId]);

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
  return (
    <Box>
      <h1>Pit Entry Page</h1>
      <Box>
        <Autocomplete
          placeholder={"Team Number"}
          options={Object.entries(event_info?.team_infos).map((v, k) => {
            return { label: `${v[1].name} (${v[1].num})`, num: k };
          })}
          onChange={(_ev, value) => {
            setTeamId(value?.num ?? 0);
          }}
        />
        {teamId !== undefined &&
          (fields ? (
            fields.pages.map((page) => (
              <MatchPage
                page={page}
                entries={fields.entries}
                setEntry={(id, value) => {
                  if (!value) {
                    const tmp = {
                      entries: { ...data.entries },
                      timestamp_ms: Date.now(),
                    };
                    delete tmp.entries[id];
                    setData(tmp);
                  } else {
                    setData({
                      entries: { ...data.entries, [id]: value },
                      timestamp_ms: Date.now(),
                    });
                  }
                }}
                allEntries={data.entries}
              ></MatchPage>
            ))
          ) : (
            <div>
              <CircularProgress
                color="danger"
                determinate={false}
                size="sm"
                value={25}
                variant="solid"
                thickness={7}
              />
              {"  "}Loading...
            </div>
          ))}
      </Box>
    </Box>
  );
}
