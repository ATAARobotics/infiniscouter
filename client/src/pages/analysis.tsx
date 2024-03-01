import { MoreVert } from "@mui/icons-material";
import {
	Box,
	Checkbox,
	Dropdown,
	IconButton,
	Menu,
	MenuButton,
	MenuItem,
	Table,
	Typography,
} from "@mui/joy";
import { useAtom } from "jotai";
import { useEffect, useState } from "preact/compat";
import FlipMove from "react-flip-move";

import { DataValue } from "../components/data_value";
import { LoadIndicator } from "../components/load_indicator";
import { Navbar } from "../components/navbar";
import { analysisColumnsAtom } from "../data/atoms";
import { useColorSchemes } from "../data/hooks";
import { NameAndSource } from "../generated/NameAndSource";
import { TeamInfoDisplay } from "../generated/TeamInfoDisplay";
import { TeamInfoEntry } from "../generated/TeamInfoEntry";
import { TeamInfoList } from "../generated/TeamInfoList";
import { SyntheticEvent } from "react";

/**
 * Return the sort value for a table based on index
 */
function sortValue(
	sortBy: number,
	sortReverse: boolean,
	entries: TeamInfoDisplay,
): number {
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
	const [storedColumns, setEnabledColumns] = useAtom(analysisColumnsAtom);
	const [defaultColumns, setDefaultColumns] = useState<number[]>([]);

	const colorSchemes = useColorSchemes(table?.heading.length ?? 0);

	const [sortBy, setSortBy] = useState<number>(0);
	const [sortReverse, setSortReverse] = useState<boolean>(false);

	useEffect(() => {
		// TODO: Fetch in the sync and store in local storage.
		fetch("/api/analysis/list")
			.then((response) => response.json())
			.then((data2: TeamInfoList) => {
				setTable(data2);
				setDefaultColumns(data2.default_display);
			});
	}, []);

	const enabledColumns = storedColumns ?? defaultColumns;

	if (!table) {
		return <LoadIndicator title="Analysis"></LoadIndicator>;
	}

	const [menuOpen, setMenuOpen] = useState(false);
	const handleOpen = (ev: SyntheticEvent | null, isOpen: boolean) => {
		if (isOpen) {
			setMenuOpen(true);
		} else if (ev?.type !== "click" || ev?.target?.type !== "checkbox") {
			// Ignore "click" events on the checkboxes in the menu
			setMenuOpen(false);
		}
	};
	const enabledColsPicker = (
		<Dropdown open={menuOpen} onOpenChange={handleOpen}>
			<MenuButton
				slots={{ root: IconButton }}
				slotProps={{ root: { variant: "outlined", color: "neutral" } }}
			>
				<MoreVert />
			</MenuButton>
			<Menu sx={{ height: "80vh" }}>
				<MenuItem
					key="reset"
					color="neutral"
					onClick={() => setEnabledColumns(defaultColumns)}
				>
					Reset Columns
				</MenuItem>
				{table.heading.map((column, idx) => {
					const checked = enabledColumns.includes(idx);
					return (
						<MenuItem
							key={idx}
							color={checked ? "primary" : "neutral"}
							onClick={() =>
								setEnabledColumns(
									checked
										? enabledColumns.filter((n) => n !== idx)
										: [...enabledColumns, idx],
								)
							}
						>
							<Checkbox
								checkedIcon={<span>✓</span>}
								overlay
								label={column.name}
								checked={checked}
							/>
						</MenuItem>
					);
				})}
			</Menu>
		</Dropdown>
	);

	return (
		<Box>
			<Box sx={{ position: "fixed", top: "0", zIndex: -1 }}>
				<Navbar title="Analysis" component={enabledColsPicker} />
			</Box>
			<Box
				sx={{ width: "100vw", marginTop: "4rem", backgroundColor: "black" }}
			>
				<Table
					stickyHeader
					hoverRow
					borderAxis="y"
					stripe="even"
					sx={{ width: "auto" }}
				>
					<thead style={{ cursor: "pointer" }}>
						{table.heading
							.map(
								(title, idx) => [title, idx] as [NameAndSource, number],
							)
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
								const val =
									sortValue(sortBy, sortReverse, a) -
									sortValue(sortBy, sortReverse, b);
								return sortReverse ? -val : val;
							})
							.map((row) => (
								<tr
									style={{ height: "100px" }}
									key={row.info[0].sort_value}
								>
									{row.info
										.map(
											(val, idx2) =>
												[val, idx2] as [TeamInfoEntry, number],
										)
										.filter((_, idx2) =>
											enabledColumns.includes(idx2),
										)
										.map(([val, idx2]) => (
											<td style={{ height: "100px" }} key={val}>
												<DataValue
													listView={true}
													value={val}
													colorScheme={colorSchemes[idx2]}
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
