import { useState, useEffect } from "preact/hooks";
import { MatchEntryFields } from "../generated/MatchEntryFields";
import { MatchEntryData } from "src/generated/MatchEntryData";
import {
  Box,
  CircularProgress,
  RadioGroup,
  Radio,
  Stack,
  Typography,
  Input,
} from "@mui/joy";
import { EventInfo } from "src/generated/EventInfo";
import { MatchInfo } from "src/generated/MatchInfo";
import { ChangeEvent } from "preact/compat";
import { MatchEntryIdData } from "src/generated/MatchEntryIdData";
import { MatchPage } from "src/components/entry_components";
import { PitEntryFields } from "src/generated/PitEntryFields";

/**
 * Pit Entry Page Component
 * @returns the component
 */
export function PitEntry() {
  const [matchId, setMatchId] = useState<number>();
  const [teamId, setTeamId] = useState<number>();

  const [data, setData] = useState<MatchEntryData>({ entries: {} });
  useEffect(() => {
    if (matchId !== undefined && teamId !== undefined) {
      const saveData: MatchEntryIdData = {
        match_id: matchId.toString(),
        team_id: teamId.toString(),
        data,
      };
      localStorage.setItem(
        "match-" + matchId?.toString() + "-" + teamId?.toString(),
        JSON.stringify(saveData),
      );
    }
  }, [data]);
  useEffect(() => {
    if (matchId !== undefined && teamId !== undefined) {
      const newData: MatchEntryIdData | null = JSON.parse(
        localStorage.getItem(
          "match-" + matchId?.toString() + "-" + teamId?.toString(),
        ) ?? "null",
      );
      if (newData !== null) {
        setData(newData.data);
      } else {
        setData({ entries: {} });
      }
    }
  }, [matchId, teamId]);

  const matchTeams: EventInfo | null = JSON.parse(
    localStorage.getItem("matchList") ?? "null",
  );
  const fields: PitEntryFields | null = JSON.parse(
    localStorage.getItem("matchList") ?? "null",
  );
  if (!matchTeams) {
    return (
      <Box>
        <Typography>Click "Save Data" to get list of matches...</Typography>
      </Box>
    );
  }
  const teamsForMatch: MatchInfo | undefined | 0 =
    matchId !== undefined
      ? matchTeams.match_infos.filter(
          (match) =>
            match.id.match_type === "qualification" && match.id.num === matchId,
        )[0]
      : undefined;

  return (
    <Box>
      <h1>Match Entry Page</h1>
      <Box>
        <Input
          type="number"
          placeholder={"Qualification Match Number"}
          onChange={(ev: InputEvent) => {
            setMatchId(parseInt((ev.target as HTMLInputElement).value));
            setTeamId(undefined);
          }}
        />
      </Box>
      {teamsForMatch && (
        <Box>
          <RadioGroup
            onChange={(ev: ChangeEvent) =>
              setTeamId(parseInt((ev.target as HTMLInputElement).value))
            }
            value={teamId ?? null}
          >
            <Stack direction="row">
              <Stack direction="column">
                <Typography>RED</Typography>
                {teamsForMatch?.teams_red.map((team) => (
                  <Radio value={team} label={team.toString()} />
                ))}
              </Stack>
              <Stack direction="column">
                <Typography>BLUE</Typography>
                {teamsForMatch?.teams_blue.map((team) => (
                  <Radio value={team} label={team.toString()} />
                ))}
              </Stack>
            </Stack>
          </RadioGroup>
        </Box>
      )}
      {teamsForMatch &&
        teamId &&
        (fields ? (
          fields.pages.map((page) => (
            <MatchPage
              page={page}
              entries={fields.entries}
              setEntry={(id, value) => {
                if (value === undefined) {
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
}
