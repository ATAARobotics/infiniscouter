import { Box, Checkbox, Chip, Stack, Table, Typography } from "@mui/joy";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
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

	const [sortBy, setSortBy] = useState<number>(0);
	const [sortReverse, setSortReverse] = useState<boolean>(false);

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
			<Typography level="h1">Analysis</Typography>
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
						.map((title, idx) => (
							<th
								aria-sort={
									sortBy === idx
										? sortReverse
											? "descending"
											: "ascending"
										: undefined
								}
								style={{ width: "100px" }}
							>
								<Typography
									level="h3"
									color={sortBy === idx ? "primary" : "neutral"}
									onClick={() => {
										if (sortBy === idx) {
											setSortReverse(!sortReverse);
										} else {
											setSortReverse(true);
										}
										setSortBy(idx);
									}}
								>
									<Typography
										sx={{
											display: "inline-block",
											opacity: sortBy === idx ? 1 : 0,
											transition: "0.2s",
											transform: sortReverse
												? "rotate(90deg)"
												: "rotate(-90deg)",
										}}
									>
										➜
									</Typography>
									{title.name}
								</Typography>
							</th>
						))}
				</thead>
				<tbody>
					{table.list
						.sort((a, b) => {
							const val =
								a.info[sortBy].sort_value - b.info[sortBy].sort_value;
							return sortReverse ? -val : val;
						})
						.map((row) => (
							<tr style={{ height: "100px" }}>
								{row.info
									.map(
										(val, idx) =>
											[val, idx] as [TeamInfoEntry, number],
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
