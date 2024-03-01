import { Box, Card, Stack, Typography } from "@mui/joy";
import { useEffect, useState } from "react";

import { DataValue } from "../components/data_value";
import { LoadIndicator } from "../components/load_indicator";
import { Navbar } from "../components/navbar";
import { useColorSchemes } from "../data/hooks";
import { InfoEntryWithSource } from "../generated/InfoEntryWithSource";
import { MultiTextEntry } from "../generated/MultiTextEntry";
import { SingleTeamInfo } from "../generated/SingleTeamInfo";

interface TeamInfoProps {
	team: number;
}

/**
 * Team Info Page Component
 */
export function TeamInfo(props: TeamInfoProps) {
	const [data, setData] = useState<SingleTeamInfo>();
	const [colorScheme] = useColorSchemes(1);

	useEffect(() => {
		fetch("/api/analysis/team/" + props.team)
			.then((response) => response.json())
			.then((data2) => {
				setData(data2);
			});
	}, []);

	if (!data) {
		return <LoadIndicator title={`${props.team} Team Info`}></LoadIndicator>;
	}

	const pages: Array<Array<InfoEntryWithSource>> = [];
	for (const entry of data.data) {
		if (
			pages.length === 0 ||
			pages[pages.length - 1][0].name.page !== entry.name.page
		) {
			pages.push([entry]);
		} else {
			pages[pages.length - 1].push(entry);
		}
	}

	return (
		<Box>
			<Navbar title="Team Info" />
			<Typography level="h2">
				{data.team_icon_uri && (
					<img width={40} height={40} src={data.team_icon_uri} />
				)}
				{data.team_number} {data.team_name}
			</Typography>
			{pages.map((entries) => (
				<>
					<Typography level="h3">{entries[0].name.page}</Typography>
					<Stack direction="row" flexWrap={"wrap"} gap={"25px"}>
						{entries
							.filter(
								({ entry }) => entry.graphic?.type !== "multi_text",
							)
							.map(({ entry, name: entry_name }) => {
								return (
									<Card sx={{ width: 150 }}>
										<Stack
											direction="column"
											justifyContent="space-between"
											alignItems="center"
											height="100%"
										>
											<Typography level="title-lg">
												{entry_name.name}
											</Typography>
											<DataValue
												listView={false}
												value={entry}
												colorScheme={colorScheme}
											></DataValue>
										</Stack>
									</Card>
								);
							})}
					</Stack>
					{entries
						.filter(({ entry }) => entry.graphic?.type === "multi_text")
						.map(({ entry, name: entry_name }) => {
							return (
								<>
									<Typography level="title-lg">
										{entry_name.name}
									</Typography>
									{(entry.graphic as MultiTextEntry).strings.map(
										(s) => (
											<p>{s}</p>
										),
									)}
								</>
							);
						})}
				</>
			))}
		</Box>
	);
}
