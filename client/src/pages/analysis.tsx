import Button from "@mui/joy/Button";
import Box from "@mui/joy/Box";
import { TeamInfoList } from "../generated/TeamInfoList";
import { useEffect, useState } from "preact/compat";
import { Table } from "@mui/joy";

// Analysis Page Component
export function Analysis() {
	const [table, setTable] = useState<TeamInfoList>();
	useEffect(() => {
		// TODO: Fetch in the sync and store in local storage.
		fetch("/api/analysis/list")
			.then((response) => response.json())
			.then((data2) => {
				setTable(data2);
			});
	}, []);
	console.log(table);

	if (table === undefined) {
		return <div>:(</div>;
	}

	return (
		<Box>
			<Table>
				<thead>
					{ table.names.map(name => <th>{name}</th>) }
				</thead>
				<tbody>
					{ table.list.map(row => <tr>{row.info.map(val => <td>{JSON.stringify(val)}</td>)}</tr>) }
				</tbody>
			</Table>
		</Box>
	);
}
