import { CircularProgress } from "@mui/joy";

/**
 * A simple indicator to use when loading data for consistency.
 */
export function LoadIndicator() {
	return (
		<div style={{ padding: "10px" }}>
			<CircularProgress
				color="neutral"
				determinate={false}
				size="lg"
				variant="solid"
				thickness={18}
			/>
		</div>
	);
}
