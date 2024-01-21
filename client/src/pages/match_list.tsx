import { Box, Checkbox, Chip, Stack, Table } from "@mui/joy";
import { useEffect, useState } from "preact/compat";

import { DataValue } from "../components/data_value";
import { EventInfo } from "../generated/EventInfo";
import { LoadIndicator } from "../components/load_indicator";

/**
 * Page that shows a list of all matches.
 */
export function MatchList() {
  const [eventInfo, setEventInfo] = useState<EventInfo>();

  useEffect(() => {
    const loadEventInfo = () => {
      const localEventInfo: EventInfo | null = JSON.parse(
        localStorage.getItem("matchList") ?? "null",
      );

      if (localEventInfo) {
        setEventInfo(localEventInfo);
        return true;
      } else {
        return false;
      }
    };

    if (eventInfo || loadEventInfo()) {
      return () => {};
    } else {
      const intervalId = setInterval(() => {
        loadEventInfo();
      }, 100);

      return () => clearInterval(intervalId);
    }
  }, [eventInfo, setEventInfo]);

  if (!eventInfo) {
    return <LoadIndicator></LoadIndicator>;
  }

  return (
    <Box>
      <Table hoverRow borderAxis="y" stripe="even" sx={{ width: "auto" }}>
        <caption>Matches</caption>
        <thead>
          <th style={{ width: "150px" }}>Match</th>
          <th style={{ width: "300px" }}>Red Alliance</th>
          <th style={{ width: "300px" }}>Blue Alliance</th>
          <th style={{ width: "50px" }}>Winner</th>
        </thead>
        <tbody>
          {eventInfo.match_infos.map((match) => (
            <tr style={{ height: "100px" }}>
              <td>
                <a
                  href={`/match/${match.id.match_type}/${match.id.num}/${match.id.set}`}
                >
                  {match.id.match_type} {match.id.num}
                  {match.id.set > 1 ? `(${match.id.set})` : ""}
                </a>
              </td>
              <td>
                <>
                  {match.teams_red.map((team) => {
                    const team_info = eventInfo.team_infos[team];
                    return (
                      <>
                        {team_info ? (
                          <a
                            href={`/team/${team_info.num}`}
                            title={team_info.name}
                          >
                            {team_info.num}
                          </a>
                        ) : (
                          team
                        )}{" "}
                      </>
                    );
                  })}{" "}
                  {match.result === "Red" ? (
                    <b>{match.score_red}</b>
                  ) : match.result === "Blue" ? (
                    match.score_red
                  ) : (
                    ""
                  )}
                </>
              </td>
              <td>
                <>
                  {match.teams_blue.map((team) => {
                    const team_info = eventInfo.team_infos[team];
                    return (
                      <>
                        {team_info ? (
                          <a
                            href={`/team/${team_info.num}`}
                            title={team_info.name}
                          >
                            {team_info.num}
                          </a>
                        ) : (
                          team
                        )}{" "}
                      </>
                    );
                  })}
                  {match.result === "Blue" ? (
                    <b>{match.score_blue}</b>
                  ) : match.result === "Red" ? (
                    match.score_blue
                  ) : (
                    ""
                  )}
                </>
              </td>
              <td>{match.result === "Tbd" ? "" : match.result}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Box>
  );
}
