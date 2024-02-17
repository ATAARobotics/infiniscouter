import { AspectRatio, Card, Stack, Typography } from "@mui/joy";
import { useEffect, useState } from "react";

import { DataValue } from "../components/data_value";
import { LoadIndicator } from "../components/load_indicator";
import { SingleTeamInfo } from "../generated/SingleTeamInfo";

interface TeamInfoProps {
	team: number;
}

/**
 * Team Info Page Component
 */
export function TeamInfo(props: TeamInfoProps) {
	const [data, setData] = useState<SingleTeamInfo>();
	useEffect(() => {
		fetch("/api/analysis/team/" + props.team)
			.then((response) => response.json())
			.then((data2) => {
				setData(data2);
			});
	}, []);

	if (!data) {
		return <LoadIndicator></LoadIndicator>;
	}

	return (
		<Stack
			direction="row"
			flexWrap={"wrap"}
			gap={"25px"}
			justifyContent={"space-evenly"}
		>
			<Card sx={{ width: 320 }}>
				<Typography level="title-lg">
					{data?.team_number}
					<br />
					{data?.team_name}
				</Typography>
				{data?.team_icon_uri !== null && (
					<AspectRatio minHeight="120px" maxHeight="200px">
						<img src={data?.team_icon_uri} />
					</AspectRatio>
				)}
			</Card>
			{data !== undefined ? (
				Object.entries(data.data)
					.filter((entry) => entry[1].type !== "team_name")
					.map((entry) => {
						return (
							<Card sx={{ width: 320 }}>
								<Typography level="title-lg">{entry[0]}</Typography>
								<DataValue
									listView={false}
									value={entry[1]}
								></DataValue>
							</Card>
						);
					})
			) : (
				<></>
			)}
		</Stack>
	);
}
