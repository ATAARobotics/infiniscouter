import { Box, Button, Typography } from "@mui/joy";

import { Navbar } from "../components/navbar";

/**
 * Scouting debugging page.
 *
 * This page is not in the menu, but available via /debug.
 */
export function Debug() {
	return (
		<Box>
			<Navbar title="Debugging Tools" />
			<Box>
				<Typography level="h3">Clear Local Data</Typography>
				<Typography color="danger">Sync before using this!</Typography>
				<Button
					onClick={() => {
						localStorage.clear();
					}}
				>
					Clear Data
				</Button>
			</Box>
		</Box>
	);
}
