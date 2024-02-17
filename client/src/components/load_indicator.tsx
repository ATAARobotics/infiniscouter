import { CircularProgress } from "@mui/joy";

/**
 * A simple indicator to use when loading data for consistency.
 */
export function LoadIndicator() {
	return (
		<div>
			<CircularProgress
				color="danger"
				determinate={false}
				size="sm"
				value={25}
				variant="solid"
				thickness={7}
			/>
			{"  "}Loading...
		</div>
	);
}
