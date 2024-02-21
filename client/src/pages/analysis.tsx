import { Box, Checkbox, Chip, Stack, Table } from "@mui/joy";
import { useEffect, useState } from "preact/compat";

import { DataValue } from "../components/data_value";
import { LoadIndicator } from "../components/load_indicator";
import { TeamInfoList } from "../generated/TeamInfoList";
import { TeamInfoEntry } from "src/generated/TeamInfoEntry";

/**
 * Analysis Page Component
 */
export function Analysis() {
	const [table, setTable] = useState<TeamInfoList>();
	const [enabledColumns, setEnabledColumns] = useState<number[]>([0]);

	const [colours, setColours] = useState<number[]>([]);

	useEffect(() => {
		// TODO: Fetch in the sync and store in local storage.
		fetch("/api/analysis/list")
			.then((response) => response.json())
			.then((data2: TeamInfoList) => {
				setTable(data2);
				setEnabledColumns(data2.default_display);
				setColours(
					data2.heading.map(() =>
						Math.floor(Math.random() * 64 * 54 * 25 * 13 * 7),
					),
				);
			});
	}, []);

	if (!table) {
		return <LoadIndicator></LoadIndicator>;
	}

	return (
		<Box>
			<caption>Analysis</caption>
			<Stack
				direction="row"
				sx={{
					width: "100%",
					overflow: "scroll",
					padding: "12px",
					gap: "12px",
				}}
			>
				{table.heading.map((column, idx) => {
					const checked = enabledColumns.includes(idx);
					return (
						<Chip
							key={idx}
							variant="plain"
							color={checked ? "primary" : "neutral"}
							startDecorator={checked && <span>✓</span>}
						>
							<Checkbox
								variant="outlined"
								color={checked ? "primary" : "neutral"}
								disableIcon
								overlay
								label={column.name}
								checked={checked}
								onchange={(ev: InputEvent) => {
									setEnabledColumns(
										!((ev.target as HTMLInputElement)
											.checked as boolean)
											? enabledColumns.filter((n) => n !== idx)
											: [...enabledColumns, idx],
									);
								}}
							/>
						</Chip>
					);
				})}
			</Stack>
			<Table
				stickyHeader
				hoverRow
				borderAxis="y"
				stripe="even"
				sx={{ width: "auto" }}
			>
				<thead>
					{table.heading
						.filter((_, idx) => enabledColumns.includes(idx))
						.map(title => (
							<th style={{ width: "150px" }}>{title.name}</th>
						))}
				</thead>
				<tbody>
					{table.list.map((row) => (
						<tr style={{ height: "100px" }}>
							{row.info
								.map(
									(val, idx) => [val, idx] as [TeamInfoEntry, number],
								)
								.filter((_, idx) => enabledColumns.includes(idx))
								.map(([val, idx]) => (
									<DataValue
										listView={true}
										value={val}
										forceColorScheme={colours[idx] ?? 0}
									/>
								))}
						</tr>
					))}
				</tbody>
			</Table>
		</Box>
	);
}
