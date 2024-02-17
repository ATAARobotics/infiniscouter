import { Box } from "@mui/joy";
import { useLocation } from "preact-iso";
import { useEffect } from "react";

/**
 * A simple component to use when we need a scout name.	.
 */
export function GetScoutName() {
	const { route } = useLocation();
	useEffect(() => {
		const timeoutId = setTimeout(() => route("/config"), 5000);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [route]);

	return (
		<Box>
			<p>
				You must set your scouting name before scouting. Click{" "}
				<a href="/config">here</a> or wait a few seconds to go to the
				configuration page.
			</p>
		</Box>
	);
}
