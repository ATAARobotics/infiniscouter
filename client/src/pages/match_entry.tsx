import {
  Box,
  CircularProgress,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/joy";
import { ChangeEvent } from "preact/compat";
import { useEffect, useState } from "preact/hooks";

import { MatchPage } from "../components/entry_components";
import { EventInfo } from "../generated/EventInfo";
import { MatchEntry } from "../generated/MatchEntry";
import { MatchEntryData } from "../generated/MatchEntryData";
import { MatchEntryFields } from "../generated/MatchEntryFields";
import { MatchEntryIdData } from "../generated/MatchEntryIdData";
import { MatchInfo } from "../generated/MatchInfo";

/**
 * Match Entry Page Component
 */
export function MatchEntry() {
  const [matchId, setMatchId] = useState<number>();
  const [teamId, setTeamId] = useState<number>();

  const [data, setData] = useState<MatchEntryData>({
    entries: {},
    timestamp_ms: 0,
  });
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
        setData({ entries: {}, timestamp_ms: 0 });
      }
    }
  }, [matchId, teamId]);

  const matchTeams: EventInfo | null = JSON.parse(
    localStorage.getItem("matchList") ?? "null",
  );
  const fields: MatchEntryFields | null = JSON.parse(
    localStorage.getItem("matchFields") ?? "null",
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
        {
          // @ts-expect-error Input seems to want a component for some reason?
          <Input
            type="number"
            placeholder={"Qualification Match Number"}
            onChange={(ev: InputEvent) => {
              setMatchId(parseInt((ev.target as HTMLInputElement).value));
              setTeamId(undefined);
            }}
          />
        }
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
        teamId !== undefined &&
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
  );
}
