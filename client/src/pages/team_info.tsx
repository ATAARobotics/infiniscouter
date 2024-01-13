import Button from "@mui/joy/Button";
import Box from "@mui/joy/Box";
import { Card, Typography, AspectRatio, CardContent, Stack } from "@mui/joy";
import { SingleTeamInfo } from "src/generated/SingleTeamInfo";
import { useEffect, useState } from "react";
import { DataValue } from "src/components/data_value";

interface TeamInfoProps {
  team: number;
}

// Team Info Page Component
export function TeamInfo(props: TeamInfoProps) {
  const [data, setData] = useState<SingleTeamInfo>();
  useEffect(() => {
    fetch("/api/analysis/team/" + props.team)
      .then((response) => response.json())
      .then((data2) => {
        setData(data2);
      });
  }, []);
  return (
    <Stack
      direction="row"
      flexWrap={"wrap"}
      gap={"25px"}
      justifyContent={"space-evenly"}
    >
      <Card sx={{ width: 320 }}>
        <Typography level="title-lg">
          {data?.team_number} - {data?.team_name}
        </Typography>
        <AspectRatio minHeight="120px" maxHeight="200px">
          <img src={`data:image/png;base64,${data?.team_icon_uri}`} />
        </AspectRatio>
      </Card>
      {data !== undefined ? (
        Object.entries(data.data).map((entry) => {
          return (
            <Card sx={{ width: 320 }}>
              <Typography level="title-lg">{entry[0]}</Typography>
              <DataValue value={entry[1]}></DataValue>
            </Card>
          );
        })
      ) : (
        <></>
      )}
    </Stack>
  );
}
