import { Box, Checkbox, Chip, Stack, Table } from "@mui/joy";
import { useEffect, useState } from "preact/compat";

import { DataValue } from "../components/data_value";
import { TeamInfoList } from "../generated/TeamInfoList";

/**
 * Analysis Page Component
 */
export function Analysis() {
	const [table, setTable] = useState<TeamInfoList>();
	const [enabledColumns, setEnabledColumns] = useState<number[]>([0]);

	useEffect(() => {
		// TODO: Fetch in the sync and store in local storage.
		fetch("/api/analysis/list")
			.then((response) => response.json())
			.then((data2) => {
				setTable(data2);
				setEnabledColumns(data2.default_display);
			});
	}, []);

	if (!table) {
		return <div>:( (loading...)</div>;
	}

	return (
		<Box>
			<Stack
				direction="row"
				sx={{
					width: "100%",
					overflow: "scroll",
					padding: "12px",
					gap: "12px",
				}}
			>
				{table.names.map((column, idx) => {
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
								label={column}
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
			<Table hoverRow borderAxis="y" stripe="even" sx={{ width: "auto" }}>
				<caption>Data Output</caption>
				<thead>
					{table.names
						.filter((_, idx) => enabledColumns.includes(idx))
						.map((title) => (
							<th style={{ width: "150px" }}>{title}</th>
						))}
				</thead>
				<tbody>
					{table.list.map((row) => (
						<tr style={{ height: "100px" }}>
							{row.info
								.filter((_, idx) => enabledColumns.includes(idx))
								.map((val) => (
									<DataValue listView={true} value={val} />
								))}
						</tr>
					))}
				</tbody>
			</Table>
		</Box>
	);
}
