import { Box, Checkbox, Chip, Stack, Table, Typography } from "@mui/joy";
import { useEffect, useState } from "preact/compat";
import { TeamInfoEntry } from "src/generated/TeamInfoEntry";

import { DataValue } from "../components/data_value";
import { LoadIndicator } from "../components/load_indicator";
import { TeamInfoList } from "../generated/TeamInfoList";
import FlipMove from "react-flip-move";
import { TeamInfoDisplay } from "src/generated/TeamInfoDisplay";
import { NameAndSource } from "src/generated/NameAndSource";
import { Navbar } from "src/components/navbar";

/**
 * Return the sort value for a table based on index
 */
function sortValue(sortBy: number, sortReverse: boolean, entries: TeamInfoDisplay): number {
	let value = entries.info[sortBy].sort_value;
	if (value === -420.0 && !sortReverse) {
		value = 420.0;
	}
	return value;
}

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

	const enabledColsPicker =
		(<Stack
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
		</Stack>);

	return (
		<Box>
			<Box sx={{ position: "fixed", top: "0", zIndex: -1 }}>
				<Navbar title="Analysis" component={enabledColsPicker} />
			</Box>
			<Box sx={{ width: "100vw", marginTop: "4rem", backgroundColor: "black" }}>
				<Table
					stickyHeader
					hoverRow
					borderAxis="y"
					stripe="even"
					sx={{ width: "auto" }}
				>
					<thead style={{ cursor: "pointer" }}>
						{table.heading
							.map((title, idx) => [title, idx] as [NameAndSource, number])
							.filter((_, idx) => enabledColumns.includes(idx))
							.map(([title, idx]) => (
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
					<FlipMove typeName="tbody" duration={150} easing="ease-out">
						{table.list
							.sort((a, b) => {
								const val = sortValue(sortBy, sortReverse, a) - sortValue(sortBy, sortReverse, b);
								return sortReverse ? -val : val;
							})
							.map(row => (
								<tr style={{ height: "100px" }} key={row.info[0].sort_value}>
									{row.info
										.map(
											(val, idx2) =>
												[val, idx2] as [TeamInfoEntry, number],
										)
										.filter((_, idx2) => enabledColumns.includes(idx2))
										.map(([val, idx2]) => (
											<td style={{ height: "100px" }} key={val}>
												<DataValue
													listView={true}
													value={val}
													forceColorScheme={colours[idx2] ?? 0}
												/>
											</td>
										))}
								</tr>
							))}
					</FlipMove>
				</Table>
			</Box>
		</Box>
	);
}
