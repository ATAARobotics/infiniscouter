import { Box } from "@mui/joy";
import { Navbar } from "./navbar";

/**
 * A simple component to use to indicate to the user that the user must sync the data to proceed.
 */
export function SyncRequired() {
	return (
		<Box>
			<Navbar title={"Sync Required"} />
			<p>
				An initial data sync is required. Click the "Save Data" button to
				synchronize with the server.
			</p>
		</Box>
	);
}
